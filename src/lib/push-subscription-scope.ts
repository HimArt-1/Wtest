export type PushSubscriptionScope = "user" | "admin";
export type StoredPushSubscriptionScope = PushSubscriptionScope | "both";

const PUSH_SCOPES: PushSubscriptionScope[] = ["user", "admin"];

export function normalizeRequestedPushScope(
    value: unknown,
    fallback: PushSubscriptionScope | null = null
): PushSubscriptionScope | null {
    return typeof value === "string" && PUSH_SCOPES.includes(value as PushSubscriptionScope)
        ? value as PushSubscriptionScope
        : fallback;
}

export function normalizeStoredPushScope(value: unknown): StoredPushSubscriptionScope | null {
    if (value === "both") return "both";
    return normalizeRequestedPushScope(value);
}

export function getPushScopeList(scope: StoredPushSubscriptionScope | null | undefined): PushSubscriptionScope[] {
    if (scope === "both") return [...PUSH_SCOPES];
    if (scope === "user" || scope === "admin") return [scope];
    return [];
}

export function hasPushScope(
    scope: StoredPushSubscriptionScope | null | undefined,
    targetScope: PushSubscriptionScope
) {
    return scope === "both" || scope === targetScope;
}

export function mergePushScopes(
    currentScope: StoredPushSubscriptionScope | null | undefined,
    nextScope: PushSubscriptionScope
): StoredPushSubscriptionScope {
    if (!currentScope) return nextScope;
    if (currentScope === "both" || currentScope === nextScope) return currentScope;
    return "both";
}

export function removePushScope(
    currentScope: StoredPushSubscriptionScope | null | undefined,
    scopeToRemove: PushSubscriptionScope
): StoredPushSubscriptionScope | null {
    if (!currentScope) return null;
    if (currentScope === "both") {
        return scopeToRemove === "user" ? "admin" : "user";
    }
    return currentScope === scopeToRemove ? null : currentScope;
}
