import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Trophy } from "lucide-react";
import { useEffect } from "react";

interface HallOfFameEntry {
  id: string;
  name: string;
  wins: number;
}

const fetchHallOfFame = async (): Promise<HallOfFameEntry[]> => {
  const { data, error } = await supabase.rpc("get_hall_of_fame");

  if (error) {
    console.error("Erro ao buscar Hall da Fama:", error);
    throw new Error("Não foi possível carregar o Hall da Fama.");
  }
  return data as HallOfFameEntry[];
};

export const HallOfFame = () => {
  const queryClient = useQueryClient();
  const {
    data: hallOfFame,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["hallOfFame"],
    queryFn: fetchHallOfFame,
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime-hall-of-fame')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proofs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['hallOfFame'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competitors' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['hallOfFame'] });
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
        <CardTitle>🏆 Hall da Fama 🏆</CardTitle>
        <CardDescription>As maiores campeãs de desafios semanais.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-2">
                <Skeleton className="h-8 w-8" />
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
                <TableHead className="text-right">Vitórias</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hallOfFame?.map((entry, index) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-center">
                      {index === 0 && entry.wins > 0 ? (
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <span>{index + 1}º</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{entry.name}</TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {entry.wins}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};