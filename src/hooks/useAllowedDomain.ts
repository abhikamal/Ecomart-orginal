import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAllowedDomain = () => {
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllowedDomains = async () => {
      const { data, error } = await supabase
        .from('allowed_domains')
        .select('domain');

      if (!error && data) {
        setAllowedDomains(data.map(d => d.domain));
      }
      setLoading(false);
    };

    fetchAllowedDomains();
  }, []);

  const validateEmail = (email: string): boolean => {
    // If no domains are configured, allow all
    if (allowedDomains.length === 0) return true;
    
    // Check if email ends with any allowed domain
    return allowedDomains.some(domain => 
      email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)
    );
  };

  const getDomainsText = (): string => {
    if (allowedDomains.length === 0) return '';
    if (allowedDomains.length === 1) return `@${allowedDomains[0]}`;
    return allowedDomains.map(d => `@${d}`).join(' or ');
  };

  return { 
    allowedDomains, 
    allowedDomain: allowedDomains[0] || '', // backwards compatibility
    loading, 
    validateEmail,
    getDomainsText
  };
};
