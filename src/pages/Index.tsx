import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
}

const Index = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (!error && data) {
        setCategories(data);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4 text-center">
        <div className="container mx-auto max-w-4xl animate-slide-up">
          <h1 className="text-3xl md:text-5xl font-bold text-eco-dark mb-4">
            Every Item Deserves a Second Chance
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            EcoMart is your campus-exclusive marketplace to buy, sell, or give away pre-loved items and promote sustainability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="eco-button">
              Buy Items
            </Link>
            {user ? (
              <Link to="/sell" className="eco-button-outline">
                Sell Items
              </Link>
            ) : (
              <Link to="/auth" className="eco-button-outline">
                Sell Items
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center text-eco-dark mb-8">
            Browse Categories
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="category-card animate-pulse">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4" />
                  <div className="h-4 bg-muted rounded w-20 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className="category-card animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img
                    src={category.icon_url || 'https://img.icons8.com/ios-filled/100/000000/box.png'}
                    alt={category.name}
                    className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4"
                  />
                  <h3 className="font-semibold text-eco-dark">{category.name}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="font-bold text-lg text-eco-dark mb-2">Sustainable</h3>
              <p className="text-muted-foreground text-sm">
                Give pre-loved items a new home and reduce waste on campus.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="font-bold text-lg text-eco-dark mb-2">Campus Exclusive</h3>
              <p className="text-muted-foreground text-sm">
                Trade safely within your college community.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-bold text-lg text-eco-dark mb-2">Save Money</h3>
              <p className="text-muted-foreground text-sm">
                Find great deals on books, gadgets, and more.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
