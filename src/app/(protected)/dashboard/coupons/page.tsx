import { getAllDiscountCoupons } from "@/app/actions/discount-coupons";
import { CouponsClient } from "@/components/admin/CouponsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "إدارة الخصومات — وشّى",
};

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
    const coupons = await getAllDiscountCoupons();

    return <CouponsClient initialCoupons={coupons as any} />;
}
