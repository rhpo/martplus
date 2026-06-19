/**
 * One-off: convert the store's raw inventory (files/products.csv, Windows-1252,
 * ';'-separated) into the spec-format seed CSV at static/examples/products.csv.
 *
 *   src cols: name; price; discount; logo(url); desc; cost; sku; inv_enabled; qty
 *   out cols: slug,name,brand,category_slug,description,price,original_price,
 *             rating,review_count,image,badge,stock,is_flash,flash_reserved_pct
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = resolve(process.cwd(), '../files/products.csv');
const OUT = resolve(process.cwd(), 'static/examples/products.csv');

const raw = new TextDecoder('windows-1252').decode(readFileSync(SRC));
const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
lines.shift(); // header

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

// deterministic pseudo-random from a string
function hash(s: string): number {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0) / 0xffffffff;
}

const BRANDS = [
	'SAMYANG', 'BULDAK', 'MOGU MOGU', 'PRINGLES', 'ALESTO', 'NESTLÉ', 'KELLOGGS', 'CAJOLINE',
	'FINISH', 'PLIZ', 'SKIP', 'VANISH', 'SANEX', 'DOVE', 'PRÉSIDENT', 'PRIMVÈRE', 'ST HUBERT',
	'LEERDAMMER', 'BABYBEL', 'PHILADELPHIA', 'NUTELLA', 'LU', 'MILKA', 'OREO', 'LINDT', 'TOBLERONE',
	'CÔTE D\'OR', 'KINDER', 'KITKAT', 'MARS', 'SNICKERS', 'MALTESERS', 'RITTER', 'HARIBO', 'MENTOS',
	'TIC TAC', 'CARAMBAR', 'LUTTI', 'FINI', 'WERTHERS', 'RICOLA', 'RICAMAR', 'BARILLA', 'EBLY',
	'PANZANI', 'AMORA', 'TABASCO', 'NESCAFÉ', 'LAVAZZA', 'SEGAFREDO', 'CARTE NOIRE', 'DOLCE GUSTO',
	'LIPTON', 'MOKATE', 'BELLAROM', 'NESPRESSO', 'RED BULL', 'MONSTER', 'OASIS', 'SCHWEPPES',
	'ORANGINA', 'TEISSEIRE', 'IZEM', 'PITBULL', 'COCA-COLA', 'CRUNCH', 'LION', 'MORDJAN', 'BJORK',
	'BONNE MAMAN', 'GRANOLA', 'PEPITO', 'MIKADO', 'PRINCE', 'BN', 'SAVANE', 'ST MICHEL', 'MERCI',
	'CHOCAPIC', 'FITNESS', 'KISSES', 'SCHOKO', 'GRANA PADANO', 'ROQUEFORT', 'FICELLO', 'DOVIDO',
	'SKY CANDY', 'FREEDENT', 'ALPENLIBE', 'CARTE D\'OR'
];

function detectBrand(name: string): string {
	const upper = name.toUpperCase();
	for (const b of BRANDS) {
		const key = b.replace(/[ÉÈÊ]/g, 'E').replace(/Ô/g, 'O');
		const nameKey = upper.normalize('NFD').replace(/[̀-ͯ]/g, '');
		if (nameKey.includes(key.normalize('NFD').replace(/[̀-ͯ]/g, ''))) return b;
	}
	// fallback: first word, capitalised
	const first = name.trim().split(/\s+/)[0] ?? '';
	return first.toUpperCase();
}

type Rule = { cat: string; kws: string[] };
const RULES: Rule[] = [
	{ cat: 'maison', kws: ['sanex', 'dove', 'douche', 'cajoline', 'finish', 'pliz', 'skip', 'vanish', 'toilet', 'pink', 'lessive', 'savon'] },
	{ cat: 'fromages', kws: ['fromage', 'roquefort', 'philadelphia', 'leerdammer', 'leerdamer', 'babybel', 'grana padano', 'parmesan', 'ficello', 'brie', 'camembert', 'comte', 'emmental', 'cheddar', 'beurre', 'cremerie', 'yaourt', 'petit brasse', 'petit suisse', 'petite recette', 'mascarpone', 'mozzarella', 'lait d', 'cheese'] },
	{ cat: 'chocolats', kws: ['chocolat', 'choco', 'milka', 'lindt', 'toblerone', 'kinder', 'nutella', 'cote d', "côte d", 'schoko', 'mars', 'snickers', 'bueno', 'kitkat', 'kit kat', 'crunch', 'maltesers', 'lion', 'mordjan', 'ritter', 'merci', 'cluizel', 'kisses', 'savane', 'nestle dessert', 'oreo milk', 'pepito', 'mikado', 'prince'] },
	{ cat: 'bonbons', kws: ['haribo', 'bonbon', 'mentos', 'tic tac', 'tictac', 'candy', 'carambar', 'lutti', 'werther', 'fini', 'chamallow', 'chamalo', 'tetes brulees', 'tete', 'ricola', 'alpenlibe', 'gum', 'freedent', 'mellow', 'mint'] },
	{ cat: 'chips', kws: ['chips', 'pringles', 'brets', 'alesto', 'pistache', 'cajou', 'pacan', 'cracker', 'curly', 'tuc'] },
	{ cat: 'boissons', kws: ['coca', 'oasis', 'monster', 'red bull', 'redbull', 'schweppes', 'orangina', 'teisseire', 'sirop', 'izem', 'pitbull', 'limonade', 'soda', 'jus', 'cherry'] }
];

// Drop any product evoking the dropped Asian-fusion concept entirely.
const EXCLUDE_KWS = ['buldak', 'samyang', 'ramune', 'ramyun', 'mogu', 'mochi', 'matcha', 'jjajang', 'ramen', 'nouille', 'konbini', 'wasabi', 'kimchi', 'sushi', 'nem'];
function isExcluded(name: string): boolean {
	const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
	return EXCLUDE_KWS.some((k) => n.includes(k));
}

function detectCategory(name: string): string {
	const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
	for (const r of RULES) {
		if (r.kws.some((k) => n.includes(k.normalize('NFD').replace(/[̀-ͯ]/g, '')))) {
			return r.cat;
		}
	}
	return 'epicerie';
}

function esc(v: string): string {
	if (/[",\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
	return v;
}

const seenSlugs = new Map<string, number>();
function uniqueSlug(base: string): string {
	const b = base || 'produit';
	const n = seenSlugs.get(b) ?? 0;
	seenSlugs.set(b, n + 1);
	return n === 0 ? b : `${b}-${n + 1}`;
}

function num(s: string): number {
	const v = parseFloat((s ?? '').replace(',', '.'));
	return Number.isFinite(v) ? v : 0;
}

const rows: string[] = [];
rows.push(
	'slug,name,brand,category_slug,description,price,original_price,rating,review_count,image,badge,stock,is_flash,flash_reserved_pct'
);

let flashBudget = 5;
for (const line of lines) {
	const parts = line.split(';');
	const name = (parts[0] ?? '').trim().replace(/\s+/g, ' ');
	if (!name) continue;
	if (isExcluded(name)) continue; // pure French terroir épicerie - no Asian-fusion items

	const srcPrice = num(parts[1]);
	if (srcPrice <= 0) continue;
	const srcDisc = num(parts[2]);
	const logo = (parts[3] ?? '').trim();
	const desc = (parts[4] ?? '').trim();
	const sku = (parts[6] ?? '').trim();
	const qty = Math.max(0, Math.round(num(parts[8])));

	const promo = srcDisc > 0 && srcDisc < srcPrice;
	const price = promo ? srcDisc : srcPrice;
	const original = promo ? srcPrice : '';

	const baseSlug = sku && sku !== 'NULL' ? slugify(sku) : slugify(name);
	const slug = uniqueSlug(baseSlug);
	const cat = detectCategory(name);
	const brand = detectBrand(name);
	const h = hash(name);
	const rating = (4.4 + h * 0.55).toFixed(1);
	const reviews = Math.round(20 + h * 430);

	let isFlash = 0;
	let reserved = 0;
	if (promo && flashBudget > 0 && qty > 0 && h > 0.6) {
		isFlash = 1;
		reserved = 40 + Math.round(hash(slug) * 50);
		flashBudget--;
	}

	let badge = '';
	if (promo) badge = 'PROMO';
	else if (h > 0.85) badge = 'BESTSELLER';

	const description =
		desc && desc !== 'NULL'
			? `${name} - format ${desc}.`
			: `${name}. Une sélection MART+, l'épicerie fine de terroir.`;

	rows.push(
		[
			slug,
			esc(name),
			esc(brand),
			cat,
			esc(description),
			String(price),
			String(original),
			rating,
			String(reviews),
			esc(logo),
			badge,
			String(qty),
			String(isFlash),
			String(reserved)
		].join(',')
	);
}

mkdirSync(resolve(process.cwd(), 'static/examples'), { recursive: true });
writeFileSync(OUT, rows.join('\n') + '\n', 'utf-8');
console.log(`[convert] wrote ${rows.length - 1} products to ${OUT}`);
