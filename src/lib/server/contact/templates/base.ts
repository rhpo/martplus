// Shared HTML email shell. Email clients ignore <style>/external CSS,
// so everything is inline.

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function emailShell(opts: { heading: string; bodyHtml: string }): string {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f2f3f5;font-family:Helvetica,Arial,sans-serif;color:#0f1729;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f3f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,41,0.08);">
        <tr><td style="background:#1a2744;padding:24px 32px;">
          <span style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">MART<span style="color:#e8432f;">+</span></span>
          <div style="font-family:monospace;font-size:11px;color:#f2c078;margin-top:4px;">SUPÉRETTE · ÉPICERIE FINE DE TERROIR</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px;color:#0f1729;">${escapeHtml(opts.heading)}</h1>
          ${opts.bodyHtml}
        </td></tr>
        <tr><td style="background:#1a2744;padding:20px 32px;">
          <p style="margin:0;font-size:12px;color:#d5d9e0;line-height:1.6;">
            Cette adresse e-mail reçoit le récapitulatif de votre commande et le suivi de votre livraison.
            Si vous l'avez accepté, vous recevrez aussi nos offres et réductions exclusives.<br />
            MART+ - Ta supérette de quartier, partout avec toi.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
