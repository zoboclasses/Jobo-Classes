'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Reveal } from '@/components/Reveal';

export default function CheckoutPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('courses').select('*').eq('id', courseId).maybeSingle()
      .then(({ data }) => setCourse(data));
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
  }, [courseId]);

  async function pay() {
    setLoading(true); setStatus('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const res = await fetch('/api/razorpay/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });

      let order;
      try { order = await res.json(); } catch { order = {}; }

      if (!res.ok) { setLoading(false); return setStatus(order.error || 'Could not start payment.'); }

      // Free course — already enrolled by server, redirect back
      if (order.free) {
        setLoading(false);
        router.push(`/courses/${courseId}`);
        router.refresh();
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: 'INR',
        name: 'Jobo Classes',
        description: course?.title,
        order_id: order.orderId,
        prefill: { email: user.email || '' },
        theme: { color: '#2563eb' },
        handler: async (response) => {
          setStatus('Verifying payment...');
          try {
            const v = await fetch('/api/razorpay/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            });
            if (v.ok) { router.push(`/courses/${courseId}`); router.refresh(); }
            else { setLoading(false); setStatus('Payment verification failed. Contact support.'); }
          } catch {
            setLoading(false);
            setStatus('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setLoading(false) }
      });
      rzp.open();
    } catch (err) {
      setLoading(false);
      setStatus(err.message || 'Something went wrong. Please try again.');
    }
  }

  if (!course) return <div className="container-x py-24 text-center text-ink/50">Loading...</div>;

  return (
    <div className="container-x flex justify-center py-20">
      <Reveal className="w-full max-w-md">
        <div className="card !p-8 text-center">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="mt-2 text-sm text-ink/60">One-time payment. Lifetime access to all videos, mock tests and notes in this course.</p>
          <p className="mt-6 text-4xl font-bold">₹{course.price_inr}</p>
          <button onClick={pay} disabled={loading} className="btn-primary mt-6 w-full">
            {loading ? 'Processing...' : course.price_inr <= 0 ? 'Enroll for Free' : 'Pay with Razorpay'}
          </button>
          {status && <p className="mt-4 text-sm text-accent">{status}</p>}
        </div>
      </Reveal>
    </div>
  );
}
