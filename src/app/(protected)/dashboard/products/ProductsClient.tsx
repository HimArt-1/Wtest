"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package,
    Star,
    StarOff,
    CheckCircle,
    XCircle,
    Loader2,
    Plus,
    Pencil,
    Trash2,
    X,
    Upload,
} from "lucide-react";
import {
    updateProduct,
    deleteProduct,
    createProductAdmin,
    uploadProductImage,
} from "@/app/actions/settings";
import Image from "next/image";
import Link from "next/link";

const typeLabels: Record<string, string> = {
    all: "الكل",
    print: "مطبوعات",
    apparel: "ملابس",
    digital: "رقمي",
    nft: "NFT",
    original: "أصلي",
};

const typeOptions = [
    { value: "print", label: "مطبوعات" },
    { value: "apparel", label: "ملابس" },
    { value: "digital", label: "رقمي" },
    { value: "nft", label: "NFT" },
    { value: "original", label: "أصلي" },
];

interface ProductsClientProps {
    products: any[];
    count: number;
    totalPages: number;
    currentPage: number;
    currentType: string;
    artists?: { id: string; display_name: string; username: string }[];
}

export function ProductsClient({
    products,
    count,
    totalPages,
    currentPage,
    currentType,
    artists = [],
}: ProductsClientProps) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleToggle = async (id: string, field: "in_stock" | "is_featured", currentValue: boolean) => {
        setLoadingId(id);
        const result = await updateProduct(id, { [field]: !currentValue });
        setLoadingId(null);
        if (result.success) {
            showToast("تم التحديث ✓");
            router.refresh();
        } else {
            setError(result.error || "فشل التحديث");
        }
    };

    const handleDelete = async (product: any) => {
        if (!confirm(`هل أنت متأكد من حذف المنتج "${product.title}"؟`)) return;
        setLoadingId(product.id);
        setError(null);
        const result = await deleteProduct(product.id);
        setLoadingId(null);
        if (result.success) {
            showToast("تم حذف المنتج ✓");
            router.refresh();
        } else {
            setError(result.error || "فشل الحذف");
        }
    };

    const setFilter = (type: string) => {
        const params = new URLSearchParams();
        if (type !== "all") params.set("type", type);
        router.push(`/dashboard/products?${params.toString()}`);
    };

    return (
        <div className="space-y-4">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-forest text-white font-bold text-sm shadow-lg"
                    >
                        {toast}
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                    >
                        {error}
                        <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(typeLabels).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${currentType === key
                                ? "bg-gold text-bg"
                                : "bg-white/5 text-fg/40 hover:text-fg/60 hover:bg-white/10"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                    <span className="text-xs text-fg/20">{count} منتج</span>
                </div>
                <button
                    onClick={() => { setShowAddModal(true); setError(null); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gold/10 text-gold border border-gold/20 rounded-xl text-sm font-bold hover:bg-gold/20 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    إضافة منتج
                </button>
            </div>

            {/* Products Table */}
            <div className="rounded-2xl border border-white/[0.06] bg-surface/50 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.06]">
                                <th className="text-right px-5 py-3 text-fg/30 font-medium text-xs">المنتج</th>
                                <th className="text-right px-4 py-3 text-fg/30 font-medium text-xs">الوشّاي</th>
                                <th className="text-right px-4 py-3 text-fg/30 font-medium text-xs">النوع</th>
                                <th className="text-right px-4 py-3 text-fg/30 font-medium text-xs">السعر</th>
                                <th className="text-center px-4 py-3 text-fg/30 font-medium text-xs">متوفر</th>
                                <th className="text-center px-4 py-3 text-fg/30 font-medium text-xs">مميز</th>
                                <th className="text-right px-5 py-3 text-fg/30 font-medium text-xs">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length > 0 ? products.map((product: any) => (
                                <tr key={product.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden shrink-0 relative">
                                                {product.image_url && (
                                                    <Image src={product.image_url} alt="" fill className="object-cover" sizes="40px" />
                                                )}
                                            </div>
                                            <span className="font-medium text-fg/80 truncate max-w-[200px]">{product.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-fg/40 text-xs">{product.artist?.display_name || "—"}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-[10px] bg-white/5 px-2 py-1 rounded-lg text-fg/40">{typeLabels[product.type] || product.type}</span>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-gold text-xs">{Number(product.price).toLocaleString()} ر.س</td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleToggle(product.id, "in_stock", product.in_stock)}
                                            disabled={loadingId === product.id}
                                            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                                        >
                                            {product.in_stock ? (
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-400/50" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleToggle(product.id, "is_featured", product.is_featured)}
                                            disabled={loadingId === product.id}
                                            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                                        >
                                            {product.is_featured ? (
                                                <Star className="w-4 h-4 text-gold fill-gold" />
                                            ) : (
                                                <StarOff className="w-4 h-4 text-fg/15" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button
                                                onClick={() => { setEditingProduct(product); setError(null); }}
                                                className="p-2 rounded-lg text-fg/40 hover:text-gold hover:bg-gold/10 transition-all"
                                                title="تعديل"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product)}
                                                disabled={loadingId === product.id}
                                                className="p-2 rounded-lg text-fg/40 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                                title="حذف"
                                            >
                                                {loadingId === product.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-fg/20">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">لا توجد منتجات</p>
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="mt-3 text-gold hover:text-gold-light text-sm font-medium"
                                        >
                                            إضافة أول منتج
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                        <Link
                            key={i}
                            href={`/dashboard/products?page=${i + 1}${currentType !== "all" ? `&type=${currentType}` : ""}`}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${currentPage === i + 1
                                ? "bg-gold text-bg"
                                : "text-fg/30 hover:bg-white/5"
                                }`}
                        >
                            {i + 1}
                        </Link>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            <ProductFormModal
                open={showAddModal}
                mode="add"
                artists={artists}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    setShowAddModal(false);
                    showToast("تم إضافة المنتج ✓");
                    router.refresh();
                }}
                onError={(msg) => setError(msg)}
            />

            {/* Edit Modal */}
            <ProductFormModal
                open={!!editingProduct}
                mode="edit"
                product={editingProduct}
                artists={artists}
                onClose={() => setEditingProduct(null)}
                onSuccess={() => {
                    setEditingProduct(null);
                    showToast("تم تحديث المنتج ✓");
                    router.refresh();
                }}
                onError={(msg) => setError(msg)}
            />
        </div>
    );
}

// ─── Product Form Modal ─────────────────────────────────────

function ProductFormModal({
    open,
    mode,
    product,
    artists,
    onClose,
    onSuccess,
    onError,
}: {
    open: boolean;
    mode: "add" | "edit";
    product?: any;
    artists: { id: string; display_name: string; username: string }[];
    onClose: () => void;
    onSuccess: () => void;
    onError: (msg: string) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [form, setForm] = useState({
        artist_id: "",
        title: "",
        description: "",
        type: "print",
        price: "",
        image_url: "",
        in_stock: true,
        stock_quantity: "",
    });

    useEffect(() => {
        if (!open) return;
        setUploadFile(null);
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        if (mode === "edit" && product) {
            setForm({
                artist_id: product.artist_id || "",
                title: product.title || "",
                description: product.description || "",
                type: product.type || "print",
                price: String(product.price ?? ""),
                image_url: product.image_url || "",
                in_stock: product.in_stock ?? true,
                stock_quantity: product.stock_quantity != null ? String(product.stock_quantity) : "",
            });
        } else if (mode === "add") {
            setForm({
                artist_id: artists[0]?.id || "",
                title: "",
                description: "",
                type: "print",
                price: "",
                image_url: "",
                in_stock: true,
                stock_quantity: "",
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode, product?.id, artists]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f && f.size <= 5 * 1024 * 1024 && /^image\/(jpeg|png|webp|gif)$/.test(f.type)) {
            setPreviewUrl((p) => { if (p) URL.revokeObjectURL(p); return URL.createObjectURL(f); });
            setUploadFile(f);
        } else if (f) {
            queueMicrotask(() => onError("الملف غير مدعوم أو أكبر من 5 ميجابايت"));
        }
        e.target.value = "";
    };

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const title = form.title.trim();
        const price = parseFloat(form.price);
        let imageUrl = form.image_url.trim();

        if (!title) {
            onError("الاسم مطلوب");
            return;
        }
        if (mode === "add" && !form.artist_id) {
            onError("اختر الوشّاي");
            return;
        }
        if (isNaN(price) || price < 0) {
            onError("السعر غير صالح");
            return;
        }

        setLoading(true);
        onError("");

        if (uploadFile) {
            const fd = new FormData();
            fd.append("file", uploadFile);
            const uploadResult = await uploadProductImage(fd);
            if (!uploadResult.success) {
                setLoading(false);
                onError(uploadResult.error || "فشل رفع الصورة");
                return;
            }
            imageUrl = uploadResult.url;
        }

        if (mode === "add" && !imageUrl) {
            setLoading(false);
            onError("ارفع صورة أو أدخل رابط الصورة");
            return;
        }

        if (mode === "add") {
            const result = await createProductAdmin({
                artist_id: form.artist_id,
                title,
                description: form.description || undefined,
                type: form.type,
                price,
                image_url: imageUrl,
                in_stock: form.in_stock,
                stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity, 10) : undefined,
            });
            setLoading(false);
            if (result.success) {
                onSuccess();
            } else {
                onError(result.error || "فشل الإضافة");
            }
        } else {
            const result = await updateProduct(product.id, {
                title,
                description: form.description || null,
                type: form.type,
                price,
                image_url: imageUrl || product.image_url,
                artist_id: form.artist_id,
                in_stock: form.in_stock,
                stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity, 10) : null,
            });
            setLoading(false);
            if (result.success) {
                onSuccess();
            } else {
                onError(result.error || "فشل التحديث");
            }
        }
    };

    const isEdit = mode === "edit";

    // عند التعديل، تأكد أن وشّاي المنتج موجود في القائمة (قد يكون غير وشّاي حالياً)
    const artistOptions = isEdit && product?.artist_id && !artists.find((a) => a.id === product.artist_id) && product.artist
        ? [...artists, { id: product.artist_id, display_name: product.artist.display_name || "—", username: product.artist.username || "" }]
        : artists;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-bg shadow-2xl"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                    <h2 className="text-lg font-bold text-fg">{isEdit ? "تعديل المنتج" : "إضافة منتج جديد"}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-fg/40">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {!isEdit && (
                        <div>
                            <label className="block text-xs font-medium text-fg/50 mb-1.5">الوشّاي *</label>
                            <select
                                value={form.artist_id}
                                onChange={(e) => setForm((f) => ({ ...f, artist_id: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-fg focus:outline-none focus:border-gold/30"
                                required={!isEdit}
                            >
                                {artistOptions.length === 0 ? (
                                    <option value="">— لا يوجد وشّايون —</option>
                                ) : (
                                    artistOptions.map((a) => (
                                        <option key={a.id} value={a.id}>{a.display_name} (@{a.username})</option>
                                    ))
                                )}
                            </select>
                            {artistOptions.length === 0 && (
                                <p className="text-[10px] text-amber-400 mt-1">أضف وشّايين أولاً من إدارة المستخدمين</p>
                            )}
                        </div>
                    )}
                    {isEdit && artists.length > 0 && (
                        <div>
                            <label className="block text-xs font-medium text-fg/50 mb-1.5">الوشّاي</label>
                            <select
                                value={form.artist_id}
                                onChange={(e) => setForm((f) => ({ ...f, artist_id: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-fg focus:outline-none focus:border-gold/30"
                            >
                                {artistOptions.map((a) => (
                                    <option key={a.id} value={a.id}>{a.display_name} (@{a.username})</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-fg/50 mb-1.5">الاسم *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="عنوان المنتج"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-fg placeholder:text-fg/20 focus:outline-none focus:border-gold/30"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-fg/50 mb-1.5">النوع</label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-fg focus:outline-none focus:border-gold/30"
                        >
                            {typeOptions.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-fg/50 mb-1.5">السعر (ر.س) *</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                            placeholder="0"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-fg placeholder:text-fg/20 focus:outline-none focus:border-gold/30"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-fg/50 mb-1.5">صورة المنتج {!isEdit && "*"}</label>
                        <div className="space-y-2">
                            {/* رفع ملف */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-gold/40"); }}
                                onDragLeave={(e) => { e.currentTarget.classList.remove("border-gold/40"); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove("border-gold/40");
                                    const f = e.dataTransfer.files?.[0];
                                    if (f && f.size <= 5 * 1024 * 1024 && /^image\/(jpeg|png|webp|gif)$/.test(f.type)) {
                                        setUploadFile(f);
                                        setPreviewUrl(URL.createObjectURL(f));
                                    } else if (f) queueMicrotask(() => onError("الملف غير مدعوم أو أكبر من 5 ميجابايت"));
                                }}
                                className="border border-dashed border-white/[0.15] rounded-xl p-6 text-center cursor-pointer hover:border-gold/30 hover:bg-white/[0.02] transition-all"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                {previewUrl ? (
                                    <div className="relative inline-block">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={previewUrl} alt="معاينة" className="max-h-32 rounded-lg object-contain" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUploadFile(null);
                                                setPreviewUrl((p) => { if (p) URL.revokeObjectURL(p); return null; });
                                            }}
                                            className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center text-xs hover:bg-red-500"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-fg/30" />
                                        <p className="text-sm text-fg/60">اسحب الصورة هنا أو انقر للاختيار</p>
                                        <p className="text-[10px] text-fg/30 mt-1">JPG, PNG, WebP, GIF — حتى 5 ميجابايت</p>
                                    </>
                                )}
                            </div>
                            <p className="text-[10px] text-fg/40">أو أدخل رابط الصورة:</p>
                            <input
                                type="url"
                                value={form.image_url}
                                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                                placeholder="https://..."
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-fg placeholder:text-fg/20 focus:outline-none focus:border-gold/30"
                                dir="ltr"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-fg/50 mb-1.5">الوصف</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="وصف المنتج..."
                            rows={2}
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-fg placeholder:text-fg/20 focus:outline-none focus:border-gold/30 resize-none"
                        />
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.in_stock}
                                onChange={(e) => setForm((f) => ({ ...f, in_stock: e.target.checked }))}
                                className="rounded border-white/20"
                            />
                            <span className="text-sm text-fg/70">متوفر</span>
                        </label>
                        <div>
                            <label className="block text-xs font-medium text-fg/50 mb-1">الكمية</label>
                            <input
                                type="number"
                                min="0"
                                value={form.stock_quantity}
                                onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                                placeholder="—"
                                className="w-24 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-fg"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-fg/60 hover:bg-white/[0.03] transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-gold/20 text-gold font-bold hover:bg-gold/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {isEdit ? "حفظ" : "إضافة"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
