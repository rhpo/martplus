import type { Product } from '$lib/types';
import { getAi } from '../ai/factory';
import type { ChatMessage } from '../ai/types';
import { getProductsByIds, listAllProducts } from './catalog.service';

export interface MartyResult {
	reply: string;
	products: Product[];
}

const FALLBACK_REPLY =
	"Je n'ai pas réussi à réfléchir à l'instant 😅. Réessayez dans un moment, ou parcourez nos rayons : fromages, chocolats, miel, confiseries…";

const OFFTOPIC_REPLY =
	"Je suis Marty, l'assistant gourmand de MART+ 🧀. Je ne réponds qu'aux questions sur notre épicerie fine (produits, recettes, idées de repas, accords). Dites-moi par exemple ce que vous aimeriez cuisiner !";

/**
 * Cheap pre-call guard: only skip the LLM when the message is *clearly* off-topic.
 * Conservative on purpose - anything food/grocery-ish goes through to the model.
 */
const OFFTOPIC_PATTERNS = [
	/\b(code|coding|programm|javascript|python|html|css|bug|serveur|api)\b/i,
	/\b(politique|élection|election|président|president|guerre|gouvernement)\b/i,
	/\b(météo|meteo|football|foot|match|sport|crypto|bitcoin|bourse|action)\b/i,
	/\b(traduis|traduction|translate|math|calcul|équation|equation|devoir)\b/i,
	/\b(blague|poème|poeme|raconte.*histoire|chanson|film|série|serie)\b/i,
	/\b(weather|news|joke|story|song|movie|sport|stock|invest|politics|coding)\b/i
];

const FOOD_HINTS =
	/\b(mang|cuisin|recette|repas|plat|apéro|apero|fromage|chocolat|miel|bonbon|confiser|cidre|boisson|chips|snack|dessert|goûter|gouter|épicerie|epicerie|produit|panier|courses|gourmand|sucré|sucre|salé|sale|déjeuner|dejeuner|dîner|diner|pique-nique|cadeau|coffret)\b/i;

function isObviouslyOffTopic(message: string): boolean {
	if (FOOD_HINTS.test(message)) return false;
	return OFFTOPIC_PATTERNS.some((re) => re.test(message));
}

interface CatalogLine {
	id: number;
	name: string;
	category: string;
}

// How many catalogue lines we inject. A focused, relevance-ranked subset keeps
// token usage low (≈2k tokens) so we don't blow the provider's per-minute rate
// limit, while the synonym expansion below ensures the right items rank in even
// for cross-language queries ("spaghetti"/"pasta" → Barilla Macaroni). Raise this
// only if you move to a high-quota / paid plan.
const CATALOG_CAP = 120;

const STOPWORDS = new Set([
	'je', 'tu', 'il', 'on', 'un', 'une', 'des', 'du', 'de', 'la', 'le', 'les', 'au', 'aux',
	'pour', 'avec', 'sur', 'dans', 'et', 'ou', 'que', 'qui', 'quoi', 'mon', 'ma', 'mes',
	'veux', 'voudrais', 'cherche', 'faire', 'fais', 'manger', 'cuisiner', 'envie', 'idee',
	'idée', 'recette', 'plat', 'avez', 'vous', 'svp', 'merci', 'bonjour', 'salut', 'want', 'make'
]);

