"use server";

import { createClient } from "@supabase/supabase-js";
import { type SupportTicketStatus, type SupportTicketPriority } from "@/types/database";

// Admin-level client used to insert tickets reliably
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

interface GenerateTicketInput {
    name: string;
    email: string;
    subject: string;
    message: string;
    user_id?: string | null;
}

export async function submitSupportTicket(data: GenerateTicketInput) {
    try {
        const { name, email, subject, message, user_id } = data;

        if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
            return { success: false, error: "جميع الحقول مطلوبة" };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: "البريد الإلكتروني غير صحيح" };
        }

        const ticketData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
            user_id: user_id || null,
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
