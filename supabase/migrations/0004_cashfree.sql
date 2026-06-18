-- Migration: Razorpay → Cashfree
-- Rename payment columns from Razorpay naming to Cashfree naming
ALTER TABLE public.payments RENAME COLUMN razorpay_order_id TO cf_order_id;
ALTER TABLE public.payments RENAME COLUMN razorpay_payment_id TO cf_payment_id;
