"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Loader2, MapPin, Phone, User, CreditCard } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createOrder } from "@/app/actions/orders";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Schema
const addressSchema = z.object({
    name: z.string().min(3, "الاسم مطلوب"),
    phone: z.string().min(10, "رقم الهاتف مطلوب"),
    line1: z.string().min(5, "العنوان مطلوب"),
    line2: z.string().optional(),
    city: z.string().min(2, "المدينة مطلوبة"),
    postal_code: z.string().min(4, "الرمز البريدي مطلوب"),
    country: z.string().min(2, "الدولة مطلوبة"),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
    const { items, getCartTotal, clearCart } = useCartStore();
    const [isClient, setIsClient] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            name: "",
            phone: "",
            line1: "",
            line2: "",
            city: "",
            postal_code: "",
            country: "المملكة العربية السعودية",
        },
    });

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null;

    if (items.length === 0 && !success) {
        return (
            <div className="min-h-screen pt-32 pb-20 container-wusha flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBagIcon className="w-10 h-10 text-white/20" />
                </div>
                <h1 className="text-2xl font-bold mb-4">سلة المشتريات فارغة</h1>
                <p className="text-white/40 mb-8 max-w-md">
                    لم تقم بإضافة أي منتجات للسلة بعد. تصفح المتجر واكتشف منتجاتنا الحصرية.
                </p>
                <Link
                    href="/#store"
                    className="btn-gold px-8 py-3 rounded-xl"
                >
                    تصفح المتجر
                </Link>
            </div>
        );
    }

    const subtotal = getCartTotal();
    const shipping = 30;
    const tax = subtotal * 0.15;
    const total = subtotal + shipping + tax;

    async function onSubmit(data: AddressFormValues) {
        setIsSubmitting(true);
        setError(null);

        const orderItems = items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            size: item.size || null,
            unit_price: item.price,
        }));

        const result = await createOrder(orderItems, {
            ...data,
            state: "", // Optional
        });

        if (result.success) {
            setSuccess(result.order_number || "#ORDER");
            clearCart();
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            setError(result.error || "حدث خطأ أثناء إنشاء الطلب");
        }

        setIsSubmitting(false);
    }

    if (success) {
        return (
            <div className="min-h-screen pt-32 pb-20 container-wusha flex flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 border border-green-500/30"
                >
                    <Check className="w-12 h-12" />
                </motion.div>
                <h1 className="text-3xl font-bold mb-2">تم استلام طلبك بنجاح!</h1>
                <p className="text-white/60 mb-2">
                    رقم الطلب: <span className="font-mono text-gold font-bold">{success}</span>
                </p>
                <p className="text-white/40 mb-8 max-w-md">
                    شكراً لتسوقك معنا. سيتم إرسال تفاصيل الطلب إلى بريدك الإلكتروني قريباً.
                </p>
                <Link
                    href="/"
                    className="btn-gold px-8 py-3 rounded-xl"
                >
                    العودة للرئيسية
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-20 bg-[#080808]">
            <div className="container-wusha">
                <h1 className="text-3xl md:text-4xl font-bold mb-8">إتمام الطلب</h1>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Form Section */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="bg-surface border border-white/5 rounded-2xl p-6 md:p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <MapPin className="text-gold w-5 h-5" />
                                عنوان الشحن
                            </h2>

                            <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-white/60">الاسم الكامل</label>
                                        <div className="relative">
                                            <input
                                                {...form.register("name")}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors pl-10"
                                                placeholder="الاسم الثلاثي"
                                            />
                                            <User className="absolute left-3 top-3.5 w-4 h-4 text-white/20" />
                                        </div>
                                        {form.formState.errors.name && (
                                            <p className="text-red-400 text-xs">{form.formState.errors.name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-white/60">رقم الهاتف</label>
                                        <div className="relative">
                                            <input
                                                {...form.register("phone")}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors pl-10 dir-ltr text-right"
                                                placeholder="05xxxxxxxx"
                                            />
                                            <Phone className="absolute left-3 top-3.5 w-4 h-4 text-white/20" />
                                        </div>
                                        {form.formState.errors.phone && (
                                            <p className="text-red-400 text-xs">{form.formState.errors.phone.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">العنوان</label>
                                    <input
                                        {...form.register("line1")}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors"
                                        placeholder="اسم الشارع، رقم المبنى"
                                    />
                                    {form.formState.errors.line1 && (
                                        <p className="text-red-400 text-xs">{form.formState.errors.line1.message}</p>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-white/60">المدينة</label>
                                        <input
                                            {...form.register("city")}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors"
                                        />
                                        {form.formState.errors.city && (
                                            <p className="text-red-400 text-xs">{form.formState.errors.city.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-white/60">الرمز البريدي</label>
                                        <input
                                            {...form.register("postal_code")}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors"
                                        />
                                        {form.formState.errors.postal_code && (
                                            <p className="text-red-400 text-xs">{form.formState.errors.postal_code.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-white/60">الدولة</label>
                                        <input
                                            {...form.register("country")}
                                            disabled
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="bg-surface border border-white/5 rounded-2xl p-6 md:p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <CreditCard className="text-gold w-5 h-5" />
                                طريقة الدفع
                            </h2>

                            <div className="p-4 rounded-xl border border-gold/30 bg-gold/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full border-[5px] border-gold bg-white"></div>
                                    <span className="font-bold">الدفع عند الاستلام (COD)</span>
                                </div>
                                <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded">متاح حالياً</span>
                            </div>
                            <p className="text-xs text-white/40 mt-2 mr-2">
                                * سنقوم بإضافة خيارات الدفع الإلكتروني (Apple Pay, Mada) قريباً.
                            </p>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-5">
                        <div className="bg-surface border border-white/5 rounded-2xl p-6 md:p-8 sticky top-32">
                            <h2 className="text-xl font-bold mb-6">ملخص الطلب</h2>

                            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item) => (
                                    <div key={`${item.id}-${item.size}`} className="flex gap-4">
                                        <div className="relative w-16 h-16 bg-white/5 rounded-lg overflow-hidden shrink-0">
                                            <Image
                                                src={item.image_url}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <span className="absolute bottom-0 right-0 bg-gold text-black text-[10px] font-bold px-1.5 rounded-tl-lg">
                                                x{item.quantity}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                                            <p className="text-white/40 text-xs">{item.artist_name}</p>
                                            {item.size && <p className="text-white/40 text-xs mt-0.5">الحجم: {item.size}</p>}
                                            <p className="text-gold text-sm font-bold mt-1">{(item.price * item.quantity).toLocaleString()} ر.س</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 border-t border-white/10 pt-6">
                                <div className="flex justify-between text-white/60 text-sm">
                                    <span>المجموع الفرعي</span>
                                    <span>{subtotal.toLocaleString()} ر.س</span>
                                </div>
                                <div className="flex justify-between text-white/60 text-sm">
                                    <span>الشحن</span>
                                    <span>{shipping.toLocaleString()} ر.س</span>
                                </div>
                                <div className="flex justify-between text-white/60 text-sm">
                                    <span>الضريبة (15%)</span>
                                    <span>{tax.toLocaleString()} ر.س</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-4 border-t border-white/10 mt-4">
                                    <span>الإجمالي</span>
                                    <span className="text-gold">{total.toLocaleString()} ر.س</span>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-xl mt-6">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                form="checkout-form"
                                disabled={isSubmitting}
                                className="w-full btn-gold py-4 text-base font-bold rounded-xl mt-8 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>تأكيد الطلب</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-white/30 text-xs mt-4">
                                بإتمام الطلب، أنت توافق على شروط الاستخدام وسياسة الخصوصية.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShoppingBagIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    );
}
