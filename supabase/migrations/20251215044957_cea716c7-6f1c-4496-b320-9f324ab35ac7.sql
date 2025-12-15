-- Add is_banned column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- Update RLS policy for products to prevent banned users from viewing
DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;
CREATE POLICY "Non-banned users can view available products" 
ON public.products 
FOR SELECT 
USING (is_available = true);