import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminCategories from '@/components/admin/AdminCategories';
import AdminSettings from '@/components/admin/AdminSettings';
import { LayoutDashboard, ShoppingCart, Users, Package, FolderOpen, Settings } from 'lucide-react';

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAdmin) { navigate('/'); return; }
    fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    const [ordersRes, usersRes, rolesRes, productsRes, categoriesRes] = await Promise.all([
      supabase.from('orders').select('*, products(name), profiles!orders_buyer_id_fkey(full_name, phone_number, username)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
      supabase.from('products').select('*, profiles!products_seller_id_fkey(full_name)'),
      supabase.from('categories').select('*').order('name'),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (usersRes.data) setUsers(usersRes.data);
    if (rolesRes.data) setUserRoles(rolesRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-eco-dark mb-8">Admin Panel</h1>
        <Tabs defaultValue="dashboard" className="glass-card-solid rounded-2xl p-6">
          <TabsList className="mb-6 flex-wrap h-auto gap-2">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" /> Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderOpen className="h-4 w-4" /> Categories
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <AdminDashboard orders={orders} users={users} products={products} />
          </TabsContent>
          
          <TabsContent value="orders">
            <AdminOrders orders={orders} onRefresh={fetchData} />
          </TabsContent>
          
          <TabsContent value="users">
            <AdminUsers users={users} userRoles={userRoles} onRefresh={fetchData} />
          </TabsContent>
          
          <TabsContent value="products">
            <AdminProducts products={products} categories={categories} onRefresh={fetchData} />
          </TabsContent>
          
          <TabsContent value="categories">
            <AdminCategories categories={categories} onRefresh={fetchData} />
          </TabsContent>
          
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
