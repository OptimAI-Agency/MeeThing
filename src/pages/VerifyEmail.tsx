import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/hooks/useBackground';
import { Mail } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [cooldown, setCooldown] = useState<number>(0);
  const { toast } = useToast();
  const { backgroundUrl } = useBackground();

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox.',
      });
      setCooldown(60);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      toast({
        variant: 'destructive',
        title: 'Could not resend',
        description: message,
      });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${backgroundUrl}')` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 sm:space-y-6">
          <Mail className="w-12 h-12 text-primary mx-auto" />

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">
            Check your email
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground text-center">
            {email ? (
              <>
                We've sent a verification link to{' '}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link in the email to activate your account.
              </>
            ) : (
              "We've sent a verification link to your email address."
            )}
          </p>

          <Button
            variant="outline"
            className="w-full rounded-2xl h-11 sm:h-12"
            onClick={handleResend}
            disabled={cooldown > 0 || !email}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
          </Button>

          <div className="text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
