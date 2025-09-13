import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/utils/toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "./ui/skeleton";

const authSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  competitorId: z.string().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

interface Competitor {
  id: string;
  name: string;
}

const fetchAvailableCompetitors = async (): Promise<Competitor[]> => {
  const { data, error } = await supabase
    .from("competitors")
    .select("id, name")
    .is("user_id", null);

  if (error) {
    throw new Error("Não foi possível carregar as competidoras disponíveis.");
  }
  return data;
};

export const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const { data: availableCompetitors, isLoading: isLoadingCompetitors } = useQuery({
    queryKey: ["availableCompetitors"],
    queryFn: fetchAvailableCompetitors,
    enabled: isSignUp,
  });

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      competitorId: undefined,
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
              competitor_id: values.competitorId,
            },
          },
        });
        if (error) throw error;
        return "Conta criada! Por favor, verifique seu e-mail para confirmar.";
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
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
    let hasError = false;
    if (isSignUp) {
      if (!values.firstName) {
        form.setError("firstName", { type: "manual", message: "Nome é obrigatório." });
        hasError = true;
      }
      if (!values.lastName) {
        form.setError("lastName", { type: "manual", message: "Sobrenome é obrigatório." });
        hasError = true;
      }
      if (!values.competitorId) {
        form.setError("competitorId", { type: "manual", message: "Selecione a competidora." });
        hasError = true;
      }
    }
    if (hasError) return;
    authMutation.mutate(values);
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {isSignUp && (
            <>
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
              <FormField
                control={form.control}
                name="competitorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eu sou a</FormLabel>
                    {isLoadingCompetitors ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a competidora" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCompetitors?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
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
      <Button variant="link" className="w-full" onClick={() => {
        setIsSignUp(!isSignUp);
        form.reset();
      }}>
        {isSignUp ? "Já tem uma conta? Entre" : "Não tem uma conta? Crie uma"}
      </Button>
    </div>
  );
};