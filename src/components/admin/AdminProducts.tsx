import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ImageUpload from '@/components/ImageUpload';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean | null;
  is_free: boolean | null;
  category_id: string | null;
  seller_id: string;
  profiles?: { full_name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface AdminProductsProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
}

const AdminProducts = ({ products, categories, onRefresh }: AdminProductsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    category_id: '',
    is_available: true,
    is_free: false,
  });

  const resetForm = () => {
    setForm({ name: '', description: '', price: 0, image_url: '', category_id: '', is_available: true, is_free: false });
    setEditingId(null);
    setOpen(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || null,
      price: form.price,
      image_url: form.image_url || null,
      category_id: form.category_id || null,
      is_available: form.is_available,
      is_free: form.is_free,
    };

    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Product updated' });
        resetForm();
        onRefresh();
      }
    } else {
      const { error } = await supabase.from('products').insert({ ...payload, seller_id: user?.id });
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Product created' });
        resetForm();
        onRefresh();
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      image_url: product.image_url || '',
      category_id: product.category_id || '',
      is_available: product.is_available ?? true,
      is_free: product.is_free ?? false,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Product deleted' });
      onRefresh();
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="eco-gradient-primary text-white" onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Price (₹)</label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Product Image</label>
                <ImageUpload
                  onImageUploaded={(url) => setForm({ ...form, image_url: url })}
                  currentImageUrl={form.image_url}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Available</label>
                <Switch checked={form.is_available} onCheckedChange={v => setForm({ ...form, is_available: v })} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Free</label>
                <Switch checked={form.is_free} onCheckedChange={v => setForm({ ...form, is_free: v })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSave} className="eco-gradient-primary text-white">
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.profiles?.full_name || 'Unknown'}</TableCell>
                  <TableCell>{product.is_free ? 'Free' : `₹${product.price}`}</TableCell>
                  <TableCell>
                    <span className={`text-sm ${product.is_available ? 'text-primary' : 'text-destructive'}`}>
                      {product.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminProducts;
