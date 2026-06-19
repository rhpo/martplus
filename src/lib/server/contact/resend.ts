import { Resend } from 'resend';
import type { Mailer, MailMessage } from './types';

export class ResendMailer implements Mailer {
	private client: Resend | null;
	private from: string;

	constructor() {
		const key = process.env.RESEND_API_KEY;
		this.client = key ? new Resend(key) : null;
		this.from = process.env.EMAIL_FROM ?? 'MART+ <onboarding@resend.dev>';
	}

	async send(message: MailMessage): Promise<void> {
		// No API key → no-op (caller logs). Order flows must never depend on email.
		if (!this.client) {
			console.warn('[mail] RESEND_API_KEY missing - skipping email to', message.to);
			return;
		}
		const { error } = await this.client.emails.send({
			from: this.from,
			to: message.to,
			subject: message.subject,
			html: message.html,
			text: message.text
		});
		if (error) throw new Error(`Resend error: ${error.message ?? String(error)}`);
	}
}
