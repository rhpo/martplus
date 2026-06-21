import type { Repositories } from './types';
import { SupabaseProductRepository } from './supabase/product.repo';
import { SupabaseCategoryRepository } from './supabase/category.repo';
import { SupabaseCouponRepository } from './supabase/coupon.repo';
import { SupabaseOrderRepository } from './supabase/order.repo';

let repos: Repositories | null = null;

/** Repository set, all backed by Supabase (@supabase/supabase-js). */
export function getRepositories(): Repositories {
	if (repos) return repos;
	repos = {
		products: new SupabaseProductRepository(),
		categories: new SupabaseCategoryRepository(),
		coupons: new SupabaseCouponRepository(),
		orders: new SupabaseOrderRepository()
	};
	return repos;
}
