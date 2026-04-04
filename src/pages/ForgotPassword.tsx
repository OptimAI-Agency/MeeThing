import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/hooks/useBackground';
import { Mail } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { backgroundUrl } = useBackground();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        return;
      }

      setSubmitted(true);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${backgroundUrl}')` }}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 sm:space-y-6">
          {!submitted ? (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reset your password</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-2xl h-11 sm:h-12"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-2xl h-11 sm:h-12"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>

              <div className="text-center text-sm">
                <Link to="/login" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-4">
                <Mail className="w-12 h-12 text-primary mx-auto" />
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Check your email</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  If an account exists for{' '}
                  <span className="font-medium text-foreground">{email}</span>
                  , we've sent a password reset link. Check your inbox and spam folder.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-2xl h-11 sm:h-12"
                onClick={() => setSubmitted(false)}
              >
                Try a different email
              </Button>

              <div className="text-center text-sm">
                <Link to="/login" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
