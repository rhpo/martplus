/**
 * Seed products from static/examples/products.csv (spec format).
 * Falls back to a built-in set (Section 9.6 + extras) if the CSV is missing.
 *
 * Run with: npm run seed
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getDb } from '../src/lib/server/db/index';

const CSV_PATH = resolve(process.cwd(), 'static/examples/products.csv');

interface SeedRow {
	slug: string;
	name: string;
	brand: string;
	category_slug: string;
	description: string;
	price: number;
	original_price: number | null;
	rating: number;
	review_count: number;
	image: string;
	badge: string | null;
	stock: number;
	is_flash: number;
	flash_reserved_pct: number;
}

/** Minimal RFC-4180-ish CSV parser (handles quotes, escaped quotes, commas, newlines). */
function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let field = '';
	let row: string[] = [];
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (inQuotes) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += c;
			}
		} else if (c === '"') {
			inQuotes = true;
		} else if (c === ',') {
			row.push(field);
			field = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else {
			field += c;
		}
	}
	if (field.length > 0 || row.length > 0) {
		row.push(field);
		rows.push(row);
	}
	return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

function rowsFromCsv(): SeedRow[] {
	const text = readFileSync(CSV_PATH, 'utf-8');
	const parsed = parseCsv(text);
	const header = parsed.shift();
	if (!header) return [];
	const idx = (k: string) => header.indexOf(k);
	const I = {
		slug: idx('slug'),
		name: idx('name'),
		brand: idx('brand'),
		category_slug: idx('category_slug'),
		description: idx('description'),
		price: idx('price'),
		original_price: idx('original_price'),
		rating: idx('rating'),
		review_count: idx('review_count'),
		image: idx('image'),
		badge: idx('badge'),
		stock: idx('stock'),
		is_flash: idx('is_flash'),
		flash_reserved_pct: idx('flash_reserved_pct')
	};

	const numOrNull = (s: string): number | null => {
		const t = (s ?? '').trim();
		if (t === '' || t.toUpperCase() === 'NULL') return null;
		const v = parseFloat(t.replace(',', '.'));
		return Number.isFinite(v) ? v : null;
	};

	return parsed.map((r) => ({
		slug: r[I.slug]?.trim() ?? '',
		name: r[I.name]?.trim() ?? '',
		brand: r[I.brand]?.trim() ?? '',
		category_slug: r[I.category_slug]?.trim() || 'epicerie',
		description: r[I.description]?.trim() ?? '',
		price: numOrNull(r[I.price]) ?? 0,
		original_price: numOrNull(r[I.original_price]),
		rating: numOrNull(r[I.rating]) ?? 0,
		review_count: Math.round(numOrNull(r[I.review_count]) ?? 0),
		image: r[I.image]?.trim() ?? '',
		badge: (r[I.badge]?.trim() || null) as string | null,
		stock: Math.round(numOrNull(r[I.stock]) ?? 0),
		is_flash: numOrNull(r[I.is_flash]) ? 1 : 0,
		flash_reserved_pct: Math.round(numOrNull(r[I.flash_reserved_pct]) ?? 0)
	}));
}

