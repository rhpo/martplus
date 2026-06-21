export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface ChatOptions {
	maxTokens?: number;
	temperature?: number;
	/** Ask the provider to return a single JSON object (OpenAI-compatible json mode). */
	jsonObject?: boolean;
}

/** A pluggable LLM provider. Swap implementations behind this interface. */
export interface AiProvider {
	/** Whether an API key is configured (lets callers degrade gracefully). */
	readonly enabled: boolean;
	readonly model: string;
	/** Returns the assistant message text (caller parses it). Throws on transport errors. */
	chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
}
