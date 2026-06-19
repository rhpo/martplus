import type { Product } from '$lib/types';
import { getProductsByIds, listAllProducts, searchProducts } from './catalog.service';

export interface MartyResult {
	reply: string;
	products: Product[];
}

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = 12000;

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
	/\b(blague|poème|poeme|raconte.*histoire|chanson|film|série|serie)\b/i
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
	price: number;
}

/** Live, in-stock catalogue injected into the system prompt (compact). */
function liveCatalog(): CatalogLine[] {
	return listAllProducts()
		.filter((p) => p.stock > 0)
		.map((p) => ({ id: p.id, name: p.name, category: p.category_slug, price: Math.round(p.price) }));
}

function systemPrompt(catalog: CatalogLine[]): string {
	const list = catalog.map((c) => `${c.id} | ${c.name} | ${c.category} | ${c.price} DA`).join('\n');
	return [
		"Tu es Marty, l'assistant gourmand de MART+, une épicerie fine de terroir française (livraison à Alger, prix en dinars algériens DZD).",
		'Tu réponds UNIQUEMENT aux questions sur la nourriture, la cuisine, les recettes et le catalogue MART+. Pour toute autre question, décline poliment en français et invite à parler épicerie.',
		'Tu ne dois JAMAIS inventer de produit. Tu ne suggères que des produits présents dans le CATALOGUE ci-dessous, en utilisant leur identifiant exact.',
		'Quand on te demande des idées (ex. « je veux faire des spaghettis »), cherche dans le catalogue les produits réellement disponibles qui correspondent (pâtes, sauce, fromage…).',
		'',
		'CATALOGUE (id | nom | catégorie | prix) :',
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

interface ChatMsg {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

async function callOpenRouter(messages: ChatMsg[], apiKey: string, model: string): Promise<string> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(ENDPOINT, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ model, messages, max_tokens: 300 }),
			signal: controller.signal
		});
		if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
		const data = await res.json();
		return data?.choices?.[0]?.message?.content ?? '';
	} finally {
		clearTimeout(timer);
	}
}

/** Resolve model-chosen ids to real, in-stock Product objects (never trust echoed details). */
function resolveProducts(ids: number[]): Product[] {
	if (ids.length === 0) return [];
	const found = getProductsByIds(ids.slice(0, 3));
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

	const apiKey = process.env.OPENROUTER_API_KEY;
	const model = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';

	// No key configured (e.g. local dev): degrade gracefully with a catalogue search.
	if (!apiKey) {
		const products = searchProducts(msg).filter((p) => p.stock > 0).slice(0, 3);
		return {
			reply:
				products.length > 0
					? `Voici ce que j'ai trouvé dans nos rayons pour « ${msg} » :`
					: "Je n'ai pas trouvé de produit correspondant. Essayez « fromage », « chocolat » ou « miel » 🧀.",
			products
		};
	}

	const catalog = liveCatalog();
	const sys = systemPrompt(catalog);
	const messages: ChatMsg[] = [
		{ role: 'system', content: sys },
		{ role: 'user', content: msg }
	];

	try {
		let raw = await callOpenRouter(messages, apiKey, model);
		let parsed = tryParse(raw);

		// Retry once with a stricter JSON-only reminder if parsing failed.
		if (!parsed) {
			const retryMessages: ChatMsg[] = [
				...messages,
				{ role: 'assistant', content: raw },
				{
					role: 'user',
					content:
						'Ta réponse n\'était pas du JSON valide. Réponds UNIQUEMENT avec un objet JSON {"reply": "...", "productIds": [...]}, sans aucun autre texte.'
				}
			];
			raw = await callOpenRouter(retryMessages, apiKey, model);
			parsed = tryParse(raw);
		}

		if (!parsed) {
			return { reply: FALLBACK_REPLY, products: [] };
		}

		// Re-fetch real product objects from the DB by id (don't trust the model).
		const validIds = new Set(catalog.map((c) => c.id));
		const ids = parsed.productIds.filter((id) => validIds.has(id));
		return { reply: parsed.reply, products: resolveProducts(ids) };
	} catch (err) {
		console.error('[marty] OpenRouter call failed', err);
		return { reply: FALLBACK_REPLY, products: [] };
	}
}
