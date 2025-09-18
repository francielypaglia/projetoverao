import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DayContent, DayContentProps } from "react-day-picker";
import { cn } from "@/lib/utils";

// Definição dos critérios para um dia perfeito
const PERFECT_DAY_CRITERIA = {
  "Refeição perfeita": 5,
  "Treino de musculação": 1,
  "Cardio ≥ 20 min": 1,
  "Meta diária de ingestão de água": 1,
};

const fetchProofsForMonth = async (month: Date) => {
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);

  const { data, error } = await supabase
    .from("proofs")
    .select("created_at, event_type, points, competitors(id, name)")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) {
    throw new Error("Não foi possível carregar os dados para o calendário.");
  }
  return data;
};

export const PerfectDaysCalendar = () => {
  const [month, setMonth] = useState(new Date());
  const queryClient = useQueryClient();

  const {
    data: proofs,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["proofs", format(month, "yyyy-MM")],
    queryFn: () => fetchProofsForMonth(month),
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime-proofs-calendar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proofs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['proofs'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const perfectDays = useMemo(() => {
    if (!proofs) return new Map<string, string[]>();

    const proofsByDayAndCompetitor = proofs.reduce((acc, proof) => {
      if (!proof.competitors) return acc;
      const day = format(parseISO(proof.created_at), "yyyy-MM-dd");
      const competitorId = proof.competitors.id;

      if (!acc[day]) acc[day] = {};
      if (!acc[day][competitorId]) {
        acc[day][competitorId] = {
          proofs: [],
          competitorName: proof.competitors.name,
        };
      }
      acc[day][competitorId].proofs.push(proof);
      return acc;
    }, {} as Record<string, Record<string, { proofs: typeof proofs; competitorName: string }>>);

    const perfectDaysMap = new Map<string, string[]>();

    for (const day in proofsByDayAndCompetitor) {
      for (const competitorId in proofsByDayAndCompetitor[day]) {
        const { proofs: dailyProofs, competitorName } =
          proofsByDayAndCompetitor[day][competitorId];

        const counts = dailyProofs.reduce(
          (acc, p) => {
            acc[p.event_type] = (acc[p.event_type] || 0) + 1;
            if (p.points < 0) {
              acc.negativePoints = (acc.negativePoints || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>
        );

        const isPerfect =
          Object.entries(PERFECT_DAY_CRITERIA).every(
            ([event, requiredCount]) => (counts[event] || 0) >= requiredCount
          ) && (counts.negativePoints || 0) === 0;

        if (isPerfect) {
          const initial = competitorName.charAt(0).toUpperCase();
          const dayInitials = perfectDaysMap.get(day) || [];
          if (!dayInitials.includes(initial)) {
            perfectDaysMap.set(day, [...dayInitials, initial]);
          }
        }
      }
    }

    return perfectDaysMap;
  }, [proofs]);

  const CustomDayContent = (props: DayContentProps) => {
    const dayKey = format(props.date, "yyyy-MM-dd");
    const initials = perfectDays.get(dayKey);

    return (
      <div className="relative h-full w-full flex flex-col items-center justify-center">
        <DayContent {...props} />
        {initials && initials.length > 0 && (
          <div className="absolute bottom-0 flex space-x-1">
            {initials.map((initial) => (
              <Badge
                key={initial}
                className={cn(
                  "h-4 w-4 p-0 flex items-center justify-center text-xs",
                  initial === "A" ? "bg-blue-500" : "bg-pink-500"
                )}
              >
                {initial}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário de Dias Perfeitos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[290px] w-full" />
        ) : isError ? (
          <p className="text-destructive text-center">{error.message}</p>
        ) : (
          <Calendar
            month={month}
            onMonthChange={setMonth}
            locale={ptBR}
            className="p-0"
            classNames={{
              day_cell: "h-12 w-12",
            }}
            components={{
              DayContent: CustomDayContent,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};