import type {
    AdminNotificationCategory,
    AdminNotificationSeverity,
    AdminNotificationType,
} from "@/types/database";

export const ADMIN_NOTIFICATION_CATEGORIES: AdminNotificationCategory[] = [
    "orders",
    "payments",
    "applications",
    "support",
    "design",
    "system",
    "security",
];

export const ADMIN_NOTIFICATION_SEVERITIES: AdminNotificationSeverity[] = [
    "critical",
    "warning",
    "info",
];

export function getDefaultAdminNotificationMeta(type: AdminNotificationType): {
    category: AdminNotificationCategory;
    severity: AdminNotificationSeverity;
} {
    switch (type) {
        case "order_new":
        case "order_status":
        case "order_update":
            return { category: "orders", severity: "info" };
        case "order_alert":
            return { category: "orders", severity: "warning" };
        case "payment_received":
            return { category: "payments", severity: "info" };
        case "application_new":
            return { category: "applications", severity: "info" };
        case "system_alert":
        default:
            return { category: "system", severity: "warning" };
    }
}

export function getAdminNotificationCategoryLabel(category: AdminNotificationCategory): string {
    switch (category) {
        case "orders":
            return "الطلبات";
        case "payments":
            return "المدفوعات";
        case "applications":
            return "الانضمام";
        case "support":
            return "الدعم";
        case "design":
            return "التصميم";
        case "security":
            return "الأمان";
        case "system":
        default:
            return "النظام";
    }
}

export function getAdminNotificationSeverityLabel(severity: AdminNotificationSeverity): string {
    switch (severity) {
        case "critical":
            return "حرج";
        case "warning":
            return "تحذير";
        case "info":
        default:
            return "معلومة";
    }
}
