import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_free: boolean;
  seller_id: string;
  categories: { name: string } | null;
  profiles: { full_name: string; email: string } | null;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (name)
      `)
      .eq('id', id)
      .single();

    if (!error && data) {
      // Fetch seller profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', data.seller_id)
        .single();

      setProduct({
        ...data,
        profiles: profile
      } as unknown as Product);
    }
    setLoading(false);
  };

  const addToCart = async () => {
    if (!user) {
      toast({
        title: 'Please login',
        description: 'You need to login to add items to cart.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    const { error } = await supabase.from('cart_items').upsert({
      user_id: user.id,
      product_id: product!.id,
      quantity: 1,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add to cart.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Added to Cart!',
        description: 'Item has been added to your cart.',
      });
    }
  };

  const addToWishlist = async () => {
    if (!user) {
      toast({
        title: 'Please login',
        description: 'You need to login to add items to wishlist.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    const { error } = await supabase.from('wishlist').upsert({
      user_id: user.id,
      product_id: product!.id,
    });

    if (!error) {
      toast({
        title: 'Added to Wishlist!',
        description: 'Item has been added to your wishlist.',
      });
    }
  };

  const handleBuy = async () => {
    if (!user) {
      toast({
        title: 'Please login',
        description: 'You need to login to purchase.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    try {
      // Use server-side validated order creation
      const { data, error } = await supabase.functions.invoke('validate-order', {
        body: {
          product_id: product!.id,
          quantity: 1
        }
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create order.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Order Created!',
        description: 'Your order has been placed successfully.',
      });
      navigate('/orders');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  const contactSeller = () => {
    if (product?.profiles?.email) {
      window.location.href = `mailto:${product.profiles.email}?subject=Inquiry about ${product.name}`;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <div className="glass-card-solid rounded-2xl p-8 animate-pulse">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-xl" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/4" />
                <div className="h-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4 text-center">
          <p className="text-muted-foreground text-lg">Product not found.</p>
          <Button onClick={() => navigate('/products')} className="mt-4">
            Back to Products
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-eco-dark hover:text-primary"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        <div className="glass-card-solid rounded-2xl p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="aspect-square bg-muted rounded-xl overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image Available
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {product.categories?.name || 'Uncategorized'}
                </p>
                <h1 className="text-3xl font-bold text-eco-dark mb-4">
                  {product.name}
                </h1>
                <p className="text-3xl font-bold text-primary">
                  {product.is_free ? 'FREE' : `₹${product.price}`}
                </p>
              </div>

              {product.description && (
                <div>
                  <h3 className="font-semibold text-eco-dark mb-2">Description</h3>
                  <p className="text-muted-foreground">{product.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-eco-dark mb-2">Seller</h3>
                <p className="text-muted-foreground">
                  {product.profiles?.full_name || 'Unknown Seller'}
                </p>
              </div>

              {user?.id !== product.seller_id && (
                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleBuy}
                    className="w-full h-12 eco-gradient-primary text-white text-lg"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Buy Now
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={addToCart}
                      variant="outline"
                      className="flex-1 h-12 border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      Add to Cart
                    </Button>
                    <Button
                      onClick={addToWishlist}
                      variant="outline"
                      className="h-12 border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button
                    onClick={contactSeller}
                    variant="outline"
                    className="w-full h-12"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Contact Seller
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
