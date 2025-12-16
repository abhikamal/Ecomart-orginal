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
import ImageUpload from '@/components/ImageUpload';

const Sell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', categoryId: '', isFree: false, imageUrl: '' });

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    supabase.from('categories').select('*').then(({ data }) => data && setCategories(data));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.categoryId) { toast({ title: 'Please fill required fields', variant: 'destructive' }); return; }
    setLoading(true);
    const { error } = await supabase.from('products').insert({
      seller_id: user!.id,
      name: form.name,
      description: form.description,
      price: form.isFree ? 0 : parseFloat(form.price) || 0,
      category_id: form.categoryId,
      is_free: form.isFree,
      image_url: form.imageUrl || null,
    });
    setLoading(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Product listed!' }); navigate('/products'); }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-lg">
        <h1 className="text-3xl font-bold text-eco-dark mb-8">Sell an Item</h1>
        <form onSubmit={handleSubmit} className="glass-card-solid rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Item Name *</label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Category *</label>
            <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Price (₹)</label>
            <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} disabled={form.isFree} className="mt-1" />
            <label className="flex items-center gap-2 mt-2 text-sm">
              <input type="checkbox" checked={form.isFree} onChange={e => setForm({ ...form, isFree: e.target.checked })} />
              Give away for free
            </label>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Product Image</label>
            <ImageUpload 
              onImageUploaded={(url) => setForm({ ...form, imageUrl: url })} 
              currentImageUrl={form.imageUrl}
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
