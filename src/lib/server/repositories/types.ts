import type {
	Category,
	Coupon,
	NewProduct,
	Order,
	OrderStatus,
	PaymentMethod,
	Product
} from '$lib/types';

// All repository methods are async — the Supabase JS client is promise-based.

export interface ProductRepository {
	listAll(): Promise<Product[]>;
	listByCategory(slug: string): Promise<Product[]>;
	search(q: string): Promise<Product[]>;
	getBySlug(slug: string): Promise<Product | null>;
	getById(id: number): Promise<Product | null>;
	getManyByIds(ids: number[]): Promise<Product[]>;
	listFlash(): Promise<Product[]>;
	listBestsellers(limit?: number): Promise<Product[]>;
	create(input: NewProduct): Promise<Product>;
	update(id: number, patch: Partial<NewProduct>): Promise<Product>;
	delete(id: number): Promise<void>;
	/** +adds / -deducts; throws if the result would go negative (enforced in Postgres). */
	adjustStock(id: number, delta: number): Promise<void>;
}

export interface CategoryRepository {
	listAll(): Promise<Category[]>;
	getBySlug(slug: string): Promise<Category | null>;
}

export interface CouponRepository {
	getActive(code: string): Promise<Coupon | null>;
}

export interface OrderItemInput {
	product_id: number;
	name_snapshot: string;
	price_snapshot: number;
	quantity: number;
}

export interface NewOrderInput {
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
	items: OrderItemInput[];
}

export interface AdminOrderUpdate {
	customer_name?: string;
	customer_phone?: string;
	customer_address?: string;
	customer_email?: string | null;
	items: OrderItemInput[];
	subtotal: number;
	discount: number;
	delivery_fee: number;
	total: number;
}

export interface OrderRepository {
	/** Atomic insert + stock decrement (Postgres RPC). */
	create(input: NewOrderInput): Promise<Order>;
	/** Atomic re-build of items + stock deltas + totals (Postgres RPC). */
	adminUpdate(orderId: number, patch: AdminOrderUpdate): Promise<Order>;
	getByRef(ref: string): Promise<Order | null>;
	getById(id: number): Promise<Order | null>;
	listAll(): Promise<Order[]>;
	setStatus(id: number, status: OrderStatus): Promise<void>;
}

export interface Repositories {
	products: ProductRepository;
	categories: CategoryRepository;
	coupons: CouponRepository;
	orders: OrderRepository;
}
