import { AuthForm } from '@/features/auth/components/AuthForm';

const Auth = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Logowanie do badania</h1>
          <p className="text-muted-foreground">
            Zaloguj się lub zarejestruj, aby wziąć udział w badaniu
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
};

export default Auth;