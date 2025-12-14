import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Package } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  tracking_number: string | null;
  products: { name: string; image_url: string | null } | null;
}

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, products(name, image_url)')
      .eq('buyer_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setOrders(data as unknown as Order[]);
    setLoading(false);
  };

  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      pending: 'status-pending', confirmed: 'status-confirmed',
      shipped: 'status-shipped', delivered: 'status-delivered', cancelled: 'status-cancelled'
    };
    return classes[status] || 'status-pending';
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-eco-dark mb-8">Your Orders</h1>
        {loading ? <p>Loading...</p> : orders.length === 0 ? (
          <div className="text-center py-12 glass-card-solid rounded-2xl">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="glass-card-solid rounded-xl p-4">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                    {order.products?.image_url && <img src={order.products.image_url} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-eco-dark">{order.products?.name || 'Product'}</h3>
                    <p className="text-primary font-bold">₹{order.total_amount}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={getStatusClass(order.status)}>{order.status}</span>
                    {order.tracking_number && <p className="text-xs text-muted-foreground mt-1">Track: {order.tracking_number}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
