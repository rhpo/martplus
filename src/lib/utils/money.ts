import { CURRENCY } from '$lib/config';

/**
 * Format a DZD amount → e.g. `1 990 DA`.
 * Space thousands separator, comma decimal, "DA" suffix.
 */
export function formatPrice(amount: number): string {
	const rounded = Math.round(amount * 100) / 100;
	const hasDecimals = Math.round(rounded % 1 === 0 ? 0 : rounded * 100) % 100 !== 0;
	const fixed = hasDecimals ? rounded.toFixed(2) : Math.round(rounded).toString();
	const [intPart, decPart] = fixed.split('.');

	const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, CURRENCY.thousandsSep);
	const body = decPart ? `${grouped}${CURRENCY.decimalSep}${decPart}` : grouped;
	return `${body} ${CURRENCY.suffix}`;
}
