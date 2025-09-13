import { supabase } from "@/lib/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo de volta!</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="dark"
            localization={{
              variables: {
                sign_in: {
                  email_label: "Endereço de e-mail",
                  password_label: "Sua senha",
                  email_input_placeholder: "Seu endereço de e-mail",
                  password_input_placeholder: "Sua senha",
                  button_label: "Entrar",
                  social_provider_text: "Entrar com {{provider}}",
                  link_text: "Já tem uma conta? Entre",
                },
                sign_up: {
                  email_label: "Endereço de e-mail",
                  password_label: "Crie uma senha",
                  email_input_placeholder: "Seu endereço de e-mail",
                  password_input_placeholder: "Crie uma senha",
                  button_label: "Criar conta",
                  social_provider_text: "Cadastre-se com {{provider}}",
                  link_text: "Não tem uma conta? Cadastre-se",
                },
                forgotten_password: {
                  email_label: "Endereço de e-mail",
                  email_input_placeholder: "Seu endereço de e-mail",
                  button_label: "Enviar instruções",
                  link_text: "Esqueceu sua senha?",
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;