import { AuthForm } from '@/features/auth/components/AuthForm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

const Auth = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Logowanie do badania</h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
            <p>Zaloguj się lub zarejestruj, aby wziąć udział w badaniu</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-primary" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>Możesz wybrać rolę "Client" (będziesz symulować anulowanie polisy) lub "Administrator" (będziesz zarządzać procesami retencji). Większość uczestników powinna wybrać rolę "Client".</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <AuthForm />
      </div>
    </div>
  );
};

export default Auth;