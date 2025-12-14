import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    seller_id: string;
  };
}

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    const { data } = await supabase
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', user!.id);
    if (data) setItems(data as unknown as CartItem[]);
    setLoading(false);
  };

  const removeItem = async (id: string) => {
    await supabase.from('cart_items').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
    toast({ title: 'Removed from cart' });
  };

  const checkout = async () => {
    for (const item of items) {
      await supabase.from('orders').insert({
        buyer_id: user!.id,
        product_id: item.products.id,
        seller_id: item.products.seller_id,
        total_amount: item.products.price * item.quantity,
        status: 'pending',
      });
    }
    await supabase.from('cart_items').delete().eq('user_id', user!.id);
    toast({ title: 'Orders placed!', description: 'Check your orders page.' });
    navigate('/orders');
  };

  const total = items.reduce((sum, i) => sum + i.products.price * i.quantity, 0);

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-eco-dark mb-8">Your Cart</h1>
        {loading ? <p>Loading...</p> : items.length === 0 ? (
          <div className="text-center py-12 glass-card-solid rounded-2xl">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button onClick={() => navigate('/products')} className="mt-4 eco-gradient-primary text-white">Browse Products</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="glass-card-solid rounded-xl p-4 flex gap-4 items-center">
                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden">
                  {item.products.image_url && <img src={item.products.image_url} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-eco-dark">{item.products.name}</h3>
                  <p className="text-primary font-bold">₹{item.products.price}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                  <Trash2 className="w-5 h-5 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="glass-card-solid rounded-xl p-6 mt-6">
              <div className="flex justify-between text-xl font-bold mb-4">
                <span>Total</span><span className="text-primary">₹{total}</span>
              </div>
              <Button onClick={checkout} className="w-full h-12 eco-gradient-primary text-white">Checkout</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
