import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';
import { sendOtpEmail } from '@/lib/server/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { mobile, email } = await request.json();

    // Prefer email (free SMTP). Fall back to mobile SMS if no email supplied.
    const useEmail = typeof email === 'string' && EMAIL_RE.test(email.trim());
    const useMobile = typeof mobile === 'string' && /^\d{10}$/.test(mobile);

    if (!useEmail && !useMobile) {
      return NextResponse.json({ error: 'Valid email or 10-digit mobile is required' }, { status: 400 });
    }

    const identifier = useEmail ? email.trim().toLowerCase() : mobile.trim();

    // 1. Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 2. Cleanup old unverified for this identifier
    if (useEmail) {
      await supabaseServer.from('visitor_otps').delete().eq('email', identifier).eq('verified', false);
    } else {
      await supabaseServer.from('visitor_otps').delete().eq('mobile_number', identifier).eq('verified', false);
    }

    const { error } = await supabaseServer.from('visitor_otps').insert({
      mobile_number: useEmail ? null : identifier,
      email: useEmail ? identifier : null,
      otp_hash: otpHash,
      expires_at: expiresAt.toISOString(),
      verified: false,
    } as any);

    if (error) {
      console.error('Error saving OTP:', error);
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
    }

    // 3. Deliver
    if (useEmail) {
      const result = await sendOtpEmail(identifier, otp);
      const isDev = process.env.NODE_ENV !== 'production';
      // Free tier 100/day - if SMTP not configured we simulate; expose OTP only in dev
      if ((result as any).simulated && !process.env.SMTP_USER) {
        console.log(`[SIMULATED EMAIL] To:${identifier} OTP:${otp}`);
        return NextResponse.json({
          success: true,
          message: 'OTP sent via email (simulated - configure SMTP)',
          ...(isDev ? { _simulatedOtp: otp } : {}),
        });
      }
      return NextResponse.json({
        success: true,
        message: result.simulated ? 'OTP email simulated (SMTP failed, see logs)' : 'OTP sent via email',
        ...(result.simulated && isDev ? { _simulatedOtp: otp } : {}),
      });
    }

    // SMS path DEPRECATED - PAID (Fast2SMS ~0.25 INR/SMS). Free plan uses Gmail SMTP only.
    // Kept only for backward compat if legacy clients send mobile without email; now returns 400 guidance to use email.
    // To keep zero cost, we no longer call Fast2SMS. Use email OTP (free 100/day).
    console.warn(`[DEPRECATED SMS OTP] mobile:${identifier} - Fast2SMS disabled for free Gmail plan. Advise using email.`);
    if (process.env.FAST2SMS_API_KEY) {
      console.warn('FAST2SMS_API_KEY is set but ignored - remove it for zero-cost mode. Simulating instead.');
    }
    console.log(`\n[SIMULATED SMS - DISABLED FOR FREE PLAN] To: +91${identifier} | OTP: ${otp} (use email instead)\n`);
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json({
      success: true,
      message: 'OTP simulated (SMS disabled - free plan uses email OTP via Gmail)',
      ...(isDev ? { _simulatedOtp: otp } : {}),
    });
  } catch (error) {
    console.error('Error in send OTP route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
