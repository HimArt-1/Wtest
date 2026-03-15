"use server";

import { SupportTicketPriority, SupportTicketStatus } from "@/types/database";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createUserNotification } from "./user-notifications";
import { createAdminNotification } from "./notifications";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { getSupportTicketAccess, requireSupportAdmin } from "@/lib/support-ticket-access";

export async function createSupportTicket(data: { subject: string; message: string; priority: SupportTicketPriority }) {
    const user = await currentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const subject = data.subject.trim();
    const message = data.message.trim();
    if (!subject || !message) {
        return { success: false, error: "Subject and message are required" };
    }

    const supabase = getSupabaseAdminClient();
    const { data: profile } = await supabase.from("profiles").select("id").eq("clerk_id", user.id).single();
    if (!profile) return { success: false, error: "Profile not found" };

    // Create the ticket
    const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
            user_id: profile.id,
            subject,
            priority: data.priority,
            name: user.firstName || "مستخدم",
            email: user.emailAddresses?.[0]?.emailAddress || "",
            message,
        })
        .select("id")
        .single();

    if (ticketError || !ticket) {
        console.error("[createSupportTicket] Error creating ticket:", ticketError);
        return { success: false, error: ticketError?.message || "Failed to create ticket" };
    }

    // Insert the first message
    const { error: msgError } = await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: profile.id,
        message,
    });

    if (msgError) {
        console.error("[createSupportTicket] Error creating initial message:", msgError);
    }

    // Notify admin about new support ticket
    await createAdminNotification({
        type: "system_alert",
        category: "support",
        severity: "warning",
        title: "تذكرة دعم جديدة 🎫",
        message: `تذكرة جديدة من ${user.firstName || "مستخدم"}: ${subject}`,
        link: `/dashboard/support`,
    });

    revalidatePath("/account/support");
    return { success: true, ticketId: ticket.id };
}

export async function getUserSupportTickets() {
    const user = await currentUser();
    if (!user) return [];

    const supabase = getSupabaseAdminClient();
    const { data: profile } = await supabase.from("profiles").select("id").eq("clerk_id", user.id).single();
    if (!profile) return [];

    const { data, error } = await supabase
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
    const { sb: supabase, access } = await getSupportTicketAccess(ticketId);
    if (access === "none") return null;

    // Fetch Ticket + User Profile
    const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .select("*, profile:profiles!user_id(display_name, avatar_url, role)")
        .eq("id", ticketId)
        .single();

    if (ticketError || !ticket) return null;

    // Fetch Messages
    const { data: messages, error: messagesError } = await supabase
        .from("support_messages")
        .select("*, sender:profiles!sender_id(display_name, avatar_url, role)")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

    if (messagesError) {
        console.error("[getSupportTicketDetails] Messages error:", messagesError);
    }

    return {
        ticket,
        messages: messages || []
    };
}

export async function createSupportMessage(ticketId: string, message: string) {
    const content = message.trim();
    if (!content) return { success: false, error: "Message is required" };

    const { sb: supabase, ticket, access, profileId } = await getSupportTicketAccess(ticketId);
    if (access === "none" || !ticket || !profileId) {
        return { success: false, error: "Unauthorized" };
    }

    if (access === "owner" && (ticket.status === "closed" || ticket.status === "resolved")) {
        return { success: false, error: "Ticket is closed" };
    }

    const isAdminReply = access === "admin";

    // Insert Message
    const { error } = await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        sender_id: profileId,
        message: content,
        is_admin_reply: isAdminReply
    });

    if (error) {
        console.error("[createSupportMessage]", error);
        return { success: false, error: error.message };
    }

    // Update Ticket's updated_at timestamp & optionally status
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (isAdminReply && ticket.status === "open") updatePayload.status = "in_progress";

    await supabase.from("support_tickets").update(updatePayload).eq("id", ticketId);

    // Notifications
    if (isAdminReply && ticket.user_id) {
        await createUserNotification({
            userId: ticket.user_id,
            type: "support_reply",
            title: "رد جديد من الدعم الفني",
            message: `تم الرد على تذكرتك: ${ticket.subject}`,
            link: `/account/support/${ticketId}`
        });
    }

    revalidatePath(`/account/support/${ticketId}`);
    revalidatePath(`/dashboard/support/${ticketId}`);

    return { success: true };
}

// ─── ADMIN ACTIONS ─────────────────────────────────────────

export async function adminGetSupportTickets() {
    try {
        const { sb: supabase } = await requireSupportAdmin();
        const { data, error } = await supabase
            .from("support_tickets")
            .select("*, profile:profiles!user_id(display_name, avatar_url)")
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("[adminGetSupportTickets]", error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error("[adminGetSupportTickets]", err);
        return [];
    }
}

export async function adminUpdateSupportTicketStatus(ticketId: string, status: SupportTicketStatus) {
    const { sb: supabase } = await requireSupportAdmin();
    const { error } = await supabase.from("support_tickets").update({
        status,
        updated_at: new Date().toISOString()
    }).eq("id", ticketId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/dashboard/support/${ticketId}`);
    revalidatePath(`/dashboard/support`);
    revalidatePath(`/account/support/${ticketId}`);
    return { success: true };
}
