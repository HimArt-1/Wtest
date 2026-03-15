"use server";

import { type SupportTicketStatus, type SupportTicketPriority } from "@/types/database";
import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

interface GenerateTicketInput {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export async function submitSupportTicket(data: GenerateTicketInput) {
    try {
        const name = data.name.trim();
        const email = data.email.trim().toLowerCase();
        const subject = data.subject.trim();
        const message = data.message.trim();

        if (!name || !email || !subject || !message) {
            return { success: false, error: "جميع الحقول مطلوبة" };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: "البريد الإلكتروني غير صحيح" };
        }

        const adminSupabase = getSupabaseAdminClient();
        const user = await currentUser();
        let resolvedUserId: string | null = null;

        if (user) {
            const { data: profile } = await adminSupabase
                .from("profiles")
                .select("id")
                .eq("clerk_id", user.id)
                .single();

            resolvedUserId = profile?.id ?? null;
        }

        const ticketData = {
            name,
            email,
            subject,
            message,
            user_id: resolvedUserId,
            status: "open" as SupportTicketStatus,
            priority: "normal" as SupportTicketPriority,
        };

        const { error } = await adminSupabase
            .from("support_tickets")
            .insert(ticketData);

        if (error) {
            console.error("Support Ticket Submission Error:", error);
            throw error;
        }

        return { success: true };
    } catch (e: any) {
        console.error("Error creating support ticket:", e);
        return { success: false, error: "حدث خطأ غير متوقع أثناء إرسال تذكرتك، يرجى المحاولة لاحقاً" };
    }
}
