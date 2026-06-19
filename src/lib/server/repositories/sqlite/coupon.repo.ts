import { getDb } from '$lib/server/db';
import type { Coupon } from '$lib/types';
import type { CouponRepository } from '../types';

export class SqliteCouponRepository implements CouponRepository {
	getActive(code: string): Coupon | null {
		const r = getDb()
			.prepare('SELECT code, percent, active FROM coupons WHERE code = ? AND active = 1')
			.get(code.trim().toUpperCase()) as
			| { code: string; percent: number; active: number }
			| undefined;
		return r ? { code: r.code, percent: r.percent, active: r.active === 1 } : null;
	}
}
