import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [domain, setDomain] = useState('');

  useEffect(() => {
    if (!user || !isAdmin) { navigate('/'); return; }
    fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
    const [ordersRes, usersRes, productsRes, settingsRes] = await Promise.all([
      supabase.from('orders').select('*, products(name), profiles!orders_buyer_id_fkey(full_name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('products').select('*, profiles!products_seller_id_fkey(full_name)'),
      supabase.from('admin_settings').select('*').eq('setting_key', 'allowed_email_domain').single(),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (usersRes.data) setUsers(usersRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    if (settingsRes.data) setDomain(settingsRes.data.setting_value);
  };

  const updateOrderStatus = async (orderId: string, status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled") => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    toast({ title: 'Order updated' });
    fetchData();
  };

  const updateDomain = async () => {
    await supabase.from('admin_settings').update({ setting_value: domain }).eq('setting_key', 'allowed_email_domain');
    toast({ title: 'Domain updated' });
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    toast({ title: 'Product deleted' });
    fetchData();
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-eco-dark mb-8">Admin Panel</h1>
        <Tabs defaultValue="orders" className="glass-card-solid rounded-2xl p-6">
          <TabsList className="mb-6">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="orders">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {orders.map(order => (
                <div key={order.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{order.products?.name}</p>
                    <p className="text-sm text-muted-foreground">Buyer: {order.profiles?.full_name}</p>
                    <p className="text-sm">₹{order.total_amount}</p>
                  </div>
                  <Select value={order.status} onValueChange={v => updateOrderStatus(order.id, v as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled")}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="users">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map(u => (
                <div key={u.id} className="border rounded-lg p-3">
                  <p className="font-semibold">{u.full_name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="products">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map(p => (
                <div key={p.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">Seller: {p.profiles?.full_name}</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteProduct(p.id)}>Delete</Button>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="settings">
            <div className="max-w-sm space-y-4">
              <div>
                <label className="text-sm font-medium">Allowed Email Domain</label>
                <div className="flex gap-2 mt-1">
                  <Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" />
                  <Button onClick={updateDomain} className="eco-gradient-primary text-white">Save</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Users can only sign up with @{domain} emails</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
