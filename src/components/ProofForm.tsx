import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { POINT_EVENTS, type Proof } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { useState, useEffect } from "react";

const formSchema = z.object({
  competitor_id: z.string().uuid("Selecione uma competidora."),
  category: z.enum(["GAIN", "LOSE"], {
    required_error: "Selecione uma categoria.",
  }),
  event: z.string({ required_error: "Selecione um tipo de pontuação." }),
  photo: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Competitor {
  id: string;
  name: string;
}

interface ProofFormProps {
  proofToEdit?: Proof | null;
  onSuccess?: () => void;
}

const fetchCompetitors = async (): Promise<Competitor[]> => {
  const { data, error } = await supabase.from("competitors").select("id, name");
  if (error) throw new Error("Não foi possível carregar as competidoras.");
  return data;
};

export const ProofForm = ({ proofToEdit, onSuccess }: ProofFormProps) => {
  const isEditMode = !!proofToEdit;
  const [selectedCategory, setSelectedCategory] = useState<"GAIN" | "LOSE">("GAIN");
  const queryClient = useQueryClient();

  const { data: competitors, isLoading: isLoadingCompetitors } = useQuery<Competitor[]>({
    queryKey: ["competitorsList"],
    queryFn: fetchCompetitors,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isEditMode && proofToEdit) {
      const eventCategory = proofToEdit.points > 0 ? "GAIN" : "LOSE";
      const eventValue = POINT_EVENTS[eventCategory].find(e => e.label === proofToEdit.event_type)?.value;
      
      form.reset({
        competitor_id: proofToEdit.competitor_id,
        category: eventCategory,
        event: eventValue,
      });
      setSelectedCategory(eventCategory);
    } else {
      form.reset({
        competitor_id: undefined,
        category: "GAIN",
        event: undefined,
        photo: undefined,
      });
      setSelectedCategory("GAIN");
    }
  }, [proofToEdit, isEditMode, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const eventData = POINT_EVENTS[values.category].find(
        (e) => e.value === values.event
      );
      if (!eventData) throw new Error("Evento inválido.");

      let photoUrl: string | null = proofToEdit?.photo_url || null;
      const photoFile = values.photo?.[0];

      if (photoFile) {
        const fileName = `${crypto.randomUUID()}-${photoFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("proof_photos")
          .upload(fileName, photoFile, { upsert: isEditMode });

        if (uploadError) throw new Error("Falha no upload da foto.");
        
        photoUrl = supabase.storage.from("proof_photos").getPublicUrl(uploadData.path).data.publicUrl;
      }

      const proofData = {
        competitor_id: values.competitor_id,
        event_type: eventData.label,
        points: eventData.points,
        photo_url: photoUrl,
      };

      if (isEditMode) {
        const { error } = await supabase.from("proofs").update(proofData).eq("id", proofToEdit.id);
        if (error) throw new Error("Falha ao atualizar a prova.");
      } else {
        const { error } = await supabase.from("proofs").insert(proofData);
        if (error) throw new Error("Falha ao registrar a prova.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      queryClient.invalidateQueries({ queryKey: ["recentProofs"] });
      showSuccess(isEditMode ? "Prova atualizada com sucesso!" : "Prova registrada com sucesso!");
      if (onSuccess) onSuccess();
      if (!isEditMode) {
        form.reset();
        form.setValue("category", "GAIN");
        setSelectedCategory("GAIN");
      }
    },
    onError: (error: Error) => showError(error.message),
    onMutate: () => showLoading(isEditMode ? "Atualizando prova..." : "Registrando prova..."),
    onSettled: (data, error, variables, context) => dismissToast(context as string),
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);
  const eventOptions = POINT_EVENTS[selectedCategory];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Editar Prova" : "Registrar Nova Prova"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="competitor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competidora</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCompetitors}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a competidora" /></SelectTrigger></FormControl>
                    <SelectContent>{competitors?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value: "GAIN" | "LOSE") => {
                        field.onChange(value);
                        setSelectedCategory(value);
                        form.setValue("event", "");
                      }}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="GAIN" /></FormControl><FormLabel className="font-normal">Ganhar Pontos</FormLabel></FormItem>
                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="LOSE" /></FormControl><FormLabel className="font-normal">Perder Pontos</FormLabel></FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="event"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Pontuação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                    <SelectContent>{eventOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label} ({opt.points} pts)</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto da Prova (Opcional)</FormLabel>
                  <FormControl><Input type="file" accept="image/*" {...form.register("photo")} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Salvando..." : (isEditMode ? "Salvar Alterações" : "Salvar Prova")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};