// Maps query words (incl. English) to French catalogue vocabulary so retrieval
// works cross-language. Values must be accent-free (tokens are normalized).
const SYNONYMS: Record<string, string[]> = {
	pasta: ['pates', 'macaroni', 'barilla', 'penne', 'spaghetti', 'ebly', 'panzani'],
	pates: ['macaroni', 'barilla', 'penne', 'spaghetti', 'ebly', 'panzani'],
	spaghetti: ['pates', 'macaroni', 'barilla', 'panzani'],
	macaroni: ['pates', 'barilla'],
	cheese: ['fromage', 'parmesan', 'grana', 'roquefort', 'babybel', 'leerdammer', 'philadelphia', 'ficello', 'brie', 'comte', 'emmental'],
	fromage: ['parmesan', 'grana', 'roquefort', 'babybel', 'leerdammer', 'philadelphia', 'ficello', 'brie', 'comte'],
	parmesan: ['grana', 'parmigiano', 'padano'],
	parmigiano: ['grana', 'parmesan', 'padano'],
	chocolate: ['chocolat', 'lindt', 'milka', 'toblerone', 'kinder', 'nutella', 'cote', 'cacao', 'schoko'],
	chocolat: ['lindt', 'milka', 'toblerone', 'kinder', 'nutella', 'cote', 'cacao'],
	cake: ['gateau', 'farine', 'chocolat', 'levure', 'sucre'],
	gateau: ['chocolat', 'farine', 'levure', 'sucre'],
	coffee: ['cafe', 'nescafe', 'lavazza', 'segafredo', 'dolce'],
	cafe: ['nescafe', 'lavazza', 'segafredo', 'dolce'],
	tea: ['the', 'lipton', 'infusion'],
	candy: ['bonbon', 'haribo', 'mentos', 'caramel', 'confiserie'],
	sweets: ['bonbon', 'haribo', 'mentos', 'caramel'],
	cereal: ['cereales', 'chocapic', 'fitness', 'corn', 'flakes', 'nesquik'],
	drink: ['boisson', 'jus', 'soda', 'limonade', 'cidre', 'eau'],
	soda: ['coca', 'oasis', 'schweppes', 'orangina'],
	honey: ['miel'],
	oil: ['huile', 'olive'],
	butter: ['beurre'],
	tuna: ['thon', 'ricamar'],
	chips: ['pringles', 'brets', 'snack'],
	biscuit: ['biscuits', 'sable', 'lu', 'prince', 'pepito', 'cookie']
};

function normalize(s: string): string {
	return s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '');
}

function expandTokens(tokens: string[]): string[] {
	const set = new Set(tokens);
	for (const t of tokens) {
		const syn = SYNONYMS[t];
		if (syn) for (const s of syn) set.add(s);
	}
	return [...set];
}

function tokenize(message: string): string[] {
	const base = normalize(message)
		.split(/[^a-z0-9]+/)
		.filter((t) => t.length >= 3 && !STOPWORDS.has(t));
	return expandTokens(base);
}

function scoreProduct(p: Product, tokens: string[]): number {
	if (tokens.length === 0) return 0;
	const name = normalize(p.name);
	const hay = `${name} ${normalize(p.brand ?? '')} ${p.category_slug} ${normalize(p.description ?? '')}`;
	let score = 0;
	for (const t of tokens) if (hay.includes(t)) score += name.includes(t) ? 2 : 1;
	return score;
}

/**
 * Catalogue injected into the system prompt: in-stock products ranked by
 * relevance to the message, then bestsellers, capped at CATALOG_CAP.
 */
async function selectCatalog(message: string): Promise<CatalogLine[]> {
	const tokens = tokenize(message);
	const inStock = (await listAllProducts()).filter((p) => p.stock > 0);
	return inStock
		.map((p) => ({ p, score: scoreProduct(p, tokens) }))
		.sort((a, b) => b.score - a.score || b.p.review_count - a.p.review_count)
		.slice(0, CATALOG_CAP)
		.map(({ p }) => ({ id: p.id, name: p.name, category: p.category_slug }));
}

/** Tokenized catalogue search — scores in-stock products by matching query words. */
async function localSearch(message: string, limit = 3): Promise<Product[]> {
	const tokens = tokenize(message);
	if (tokens.length === 0) return [];
	const products = await listAllProducts();
	return products
		.filter((p) => p.stock > 0)
		.map((p) => ({ p, score: scoreProduct(p, tokens) }))
		.filter((x) => x.score > 0)
		.sort((a, b) => b.score - a.score || b.p.review_count - a.p.review_count)
		.slice(0, limit)
		.map((x) => x.p);
}

function systemPrompt(catalog: CatalogLine[]): string {
	const list = catalog.map((c) => `${c.id} | ${c.name} | ${c.category}`).join('\n');
	return [
		"Tu es Marty, l'assistant gourmand de MART+, une épicerie fine de terroir française (livraison à Alger, prix en dinars algériens DZD).",
		'Tu réponds UNIQUEMENT aux questions sur la nourriture, la cuisine, les recettes et le catalogue MART+. Pour toute autre question, décline poliment en français et invite à parler épicerie.',
		'Tu ne dois JAMAIS inventer de produit. Tu ne suggères que des produits présents dans le CATALOGUE ci-dessous, en utilisant leur identifiant exact.',
		'Quand on te demande des idées (ex. « je veux faire des spaghettis »), cherche dans le catalogue les produits réellement disponibles qui correspondent (pâtes, sauce, fromage…).',
		'',
		'CATALOGUE (id | nom | catégorie) :',
		list,
		'',
		'Réponds uniquement en JSON valide, sans texte avant ou après, au format exact suivant :',
		'{"reply": "ta réponse en français", "productIds": ["id1", "id2", "id3"]}',
		'productIds : au maximum 3 identifiants, uniquement des id présents dans le catalogue ci-dessus. Mets [] si aucun produit ne convient.'
	].join('\n');
}

