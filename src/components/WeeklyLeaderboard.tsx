import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  format,
  addWeeks,
  subWeeks,
  isSameWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeeklyCompetitor {
  id: string;
  name: string;
  score: number;
}

const fetchWeeklyLeaderboard = async (
  week: Date
): Promise<WeeklyCompetitor[]> => {
  const startDate = startOfWeek(week, { weekStartsOn: 1 }); // Semana começa na Segunda
  const endDate = endOfWeek(week, { weekStartsOn: 1 });

  const { data, error } = await supabase.rpc("get_weekly_leaderboard", {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });

  if (error) {
    console.error("Erro ao buscar ranking semanal:", error);
    throw new Error("Não foi possível carregar o ranking da semana.");
  }
  return data as WeeklyCompetitor[];
};

export const WeeklyLeaderboard = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const {
    data: competitors,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["weeklyLeaderboard", format(currentWeek, "yyyy-MM-dd")],
    queryFn: () => fetchWeeklyLeaderboard(currentWeek),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  const handlePreviousWeek = () => {
    setCurrentWeek((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek((prev) => addWeeks(prev, 1));
  };

  const isCurrentWeek = isSameWeek(currentWeek, new Date(), {
    weekStartsOn: 1,
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDisplay = `${format(weekStart, "dd/MM")} - ${format(
    weekEnd,
    "dd/MM/yyyy"
  )}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Desafio Semanal</CardTitle>
            <CardDescription>{weekDisplay}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextWeek}
              disabled={isCurrentWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
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
                <TableHead className="text-right">Pontos na Semana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors?.map((competitor, index) => (
                <TableRow key={competitor.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-center">
                      {index === 0 && competitor.score > 0 ? (
                        <Crown className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <span>{index + 1}º</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{competitor.name}</TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {competitor.score}
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