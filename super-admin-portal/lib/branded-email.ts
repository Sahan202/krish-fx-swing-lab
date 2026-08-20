type Detail = { label: string; value: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] ?? character));
}

export function brandedEmail({
  eyebrow,
  title,
  name,
  message,
  details = [],
  noticeTitle,
  notice,
  actionUrl,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  name: string;
  message: string;
  details?: Detail[];
  noticeTitle?: string;
  notice?: string;
  actionUrl?: string;
  actionLabel?: string;
}) {
  const detailRows = details.map(({ label, value }) => `<tr><td style="padding:0 0 9px;color:#7890a6;font-size:13px">${escapeHtml(label)}</td><td style="padding:0 0 9px;color:#10233f;font-size:13px;font-weight:700;text-align:right">${escapeHtml(value)}</td></tr>`).join('');
  return `<div style="margin:0;padding:32px 16px;background:#eef5fb;font-family:Arial,Helvetica,sans-serif;color:#10233f"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 14px 42px rgba(15,40,70,.14)"><tr><td style="padding:30px 34px;background:#071b33"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="width:42px;height:42px;border-radius:12px;background:#00b8fe;color:#ffffff;text-align:center;font-size:22px;font-weight:800">K</td><td style="padding-left:12px;color:#ffffff;font-size:17px;font-weight:700">Krish FX <span style="color:#56d8ff">Swing Lab</span></td></tr></table><p style="margin:26px 0 0;color:#8ce7ff;font-size:11px;font-weight:700;letter-spacing:1.8px">${escapeHtml(eyebrow)}</p><h1 style="margin:9px 0 0;color:#ffffff;font-size:29px;line-height:1.2">${escapeHtml(title)}</h1></td></tr><tr><td style="padding:34px"><p style="margin:0;font-size:16px;line-height:1.6">Hi ${escapeHtml(name)},</p><p style="margin:18px 0 0;color:#52677f;font-size:15px;line-height:1.7">${escapeHtml(message)}</p>${detailRows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0;background:#f0faff;border:1px solid #c7effc;border-radius:14px"><tr><td style="padding:18px"><p style="margin:0 0 13px;color:#0784b3;font-size:12px;font-weight:700;letter-spacing:1px">YOUR ACCESS DETAILS</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${detailRows}</table></td></tr></table>` : ''}${notice ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0;background:#f8fafc;border:1px solid #e3eaf1;border-radius:14px"><tr><td style="padding:18px"><p style="margin:0;color:#31516d;font-size:12px;font-weight:700;letter-spacing:1px">${escapeHtml(noticeTitle ?? 'NEXT STEP')}</p><p style="margin:8px 0 0;color:#52677f;font-size:14px;line-height:1.6">${escapeHtml(notice)}</p></td></tr></table>` : ''}${actionUrl && actionLabel ? `<p style="margin:28px 0 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;border-radius:10px;background:#00aee8;color:#ffffff;padding:13px 19px;font-size:14px;font-weight:700;text-decoration:none">${escapeHtml(actionLabel)} →</a></p>` : ''}<p style="margin:30px 0 0;border-top:1px solid #e5edf4;padding-top:20px;color:#8193a5;font-size:12px;line-height:1.6">This is an automated email from Krish FX Swing Lab. Please do not reply to this email.</p></td></tr></table></div>`;
}
