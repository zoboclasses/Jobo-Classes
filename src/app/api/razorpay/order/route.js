import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// UUID v4 format check
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { courseId } = await request.json();

  // FIX #3: Validate courseId is a proper UUID
  if (!courseId || !UUID_RE.test(courseId)) {
    return NextResponse.json({ error: 'Invalid course' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: course } = await admin.from('courses').select('id, price_inr, is_published').eq('id', courseId).maybeSingle();
  if (!course || !course.is_published) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

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
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    const order = await razorpay.orders.create({
      amount: course.price_inr * 100, // paise
      currency: 'INR',
      notes: { courseId, userId: user.id }
    });

    await admin.from('payments').insert({
      user_id: user.id, course_id: courseId,
      razorpay_order_id: order.id, amount_inr: course.price_inr, status: 'created'
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID });
  } catch (err) {
    // FIX #7: Don't leak internal error details to client
    console.error('Razorpay order error:', err);
    return NextResponse.json({ error: 'Payment creation failed. Please try again.' }, { status: 500 });
  }
}
