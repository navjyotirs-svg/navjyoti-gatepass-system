import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { mobile, email, otp } = await request.json();

    if (!otp) return NextResponse.json({ error: 'OTP is required' }, { status: 400 });

    const useEmail = typeof email === 'string' && EMAIL_RE.test(email.trim());
    const useMobile = typeof mobile === 'string' && /^\d{10}$/.test(mobile);
    if (!useEmail && !useMobile) {
      return NextResponse.json({ error: 'Email or mobile is required' }, { status: 400 });
    }
    const identifier = useEmail ? email.trim().toLowerCase() : mobile.trim();

    const otpHash = crypto.createHash('sha256').update(otp.toString()).digest('hex');

    const query = supabaseServer.from('visitor_otps').select('*').eq('verified', false);
    const { data: otpRecord, error } = useEmail
      ? await query.eq('email', identifier).single()
      : await query.eq('mobile_number', identifier).single();

    if (error || !otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    if (otpRecord.otp_hash !== otpHash) {
      return NextResponse.json({ error: 'Incorrect OTP' }, { status: 400 });
    }

    await supabaseServer.from('visitor_otps').update({ verified: true }).eq('id', otpRecord.id);

    return NextResponse.json({ success: true, message: useEmail ? 'Email verified successfully' : 'Phone verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
