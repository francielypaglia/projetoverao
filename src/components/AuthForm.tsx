import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/utils/toast";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const authSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const authMutation = useMutation({
    mutationFn: async (values: AuthFormValues) => {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              first_name: values.firstName,
              last_name: values.lastName,
            },
          },
        });
        if (error) throw error;
        return "Conta criada! Por favor, verifique seu e-mail para confirmar.";
      } else {
        const { error } = await supabase.auth.signInWithPassword(values);
        if (error) throw error;
        return "Login realizado com sucesso!";
      }
    },
    onSuccess: (message) => {
      showSuccess(message);
      form.reset();
    },
    onError: (error: Error) => {
      if (error.message.includes("User already registered")) {
        showError("Este e-mail já está cadastrado. Tente fazer login.");
      } else {
        showError(error.message || "Ocorreu um erro.");
      }
    },
  });

  const onSubmit = (values: AuthFormValues) => {
    if (isSignUp && (!values.firstName || !values.lastName)) {
      form.setError("firstName", { type: "manual", message: "Nome e sobrenome são obrigatórios." });
      return;
    }
    authMutation.mutate(values);
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <Label>Nome</Label>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <Label>Sobrenome</Label>
                    <FormControl>
                      <Input placeholder="Seu sobrenome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <Label>Email</Label>
                <FormControl>
                  <Input type="email" placeholder="seu@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <Label>Senha</Label>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={authMutation.isPending}>
            {authMutation.isPending ? "Processando..." : (isSignUp ? "Criar Conta" : "Entrar")}
          </Button>
        </form>
      </Form>
      <Button variant="link" className="w-full" onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? "Já tem uma conta? Entre" : "Não tem uma conta? Crie uma"}
      </Button>
    </div>
  );
};