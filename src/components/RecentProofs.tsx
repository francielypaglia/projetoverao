import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { type Proof } from "@/lib/definitions";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProofForm } from "./ProofForm";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";

const PAGE_SIZE = 5;

const fetchRecentProofs = async (page: number) => {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("proofs")
    .select("*, notes, competitors(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error("Não foi possível carregar as provas recentes.");
  return { proofs: data as Proof[], count: count ?? 0 };
};

const formatBrasiliaTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
};

export const RecentProofs = () => {
  const [page, setPage] = useState(0);
  const [proofToDelete, setProofToDelete] = useState<Proof | null>(null);
  const [proofToEdit, setProofToEdit] = useState<Proof | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["recentProofs", page],
    queryFn: () => fetchRecentProofs(page),
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime-proofs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proofs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recentProofs'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (proof: Proof) => {
      if (proof.photo_url) {
        const photoPath = proof.photo_url.split("/").pop();
        if (photoPath) {
          await supabase.storage.from("proof_photos").remove([photoPath]);
        }
      }
      await supabase.from("proofs").delete().eq("id", proof.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentProofs"] });
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      showSuccess("Prova apagada com sucesso!");
      setProofToDelete(null);
    },
    onError: (error: Error) => showError(error.message),
    onMutate: () => showLoading("Apagando prova..."),
    onSettled: (_data, _error, _variables, context) => dismissToast(context as string),
  });

  const totalPages = data?.count ? Math.ceil(data.count / PAGE_SIZE) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Últimas Provas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4"><Skeleton className="h-16 w-16 rounded-md" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader><CardTitle>Últimas Provas</CardTitle></CardHeader>
        <CardContent><p className="text-destructive">{error.message}</p></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Últimas Provas Adicionadas</CardTitle></CardHeader>
        <CardContent>
          {data?.proofs && data.proofs.length > 0 ? (
            <ul className="space-y-4">
              {data.proofs.map((proof) => (
                <li key={proof.id} className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/50">
                  {proof.photo_url ? <img src={proof.photo_url} alt={proof.event_type} className="h-16 w-16 rounded-md object-cover" /> : <div className="h-16 w-16 rounded-md bg-secondary flex items-center justify-center text-muted-foreground"><span>Sem foto</span></div>}
                  <div className="flex-1">
                    <p className="font-semibold">{proof.event_type}</p>
                    <p className="text-sm text-muted-foreground">{proof.competitors.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBrasiliaTime(proof.created_at)}</p>
                    {proof.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{proof.notes}"</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={proof.points > 0 ? "default" : "destructive"}>{proof.points > 0 ? `+${proof.points}` : proof.points} pts</Badge>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => setProofToEdit(proof)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => setProofToDelete(proof)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma prova registrada ainda.</p>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex justify-between items-center">
            <Button onClick={() => setPage(p => p - 1)} disabled={page === 0}>Anterior</Button>
            <span className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</span>
            <Button onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}>Próximo</Button>
          </CardFooter>
        )}
      </Card>

      <AlertDialog open={!!proofToDelete} onOpenChange={(open) => !open && setProofToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja apagar esta prova? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => proofToDelete && deleteMutation.mutate(proofToDelete)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Apagando..." : "Apagar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!proofToEdit} onOpenChange={(open) => !open && setProofToEdit(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Editar Prova</DialogTitle></DialogHeader>
          <ProofForm proofToEdit={proofToEdit} onSuccess={() => setProofToEdit(null)} />
        </DialogContent>
      </Dialog>
    </>
  );
};