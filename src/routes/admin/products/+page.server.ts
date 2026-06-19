import { fail } from '@sveltejs/kit';
import type { Badge, NewProduct } from '$lib/types';
import {
	adjustStock,
	createProduct,
	deleteProduct,
	listAllProducts,
	listCategories,
	updateProduct,
	uploadProductImage
} from '$lib/server/services/catalog.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		products: listAllProducts(),
		categories: listCategories()
	};
};

function slugify(s: string): string {
	return s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '')
		.slice(0, 60);
}

function num(v: FormDataEntryValue | null): number {
	const n = parseFloat((v?.toString() ?? '').replace(',', '.'));
	return Number.isFinite(n) ? n : 0;
}

function optNum(v: FormDataEntryValue | null): number | null {
	const t = v?.toString().trim() ?? '';
	if (t === '') return null;
	const n = parseFloat(t.replace(',', '.'));
	return Number.isFinite(n) ? n : null;
}

function readBadge(v: FormDataEntryValue | null): Badge | null {
	const t = v?.toString() ?? '';
	return t === 'BESTSELLER' || t === 'PROMO' || t === 'NOUVEAU' ? t : null;
}

async function buildInput(form: FormData, fallbackSlug: string): Promise<NewProduct> {
	const name = form.get('name')?.toString().trim() ?? '';
	const slug = form.get('slug')?.toString().trim() || slugify(name) || fallbackSlug;

	let image = form.get('current_image')?.toString() || null;
	const file = form.get('image');
	if (file instanceof File && file.size > 0) {
		image = await uploadProductImage(slug, file);
	}

	return {
		slug,
		name,
		brand: form.get('brand')?.toString().trim() || null,
		category_slug: form.get('category_slug')?.toString() || 'epicerie',
		description: form.get('description')?.toString().trim() || null,
		price: num(form.get('price')),
		original_price: optNum(form.get('original_price')),
		rating: num(form.get('rating')),
		review_count: Math.round(num(form.get('review_count'))),
		image,
		badge: readBadge(form.get('badge')),
		stock: Math.round(num(form.get('stock'))),
		is_flash: form.get('is_flash')?.toString() === 'on',
		flash_reserved_pct: Math.round(num(form.get('flash_reserved_pct')))
	};
}

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const input = await buildInput(form, `produit-${Date.now()}`);
		if (!input.name || input.price <= 0) {
			return fail(400, { message: 'Nom et prix (> 0) sont requis.' });
		}
		try {
			createProduct(input);
			return { success: true, message: `« ${input.name} » créé.` };
		} catch (err) {
			return fail(400, { message: (err as Error).message });
		}
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const input = await buildInput(form, `produit-${id}`);
		try {
			updateProduct(id, input);
			return { success: true, message: `« ${input.name} » mis à jour.` };
		} catch (err) {
			return fail(400, { message: (err as Error).message });
		}
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		await deleteProduct(id);
		return { success: true, message: 'Produit supprimé.' };
	},

	adjustStock: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const delta = Math.round(num(form.get('delta')));
		try {
			adjustStock(id, delta);
			return { success: true };
		} catch (err) {
			return fail(400, { message: (err as Error).message });
		}
	}
};
