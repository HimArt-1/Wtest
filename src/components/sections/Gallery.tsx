"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { getArtworks } from "@/app/actions/artworks";
import { useCartStore } from "@/stores/cartStore";

const categories = [
  { id: "all", label: "الكل" },
  { id: "painting", label: "رسم زيتي" },
  { id: "digital", label: "فن رقمي" },
  { id: "calligraphy", label: "خط عربي" },
  { id: "sculpture", label: "نحت" },
  { id: "photography", label: "تصوير" },
];

export function Gallery() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function fetchArtworks() {
      setLoading(true);
      const { data } = await getArtworks(1, activeCategory);
      setArtworks(data || []);
      setLoading(false);
    }
    fetchArtworks();
  }, [activeCategory]);

  return (
    <section id="gallery" className="py-20 relative overflow-hidden" style={{ backgroundColor: "var(--wusha-bg)" }}>
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-gold/5 rounded-full blur-3xl opacity-20 animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full blur-3xl opacity-20 animate-pulse-slow delay-1000" style={{ backgroundColor: "color-mix(in srgb, var(--wusha-mist) 5%, transparent)" }} />
      </div>

      <div className="container-wusha relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-4"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              معرض <span className="text-gold">الأعمال المميزة</span>
            </motion.h2>
            <motion.p
              className="text-theme-soft max-w-xl text-lg"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              اكتشف مجموعة مختارة من أبدع الأعمال الفنية لفنانينا الموهوبين
            </motion.p>
          </div>

          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === cat.id
                  ? "bg-[var(--wusha-gold)] text-[var(--wusha-bg)]"
                  : "bg-theme-subtle text-theme-soft hover:bg-[color-mix(in_srgb,var(--wusha-text)_10%,transparent)] hover:text-[var(--wusha-text)]"
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </motion.div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] bg-theme-subtle rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            <AnimatePresence mode="popLayout">
              {artworks.map((artwork) => (
                <motion.div
                  key={artwork.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-theme-subtle border border-theme-soft"
                >
                  <Image
                    src={artwork.image_url}
                    alt={artwork.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--wusha-bg) 90%, transparent), color-mix(in srgb, var(--wusha-bg) 20%, transparent), transparent)" }}>
                    <div className="absolute bottom-0 left-0 w-full p-6">
                      <div className="flex justify-between items-end">
                        <div>
                          <h3 className="text-xl font-bold mb-1" style={{ color: "var(--wusha-text)" }}>{artwork.title}</h3>
                          <p className="text-sm" style={{ color: "var(--wusha-gold)" }}>{artwork.artist?.display_name || "فنان مجهول"}</p>
                          {artwork.price && (
                            <p className="font-bold mt-2" style={{ color: "color-mix(in srgb, var(--wusha-text) 90%, transparent)" }}>{artwork.price} ر.س</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {artwork.price && (
                            <button
                              onClick={() => addToCart({
                                id: artwork.id,
                                title: artwork.title,
                                price: Number(artwork.price),
                                image_url: artwork.image_url,
                                artist_name: artwork.artist?.display_name || "Wusha Artist",
                                type: "artwork",
                              })}
                              className="p-3 rounded-full transition-colors backdrop-blur-sm"
                              style={{
                                backgroundColor: "var(--wusha-gold)",
                                color: "var(--wusha-bg)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--wusha-text)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--wusha-gold)";
                              }}
                              title="أضف للسلة"
                            >
                              <ShoppingBag className="w-5 h-5" />
                            </button>
                          )}
                            <button className="p-3 rounded-full transition-colors backdrop-blur-sm" style={{ backgroundColor: "color-mix(in srgb, var(--wusha-text) 10%, transparent)", color: "var(--wusha-text)" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--wusha-text) 20%, transparent)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--wusha-text) 10%, transparent)"; }}>
                            <Heart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && artworks.length === 0 && (
          <div className="text-center py-20">
            <p className="text-theme-subtle text-lg">لا توجد أعمال في هذا التصنيف حالياً</p>
          </div>
        )}

        {/* Load More */}
        <div className="mt-16 text-center">
          <button className="px-8 py-4 border rounded-full transition-all duration-300 tracking-wider text-sm font-medium" style={{ borderColor: "color-mix(in srgb, var(--wusha-gold) 30%, transparent)", color: "var(--wusha-gold)" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--wusha-gold)"; e.currentTarget.style.color = "var(--wusha-bg)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--wusha-gold)"; }}>
            عرض المزيد من الأعمال
          </button>
        </div>
      </div>
    </section>
  );
}
