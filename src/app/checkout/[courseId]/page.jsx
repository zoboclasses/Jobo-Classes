'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Reveal } from '@/components/Reveal';

export default function CheckoutPage() {
  const { courseId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const cashfreeRef = useRef(null);

  useEffect(() => {
    supabase.from('courses').select('*').eq('id', courseId).maybeSingle()
      .then(({ data }) => setCourse(data));

    // Load Cashfree JS SDK once
    const existing = document.querySelector('script[src*="sdk.cashfree.com"]');
    if (existing && window.Cashfree) {
      const mode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox';
      cashfreeRef.current = window.Cashfree({ mode });
    } else if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = () => {
        if (window.Cashfree) {
          const mode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox';
          cashfreeRef.current = window.Cashfree({ mode });
        }
      };
      document.body.appendChild(script);
    }
  }, [courseId]);

  // Handle return from redirect (if browser was redirected)
  useEffect(() => {
    const returnOrderId = searchParams.get('order_id');
    if (returnOrderId) verifyPayment(returnOrderId);
  }, [searchParams]);

  async function verifyPayment(orderId) {
    setLoading(true);
    setStatus('Verifying payment...');
    try {
      const v = await fetch('/api/cashfree/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const result = await v.json();
      if (result.ok && result.status === 'PAID') {
        router.push(`/courses/${courseId}`);
        router.refresh();
      } else {
        setLoading(false);
        setStatus(result.status === 'ACTIVE'
          ? 'Payment is still processing. Please wait or try again.'
          : 'Payment was not completed. Please try again.');
      }
    } catch {
      setLoading(false);
      setStatus('Verification failed. Contact support.');
    }
  }

  async function pay() {
    setLoading(true);
    setStatus('');
    try {
      // 1. Check login
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // 2. Create order on backend
      setStatus('Creating order...');
      const res = await fetch('/api/cashfree/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });

      let order;
      try { order = await res.json(); } catch { order = {}; }

      if (!res.ok) {
        setLoading(false);
        setStatus(order.error || 'Could not start payment. Please try again.');
        return;
      }

      // 3. Free course — already enrolled
      if (order.free) {
        router.push(`/courses/${courseId}`);
        router.refresh();
        return;
      }

      // 4. Wait for Cashfree SDK
      if (!cashfreeRef.current) {
        // Try to init if SDK loaded after our useEffect
        if (window.Cashfree) {
          const mode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox';
          cashfreeRef.current = window.Cashfree({ mode });
        } else {
          // Wait up to 5 seconds for SDK to load
          await new Promise((resolve) => {
            let waited = 0;
            const interval = setInterval(() => {
              waited += 300;
              if (window.Cashfree) {
                const mode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox';
                cashfreeRef.current = window.Cashfree({ mode });
                clearInterval(interval);
                resolve();
              } else if (waited >= 5000) {
                clearInterval(interval);
                resolve();
              }
            }, 300);
          });
        }
      }

      if (!cashfreeRef.current) {
        setLoading(false);
        setStatus('Payment system failed to load. Please refresh the page and try again.');
        return;
      }

      // 5. Open Cashfree checkout
      setStatus('Opening payment...');
      const result = await cashfreeRef.current.checkout({
        paymentSessionId: order.paymentSessionId,
        redirectTarget: '_modal',
      });

      if (result.error) {
        setLoading(false);
        setStatus('Payment was not completed. You can try again.');
        return;
      }

      if (result.redirect) {
        return; // browser navigating away
      }

      if (result.paymentDetails) {
        await verifyPayment(order.orderId);
        return;
      }

      // Fallback — shouldn't reach here
      setLoading(false);
      setStatus('Payment was not completed. You can try again.');

    } catch (err) {
      console.error('Payment error:', err);
      setLoading(false);
      setStatus('Something went wrong. Please refresh and try again.');
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
            {loading ? 'Processing...' : course.price_inr <= 0 ? 'Enroll for Free' : 'Pay Now'}
          </button>
          {status && <p className="mt-4 text-sm text-accent">{status}</p>}
        </div>
      </Reveal>
    </div>
  );
}
