import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Package, Truck, Phone, MapPin, CheckCircle, Receipt, User } from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  status: OrderStatus;
  total_amount: number;
  tracking_number: string | null;
  created_at: string;
  shipping_address: string | null;
  payment_method: string | null;
  buyer_phone: string | null;
  receipt_number: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  executive_notes: string | null;
  products?: { name: string } | null;
  profiles?: { full_name: string; phone_number: string | null; username: string | null } | null;
}

interface AdminOrdersProps {
  orders: Order[];
  onRefresh: () => void;
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  shipped: 'bg-purple-100 text-purple-800 border-purple-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

const AdminOrders = ({ orders, onRefresh }: AdminOrdersProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [executiveNotes, setExecutiveNotes] = useState('');

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const updateData: any = { status };
    
    // If confirming, add confirmation details
    if (status === 'confirmed') {
      updateData.confirmed_by = user?.id;
      updateData.confirmed_at = new Date().toISOString();
    }

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Order status updated' });
      onRefresh();
    }
  };

  const updateTracking = async () => {
    if (!selectedOrder) return;
    
    const { error } = await supabase
      .from('orders')
      .update({ tracking_number: trackingNumber })
      .eq('id', selectedOrder.id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Tracking number updated' });
      setTrackingDialogOpen(false);
      setSelectedOrder(null);
      setTrackingNumber('');
      onRefresh();
    }
  };

  const confirmOrder = async () => {
    if (!selectedOrder) return;
    
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'confirmed',
        confirmed_by: user?.id,
        confirmed_at: new Date().toISOString(),
        executive_notes: executiveNotes || null
      })
      .eq('id', selectedOrder.id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Order confirmed successfully!' });
      setConfirmDialogOpen(false);
      setSelectedOrder(null);
      setExecutiveNotes('');
      onRefresh();
    }
  };

  const openTrackingDialog = (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || '');
    setTrackingDialogOpen(true);
  };

  const openConfirmDialog = (order: Order) => {
    setSelectedOrder(order);
    setExecutiveNotes(order.executive_notes || '');
    setConfirmDialogOpen(true);
  };

  const openDetailsDialog = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const getBuyerPhone = (order: Order) => {
    return order.buyer_phone || order.profiles?.phone_number || 'N/A';
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.products?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.profiles?.username?.toLowerCase().includes(search.toLowerCase()) ||
      o.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, receipt..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending Call</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending Orders Alert */}
      {filteredOrders.filter(o => o.status === 'pending').length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <Phone className="w-5 h-5" />
            <span className="font-medium">
              {filteredOrders.filter(o => o.status === 'pending').length} orders awaiting confirmation call
            </span>
          </div>
        </div>
      )}

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt #</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map(order => (
                <TableRow key={order.id} className={order.status === 'pending' ? 'bg-yellow-50/50' : ''}>
                  <TableCell className="font-mono text-xs">
                    {order.receipt_number || order.id.substring(0, 8)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="max-w-[150px] truncate">{order.products?.name || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <div className="text-sm">{order.profiles?.full_name || 'Unknown'}</div>
                        {order.profiles?.username && (
                          <div className="text-xs text-muted-foreground">@{order.profiles.username}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={`tel:${getBuyerPhone(order)}`}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {getBuyerPhone(order)}
                    </a>
                  </TableCell>
                  <TableCell className="font-semibold">₹{order.total_amount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {order.payment_method?.toUpperCase() || 'COD'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status]}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {order.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => openConfirmDialog(order)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirm
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openDetailsDialog(order)}
                      >
                        <Receipt className="h-3 w-3" />
                      </Button>
                      {order.status !== 'pending' && order.status !== 'cancelled' && (
                        <>
                          <Select
                            value={order.status}
                            onValueChange={(v: OrderStatus) => updateStatus(order.id, v)}
                          >
                            <SelectTrigger className="w-24 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" onClick={() => openTrackingDialog(order)}>
                            <Truck className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirm Order Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              Confirm Order via Call
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 pt-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buyer:</span>
                  <span className="font-medium">{selectedOrder.profiles?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <a href={`tel:${getBuyerPhone(selectedOrder)}`} className="font-medium text-primary">
                    {getBuyerPhone(selectedOrder)}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">{selectedOrder.products?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-primary">₹{selectedOrder.total_amount}</span>
                </div>
                {selectedOrder.shipping_address && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Delivery:
                    </span>
                    <p className="text-sm mt-1">{selectedOrder.shipping_address}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Call Notes (optional)</label>
                <Textarea
                  value={executiveNotes}
                  onChange={e => setExecutiveNotes(e.target.value)}
                  placeholder="Add any notes from the confirmation call..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => {
                  updateStatus(selectedOrder.id, 'cancelled');
                  setConfirmDialogOpen(false);
                }}>
                  Cancel Order
                </Button>
                <Button onClick={confirmOrder} className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Confirm Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Receipt #:</span>
                  <p className="font-mono">{selectedOrder.receipt_number || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Buyer:</span>
                  <p>{selectedOrder.profiles?.full_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Username:</span>
                  <p>@{selectedOrder.profiles?.username || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="text-primary">{getBuyerPhone(selectedOrder)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment:</span>
                  <p>{selectedOrder.payment_method?.toUpperCase() || 'COD'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={statusColors[selectedOrder.status]}>{selectedOrder.status}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-bold text-primary">₹{selectedOrder.total_amount}</p>
                </div>
              </div>
              
              {selectedOrder.shipping_address && (
                <div className="pt-4 border-t">
                  <span className="text-muted-foreground text-sm">Shipping Address:</span>
                  <p className="mt-1">{selectedOrder.shipping_address}</p>
                </div>
              )}
              
              {selectedOrder.tracking_number && (
                <div className="pt-4 border-t">
                  <span className="text-muted-foreground text-sm">Tracking:</span>
                  <p className="mt-1 font-mono">{selectedOrder.tracking_number}</p>
                </div>
              )}
              
              {selectedOrder.executive_notes && (
                <div className="pt-4 border-t">
                  <span className="text-muted-foreground text-sm">Executive Notes:</span>
                  <p className="mt-1 text-sm bg-muted/50 p-2 rounded">{selectedOrder.executive_notes}</p>
                </div>
              )}
              
              {selectedOrder.confirmed_at && (
                <div className="pt-4 border-t text-sm text-muted-foreground">
                  Confirmed on {new Date(selectedOrder.confirmed_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tracking Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Tracking Number</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Tracking Number</label>
              <Input
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setTrackingDialogOpen(false)}>Cancel</Button>
              <Button onClick={updateTracking} className="eco-gradient-primary text-white">
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
