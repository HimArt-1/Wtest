// ═══════════════════════════════════════════════════════════
//  وشّى | WASHA — Type Exports
// ═══════════════════════════════════════════════════════════

// Database types
export type {
    Database,
    Profile,
    SocialLinks,
    Category,
    Artwork,
    Product,
    Order,
    OrderItem,
    ShippingAddress,
    Application,
    ArtworkLike,
    NewsletterSubscriber,
    Timestamps,
    UserRole,
    ArtworkStatus,
    ProductType,
    OrderStatus,
    PaymentStatus,
    ApplicationStatus,
    ApparelSize,
} from "./database";

// ─── Helper Types ────────────────────────────────────────

/** Artwork with artist profile joined */
export interface ArtworkWithArtist {
    id: string;
    title: string;
    image_url: string;
    price: number | null;
    currency: string;
    likes_count: number;
    views_count: number;
    status: import("./database").ArtworkStatus;
    category_id: string | null;
    artist: {
        id: string;
        display_name: string;
        username: string;
        avatar_url: string | null;
        is_verified: boolean;
    };
}

/** Product with artist info */
export interface ProductWithArtist {
    id: string;
    title: string;
    price: number;
    original_price: number | null;
    currency: string;
    image_url: string;
    type: import("./database").ProductType;
    rating: number;
    reviews_count: number;
    sizes: import("./database").ApparelSize[] | null;
    in_stock: boolean;
    badge: string | null;
    artist: {
        id: string;
        display_name: string;
        avatar_url: string | null;
    };
}

/** Paginated API response */
export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

/** Generic API response */
export interface ApiResponse<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}
