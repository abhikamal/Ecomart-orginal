import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, ShoppingBag, MapPin, Phone, CreditCard, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

interface UserProfile {
  phone_number: string | null;
  full_name: string;
}

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Checkout form state
  const [shippingAddress, setShippingAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchCart();
    fetchProfile();
  }, [user]);

  const fetchCart = async () => {
    const { data } = await supabase
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', user!.id);
    if (data) setItems(data as unknown as CartItem[]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('phone_number, full_name')
      .eq('user_id', user!.id)
      .single();
    if (data) {
      setProfile(data);
      setPhoneNumber(data.phone_number || '');
    }
  };

  const removeItem = async (id: string) => {
    await supabase.from('cart_items').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
    toast({ title: 'Removed from cart' });
  };

  const openCheckout = () => {
    if (items.length === 0) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }
    setCheckoutOpen(true);
  };

  const placeOrder = async () => {
    if (!shippingAddress.trim()) {
      toast({ title: 'Please enter shipping address', variant: 'destructive' });
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      toast({ title: 'Please enter a valid phone number', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      for (const item of items) {
        const { data, error } = await supabase.functions.invoke('validate-order', {
          body: {
            product_id: item.products.id,
            quantity: item.quantity,
            shipping_address: shippingAddress,
            buyer_phone: phoneNumber,
            payment_method: 'cod'
          }
        });

        if (error) {
          toast({ 
            title: 'Order Failed', 
            description: error.message || 'Failed to process order',
            variant: 'destructive' 
          });
          setSubmitting(false);
          return;
        }

        if (data?.error) {
          toast({ 
            title: 'Order Failed', 
            description: data.error,
            variant: 'destructive' 
          });
          setSubmitting(false);
          return;
        }
      }

      // Clear cart after successful orders
      await supabase.from('cart_items').delete().eq('user_id', user!.id);
      
      setCheckoutOpen(false);
      toast({ 
        title: 'Order Placed Successfully!', 
        description: 'Our executive will call you shortly to confirm your order. Payment: Cash on Delivery.' 
      });
      navigate('/orders');
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Something went wrong',
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
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
              
              {/* Payment Method Info */}
              <div className="bg-accent/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span className="font-medium">Payment Method: Cash on Delivery (COD)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-7">
                  Pay when you receive your order. Our executive will call you to confirm.
                </p>
              </div>
              
              <Button onClick={openCheckout} className="w-full h-12 eco-gradient-primary text-white">
                <Truck className="w-5 h-5 mr-2" />
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Complete Your Order
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Order Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">{item.products.name}</span>
                    <span>₹{item.products.price}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{total}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" />
                Shipping Address
              </label>
              <Textarea
                placeholder="Enter your complete delivery address (Room No, Hostel/Building, College Campus)"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={3}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                Contact Number (for delivery confirmation)
              </label>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Our executive will call this number to confirm your order
              </p>
            </div>

            {/* Payment Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <CreditCard className="w-4 h-4" />
                <span className="font-medium text-sm">Cash on Delivery</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Pay ₹{total} when you receive your order
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setCheckoutOpen(false)} 
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={placeOrder} 
                className="flex-1 eco-gradient-primary text-white"
                disabled={submitting}
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Cart;
