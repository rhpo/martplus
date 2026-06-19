import type { Repositories } from './types';
import { SqliteProductRepository } from './sqlite/product.repo';
import { SqliteCategoryRepository } from './sqlite/category.repo';
import { SqliteCouponRepository } from './sqlite/coupon.repo';
import { SqliteOrderRepository } from './sqlite/order.repo';

let repos: Repositories | null = null;

/**
 * Returns the repository set for the configured DB_DRIVER.
 * Swapping to Postgres later = add a `postgres/` impl set + a branch here.
 */
export function getRepositories(): Repositories {
	if (repos) return repos;

	const driver = process.env.DB_DRIVER ?? 'sqlite';
	switch (driver) {
		case 'sqlite':
		default:
			repos = {
				products: new SqliteProductRepository(),
				categories: new SqliteCategoryRepository(),
				coupons: new SqliteCouponRepository(),
				orders: new SqliteOrderRepository()
			};
			return repos;
	}
}
