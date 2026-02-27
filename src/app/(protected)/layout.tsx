import { ensureProfile } from "@/lib/ensure-profile";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await ensureProfile();
    return <>{children}</>;
}
