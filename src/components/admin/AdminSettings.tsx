import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings, Mail, Save } from 'lucide-react';

interface AdminSettingsProps {
  domain: string;
  onRefresh: () => void;
}

const AdminSettings = ({ domain: initialDomain, onRefresh }: AdminSettingsProps) => {
  const { toast } = useToast();
  const [domain, setDomain] = useState(initialDomain);
  const [saving, setSaving] = useState(false);

  const updateDomain = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('admin_settings')
      .update({ setting_value: domain })
      .eq('setting_key', 'allowed_email_domain');
    
    setSaving(false);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Domain updated successfully' });
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Domain Restriction
          </CardTitle>
          <CardDescription>
            Only users with emails from this domain can sign up
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <Input
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="example.com"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Users can only register with @{domain || 'yourdomain.com'} email addresses
              </p>
            </div>
            <Button 
              onClick={updateDomain} 
              disabled={saving}
              className="eco-gradient-primary text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
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
