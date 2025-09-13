import { AuthForm } from "@/components/AuthForm";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";

const Login = () => {
  const logoUrl = "https://barvwsrvajuskejieyaj.supabase.co/storage/v1/object/public/proof_photos/story%20(3).png";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <img src={logoUrl} alt="Verão Fitness Logo" className="w-48 mx-auto" />
          <CardDescription>Acesse sua conta ou crie uma nova para começar</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;