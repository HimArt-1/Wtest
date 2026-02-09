"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Heart, Loader2 } from "lucide-react";
import { getArtworks } from "@/app/actions/artworks";
import type { Artwork, Category } from "@/types/database";

type ArtworkWithArtist = Artwork & {
  artist: {
    display_name: string;
    avatar_url: string | null;
  };
};

const categories = [
  { id: "all", label: "الكل" },
  { id: "digital", label: "رقمي" },
  { id: "photography", label: "تصوير" },
  { id: "calligraphy", label: "خط" },
  { id: "traditional", label: "تقليدي" },
  { id: "abstract", label: "تجريدي" },
];

export function Gallery() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [artworks, setArtworks] = useState<ArtworkWithArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  async function loadArtworks(reset = false) {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    const { data, count } = await getArtworks(currentPage, activeCategory);

    const newArtworks = data as unknown as ArtworkWithArtist[];

    if (reset) {
      setArtworks(newArtworks);
      setPage(2);
    } else {
      setArtworks((prev) => [...prev, ...newArtworks]);
      setPage((prev) => prev + 1);
    }

    setHasMore(newArtworks.length > 0 && (reset ? newArtworks.length : artworks.length + newArtworks.length) < count);
    setLoading(false);
  }

  useEffect(() => {
    loadArtworks(true);
  }, [activeCategory]);

  return (
    <section id="gallery" className="py-16 sm:py-24 relative">
      {/* Section Divider */}
      <div className="section-divider mb-16 sm:mb-24" />

      <div className="container-wusha">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
          <motion.span
            className="text-gold/60 text-sm tracking-[0.3em] uppercase block mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            إبداعات لا حدود لها
          </motion.span>
          <motion.h2
            className="text-4xl md:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gradient">معرض الأعمال</span>
          </motion.h2>
          <motion.p
            className="text-white/40 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            اكتشف أحدث إبداعات الفنانين العرب، من اللوحات التقليدية إلى الفنون الرقمية
          </motion.p>
        </div>

        {/* Filter Categories */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 sm:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-500 ${activeCategory === category.id
                ? "bg-gradient-to-r from-gold to-[#b8964f] text-[#0a0a0a] shadow-[0_0_20px_rgba(206,174,127,0.2)]"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/5"
                }`}
            >
              {category.label}
            </button>
          ))}
        </motion.div>

        {/* Artworks Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8"
        >
          <AnimatePresence mode="popLayout">
            {artworks.map((artwork, index) => (
              <motion.div
                layout
                key={artwork.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group relative glass-card rounded-2xl overflow-hidden"
              >
                {/* Image */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex items-center justify-between text-white mb-2">
                        <span className="font-bold text-lg text-gold">{artwork.price ? `${artwork.price} ${artwork.currency}` : 'للعرض فقط'}</span>
                        <div className="flex gap-3">
                          <button className="p-2 bg-white/10 rounded-full hover:bg-gold hover:text-[#0a0a0a] transition-all backdrop-blur-sm">
                            <Heart className="w-5 h-5" />
                          </button>
                          <button className="p-2 bg-white/10 rounded-full hover:bg-gold hover:text-[#0a0a0a] transition-all backdrop-blur-sm">
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 relative z-10">
                  <h3 className="text-lg font-bold mb-2 text-white/90 truncate">{artwork.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10">
                        {artwork.artist?.avatar_url && (
                          <img src={artwork.artist.avatar_url} alt={artwork.artist.display_name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="text-sm text-white/40">{artwork.artist?.display_name || 'فنان مجهول'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/30">
                      <Eye className="w-3 h-3" />
                      <span>{artwork.views_count}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center mt-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        )}

        {/* Empty State */}
        {!loading && artworks.length === 0 && (
          <div className="text-center mt-12 text-white/30">
            لا توجد أعمال فنية في هذا التصنيف حالياً.
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && (
          <div className="text-center mt-14">
            <motion.button
              onClick={() => loadArtworks(false)}
              className="px-10 py-3 border border-gold/20 rounded-full text-gold/70 hover:bg-gold/10 hover:border-gold/40 hover:text-gold transition-all duration-500"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              عرض المزيد
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
}
