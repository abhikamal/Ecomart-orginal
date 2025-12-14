import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Wishlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    supabase.from('wishlist').select('*, products(*)').eq('user_id', user.id)
      .then(({ data }) => data && setItems(data));
  }, [user]);

  const remove = async (id: string) => {
    await supabase.from('wishlist').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-eco-dark mb-8">Wishlist</h1>
        {items.length === 0 ? (
          <div className="text-center py-12 glass-card-solid rounded-2xl">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No wishlist items</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map(item => (
              <div key={item.id} className="glass-card-solid rounded-xl p-4 flex gap-4 items-center">
                <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                  {item.products?.image_url && <img src={item.products.image_url} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => navigate(`/product/${item.products?.id}`)}>
                  <h3 className="font-semibold text-eco-dark">{item.products?.name}</h3>
                  <p className="text-primary font-bold">₹{item.products?.price}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(item.id)}>
                  <Trash2 className="w-5 h-5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Wishlist;
