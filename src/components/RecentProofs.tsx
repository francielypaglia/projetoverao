import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { type Proof } from "@/lib/definitions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2 } from "lucide-react";

const fetchRecentProofs = async (): Promise<Proof[]> => {
  const { data, error } = await supabase
    .from("proofs")
    .select("*, competitors(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching recent proofs:", error);
    throw new Error("Não foi possível carregar as provas recentes.");
  }

  return data as Proof[];
};

export const RecentProofs = () => {
  const {
    data: proofs,
    isLoading,
    isError,
    error,
  } = useQuery<Proof[]>({
    queryKey: ["recentProofs"],
    queryFn: fetchRecentProofs,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Últimas Provas Adicionadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Últimas Provas Adicionadas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas Provas Adicionadas</CardTitle>
      </CardHeader>
      <CardContent>
        {proofs && proofs.length > 0 ? (
          <ul className="space-y-4">
            {proofs.map((proof) => (
              <li key={proof.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50">
                {proof.photo_url ? (
                  <img
                    src={proof.photo_url}
                    alt={proof.event_type}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-md bg-secondary flex items-center justify-center text-muted-foreground">
                    <span>Sem foto</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold">{proof.event_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {proof.competitors.name} -{" "}
                    <Badge variant={proof.points > 0 ? "default" : "destructive"}>
                      {proof.points > 0 ? `+${proof.points}` : proof.points} pts
                    </Badge>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" disabled>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" disabled>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma prova registrada ainda.
          </p>
        )}
      </CardContent>
    </Card>
  );
};