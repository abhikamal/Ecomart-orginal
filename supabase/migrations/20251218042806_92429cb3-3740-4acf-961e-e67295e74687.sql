-- Add username and phone_number to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add new columns to orders for Amazon-like flow
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod',
ADD COLUMN IF NOT EXISTS confirmed_by UUID,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS executive_notes TEXT,
ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- Create function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for receipt generation
DROP TRIGGER IF EXISTS generate_order_receipt ON public.orders;
CREATE TRIGGER generate_order_receipt
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_receipt_number();

-- Update handle_new_user to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, username, phone_number)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;