import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user!.id).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-md">
        <h1 className="text-3xl font-bold text-eco-dark mb-8">Profile</h1>
        {loading ? <p>Loading...</p> : profile && (
          <div className="glass-card-solid rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <Input value={profile.full_name} disabled className="mt-1 bg-muted" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input value={profile.email} disabled className="mt-1 bg-muted" />
            </div>
            <Button onClick={handleLogout} variant="destructive" className="w-full mt-6">Logout</Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
