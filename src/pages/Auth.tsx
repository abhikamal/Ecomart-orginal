import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useAllowedDomain } from '@/hooks/useAllowedDomain';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import TermsDialog from '@/components/TermsDialog';

type AuthView = 'login' | 'signup' | 'forgot-password';

const Auth = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; terms?: string }>({});

  const { signIn, signUp } = useAuth();
  const { validateEmail, getDomainsText, loading: domainLoading } = useAllowedDomain();
  const { toast } = useToast();
  const navigate = useNavigate();

  const domainsText = getDomainsText();

  const emailSchema = z.string().email('Invalid email address').refine(
    (val) => validateEmail(val),
    domainsText ? `Only ${domainsText} emails allowed` : 'Invalid email domain'
  );

  const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(4, 'Password must be at least 4 characters'),
  });

  const signupSchema = loginSchema.extend({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  });

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      toast({
        title: 'Reset Link Sent',
        description: 'Check your email for the password reset link.',
      });
      setView('login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (view === 'login') {
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
      } else if (view === 'signup') {
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
            title: 'Verify Your Email',
            description: 'Please check your email and click the verification link to complete signup.',
          });
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

  const switchView = (newView: AuthView) => {
    setView(newView);
    setErrors({});
    setAcceptedTerms(false);
  };

  // Forgot Password View
  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="auth-container animate-scale-in">
          <button
            onClick={() => switchView('login')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
          
          <h2 className="text-2xl font-bold text-center text-primary mb-2">
            Forgot Password
          </h2>
          <p className="text-center text-muted-foreground text-sm mb-6">
            Enter your email and we'll send you a reset link
          </p>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder={domainsText ? `Enter College Email (${domainsText})` : 'Enter your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-white border-border"
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 eco-gradient-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="auth-container animate-scale-in">
        <h2 className="text-2xl font-bold text-center text-primary mb-6">
          {view === 'login' ? 'Login' : 'Sign Up'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'signup' && (
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
              placeholder={domainsText ? `Enter College Email (${domainsText})` : 'Enter your email'}
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

          {view === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => switchView('forgot-password')}
                className="text-sm text-secondary hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {view === 'signup' && (
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
            ) : view === 'login' ? (
              'Login'
            ) : (
              'Sign Up'
            )}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          {view === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => switchView(view === 'login' ? 'signup' : 'login')}
            className="text-secondary font-semibold hover:underline"
          >
            {view === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;