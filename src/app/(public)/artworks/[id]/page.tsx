import { getArtworkById, getArtworks } from "@/app/actions/artworks";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { ArtworkActions } from "./ArtworkActions";

// ─── Dynamic Metadata ───────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const artwork = await getArtworkById(id);
    if (!artwork) return { title: "غير موجود — وشّى" };

    return {
        title: `${(artwork as any).title} — وشّى`,
        description: (artwork as any).description || `عمل فني بواسطة ${(artwork as any).artist?.display_name}`,
        openGraph: {
            images: [(artwork as any).image_url],
        },
    };
}

// ─── Page ───────────────────────────────────────────────────

export default async function ArtworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const artwork = await getArtworkById(id) as any;
    if (!artwork) notFound();

    // Fetch similar artworks (same category, excluding current)
    const similar = await getArtworks(1, "all", "");
    const similarArtworks = similar.data?.filter((a: any) => a.id !== artwork.id).slice(0, 4) || [];

    return (
        <div className="min-h-[60vh] bg-bg pt-6 sm:pt-8 pb-12 sm:pb-16" dir="rtl">
            <div className="max-w-7xl mx-auto px-6">
                {/* ─── Breadcrumb ─── */}
                <nav className="flex items-center gap-2 text-xs text-fg/30 mb-8">
                    <Link href="/" className="hover:text-gold transition-colors">الرئيسية</Link>
                    <span>/</span>
                    <Link href="/gallery" className="hover:text-gold transition-colors">المعرض</Link>
                    <span>/</span>
                    <span className="text-fg/50">{artwork.title}</span>
                </nav>

                {/* ─── Main Content ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Image */}
                    <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/[0.06] bg-surface/30">
                        <Image
                            src={artwork.image_url}
                            alt={artwork.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority
                        />
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-center">
                        {/* Category Badge */}
                        {artwork.category && (
                            <span className="inline-block w-fit text-xs bg-gold/10 text-gold px-3 py-1 rounded-full mb-4">
                                {artwork.category.name_ar}
                            </span>
                        )}

                        <h1 className="text-3xl md:text-4xl font-bold text-fg mb-4">{artwork.title}</h1>

                        {/* Artist */}
                        <Link
                            href={`/artists/${artwork.artist?.username}`}
                            className="flex items-center gap-3 mb-6 group"
                        >
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/[0.08] bg-surface">
                                {artwork.artist?.avatar_url ? (
                                    <Image src={artwork.artist.avatar_url} alt="" width={48} height={48} className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                                        {artwork.artist?.display_name?.[0]}
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className="font-bold text-fg text-sm group-hover:text-gold transition-colors flex items-center gap-1.5">
                                    {artwork.artist?.display_name}
                                    {artwork.artist?.is_verified && <span className="text-gold text-xs">✦</span>}
                                </span>
                                <span className="text-xs text-fg/30">@{artwork.artist?.username}</span>
                            </div>
                        </Link>

                        {/* Description */}
                        {artwork.description && (
                            <p className="text-fg/50 text-sm leading-relaxed mb-6">{artwork.description}</p>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {artwork.medium && (
                                <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                    <span className="text-[10px] text-fg/20 block">الخامة</span>
                                    <span className="text-sm text-fg/70">{artwork.medium}</span>
                                </div>
                            )}
                            {artwork.dimensions && (
                                <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                    <span className="text-[10px] text-fg/20 block">الأبعاد</span>
                                    <span className="text-sm text-fg/70">{artwork.dimensions}</span>
                                </div>
                            )}
                            {artwork.year && (
                                <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                    <span className="text-[10px] text-fg/20 block">السنة</span>
                                    <span className="text-sm text-fg/70">{artwork.year}</span>
                                </div>
                            )}
                            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                <span className="text-[10px] text-fg/20 block">المشاهدات</span>
                                <span className="text-sm text-fg/70">{artwork.views_count || 0}</span>
                            </div>
                        </div>

                        {/* Price + Add to Cart */}
                        {artwork.price && (
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-3xl font-bold text-gold">{Number(artwork.price).toLocaleString()} ر.س</span>
                            </div>
                        )}

                        {/* Client Actions (Add to Cart + Share) */}
                        <ArtworkActions artwork={artwork} />

                        {/* Tags */}
                        {artwork.tags && artwork.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-6">
                                {artwork.tags.map((tag: string) => (
                                    <Link
                                        key={tag}
                                        href={`/search?q=${tag}`}
                                        className="text-[10px] bg-white/[0.04] text-fg/30 px-3 py-1 rounded-full hover:bg-gold/10 hover:text-gold transition-colors"
                                    >
                                        #{tag}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Similar Artworks ─── */}
                {similarArtworks.length > 0 && (
                    <div className="mt-20">
                        <h2 className="text-2xl font-bold text-fg mb-8">أعمال قد تعجبك</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {similarArtworks.map((item: any) => (
                                <Link
                                    key={item.id}
                                    href={`/artworks/${item.id}`}
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
                                        <p className="text-xs text-fg/30 mt-1">{item.artist?.display_name}</p>
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
