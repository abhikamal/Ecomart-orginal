-- Create allowed_domains table for multiple email domains
CREATE TABLE public.allowed_domains (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;

-- Admins can manage domains
CREATE POLICY "Admins can manage domains"
ON public.allowed_domains
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view domains (for signup validation)
CREATE POLICY "Anyone can view domains"
ON public.allowed_domains
FOR SELECT
USING (true);

-- Migrate existing domain from admin_settings if it exists
INSERT INTO public.allowed_domains (domain)
SELECT setting_value 
FROM public.admin_settings 
WHERE setting_key = 'allowed_email_domain' 
  AND setting_value IS NOT NULL 
  AND setting_value != ''
ON CONFLICT (domain) DO NOTHING;