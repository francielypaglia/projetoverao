import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";

const formSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
});

type FormValues = z.infer<typeof formSchema>;

interface Competitor {
  id: string;
  name: string;
}

interface CompetitorFormProps {
  competitorToEdit?: Competitor | null;
  onSuccess?: () => void;
}

export const CompetitorForm = ({ competitorToEdit, onSuccess }: CompetitorFormProps) => {
  const isEditMode = !!competitorToEdit;
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: competitorToEdit?.name || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditMode) {
        const { error } = await supabase
          .from("competitors")
          .update({ name: values.name })
          .eq("id", competitorToEdit.id);
        if (error) throw new Error("Falha ao atualizar o competidor.");
      } else {
        const { error } = await supabase.from("competitors").insert({ name: values.name });
        if (error) throw new Error("Falha ao adicionar o competidor.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      queryClient.invalidateQueries({ queryKey: ["competitorsList"] });
      showSuccess(isEditMode ? "Competidor atualizado!" : "Competidor adicionado!");
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => showError(error.message),
    onMutate: () => showLoading(isEditMode ? "Atualizando..." : "Adicionando..."),
    onSettled: (data, error, variables, context) => dismissToast(context as string),
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Competidor</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Salvando..." : (isEditMode ? "Salvar Alterações" : "Adicionar Competidor")}
        </Button>
      </form>
    </Form>
  );
};