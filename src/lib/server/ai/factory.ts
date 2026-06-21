import { env } from '$env/dynamic/private';
import type { AiProvider } from './types';
import { OpenAICompatibleProvider } from './openai-compatible';

let provider: AiProvider | null = null;

// Sensible defaults per known provider — pick one with AI_PROVIDER, or override
// AI_BASE_URL / AI_MODEL directly. Switching providers = an env change only.
const PRESETS: Record<string, { baseUrl: string; model: string }> = {
	groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
	openrouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
	openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
	gemini: {
		baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
		model: 'gemini-2.0-flash'
	},
	mistral: { baseUrl: 'https://api.mistral.ai/v1', model: 'mistral-small-latest' },
	cerebras: { baseUrl: 'https://api.cerebras.ai/v1', model: 'llama-3.3-70b' }
};

/** Returns the configured AI provider (default: Groq). */
export function getAi(): AiProvider {
	if (provider) return provider;

	const referer = env.PUBLIC_SITE_URL ?? 'https://martplusdz.com';

	// Backward-compat: if the generic AI_API_KEY isn't set yet but a legacy
	// OPENROUTER_API_KEY exists, keep working on OpenRouter until you switch.
	if (!env.AI_API_KEY && env.OPENROUTER_API_KEY) {
		const p = PRESETS.openrouter;
		provider = new OpenAICompatibleProvider(
			(env.AI_BASE_URL ?? p.baseUrl).replace(/\/+$/, ''),
			env.OPENROUTER_API_KEY,
			env.AI_MODEL ?? env.OPENROUTER_MODEL ?? p.model,
			15000,
			referer,
			'MART+ · Marty'
		);
		return provider;
	}

	const preset = PRESETS[(env.AI_PROVIDER ?? 'groq').toLowerCase()] ?? PRESETS.groq;
	const baseUrl = (env.AI_BASE_URL ?? preset.baseUrl).replace(/\/+$/, '');
	const model = env.AI_MODEL ?? preset.model;
	const apiKey = env.AI_API_KEY ?? '';

	provider = new OpenAICompatibleProvider(baseUrl, apiKey, model, 15000, referer, 'MART+ · Marty');
	return provider;
}
