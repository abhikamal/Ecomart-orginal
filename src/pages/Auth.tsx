import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useAllowedDomain } from '@/hooks/useAllowedDomain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import TermsDialog from '@/components/TermsDialog';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; terms?: string }>({});

  const { signIn, signUp } = useAuth();
  const { allowedDomain } = useAllowedDomain();
  const { toast } = useToast();
  const navigate = useNavigate();

  const loginSchema = z.object({
    email: z.string().email('Invalid email address').refine(
      (val) => val.endsWith(`@${allowedDomain}`),
      `Only @${allowedDomain} emails allowed`
    ),
    password: z.string().min(4, 'Password must be at least 4 characters'),
  });

  const signupSchema = loginSchema.extend({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: { email?: string; password?: string } = {};
          result.error.errors.forEach(err => {
            if (err.path[0] === 'email') fieldErrors.email = err.message;
            if (err.path[0] === 'password') fieldErrors.password = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login Failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
          navigate('/');
        }
      } else {
        // Check terms acceptance first
        if (!acceptedTerms) {
          setErrors({ terms: 'You must accept the Terms and Conditions' });
          setLoading(false);
          return;
        }

        const result = signupSchema.safeParse({ email, password, fullName });
        if (!result.success) {
          const fieldErrors: { email?: string; password?: string; fullName?: string } = {};
          result.error.errors.forEach(err => {
            if (err.path[0] === 'email') fieldErrors.email = err.message;
            if (err.path[0] === 'password') fieldErrors.password = err.message;
            if (err.path[0] === 'fullName') fieldErrors.fullName = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account Exists',
              description: 'This email is already registered. Please login instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Signup Failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account Created!',
            description: 'Welcome to EcoMart! You are now logged in.',
          });
          navigate('/');
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="auth-container animate-scale-in">
        <h2 className="text-2xl font-bold text-center text-primary mb-6">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Input
                type="text"
                placeholder="Enter Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-12 bg-white border-border"
              />
              {errors.fullName && (
                <p className="text-destructive text-sm mt-1">{errors.fullName}</p>
              )}
            </div>
          )}

          <div>
            <Input
              type="email"
              placeholder={`Enter College Email (@${allowedDomain})`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 bg-white border-border"
            />
            {errors.email && (
              <p className="text-destructive text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 bg-white border-border pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            {errors.password && (
              <p className="text-destructive text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                  I agree to the{' '}
                  <TermsDialog>
                    <button type="button" className="text-primary font-semibold hover:underline">
                      Terms and Conditions
                    </button>
                  </TermsDialog>
                </label>
              </div>
              {errors.terms && (
                <p className="text-destructive text-sm">{errors.terms}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 eco-gradient-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLogin ? (
              'Login'
            ) : (
              'Sign Up'
            )}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
              setAcceptedTerms(false);
            }}
            className="text-secondary font-semibold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
