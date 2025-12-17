import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import MultiImageUpload from '@/components/MultiImageUpload';

const Sell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    categoryId: '', 
    isFree: false, 
    images: [] as string[] 
  });

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    supabase.from('categories').select('*').then(({ data }) => data && setCategories(data));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.categoryId) { 
      toast({ title: 'Please fill required fields', variant: 'destructive' }); 
      return; 
    }
    
    setLoading(true);
    
    try {
      // Create product with first image as main
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          seller_id: user!.id,
          name: form.name,
          description: form.description,
          price: form.isFree ? 0 : parseFloat(form.price) || 0,
          category_id: form.categoryId,
          is_free: form.isFree,
          image_url: form.images[0] || null,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Insert additional images to product_images table
      if (form.images.length > 0) {
        const imageRecords = form.images.map((url, index) => ({
          product_id: product.id,
          image_url: url,
          display_order: index,
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (imagesError) {
          console.error('Error saving images:', imagesError);
        }
      }

      toast({ title: 'Product listed!' });
      navigate('/products');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-lg">
        <h1 className="text-3xl font-bold text-eco-dark mb-8">Sell an Item</h1>
        <form onSubmit={handleSubmit} className="glass-card-solid rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Item Name *</label>
            <Input 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              className="mt-1" 
              placeholder="e.g., Engineering Mathematics Textbook, HP Laptop, Study Table"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Category *</label>
            <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a category for your item" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Price (₹)</label>
            <Input 
              type="number" 
              value={form.price} 
              onChange={e => setForm({ ...form, price: e.target.value })} 
              disabled={form.isFree} 
              className="mt-1" 
              placeholder="e.g., 250, 500, 1500"
            />
            <label className="flex items-center gap-2 mt-2 text-sm">
              <input type="checkbox" checked={form.isFree} onChange={e => setForm({ ...form, isFree: e.target.checked })} />
              Give away for free
            </label>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} 
              className="mt-1 min-h-[120px]" 
              placeholder="Describe your item in detail. Include:&#10;• Condition (new, like new, good, fair)&#10;• Age or purchase date&#10;• Any defects or issues&#10;• Reason for selling&#10;&#10;Example: Selling my 2nd year Engineering Mathematics textbook by BS Grewal. Used for one semester, in good condition with some highlighting. No torn pages. Selling because I completed the course."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Product Images</label>
            <MultiImageUpload 
              onImagesChange={(urls) => setForm({ ...form, images: urls })} 
              currentImages={form.images}
              maxImages={5}
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 eco-gradient-primary text-white">
            {loading ? <Loader2 className="animate-spin" /> : 'List Item'}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default Sell;