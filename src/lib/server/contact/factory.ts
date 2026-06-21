import { env } from '$env/dynamic/private';
import type { Mailer } from './types';
import { ResendMailer } from './resend';

let mailer: Mailer | null = null;

/** Returns the Mailer impl for MAIL_DRIVER (resend now). */
export function getMailer(): Mailer {
	if (mailer) return mailer;

	const driver = env.MAIL_DRIVER ?? 'resend';
	switch (driver) {
		case 'resend':
		default:
			mailer = new ResendMailer();
			return mailer;
	}
}
