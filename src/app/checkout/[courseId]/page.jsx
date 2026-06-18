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
  const sdkReady = useRef(false);

  useEffect(() => {
    supabase.from('courses').select('*').eq('id', courseId).maybeSingle()
      .then(({ data }) => setCourse(data));

    // Load Cashfree JS SDK once
    if (!document.querySelector('script[src*="sdk.cashfree.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = () => {
        const mode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox';
        cashfreeRef.current = window.Cashfree({ mode });
        sdkReady.current = true;
      };
      document.body.appendChild(script);
    } else if (window.Cashfree) {
      const mode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox';
      cashfreeRef.current = window.Cashfree({ mode });
      sdkReady.current = true;
    }
  }, [courseId]);

  // Handle return from Cashfree redirect (if _self mode was used)
  useEffect(() => {
    const returnOrderId = searchParams.get('order_id');
    if (returnOrderId) {
      verifyPayment(returnOrderId);
    }
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
      } else if (result.status === 'ACTIVE') {
        setLoading(false);
        setStatus('Payment is still processing. Please wait or try again.');
      } else {
        setLoading(false);
        setStatus('Payment was not completed. Please try again.');
      }
    } catch {
      setLoading(false);
      setStatus('Payment verification failed. Contact support.');
    }
  }

  async function pay() {
    setLoading(true); setStatus('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const res = await fetch('/api/cashfree/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });

      let order;
      try { order = await res.json(); } catch { order = {}; }

      if (!res.ok) {
        setLoading(false);
        return setStatus(order.error || 'Could not start payment.');
      }

      // Free course — already enrolled by server
      if (order.free) {
        setLoading(false);
        router.push(`/courses/${courseId}`);
        router.refresh();
        return;
      }

      // Wait for SDK to be ready
      if (!sdkReady.current || !cashfreeRef.current) {
        // SDK not loaded yet, wait a bit
        await new Promise(resolve => {
          const check = setInterval(() => {
            if (window.Cashfree) {
              const mode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox';
              cashfreeRef.current = window.Cashfree({ mode });
              sdkReady.current = true;
              clearInterval(check);
              resolve();
            }
          }, 200);
          // Timeout after 10s
          setTimeout(() => { clearInterval(check); resolve(); }, 10000);
        });
      }

      if (!cashfreeRef.current) {
        setLoading(false);
        return setStatus('Payment system is loading. Please try again.');
      }

      // Open Cashfree checkout modal
      const result = await cashfreeRef.current.checkout({
        paymentSessionId: order.paymentSessionId,
        redirectTarget: '_modal',
      });

      if (result.error) {
        setLoading(false);
        setStatus('Payment was not completed. Please try again.');
        return;
      }

      if (result.redirect) {
        // Page is navigating away — return_url handler will pick up
        return;
      }

      if (result.paymentDetails) {
        // User submitted payment — verify on backend
        await verifyPayment(order.orderId);
      }
    } catch (err) {
      setLoading(false);
      setStatus('Something went wrong. Please try again.');
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
