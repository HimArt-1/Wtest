import { getProductById, getProducts } from "@/app/actions/products";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { ProductActions } from "./ProductActions";

// ─── Dynamic Metadata ───────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) return { title: "غير موجود — وشّى" };

    return {
        title: `${(product as any).title} — وشّى`,
        description: (product as any).description || `منتج بواسطة ${(product as any).artist?.display_name}`,
        openGraph: {
            images: [(product as any).image_url],
        },
    };
}

// ─── Page ───────────────────────────────────────────────────

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProductById(id) as any;
    if (!product) notFound();

    // Related products
    const related = await getProducts(1, product.type || "all");
    const relatedProducts = related.data?.filter((p: any) => p.id !== product.id).slice(0, 4) || [];

    return (
        <div className="min-h-screen bg-bg pt-24 pb-20" dir="rtl">
            <div className="max-w-7xl mx-auto px-6">
                {/* ─── Breadcrumb ─── */}
                <nav className="flex items-center gap-2 text-xs text-fg/30 mb-8">
                    <Link href="/" className="hover:text-gold transition-colors">الرئيسية</Link>
                    <span>/</span>
                    <Link href="/store" className="hover:text-gold transition-colors">المتجر</Link>
                    <span>/</span>
                    <span className="text-fg/50">{product.title}</span>
                </nav>

                {/* ─── Main Content ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Image */}
                    <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/[0.06] bg-surface/30">
                        <Image
                            src={product.image_url}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority
                        />
                        <span className="absolute top-4 right-4 text-xs bg-black/50 backdrop-blur-sm text-white/80 px-3 py-1 rounded-full">
                            {product.type}
                        </span>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-fg mb-3">{product.title}</h1>

                        {/* Artist */}
                        {product.artist && (
                            <Link
                                href={`/artists/${product.artist.username}`}
                                className="flex items-center gap-2 mb-6 text-fg/40 hover:text-gold transition-colors"
                            >
                                {product.artist.avatar_url ? (
                                    <Image src={product.artist.avatar_url} alt="" width={24} height={24} className="rounded-full" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gold/20" />
                                )}
                                <span className="text-sm">بواسطة {product.artist.display_name}</span>
                            </Link>
                        )}

                        {/* Description */}
                        {product.description && (
                            <p className="text-fg/50 text-sm leading-relaxed mb-6">{product.description}</p>
                        )}

                        {/* Product Details */}
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                                <span className="text-xs text-fg/30">النوع</span>
                                <span className="text-sm text-fg/70">{product.type}</span>
                            </div>
                            {product.sizes && product.sizes.length > 0 && (
                                <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                                    <span className="text-xs text-fg/30">المقاسات المتاحة</span>
                                    <span className="text-sm text-fg/70">{product.sizes.join(", ")}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                                <span className="text-xs text-fg/30">الحالة</span>
                                <span className={`text-sm font-medium ${product.in_stock ? "text-emerald-400" : "text-red-400"}`}>
                                    {product.in_stock ? "متوفر" : "غير متوفر"}
                                </span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="mb-6">
                            <span className="text-3xl font-bold text-gold">{Number(product.price).toLocaleString()} ر.س</span>
                            <span className="text-xs text-fg/20 mr-2">{product.currency || "SAR"}</span>
                        </div>

                        {/* Client Actions (Size Selector + Add to Cart) */}
                        <ProductActions product={product} />
                    </div>
                </div>

                {/* ─── Related Products ─── */}
                {relatedProducts.length > 0 && (
                    <div className="mt-20">
                        <h2 className="text-2xl font-bold text-fg mb-8">منتجات مشابهة</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {relatedProducts.map((item: any) => (
                                <Link
                                    key={item.id}
                                    href={`/products/${item.id}`}
                                    className="group rounded-2xl border border-white/[0.06] overflow-hidden hover:border-gold/30 transition-all"
                                >
                                    <div className="aspect-square relative">
                                        <Image
                                            src={item.image_url}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-bold text-fg truncate">{item.title}</h3>
                                        <p className="text-xs text-gold mt-1">{Number(item.price).toLocaleString()} ر.س</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
