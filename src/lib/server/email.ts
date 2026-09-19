import 'server-only';
import * as nodemailer from 'nodemailer';

let cached: any = null;

function getTransporter() {
  if (cached) return cached;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || (process.env as any).SMTP_PASSWORD;
  if (!user || !pass) return null;
  cached = (nodemailer as any).createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cached;
}

export async function isEmailConfigured(): Promise<boolean> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || (process.env as any).SMTP_PASSWORD;
  return Boolean(user && pass);
}

export async function sendApprovalRequestEmail(params: {
  to: string;
  hostName: string;
  visitorName: string;
  visitorMobile: string;
  visitorCompany?: string | null;
  visitorEmail?: string | null;
  purpose: string;
  approvalLink: string;
}) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@navjyoti.com';
  if (!transporter) {
    console.log(`\n[SIMULATED APPROVAL EMAIL] => To: ${params.to} | Visitor:${params.visitorName} Link:${params.approvalLink}\n`);
    return { simulated: true as const };
  }
  try {
    await transporter.verify().catch(() => null);
    await transporter.sendMail({
      from: `Navjyoti Gate Pass <${from}>`,
      to: params.to,
      subject: `Visitor Approval: ${params.visitorName} waiting to meet you`,
      text: `Visitor ${params.visitorName} (${params.visitorMobile}) wants to meet you. Purpose: ${params.purpose}. Approve/reject: ${params.approvalLink} (expires 24h)`,
      html: `
        <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px">
          <h2 style="margin:0 0 8px;color:#0133a1">Navjyoti Visitor Approval Request</h2>
          <p style="margin:0 0 12px;color:#475569">Hi ${params.hostName},</p>
          <p style="margin:0 0 12px;color:#334155"><strong>${params.visitorName}</strong> is waiting to meet you.</p>
          <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px">
            <tr><td style="padding:6px 0;color:#64748b">Mobile</td><td style="padding:6px 0;color:#0f172a;font-weight:600">${params.visitorMobile}</td></tr>
            ${params.visitorEmail ? `<tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0;color:#0f172a">${params.visitorEmail}</td></tr>` : ''}
            ${params.visitorCompany ? `<tr><td style="padding:6px 0;color:#64748b">Company</td><td style="padding:6px 0;color:#0f172a">${params.visitorCompany}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#64748b">Purpose</td><td style="padding:6px 0;color:#0f172a">${params.purpose}</td></tr>
          </table>
          <a href="${params.approvalLink}" style="display:inline-block;margin:16px 0;padding:14px 28px;background:#0133a1;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Review & Approve / Reject</a>
          <p style="margin:12px 0 0;color:#64748b;font-size:13px">Link expires in 24 hours. This email is free via Gmail SMTP (100/day).</p>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:12px">If you did not expect this, you can ignore it.</p>
        </div>
      `,
    });
    console.log(`[APPROVAL EMAIL SENT] => To: ${params.to} Visitor:${params.visitorName}`);
    return { simulated: false as const };
  } catch (e) {
    console.error('Approval email failed, simulated fallback:', e);
    console.log(`\n[SIMULATED APPROVAL EMAIL FALLBACK] => To: ${params.to} | Link:${params.approvalLink}\n`);
    return { simulated: true as const, error: e };
  }
}

export async function sendOtpEmail(to: string, otp: string) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@navjyoti.com';
  if (!transporter) {
    console.log(`\n[SIMULATED EMAIL] => To: ${to} | OTP: ${otp}\n`);
    return { simulated: true };
  }
  try {
    await transporter.verify().catch(() => null);
    await transporter.sendMail({
      from: `Navjyoti Gate Pass <${from}>`,
      to,
      subject: 'Your Navjyoti Gate Pass verification code',
      text: `Your Navjyoti verification code is ${otp}. It expires in 5 minutes. Do not share this code.`,
      html: `
        <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px">
          <h2 style="margin:0 0 8px;color:#0133a1">Navjyoti Gate Pass</h2>
          <p style="margin:0 0 16px;color:#475569">Your verification code is:</p>
          <div style="font-size:28px;letter-spacing:0.35em;font-weight:800;text-align:center;padding:14px 0;background:#f1f5f9;border-radius:12px;color:#0f172a">${otp}</div>
          <p style="margin:16px 0 0;color:#64748b;font-size:13px">Expires in 5 minutes. If you did not request this, ignore this email.</p>
          <p style="margin:16px 0 0;color:#94a3b8;font-size:12px">Free tier: 100 emails/day via SMTP. Do not reply.</p>
        </div>
      `,
    });
    console.log(`[EMAIL SENT] => To: ${to}`);
    return { simulated: false };
  } catch (e) {
    console.error('SMTP send failed, falling back to simulated:', e);
    console.log(`\n[SIMULATED EMAIL FALLBACK] => To: ${to} | OTP: ${otp}\n`);
    return { simulated: true, error: e };
  }
}

export async function sendVisitorDecisionEmail(params: {
  to: string;
  visitorName: string;
  status: 'approved' | 'rejected';
  passLink?: string;
}) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@navjyoti.com';
  
  if (!transporter) {
    console.log(`\n[SIMULATED VISITOR EMAIL] => To: ${params.to} | Status: ${params.status}\n`);
    return { simulated: true };
  }
  
  try {
    await transporter.verify().catch(() => null);
    
    const subject = params.status === 'approved' 
      ? 'Your Navjyoti Gate Pass is Approved!' 
      : 'Navjyoti Gate Pass Update';
      
    const text = params.status === 'approved'
      ? `Hi ${params.visitorName}, your gate pass has been approved. View and download it here: ${params.passLink}`
      : `Hi ${params.visitorName}, unfortunately your gate pass request could not be approved at this time.`;
      
    const html = params.status === 'approved'
      ? `
        <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;text-align:center;">
          <h2 style="margin:0 0 16px;color:#0133a1">Gate Pass Approved!</h2>
          <p style="margin:0 0 16px;color:#475569;font-size:16px;">Hi <strong>${params.visitorName}</strong>, your visit has been approved.</p>
          <a href="${params.passLink}" style="display:inline-block;margin:16px 0;padding:14px 28px;background:#FF6A00;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">View & Download Pass</a>
          <p style="margin:24px 0 0;color:#64748b;font-size:13px">Please show the digital pass or a printed copy at the security gate.</p>
        </div>
      `
      : `
        <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;text-align:center;">
          <h2 style="margin:0 0 16px;color:#0133a1">Visit Update</h2>
          <p style="margin:0 0 16px;color:#475569;font-size:16px;">Hi <strong>${params.visitorName}</strong>, unfortunately your gate pass request could not be approved at this time.</p>
          <p style="margin:16px 0 0;color:#64748b;font-size:13px">Please contact your host for more information.</p>
        </div>
      `;

    await transporter.sendMail({
      from: `Navjyoti Gate Pass <${from}>`,
      to: params.to,
      subject,
      text,
      html,
    });
    
    console.log(`[VISITOR EMAIL SENT] => To: ${params.to} Status: ${params.status}`);
    return { simulated: false };
  } catch (e) {
    console.error('Visitor email failed, simulated fallback:', e);
    console.log(`\n[SIMULATED VISITOR EMAIL FALLBACK] => To: ${params.to} | Status: ${params.status}\n`);
    return { simulated: true, error: e };
  }
}
