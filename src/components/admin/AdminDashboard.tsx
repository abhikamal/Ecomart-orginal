import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, Users, ShoppingCart, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardProps {
  orders: any[];
  users: any[];
  products: any[];
}

const COLORS = ['hsl(145, 63%, 49%)', 'hsl(168, 73%, 37%)', 'hsl(45, 93%, 47%)', 'hsl(200, 74%, 46%)', 'hsl(0, 84%, 60%)'];

const AdminDashboard = ({ orders, users, products }: DashboardProps) => {
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const bannedUsers = users.filter(u => u.is_banned).length;
    
    return { totalRevenue, pendingOrders, deliveredOrders, bannedUsers };
  }, [orders, users]);

  const ordersByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const recentOrdersChart = useMemo(() => {
    const last7Days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      last7Days[date.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
    }
    orders.forEach(o => {
      const date = new Date(o.created_at);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      if (last7Days[dayName] !== undefined) last7Days[dayName]++;
    });
    return Object.entries(last7Days).map(([name, orders]) => ({ name, orders }));
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-10 w-10 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-secondary">{orders.length}</p>
              </div>
              <ShoppingCart className="h-10 w-10 text-secondary/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-accent">{users.filter(u => !u.is_banned).length}</p>
              </div>
              <Users className="h-10 w-10 text-accent/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-destructive">{stats.pendingOrders}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Orders This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={recentOrdersChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="hsl(145, 63%, 49%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Orders by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {ordersByStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-secondary mb-2" />
              <p className="text-2xl font-bold">{stats.deliveredOrders}</p>
              <p className="text-sm text-muted-foreground">Delivered Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto text-destructive mb-2" />
              <p className="text-2xl font-bold">{stats.bannedUsers}</p>
              <p className="text-sm text-muted-foreground">Banned Users</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
