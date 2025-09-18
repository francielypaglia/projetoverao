import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, ArrowUp, ArrowDown } from "lucide-react";
import { useEffect } from "react";

interface Competitor {
  id: string;
  name: string;
  score: number;
}

const fetchCompetitors = async (): Promise<Competitor[]> => {
  const { data, error } = await supabase
    .from("competitors")
    .select("id, name, score")
    .order("score", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar o ranking.");
  }
  return data;
};

export const Leaderboard = () => {
  const queryClient = useQueryClient();
  const { data: competitors, isLoading, isError, error } = useQuery({
    queryKey: ["competitors"],
    queryFn: fetchCompetitors,
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime-competitors')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competitors' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['competitors'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);


  const getRankIndicator = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <span className="text-gray-400 font-bold">2º</span>;
    if (index === 2) return <span className="text-yellow-700 font-bold">3º</span>;
    return <span className="text-muted-foreground">{index + 1}º</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking Verão Fitness</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-6 flex-1" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="text-destructive text-center">{error.message}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>Competidora</TableHead>
                <TableHead className="text-right">Pontuação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors?.map((competitor, index) => (
                <TableRow key={competitor.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-center">
                      {getRankIndicator(index)}
                    </div>
                  </TableCell>
                  <TableCell>{competitor.name}</TableCell>
                  <TableCell className="text-right font-bold text-lg">{competitor.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};