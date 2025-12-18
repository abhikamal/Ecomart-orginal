import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Receipt, Phone, MapPin, Clock, CheckCircle, XCircle, Truck, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  tracking_number: string | null;
  shipping_address: string | null;
  payment_method: string | null;
  buyer_phone: string | null;
  receipt_number: string | null;
  confirmed_at: string | null;
  products: { name: string; image_url: string | null; description: string | null } | null;
}

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, products(name, image_url, description)')
      .eq('buyer_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setOrders(data as unknown as Order[]);
    setLoading(false);
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="w-4 h-4" />, label: 'Awaiting Confirmation' },
      confirmed: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <CheckCircle className="w-4 h-4" />, label: 'Confirmed' },
      shipped: { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: <Truck className="w-4 h-4" />, label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle className="w-4 h-4" />, label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-300', icon: <XCircle className="w-4 h-4" />, label: 'Cancelled' },
    };
    return statusMap[status] || statusMap.pending;
  };

  const openReceipt = (order: Order) => {
    setSelectedOrder(order);
    setReceiptOpen(true);
  };

  const printReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${selectedOrder?.receipt_number}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 15px; }
                .logo { font-size: 24px; font-weight: bold; color: #16a34a; }
                .receipt-no { font-size: 12px; color: #666; }
                .section { margin: 15px 0; }
                .row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 14px; }
                .total { border-top: 1px solid #ccc; padding-top: 10px; font-weight: bold; font-size: 16px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; border-top: 2px dashed #ccc; padding-top: 10px; }
                .status { padding: 4px 8px; background: #e5e7eb; border-radius: 4px; font-size: 12px; }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-eco-dark mb-8">Your Orders</h1>
        {loading ? <p>Loading...</p> : orders.length === 0 ? (
          <div className="text-center py-12 glass-card-solid rounded-2xl">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders yet</p>
            <Button onClick={() => navigate('/products')} className="mt-4 eco-gradient-primary text-white">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div key={order.id} className="glass-card-solid rounded-xl p-4 border border-border/50">
                  <div className="flex gap-4 items-start">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {order.products?.image_url && <img src={order.products.image_url} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-eco-dark truncate">{order.products?.name || 'Product'}</h3>
                        <Badge className={`${statusInfo.color} flex items-center gap-1 flex-shrink-0`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-primary font-bold text-lg">₹{order.total_amount}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        {order.payment_method && (
                          <span className="bg-accent px-2 py-0.5 rounded">
                            {order.payment_method.toUpperCase()}
                          </span>
                        )}
                        {order.receipt_number && (
                          <span className="text-primary">#{order.receipt_number}</span>
                        )}
                      </div>
                      {order.tracking_number && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          Tracking: {order.tracking_number}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Order Info Footer */}
                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {order.status === 'pending' && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Awaiting executive call for confirmation
                        </span>
                      )}
                      {order.confirmed_at && (
                        <span>Confirmed on {new Date(order.confirmed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openReceipt(order)}
                      className="flex items-center gap-1"
                    >
                      <Receipt className="w-4 h-4" />
                      View Receipt
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Order Receipt
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div>
              <div ref={receiptRef} className="bg-white p-4 rounded-lg">
                <div className="header text-center border-b-2 border-dashed border-border pb-3 mb-4">
                  <div className="logo text-2xl font-bold text-primary">EcoMart</div>
                  <div className="text-xs text-muted-foreground">Campus Marketplace</div>
                  <div className="receipt-no mt-2 text-sm font-medium">{selectedOrder.receipt_number}</div>
                </div>

                <div className="section space-y-2">
                  <div className="row flex justify-between text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                  </div>
                  <div className="row flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="status bg-accent px-2 py-0.5 rounded text-xs">
                      {getStatusInfo(selectedOrder.status).label}
                    </span>
                  </div>
                  <div className="row flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment:</span>
                    <span>{selectedOrder.payment_method?.toUpperCase() || 'COD'}</span>
                  </div>
                </div>

                <div className="section border-t border-border pt-3 mt-3">
                  <div className="font-medium mb-2">Item</div>
                  <div className="text-sm">
                    <div>{selectedOrder.products?.name}</div>
                  </div>
                </div>

                <div className="total border-t border-border pt-3 mt-3 flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span className="text-primary">₹{selectedOrder.total_amount}</span>
                </div>

                {selectedOrder.shipping_address && (
                  <div className="section border-t border-border pt-3 mt-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <MapPin className="w-3 h-3" />
                      Delivery Address:
                    </div>
                    <div className="text-sm">{selectedOrder.shipping_address}</div>
                  </div>
                )}

                <div className="footer text-center mt-4 pt-3 border-t-2 border-dashed border-border text-xs text-muted-foreground">
                  <p>Thank you for shopping with EcoMart!</p>
                  <p className="mt-1">Questions? Contact us through the app.</p>
                </div>
              </div>

              <Button onClick={printReceipt} className="w-full mt-4 eco-gradient-primary text-white">
                <Download className="w-4 h-4 mr-2" />
                Download / Print Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Orders;