const FALLBACK: SeedRow[] = [
	{ slug: 'fromage-comte-reserve', name: 'Comté AOP Réserve Affiné 18 Mois', brand: "MONT D'OR", category_slug: 'fromages', description: 'Comté AOP du Jura affiné 18 mois en cave : notes de noisette grillée et de fruits secs. Le roi des plateaux.', price: 1490, original_price: 1800, rating: 4.9, review_count: 312, image: 'products/fromage-comte-reserve.jpg', badge: 'BESTSELLER', stock: 24, is_flash: 1, flash_reserved_pct: 72 },
	{ slug: 'choc-fleur-de-sel', name: 'Tablette Noir 72% Fleur de Sel de Guérande', brand: 'MICHEL CLUIZEL', category_slug: 'chocolats', description: 'Grand cru de cacao 72% rehaussé de cristaux de fleur de sel de Guérande. Le terroir français dans toute sa noblesse.', price: 1290, original_price: 1700, rating: 4.8, review_count: 127, image: 'products/choc-fleur-de-sel.jpg', badge: 'PROMO', stock: 18, is_flash: 1, flash_reserved_pct: 55 },
	{ slug: 'chips-brets-jura', name: 'Chips Artisanales au Fromage du Jura', brand: 'BRETS', category_slug: 'chips', description: 'Chips épaisses cuites au chaudron, parfumées au comté du Jura. Le craquant apéro à la française.', price: 690, original_price: 850, rating: 4.9, review_count: 405, image: 'products/chips-brets-jura.jpg', badge: 'BESTSELLER', stock: 40, is_flash: 0, flash_reserved_pct: 0 },
	{ slug: 'biscuit-sable-breton', name: 'Sablés Pur Beurre de Bretagne', brand: 'LA TRINITAINE', category_slug: 'epicerie', description: 'Sablés croquants au pur beurre de baratte, recette traditionnelle bretonne. Parfaits pour le goûter.', price: 760, original_price: 950, rating: 4.8, review_count: 188, image: 'products/biscuit-sable-breton.jpg', badge: 'NOUVEAU', stock: 32, is_flash: 0, flash_reserved_pct: 0 },
	{ slug: 'cidre-fermier-brut', name: 'Cidre Fermier Brut de Normandie 75cl', brand: 'MAISON SASSY', category_slug: 'boissons', description: 'Cidre fermier brut pressé en Normandie, fines bulles et fraîcheur de pomme. Sans alcool ajouté, naturellement pétillant.', price: 980, original_price: 1200, rating: 4.7, review_count: 143, image: 'products/cidre-fermier-brut.jpg', badge: 'PROMO', stock: 28, is_flash: 1, flash_reserved_pct: 60 },
	{ slug: 'epic-miel-provence', name: 'Pot de Miel de Lavande Fine de Provence IGP', brand: "L'APICULTEUR DU SUD", category_slug: 'epicerie', description: 'Miel de lavande fine IGP de Provence, récolté à la main. Doux, floral, idéal sur des tartines ou un plateau de fromages.', price: 2400, original_price: null, rating: 4.9, review_count: 164, image: 'products/epic-miel-provence.jpg', badge: 'BESTSELLER', stock: 8, is_flash: 0, flash_reserved_pct: 0 },
	{ slug: 'bonbon-caramel-bsale', name: 'Caramels au Beurre Salé de Bretagne', brand: 'LA MAISON D\'ARMORINE', category_slug: 'bonbons', description: 'Caramels tendres au beurre salé de Guérande, fondants à souhait. La gourmandise bretonne par excellence.', price: 620, original_price: 780, rating: 4.8, review_count: 211, image: 'products/bonbon-caramel-bsale.jpg', badge: 'PROMO', stock: 45, is_flash: 0, flash_reserved_pct: 0 },
	{ slug: 'bonbon-haribo-tropi', name: 'Haribo Tropifrutti Sachet Familial', brand: 'HARIBO', category_slug: 'bonbons', description: 'Assortiment de bonbons tendres aux fruits. Le plaisir partagé qui ne vieillit jamais.', price: 550, original_price: 700, rating: 4.7, review_count: 198, image: 'products/bonbon-haribo-tropi.jpg', badge: 'PROMO', stock: 50, is_flash: 0, flash_reserved_pct: 0 },
	{ slug: 'fromage-roquefort-aop', name: 'Roquefort AOP Cave des Templiers 150g', brand: 'SOCIÉTÉ', category_slug: 'fromages', description: 'Roquefort AOP affiné dans les caves de Combalou : persillé puissant et crémeux. Une icône du terroir.', price: 1200, original_price: null, rating: 4.7, review_count: 96, image: 'products/fromage-roquefort-aop.jpg', badge: null, stock: 16, is_flash: 0, flash_reserved_pct: 0 },
	{ slug: 'maison-savon-marseille', name: 'Savon de Marseille Cube Traditionnel 300g', brand: 'LA CORVETTE', category_slug: 'maison', description: "Le véritable savon de Marseille à l'huile d'olive, cuit en chaudron. Maison propre, conscience tranquille.", price: 420, original_price: null, rating: 4.8, review_count: 142, image: 'products/maison-savon-marseille.jpg', badge: null, stock: 60, is_flash: 0, flash_reserved_pct: 0 },
	{ slug: 'maison-lessive-fraicheur', name: 'Lessive Liquide Fraîcheur de Lin 30 Lavages', brand: 'LE CHAT', category_slug: 'maison', description: 'Lessive concentrée au parfum de lin frais, 30 lavages. Douce pour le linge et la planète.', price: 1350, original_price: 1500, rating: 4.5, review_count: 88, image: 'products/maison-lessive-fraicheur.jpg', badge: 'PROMO', stock: 22, is_flash: 0, flash_reserved_pct: 0 },
	{ slug: 'boisson-perrier-citron', name: 'Perrier Fines Bulles Citron 33cl', brand: 'PERRIER', category_slug: 'boissons', description: "L'eau pétillante française aux fines bulles, twist de citron. L'élégance désaltérante.", price: 180, original_price: null, rating: 4.7, review_count: 210, image: 'products/boisson-perrier-citron.jpg', badge: null, stock: 80, is_flash: 0, flash_reserved_pct: 0 },
	{ slug: 'maison-bouilloire-retro', name: 'Bouilloire Électrique Rétro 1,7L Crème', brand: 'KITSU', category_slug: 'maison', description: "Bouilloire rétro 1,7L, ébullition rapide pour vos thés et infusions. L'objet déco-utile de la cuisine.", price: 4900, original_price: 5900, rating: 4.6, review_count: 53, image: 'products/maison-bouilloire-retro.jpg', badge: 'PROMO', stock: 6, is_flash: 1, flash_reserved_pct: 47 }
];

