"use server";

import { getSupabaseServerClient } from "@/lib/supabase";
import { SupportTicketPriority, SupportTicketStatus } from "@/types/database";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createUserNotification } from "./user-notifications";

export async function createSupportTicket(data: { subject: string; message: string; priority: SupportTicketPriority }) {
    const user = await currentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const supabase = getSupabaseServerClient();
    const { data: profile } = await (supabase as any).from("profiles").select("id").eq("clerk_id", user.id).single();
    if (!profile) return { success: false, error: "Profile not found" };

    // Create the ticket
    const { data: ticket, error: ticketError } = await (supabase as any)
        .from("support_tickets")
        .insert({
            user_id: profile.id,
            subject: data.subject,
            priority: data.priority,
        })
        .select("id")
        .single();

    if (ticketError || !ticket) {
        console.error("[createSupportTicket] Error creating ticket:", ticketError);
        return { success: false, error: ticketError?.message || "Failed to create ticket" };
    }

    // Insert the first message
    const { error: msgError } = await (supabase as any).from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: profile.id,
        message: data.message,
    });

    if (msgError) {
        console.error("[createSupportTicket] Error creating initial message:", msgError);
    }

    // TODO: Notify admin (Push + DB)

    revalidatePath("/account/support");
    return { success: true, ticketId: ticket.id };
}

export async function getUserSupportTickets() {
    const user = await currentUser();
    if (!user) return [];

    const supabase = getSupabaseServerClient();
    const { data: profile } = await (supabase as any).from("profiles").select("id").eq("clerk_id", user.id).single();
    if (!profile) return [];

    const { data, error } = await (supabase as any)
        .from("support_tickets")
        .select("*")
        .eq("user_id", profile.id)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("[getUserSupportTickets] Error:", error);
        return [];
    }
    return data || [];
}

export async function getSupportTicketDetails(ticketId: string) {
    const supabase = getSupabaseServerClient();

    // Fetch Ticket + User Profile
    const { data: ticket, error: ticketError } = await (supabase as any)
        .from("support_tickets")
        .select("*, profile:profiles!user_id(display_name, avatar_url, role)")
        .eq("id", ticketId)
        .single();

    if (ticketError || !ticket) return null;

    // Fetch Messages
    const { data: messages, error: messagesError } = await (supabase as any)
        .from("support_messages")
        .select("*, sender:profiles!sender_id(display_name, avatar_url, role)")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

    return {
        ticket,
        messages: messages || []
    };
}

export async function createSupportMessage(ticketId: string, message: string) {
    const user = await currentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const supabase = getSupabaseServerClient();
    const { data: profile } = await (supabase as any).from("profiles").select("id, role").eq("clerk_id", user.id).single();
    if (!profile) return { success: false, error: "Profile not found" };

    const isAdminReply = profile.role === "admin";

    // Insert Message
    const { error } = await (supabase as any).from("support_messages").insert({
        ticket_id: ticketId,
        sender_id: profile.id,
        message,
        is_admin_reply: isAdminReply
    });

    if (error) {
        console.error("[createSupportMessage]", error);
        return { success: false, error: error.message };
    }

    // Update Ticket's updated_at timestamp & optionally status
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (isAdminReply) updatePayload.status = "in_progress"; // automatic state change

    await (supabase as any).from("support_tickets").update(updatePayload).eq("id", ticketId);

    // Notifications
    const { data: ticketBase } = await (supabase as any).from("support_tickets").select("user_id, subject").eq("id", ticketId).single();

    if (isAdminReply && ticketBase) {
        await createUserNotification({
            userId: ticketBase.user_id,
            type: "support_reply",
            title: "رد جديد من الدعم الفني",
            message: `تم الرد على تذكرتك: ${ticketBase.subject}`,
            link: `/account/support/${ticketId}`
        });
    }

    revalidatePath(`/account/support/${ticketId}`);
    revalidatePath(`/dashboard/support/${ticketId}`);

    return { success: true };
}

// ─── ADMIN ACTIONS ─────────────────────────────────────────

export async function adminGetSupportTickets() {
    const supabase = getSupabaseServerClient();
    const { data, error } = await (supabase as any)
        .from("support_tickets")
        .select("*, profile:profiles!user_id(display_name, avatar_url)")
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("[adminGetSupportTickets]", error);
        return [];
    }
    return data || [];
}

export async function adminUpdateSupportTicketStatus(ticketId: string, status: SupportTicketStatus) {
    const supabase = getSupabaseServerClient();
    const { error } = await (supabase as any).from("support_tickets").update({
        status,
        updated_at: new Date().toISOString()
    }).eq("id", ticketId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/dashboard/support/${ticketId}`);
    revalidatePath(`/dashboard/support`);
    revalidatePath(`/account/support/${ticketId}`);
    return { success: true };
}
