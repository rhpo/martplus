import { getSupabase } from '$lib/server/supabase';
import type { Coupon } from '$lib/types';
import type { CouponRepository } from '../types';

export class SupabaseCouponRepository implements CouponRepository {
	async getActive(code: string): Promise<Coupon | null> {
		const { data, error } = await getSupabase()
			.from('coupons')
			.select('code, percent, active')
			.eq('code', code.trim().toUpperCase())
			.eq('active', true)
			.maybeSingle();
		if (error) throw new Error(`[coupons] getActive: ${error.message}`);
		if (!data) return null;
		return { code: data.code, percent: data.percent, active: !!data.active };
	}
}
