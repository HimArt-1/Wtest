// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Cart Store (Zustand)
//  إدارة سلة المشتريات مع الحفظ في localStorage
// ═══════════════════════════════════════════════════════════

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApparelSize } from "@/types/database";

// ─── Types ───────────────────────────────────────────────

export interface CartItem {
    product_id: string;
    title: string;
    price: number;
    currency: string;
    image_url: string;
    quantity: number;
    size: ApparelSize | null;
    artist_name: string;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;

    // Actions
    addItem: (item: Omit<CartItem, "quantity">) => void;
    removeItem: (productId: string, size?: ApparelSize | null) => void;
    updateQuantity: (productId: string, quantity: number, size?: ApparelSize | null) => void;
    clearCart: () => void;
    toggleCart: () => void;
    setCartOpen: (open: boolean) => void;

    // Computed
    totalItems: () => number;
    totalPrice: () => number;
    isInCart: (productId: string, size?: ApparelSize | null) => boolean;
}

// ─── Store ───────────────────────────────────────────────

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (item) => {
                set((state) => {
                    const existingIndex = state.items.findIndex(
                        (i) => i.product_id === item.product_id && i.size === item.size
                    );

                    if (existingIndex > -1) {
                        // Increment quantity
                        const newItems = [...state.items];
                        newItems[existingIndex] = {
                            ...newItems[existingIndex],
                            quantity: newItems[existingIndex].quantity + 1,
                        };
                        return { items: newItems };
                    }

                    // Add new item
                    return { items: [...state.items, { ...item, quantity: 1 }] };
                });
            },

            removeItem: (productId, size) => {
                set((state) => ({
                    items: state.items.filter(
                        (i) => !(i.product_id === productId && i.size === size)
                    ),
                }));
            },

            updateQuantity: (productId, quantity, size) => {
                if (quantity <= 0) {
                    get().removeItem(productId, size);
                    return;
                }
                set((state) => ({
                    items: state.items.map((i) =>
                        i.product_id === productId && i.size === size
                            ? { ...i, quantity }
                            : i
                    ),
                }));
            },

            clearCart: () => set({ items: [] }),
            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            setCartOpen: (open) => set({ isOpen: open }),

            totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: () =>
                get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
            isInCart: (productId, size) =>
                get().items.some(
                    (i) => i.product_id === productId && i.size === size
                ),
        }),
        {
            name: "wusha-cart",
            partialize: (state) => ({ items: state.items }),
        }
    )
);