function seed(rows: SeedRow[]) {
	const db = getDb();
	const validCats = new Set(
		(db.prepare('SELECT slug FROM categories').all() as { slug: string }[]).map((c) => c.slug)
	);

	const stmt = db.prepare(`
		INSERT INTO products (
			slug, name, brand, category_slug, description, price, original_price,
			rating, review_count, image, badge, stock, is_flash, flash_reserved_pct
		) VALUES (
			@slug, @name, @brand, @category_slug, @description, @price, @original_price,
			@rating, @review_count, @image, @badge, @stock, @is_flash, @flash_reserved_pct
		)
		ON CONFLICT(slug) DO UPDATE SET
			name=excluded.name, brand=excluded.brand, category_slug=excluded.category_slug,
			description=excluded.description, price=excluded.price, original_price=excluded.original_price,
			rating=excluded.rating, review_count=excluded.review_count, image=excluded.image,
			badge=excluded.badge, stock=excluded.stock,
			is_flash=excluded.is_flash, flash_reserved_pct=excluded.flash_reserved_pct
	`);

	const insertMany = db.transaction((items: SeedRow[]) => {
		let n = 0;
		for (const it of items) {
			if (!it.slug || !it.name || it.price <= 0) continue;
			const cat = validCats.has(it.category_slug) ? it.category_slug : 'epicerie';
			stmt.run({
				...it,
				category_slug: cat,
				original_price: it.original_price ?? null,
				badge: it.badge && it.badge !== '' ? it.badge : null,
				image: it.image || null
			});
			n++;
		}
		return n;
	});

	const count = insertMany(rows);
	console.log(`[seed] upserted ${count} products`);
}

const csvRows = existsSync(CSV_PATH) ? rowsFromCsv() : [];
// Always include the canonical signature products (referenced by Hero / Fusion
// packs / Marty), then layer the CSV catalogue on top.
const bySlug = new Map<string, SeedRow>();
for (const r of FALLBACK) bySlug.set(r.slug, r);
for (const r of csvRows) bySlug.set(r.slug, r);
seed([...bySlug.values()]);
