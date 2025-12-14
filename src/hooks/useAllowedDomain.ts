import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAllowedDomain = () => {
  const [allowedDomain, setAllowedDomain] = useState<string>('bvrit.ac.in');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllowedDomain = async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'allowed_email_domain')
        .single();

      if (!error && data) {
        setAllowedDomain(data.setting_value);
      }
      setLoading(false);
    };

    fetchAllowedDomain();
  }, []);

  const validateEmail = (email: string): boolean => {
    return email.endsWith(`@${allowedDomain}`);
  };

  return { allowedDomain, loading, validateEmail };
};
