// Single source of truth for client and server types.

export type Theme = 'light' | 'dark';

export type Badge = 'BESTSELLER' | 'PROMO' | 'NOUVEAU';

export type PaymentMethod = 'cod' | 'cib' | 'edahabia';

export type OrderStatus =
	| 'pending'
	| 'confirmed'
	| 'preparing'
	| 'out_for_delivery'
	| 'delivered'
	| 'cancelled';

export interface Category {
	id: number;
	slug: string;
	label: string;
	emoji: string | null;
	accent: string | null; // 'navy' | 'red' | 'caramel' | 'navy-soft'
	sort_order: number;
}

export interface Product {
	id: number;
	slug: string;
	name: string;
	brand: string | null;
	category_slug: string;
	description: string | null;
	price: number; // DZD
	original_price: number | null; // DZD, > price ⇒ on promo
	rating: number;
	review_count: number;
	image: string | null; // S3 object key (or absolute URL)
	imageUrl?: string; // resolved public URL (set in server load)
	badge: Badge | null;
	stock: number;
	is_flash: boolean;
	flash_reserved_pct: number;
	created_at: string;
}

export interface NewProduct {
	slug: string;
	name: string;
	brand: string | null;
	category_slug: string;
	description: string | null;
	price: number;
	original_price: number | null;
	rating: number;
	review_count: number;
	image: string | null;
	badge: Badge | null;
	stock: number;
	is_flash: boolean;
	flash_reserved_pct: number;
}

export interface CartItem {
	productId: number;
	slug: string;
	name: string;
	brand: string | null;
	price: number;
	image: string | null;
	imageUrl?: string;
	quantity: number;
	stock: number;
}

export interface WishlistItem {
	productId: number;
	slug: string;
	name: string;
	brand: string | null;
	price: number;
	image: string | null;
	imageUrl?: string;
	stock: number;
}

export interface Coupon {
	code: string;
	percent: number;
	active: boolean;
}

export interface OrderItem {
	id: number;
	order_id: number;
	product_id: number;
	name_snapshot: string;
	price_snapshot: number;
	quantity: number;
}

export interface Order {
	id: number;
	public_ref: string;
	customer_name: string;
	customer_phone: string;
	customer_address: string;
	customer_lat: number;
	customer_lng: number;
	distance_km: number;
	customer_email: string | null;
	marketing_opt_in: boolean;
	payment_method: PaymentMethod;
	coupon_code: string | null;
	subtotal: number;
	discount: number;
	delivery_fee: number;
	total: number;
	status: OrderStatus;
	created_at: string;
	updated_at: string | null;
	items: OrderItem[];
}

export interface LatLng {
	lat: number;
	lng: number;
}

export interface ChatMessage {
	role: 'user' | 'marty';
	text: string;
	suggestions?: Product[];
}

export interface SignatureDuo {
	id: string;
	title: string;
	tagline: string;
	emoji: string;
	productSlugs: [string, string];
}
