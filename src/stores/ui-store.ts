// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — UI Store (Zustand)
//  إدارة حالة الواجهة العامة
// ═══════════════════════════════════════════════════════════

import { create } from "zustand";

// ─── Toast Types ─────────────────────────────────────────

export interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
    duration?: number;
}

// ─── Modal Types ─────────────────────────────────────────

export type ModalType =
    | "artwork-detail"
    | "product-detail"
    | "confirm-delete"
    | "image-preview"
    | null;

interface ModalData {
    type: ModalType;
    data?: Record<string, unknown>;
}

// ─── State ───────────────────────────────────────────────

interface UIState {
    // Mobile menu
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    setMobileMenuOpen: (open: boolean) => void;

    // Modal
    modal: ModalData;
    openModal: (type: NonNullable<ModalType>, data?: Record<string, unknown>) => void;
    closeModal: () => void;

    // Toast notifications
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;

    // Search
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    // Gallery filter
    activeCategory: string;
    setActiveCategory: (category: string) => void;
}

// ─── Store ───────────────────────────────────────────────

let toastCounter = 0;

export const useUIStore = create<UIState>()((set) => ({
    // Mobile menu
    isMobileMenuOpen: false,
    toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

    // Modal
    modal: { type: null },
    openModal: (type, data) => set({ modal: { type, data } }),
    closeModal: () => set({ modal: { type: null } }),

    // Toast
    toasts: [],
    addToast: (toast) => {
        const id = `toast-${++toastCounter}`;
        const duration = toast.duration ?? 4000;

        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }));

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, duration);
        }
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),

    // Search
    searchQuery: "",
    setSearchQuery: (query) => set({ searchQuery: query }),

    // Gallery filter
    activeCategory: "all",
    setActiveCategory: (category) => set({ activeCategory: category }),
}));
