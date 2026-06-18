import { NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const cashfree = new Cashfree(
  process.env.CASHFREE_ENV === 'PRODUCTION'
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { orderId } = await request.json();
  if (!orderId || typeof orderId !== 'string') {
    return NextResponse.json({ error: 'Invalid order' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find the payment record
  const { data: payment } = await admin.from('payments').select('*')
    .eq('cf_order_id', orderId).eq('user_id', user.id).maybeSingle();
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  // Already processed — idempotent response
  if (payment.status === 'paid') {
    return NextResponse.json({ ok: true, status: 'PAID' });
  }
  if (payment.status === 'failed') {
    return NextResponse.json({ error: 'Payment failed' }, { status: 400 });
  }

  try {
    // Backend re-fetch — NEVER trust client-side signals
    const order = await cashfree.PGFetchOrder(orderId);
    const orderStatus = order.data.order_status;

    if (orderStatus === 'PAID') {
      const cfPaymentId = order.data.cf_order_id || orderId;

      await admin.from('payments').update({
        status: 'paid',
        cf_payment_id: String(cfPaymentId)
      }).eq('id', payment.id);

      await admin.from('enrollments').upsert(
        { user_id: user.id, course_id: payment.course_id, payment_id: payment.id },
        { onConflict: 'user_id,course_id' }
      );

      return NextResponse.json({ ok: true, status: 'PAID' });
    }

    // Not paid yet — update status if failed
    if (orderStatus === 'EXPIRED' || orderStatus === 'TERMINATED') {
      await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
    }

    return NextResponse.json({ ok: false, status: orderStatus });
  } catch (err) {
    console.error('Cashfree verify error:', err?.response?.data || err);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
