import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// UUID v4 format check
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const body = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  // Input validation
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment parameters' }, { status: 400 });
  }

  // FIX #1: Timing-safe HMAC comparison (prevents timing attacks)
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const sigBuffer = Buffer.from(razorpay_signature, 'utf8');
  const expBuffer = Buffer.from(expected, 'utf8');
  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: payment } = await admin.from('payments').select('*')
    .eq('razorpay_order_id', razorpay_order_id).eq('user_id', user.id).maybeSingle();
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  // FIX #4: Prevent payment replay — only process if status is 'created'
  if (payment.status === 'paid') {
    return NextResponse.json({ ok: true }); // Already processed, idempotent response
  }
  if (payment.status !== 'created') {
    return NextResponse.json({ error: 'Payment already processed' }, { status: 400 });
  }

  await admin.from('payments').update({ status: 'paid', razorpay_payment_id }).eq('id', payment.id);
  await admin.from('enrollments').upsert(
    { user_id: user.id, course_id: payment.course_id, payment_id: payment.id },
    { onConflict: 'user_id,course_id' }
  );

  return NextResponse.json({ ok: true });
}
