import { getProducts } from "@/app/actions/products";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { StoreFilters } from "./StoreFilters";

export const metadata: Metadata = {
    title: "المتجر — وشّى",
    description: "تسوق منتجات فنية فريدة من فناني وشّى",
};

export default async function StorePage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string; page?: string }>;
}) {
    const params = await searchParams;
    const type = params.type || "all";
    const page = parseInt(params.page || "1");

    const { data: products, count, totalPages } = await getProducts(page, type);

    return (
        <div className="min-h-screen bg-bg pt-24 pb-20" dir="rtl">
            <div className="max-w-7xl mx-auto px-6">
                {/* ─── Header ─── */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-fg mb-3">
                        المتجر
                    </h1>
                    <p className="text-fg/30 text-sm">
                        {count || 0} منتج فني فريد
                    </p>
                </div>

                {/* ─── Filters (Client Component) ─── */}
                <StoreFilters currentType={type} />

                {/* ─── Grid ─── */}
                {products && products.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {products.map((product: any) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.id}`}
                                    className="group rounded-2xl border border-white/[0.06] overflow-hidden hover:border-gold/30 transition-all duration-500"
                                >
                                    <div className="aspect-square relative overflow-hidden">
                                        <Image
                                            src={product.image_url}
                                            alt={product.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        />
                                        <span className="absolute top-2 right-2 text-[9px] bg-black/40 backdrop-blur-sm text-white/70 px-2 py-0.5 rounded-full">
                                            {product.type}
                                        </span>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-bold text-fg truncate group-hover:text-gold transition-colors">
                                            {product.title}
                                        </h3>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-[10px] text-fg/30">{product.artist?.display_name}</span>
                                            <span className="text-xs font-bold text-gold">{Number(product.price).toLocaleString()} ر.س</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-12">
                                {[...Array(totalPages)].map((_, i) => {
                                    const params = new URLSearchParams();
                                    if (type !== "all") params.set("type", type);
                                    params.set("page", String(i + 1));

                                    return (
                                        <Link
                                            key={i}
                                            href={`/store?${params.toString()}`}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${page === i + 1
                                                    ? "bg-gold text-bg"
                                                    : "text-fg/30 hover:bg-white/[0.04]"
                                                }`}
                                        >
                                            {i + 1}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-24">
                        <p className="text-fg/20">لا توجد منتجات</p>
                    </div>
                )}
            </div>
        </div>
    );
}
