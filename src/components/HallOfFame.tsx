import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown } from "lucide-react";
import { useEffect } from "react";

interface Champion {
  id: string;
  name: string;
  wins: number;
}

const fetchHallOfFame = async (): Promise<Champion[]> => {
  const { data, error } = await supabase.rpc("get_hall_of_fame");

  if (error) {
    console.error("Erro ao buscar Hall da Fama:", error);
    throw new Error("Não foi possível carregar o Hall da Fama.");
  }
  return data as Champion[];
};

export const HallOfFame = () => {
  const queryClient = useQueryClient();
  const {
    data: champions,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["hallOfFame"],
    queryFn: fetchHallOfFame,
  });

  useEffect(() => {
    const channel = supabase
      .channel("realtime-hall-of-fame")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "proofs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["hallOfFame"] });
          queryClient.invalidateQueries({ queryKey: ["weeklyLeaderboard"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hall da Fama</CardTitle>
        <CardDescription>Total de vitórias semanais</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-6 w-1/4" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="text-destructive text-center">{error.message}</p>
        ) : (
          <ul className="space-y-3">
            {champions?.map((champion) => (
              <li
                key={champion.id}
                className="flex items-center justify-between"
              >
                <span className="font-medium">{champion.name}</span>
                <div className="flex items-center gap-1">
                  {champion.wins > 0 ? (
                    Array.from({ length: champion.wins }).map((_, i) => (
                      <Crown key={i} className="h-5 w-5 text-yellow-500" />
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Nenhuma vitória
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};