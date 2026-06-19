import type {
	Category,
	Coupon,
	NewProduct,
	Order,
	OrderStatus,
	PaymentMethod,
	Product
} from '$lib/types';

export interface ProductRepository {
	listAll(): Product[];
	listByCategory(slug: string): Product[];
	search(q: string): Product[];
	getBySlug(slug: string): Product | null;
	getById(id: number): Product | null;
	getManyByIds(ids: number[]): Product[];
	listFlash(): Product[];
	listBestsellers(limit?: number): Product[];
	create(input: NewProduct): Product;
	update(id: number, patch: Partial<NewProduct>): Product;
	delete(id: number): void;
	/** +adds / -deducts; throws if the result would be negative. */
	adjustStock(id: number, delta: number): void;
}

export interface CategoryRepository {
	listAll(): Category[];
	getBySlug(slug: string): Category | null;
}

export interface CouponRepository {
	getActive(code: string): Coupon | null;
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
	items: { product_id: number; name_snapshot: string; price_snapshot: number; quantity: number }[];
}

export interface OrderRepository {
	create(input: NewOrderInput): Order;
	getByRef(ref: string): Order | null;
	getById(id: number): Order | null;
	listAll(): Order[];
	setStatus(id: number, status: OrderStatus): void;
	replaceItems(
		orderId: number,
		items: { product_id: number; name_snapshot: string; price_snapshot: number; quantity: number }[]
	): void;
	updateTotalsAndCustomer(
		orderId: number,
		patch: {
			customer_name?: string;
			customer_phone?: string;
			customer_address?: string;
			customer_email?: string | null;
			subtotal: number;
			discount: number;
			delivery_fee: number;
			total: number;
		}
	): void;
}

export interface Repositories {
	products: ProductRepository;
	categories: CategoryRepository;
	coupons: CouponRepository;
	orders: OrderRepository;
}
