import { createClient } from "@supabase/supabase-js";

const DEFAULT_STALE_PROCESSING_MS = 10 * 60 * 1000;
const MAX_DISPATCH_KEY_LENGTH = 240;
const MAX_EVENT_TYPE_LENGTH = 80;
const MAX_CHANNEL_LENGTH = 80;
const MAX_RESOURCE_TYPE_LENGTH = 80;
const MAX_RESOURCE_ID_LENGTH = 120;
const MAX_ERROR_LENGTH = 1000;

type DispatchStatus = "processing" | "sent" | "failed";

interface EventDispatchRow {
    id: string;
    status: DispatchStatus;
    updated_at: string;
    attempt_count: number;
}

interface DispatchOptions {
    dispatchKey: string;
    eventType: string;
    channel: string;
    resourceType?: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
    staleAfterMs?: number;
}

function getDispatchClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error("Dispatch tracking requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }

    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

function normalizeText(value: string, maxLength: number) {
    return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeOptions(options: DispatchOptions) {
    const dispatchKey = normalizeText(options.dispatchKey, MAX_DISPATCH_KEY_LENGTH);
    const eventType = normalizeText(options.eventType, MAX_EVENT_TYPE_LENGTH);
    const channel = normalizeText(options.channel, MAX_CHANNEL_LENGTH);
    const resourceType = options.resourceType
        ? normalizeText(options.resourceType, MAX_RESOURCE_TYPE_LENGTH)
        : null;
    const resourceId = options.resourceId
        ? normalizeText(options.resourceId, MAX_RESOURCE_ID_LENGTH)
        : null;

    if (!dispatchKey || !eventType || !channel) {
        throw new Error("Dispatch options are invalid");
    }

    return {
        dispatchKey,
        eventType,
        channel,
        resourceType,
        resourceId,
        metadata: options.metadata ?? {},
        staleAfterMs: options.staleAfterMs ?? DEFAULT_STALE_PROCESSING_MS,
    };
}

async function markDispatch(
    dispatchId: string,
    patch: Record<string, unknown>
) {
    const supabase = getDispatchClient();
    const { error } = await supabase
        .from("event_dispatches")
        .update({
            ...patch,
            updated_at: new Date().toISOString(),
        })
        .eq("id", dispatchId);

    if (error) {
        console.error("[idempotent-dispatch.markDispatch]", error);
    }
}

async function claimDispatch(options: ReturnType<typeof normalizeOptions>) {
    const supabase = getDispatchClient();
    const nowIso = new Date().toISOString();
    const insertPayload = {
        dispatch_key: options.dispatchKey,
        event_type: options.eventType,
        channel: options.channel,
        resource_type: options.resourceType,
        resource_id: options.resourceId,
        status: "processing",
        attempt_count: 1,
        metadata: options.metadata,
        last_error: null,
        sent_at: null,
        updated_at: nowIso,
    };

    const { data: inserted, error: insertError } = await supabase
        .from("event_dispatches")
        .insert(insertPayload)
        .select("id")
        .maybeSingle();

    if (inserted?.id) {
        return { acquired: true as const, dispatchId: inserted.id };
    }

    if (insertError && insertError.code !== "23505") {
        throw insertError;
    }

    const { data: existingData, error: existingError } = await supabase
        .from("event_dispatches")
        .select("id, status, updated_at, attempt_count")
        .eq("dispatch_key", options.dispatchKey)
        .maybeSingle();

    if (existingError) {
        throw existingError;
    }

    const existing = existingData as EventDispatchRow | null;

    if (!existing) {
        return { acquired: false as const, reason: "missing" };
    }

    const ageMs = Date.now() - new Date(existing.updated_at).getTime();
    const isStaleProcessing = existing.status === "processing" && ageMs > options.staleAfterMs;
    const canRetry = existing.status === "failed" || isStaleProcessing;

    if (!canRetry) {
        return { acquired: false as const, reason: existing.status };
    }

    const { data: reclaimed, error: reclaimError } = await supabase
        .from("event_dispatches")
        .update({
            status: "processing",
            attempt_count: (existing.attempt_count || 1) + 1,
            metadata: options.metadata,
            last_error: null,
            updated_at: nowIso,
        })
        .eq("id", existing.id)
        .eq("status", existing.status)
        .eq("updated_at", existing.updated_at)
        .select("id")
        .maybeSingle();

    if (reclaimError) {
        throw reclaimError;
    }

    if (!reclaimed?.id) {
        return { acquired: false as const, reason: "race" };
    }

    return { acquired: true as const, dispatchId: reclaimed.id };
}

export async function runIdempotentDispatch(
    options: DispatchOptions,
    task: () => Promise<void>
) {
    const normalized = normalizeOptions(options);
    const claim = await claimDispatch(normalized);

    if (!claim.acquired || !claim.dispatchId) {
        return { success: true as const, skipped: true as const, reason: claim.reason ?? "duplicate" };
    }

    try {
        await task();
        await markDispatch(claim.dispatchId, {
            status: "sent",
            sent_at: new Date().toISOString(),
            last_error: null,
        });
        return { success: true as const, skipped: false as const };
    } catch (error) {
        await markDispatch(claim.dispatchId, {
            status: "failed",
            last_error: error instanceof Error
                ? error.message.slice(0, MAX_ERROR_LENGTH)
                : "Unknown dispatch error",
        });
        throw error;
    }
}
