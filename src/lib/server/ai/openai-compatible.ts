import type { AiProvider, ChatMessage, ChatOptions } from './types';

/**
 * Works with any OpenAI-compatible `chat/completions` endpoint:
 * Groq, OpenRouter, OpenAI, Google Gemini (OpenAI mode), Mistral, Cerebras, …
 * Switching providers is just a base URL + key + model change.
 */
export class OpenAICompatibleProvider implements AiProvider {
	constructor(
		private baseUrl: string,
		private apiKey: string,
		readonly model: string,
		private timeoutMs = 15000,
		private referer = 'https://martplusdz.com',
		private title = 'MART+ · Marty'
	) {}

	get enabled(): boolean {
		return !!this.apiKey;
	}

	async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
		if (!this.apiKey) throw new Error('AI provider non configuré (clé API manquante).');

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeoutMs);
		try {
			const body: Record<string, unknown> = {
				model: this.model,
				messages,
				max_tokens: options.maxTokens ?? 300
			};
			if (options.temperature !== undefined) body.temperature = options.temperature;
			if (options.jsonObject) body.response_format = { type: 'json_object' };

			const res = await fetch(`${this.baseUrl}/chat/completions`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json',
					// Harmless on providers that ignore them (OpenRouter uses them for attribution).
					'HTTP-Referer': this.referer,
					'X-Title': this.title
				},
				body: JSON.stringify(body),
				signal: controller.signal
			});
			if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
			const data = await res.json();
			return data?.choices?.[0]?.message?.content ?? '';
		} finally {
			clearTimeout(timer);
		}
	}
}
