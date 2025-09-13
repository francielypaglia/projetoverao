import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CompetitorForm } from "./CompetitorForm";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";

interface Competitor {
  id: string;
  name: string;
}

const fetchCompetitors = async (): Promise<Competitor[]> => {
  const { data, error } = await supabase.from("competitors").select("id, name").order("name");
  if (error) throw new Error("Não foi possível carregar os competidores.");
  return data;
};

export const CompetitorManager = () => {
  const [isAddOpen, setAddOpen] = useState(false);
  const [competitorToEdit, setCompetitorToEdit] = useState<Competitor | null>(null);
  const [competitorToDelete, setCompetitorToDelete] = useState<Competitor | null>(null);
  const queryClient = useQueryClient();

  const { data: competitors, isLoading } = useQuery<Competitor[]>({
    queryKey: ["competitorsList"],
    queryFn: fetchCompetitors,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competitors").delete().eq("id", id);
      if (error) throw new Error("Falha ao remover o competidor.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitorsList"] });
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      showSuccess("Competidor removido!");
      setCompetitorToDelete(null);
    },
    onError: (error: Error) => showError(error.message),
    onMutate: () => showLoading("Removendo..."),
    onSettled: (data, error, variables, context) => dismissToast(context as string),
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciar Competidores</CardTitle>
          <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Novo Competidor</DialogTitle></DialogHeader>
              <CompetitorForm onSuccess={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <ul className="space-y-2">
              {competitors?.map((c) => (
                <li key={c.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <span>{c.name}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setCompetitorToEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setCompetitorToDelete(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!competitorToEdit} onOpenChange={(open) => !open && setCompetitorToEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Competidor</DialogTitle></DialogHeader>
          <CompetitorForm competitorToEdit={competitorToEdit} onSuccess={() => setCompetitorToEdit(null)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!competitorToDelete} onOpenChange={(open) => !open && setCompetitorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja remover "{competitorToDelete?.name}"? Todas as provas associadas também serão removidas. Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => competitorToDelete && deleteMutation.mutate(competitorToDelete.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};