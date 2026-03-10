import { PublicPageWrapper } from "@/components/layout/PublicPageWrapper";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <PublicPageWrapper>{children}</PublicPageWrapper>;
}
