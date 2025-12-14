import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Heart, Package, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 glass-card backdrop-blur-xl px-4 md:px-8 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl md:text-3xl font-bold text-primary">🌿 EcoMart</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Browse</Link>
          
          {user && (
            <>
              <Link to="/cart" className="nav-link flex items-center gap-1">
                <ShoppingCart className="w-5 h-5" />
                Cart
              </Link>
              <Link to="/orders" className="nav-link flex items-center gap-1">
                <Package className="w-5 h-5" />
                Orders
              </Link>
            </>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="nav-link p-2">
                  <User className="w-6 h-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 glass-card-solid">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                  <Heart className="w-4 h-4 mr-2" />
                  Wishlist
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/orders')}>
                  <Package className="w-4 h-4 mr-2" />
                  Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/sell')}>
                  <Package className="w-4 h-4 mr-2" />
                  Sell Items
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="eco-button text-sm py-2 px-6">
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden mt-4 pb-4 flex flex-col gap-4 animate-slide-up">
          <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/products" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Browse</Link>
          {user ? (
            <>
              <Link to="/cart" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Cart</Link>
              <Link to="/orders" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
              <Link to="/wishlist" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link>
              <Link to="/profile" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
              <Link to="/sell" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Sell Items</Link>
              {isAdmin && (
                <Link to="/admin" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Admin</Link>
              )}
              <button onClick={handleLogout} className="nav-link text-left">Logout</button>
            </>
          ) : (
            <Link to="/auth" className="eco-button text-center" onClick={() => setMobileMenuOpen(false)}>
              Login
            </Link>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;
