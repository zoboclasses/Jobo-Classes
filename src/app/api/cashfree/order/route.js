import { NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const { courseId } = await request.json();
  if (!courseId || !UUID_RE.test(courseId)) {
    return NextResponse.json({ error: 'Invalid course' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: course } = await admin.from('courses')
    .select('id, price_inr, is_published').eq('id', courseId).maybeSingle();
  if (!course || !course.is_published) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const { data: existing } = await admin.from('enrollments').select('id')
    .eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
  if (existing) return NextResponse.json({ error: 'Already enrolled' }, { status: 400 });

  // Free course (₹0): enroll directly without payment
  if (course.price_inr <= 0) {
    await admin.from('enrollments').upsert(
      { user_id: user.id, course_id: courseId },
      { onConflict: 'user_id,course_id' }
    );
    return NextResponse.json({ free: true });
  }

  try {
    // Generate a unique order ID
    const orderId = `order_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    const response = await cashfree.PGCreateOrder({
      order_id: orderId,
      order_amount: course.price_inr,  // RUPEES — not paise
      order_currency: 'INR',
      customer_details: {
        customer_id: user.id,
        customer_phone: '9999999999', // fallback; Cashfree requires this
        customer_email: user.email || '',
        customer_name: user.user_metadata?.full_name || '',
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/${courseId}?order_id=${orderId}`,
      },
      order_note: `Course: ${courseId}`,
    });

    const paymentSessionId = response.data.payment_session_id;

    // Store payment record
    await admin.from('payments').insert({
      user_id: user.id,
      course_id: courseId,
      cf_order_id: orderId,
      amount_inr: course.price_inr,
      status: 'created'
    });

    return NextResponse.json({ orderId, paymentSessionId });
  } catch (err) {
    console.error('Cashfree order error:', err?.response?.data || err);
    return NextResponse.json({ error: 'Payment creation failed. Please try again.' }, { status: 500 });
  }
}
