import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings, Mail, Plus, Trash2, Loader2 } from 'lucide-react';

interface AllowedDomain {
  id: string;
  domain: string;
  created_at: string;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const [domains, setDomains] = useState<AllowedDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    const { data, error } = await supabase
      .from('allowed_domains')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setDomains(data);
    }
    setLoading(false);
  };

  const addDomain = async () => {
    const trimmedDomain = newDomain.trim().toLowerCase().replace(/^@/, '');
    
    if (!trimmedDomain) {
      toast({ title: 'Please enter a domain', variant: 'destructive' });
      return;
    }

    // Basic domain validation
    if (!/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(trimmedDomain)) {
      toast({ title: 'Invalid domain format', description: 'Please enter a valid domain like example.com', variant: 'destructive' });
      return;
    }

    if (domains.some(d => d.domain === trimmedDomain)) {
      toast({ title: 'Domain already exists', variant: 'destructive' });
      return;
    }

    setAdding(true);
    const { data, error } = await supabase
      .from('allowed_domains')
      .insert({ domain: trimmedDomain })
      .select()
      .single();

    setAdding(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setDomains([...domains, data]);
      setNewDomain('');
      toast({ title: 'Domain added successfully' });
    }
  };

  const removeDomain = async (id: string, domain: string) => {
    if (domains.length === 1) {
      toast({ 
        title: 'Cannot remove last domain', 
        description: 'At least one allowed domain must exist',
        variant: 'destructive' 
      });
      return;
    }

    setDeletingId(id);
    const { error } = await supabase
      .from('allowed_domains')
      .delete()
      .eq('id', id);

    setDeletingId(null);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setDomains(domains.filter(d => d.id !== id));
      toast({ title: `Domain @${domain} removed` });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDomain();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Allowed Email Domains
          </CardTitle>
          <CardDescription>
            Users can only sign up with email addresses from these domains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new domain */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="newdomain.edu"
                className="flex-1"
              />
            </div>
            <Button 
              onClick={addDomain} 
              disabled={adding || !newDomain.trim()}
              className="eco-gradient-primary text-white"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </>
              )}
            </Button>
          </div>

          {/* Domain list */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : domains.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No domains configured. Add a domain to restrict signups.
              </p>
            ) : (
              domains.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">@{item.domain}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDomain(item.id, item.domain)}
                    disabled={deletingId === item.id}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {domains.length > 0 
              ? `Users can register with: ${domains.map(d => `@${d.domain}`).join(', ')}`
              : 'No restrictions set - anyone can sign up'
            }
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Platform Settings
          </CardTitle>
          <CardDescription>
            General platform configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Additional settings will be available here as the platform grows.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
