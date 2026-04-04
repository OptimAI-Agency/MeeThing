import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/hooks/useBackground';
import { resetPasswordSchema } from '@/lib/auth-schemas';
import { KeyRound } from 'lucide-react';

const ResetPassword = () => {
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const recoveryDetectedRef = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { backgroundUrl } = useBackground();

  useEffect(() => {
    // Check URL hash for recovery token (supabase-js auto-parses this)
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      recoveryDetectedRef.current = true;
      setIsRecoveryMode(true);
    }

    // Also listen for PASSWORD_RECOVERY event from supabase-js
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryDetectedRef.current = true;
        setIsRecoveryMode(true);
      }
    });

    // If neither detection fires after 2s, redirect to forgot-password
    const timeout = setTimeout(() => {
      if (!recoveryDetectedRef.current) {
        navigate('/forgot-password');
      }
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: firstError.message,
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const isExpired = /expired|invalid/i.test(error.message);
        toast({
          variant: "destructive",
          title: isExpired ? "Link Expired" : "Error",
          description: isExpired
            ? "This reset link has expired. Please request a new one."
            : error.message,
        });
        return;
      }

      toast({
        title: "Password updated",
        description: "Sign in with your new password.",
      });
      navigate('/login');
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
          {!isRecoveryMode ? (
            <div className="text-center space-y-4 py-8">
              <p className="text-muted-foreground">Verifying your reset link...</p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <KeyRound className="w-12 h-12 text-primary mx-auto" />
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Set a new password</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Choose a strong password for your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm sm:text-base">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-2xl h-11 sm:h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="rounded-2xl h-11 sm:h-12"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  At least 8 characters with uppercase, lowercase, and a number
                </p>

                <Button
                  type="submit"
                  className="w-full rounded-2xl h-11 sm:h-12"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update password"}
                </Button>
              </form>

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

export default ResetPassword;