interface ParsedReply {
	reply: string;
	productIds: number[];
}

function tryParse(raw: string): ParsedReply | null {
	if (!raw) return null;
	// Tolerate code fences or stray text around the JSON object.
	const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
	const start = cleaned.indexOf('{');
	const end = cleaned.lastIndexOf('}');
	if (start === -1 || end === -1 || end < start) return null;
	try {
		const obj = JSON.parse(cleaned.slice(start, end + 1));
		if (typeof obj?.reply !== 'string') return null;
		const ids = Array.isArray(obj.productIds)
			? obj.productIds.map((x: unknown) => Number(x)).filter((n: number) => Number.isFinite(n))
			: [];
		return { reply: obj.reply, productIds: ids };
	} catch {
		return null;
	}
}

/** Resolve model-chosen ids to real, in-stock Product objects (never trust echoed details). */
async function resolveProducts(ids: number[]): Promise<Product[]> {
	if (ids.length === 0) return [];
	const found = await getProductsByIds(ids.slice(0, 3));
	const byId = new Map(found.map((p) => [p.id, p]));
	// Preserve the model's ordering, keep only in-stock products.
	return ids
		.map((id) => byId.get(id))
		.filter((p): p is Product => !!p && p.stock > 0)
		.slice(0, 3);
}

export async function martyReply(message: string): Promise<MartyResult> {
	const msg = (message ?? '').trim();

	if (!msg) {
		return {
			reply:
				"Bonjour ! Je suis Marty 👋, votre complice gourmand chez MART+. Dites-moi une envie (un apéro, un dessert, un plat à cuisiner) et je vous trouve les bons produits du terroir.",
			products: []
		};
	}

	// Defense in depth: obviously off-topic → skip the LLM entirely.
	if (isObviouslyOffTopic(msg)) {
		return { reply: OFFTOPIC_REPLY, products: [] };
	}

	const ai = getAi();

	// No provider key configured (e.g. local dev): degrade gracefully with a catalogue search.
	if (!ai.enabled) {
		const products = await localSearch(msg, 3);
		return {
			reply:
				products.length > 0
					? `Voici ce que j'ai trouvé dans nos rayons pour « ${msg} » :`
					: "Je n'ai pas trouvé de produit correspondant. Essayez « fromage », « chocolat » ou « miel » 🧀.",
			products
		};
	}

	const catalog = await selectCatalog(msg);
	const sys = systemPrompt(catalog);
	const messages: ChatMessage[] = [
		{ role: 'system', content: sys },
		{ role: 'user', content: msg }
	];

	try {
		let raw = await ai.chat(messages, { maxTokens: 300, temperature: 0.3, jsonObject: true });
		let parsed = tryParse(raw);

		// Retry once with a stricter JSON-only reminder if parsing failed.
		if (!parsed) {
			const retryMessages: ChatMessage[] = [
				...messages,
				{ role: 'assistant', content: raw },
				{
					role: 'user',
					content:
						'Ta réponse n\'était pas du JSON valide. Réponds UNIQUEMENT avec un objet JSON {"reply": "...", "productIds": [...]}, sans aucun autre texte.'
				}
			];
			raw = await ai.chat(retryMessages, { maxTokens: 300, temperature: 0, jsonObject: true });
			parsed = tryParse(raw);
		}

		if (!parsed) {
			return { reply: FALLBACK_REPLY, products: [] };
		}

		// Re-fetch real product objects from the DB by id (don't trust the model).
		const validIds = new Set(catalog.map((c) => c.id));
		const ids = parsed.productIds.filter((id) => validIds.has(id));
		let products = await resolveProducts(ids);

		// Backstop: if the model named no usable products, try a strict keyword match
		// on the user's query only (never the verbose reply — that surfaced noise).
		// Still grounded: localSearch only returns real, in-stock products, and
		// returns nothing rather than padding with irrelevant items.
		if (products.length === 0) {
			products = await localSearch(msg, 3);
		}

		return { reply: parsed.reply, products };
	} catch (err) {
		console.error('[marty] AI call failed', err);
		return { reply: FALLBACK_REPLY, products: [] };
	}
}
