// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — إرسال البريد الإلكتروني
//  عبر Resend — ترحيب، قبول طلب، تأكيد طلب
// ═══════════════════════════════════════════════════════════

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "وشّى <onboarding@resend.dev>";
const SITE_NAME = "وشّى";

export const EMAIL_ENABLED = !!resend;

async function send(options: { to: string; subject: string; html: string }) {
    if (!resend) {
        console.warn("[Email] RESEND_API_KEY غير معرّف — تخطي الإرسال");
        return { success: false };
    }
    try {
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        if (error) {
            console.error("[Email]", error);
            return { success: false };
        }
        return { success: true };
    } catch (err) {
        console.error("[Email]", err);
        return { success: false };
    }
}

export async function sendWelcomeEmail(to: string, name: string) {
    return send({
        to,
        subject: `مرحباً بك في ${SITE_NAME} 👋`,
        html: `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
                <h1 style="color: #ceae7f; font-size: 24px;">مرحباً ${name}،</h1>
                <p style="color: #333; line-height: 1.7;">شكراً لانضمامك إلى ${SITE_NAME}. أنت الآن جزء من مجتمع الفنون العربية.</p>
                <p style="color: #333; line-height: 1.7;">يمكنك تصفح المعرض، المتجر، وتصميم قطعك بالذكاء الاصطناعي.</p>
                <p style="color: #666; margin-top: 32px;">— فريق ${SITE_NAME}</p>
            </div>
        `,
    });
}

export async function sendApplicationAcceptedEmail(to: string, name: string, tempPassword?: string) {
    const passwordNote = tempPassword
        ? `<p style="color: #333; line-height: 1.7;">تم إنشاء حسابك. كلمة المرور المؤقتة: <strong dir="ltr">${tempPassword}</strong></p><p style="color: #666; font-size: 14px;">ننصحك بتغييرها فور تسجيل الدخول.</p>`
        : "";

    return send({
        to,
        subject: `تم قبول طلبك — أنت الآن وشّاي في ${SITE_NAME} 🎨`,
        html: `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
                <h1 style="color: #ceae7f; font-size: 24px;">مبروك ${name}!</h1>
                <p style="color: #333; line-height: 1.7;">تم قبول طلب انضمامك كفنان وشّاي. يمكنك الآن الدخول إلى الاستوديو ورفع أعمالك وبيعها.</p>
                ${passwordNote}
                <p style="color: #333; line-height: 1.7; margin-top: 24px;"><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wusha.sa"}/studio" style="color: #ceae7f; font-weight: bold;">ادخل إلى الاستوديو ←</a></p>
                <p style="color: #666; margin-top: 32px;">— فريق ${SITE_NAME}</p>
            </div>
        `,
    });
}

export async function sendApplicationRejectedEmail(to: string, name: string) {
    return send({
        to,
        subject: `بخصوص طلب الانضمام إلى ${SITE_NAME}`,
        html: `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
                <h1 style="color: #333; font-size: 24px;">أهلاً ${name}،</h1>
                <p style="color: #333; line-height: 1.7;">شكراً لاهتمامك بالانضمام كفنان. للأسف لم نتمكن من قبول طلبك هذه المرة.</p>
                <p style="color: #333; line-height: 1.7;">يمكنك إعادة التقديم لاحقاً بعد تطوير معرض أعمالك.</p>
                <p style="color: #666; margin-top: 32px;">— فريق ${SITE_NAME}</p>
            </div>
        `,
    });
}

export async function sendOrderConfirmationEmail(
    to: string,
    name: string,
    orderNumber: string,
    total: number
) {
    return send({
        to,
        subject: `تم استلام طلبك #${orderNumber} — ${SITE_NAME}`,
        html: `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
                <h1 style="color: #ceae7f; font-size: 24px;">شكراً لطلبك، ${name}</h1>
                <p style="color: #333; line-height: 1.7;">تم استلام طلبك بنجاح.</p>
                <p style="color: #333; line-height: 1.7;">رقم الطلب: <strong>${orderNumber}</strong></p>
                <p style="color: #333; line-height: 1.7;">الإجمالي: <strong>${total.toLocaleString()} ر.س</strong></p>
                <p style="color: #666; margin-top: 32px;">— فريق ${SITE_NAME}</p>
            </div>
        `,
    });
}
