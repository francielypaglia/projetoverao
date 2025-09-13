import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowUp, ArrowDown } from "lucide-react";

interface Competitor {
  id: number;
  name: string;
  score: number;
}

interface Action {
  label: string;
  points: number;
  variant: "default" | "destructive";
  icon: React.ReactNode;
}

const actions: Action[] = [
  {
    label: "Treino Concluído",
    points: 10,
    variant: "default",
    icon: <ArrowUp className="mr-2 h-4 w-4" />,
  },
  {
    label: "Dieta 100%",
    points: 5,
    variant: "default",
    icon: <ArrowUp className="mr-2 h-4 w-4" />,
  },
  {
    label: "Bebeu 2L+ Água",
    points: 3,
    variant: "default",
    icon: <ArrowUp className="mr-2 h-4 w-4" />,
  },
  {
    label: "Furou a Dieta",
    points: -5,
    variant: "destructive",
    icon: <ArrowDown className="mr-2 h-4 w-4" />,
  },
  {
    label: "Não Treinou",
    points: -10,
    variant: "destructive",
    icon: <ArrowDown className="mr-2 h-4 w-4" />,
  },
];

const initialCompetitors: Competitor[] = [
  { id: 1, name: "Amanda", score: 0 },
  { id: 2, name: "Franciely", score: 0 },
];

const Index = () => {
  const [competitors, setCompetitors] =
    useState<Competitor[]>(initialCompetitors);

  const handleAction = (competitorId: number, points: number) => {
    setCompetitors((prevCompetitors) =>
      prevCompetitors.map((c) =>
        c.id === competitorId ? { ...c, score: c.score + points } : c,
      ),
    );
  };

  const getLeader = (): Competitor | null => {
    if (competitors[0].score === 0 && competitors[1].score === 0) return null;
    if (competitors[0].score === competitors[1].score) return null;
    return competitors.reduce((prev, current) =>
      prev.score > current.score ? prev : current,
    );
  };

  const leader = getLeader();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 sm:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            Projeto Verão ☀️
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhamento de desempenho diário
          </p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {competitors.map((competitor) => (
            <Card
              key={competitor.id}
              className="flex flex-col shadow-lg rounded-xl"
            >
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-3xl font-bold">
                  {competitor.name}
                </CardTitle>
                {leader && leader.id === competitor.id && (
                  <Badge className="bg-yellow-400 text-black hover:bg-yellow-500 text-sm">
                    <Trophy className="mr-2 h-5 w-5" />
                    Líder
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex-grow flex items-center justify-center py-10">
                <div className="text-8xl font-extrabold tracking-tighter">
                  {competitor.score}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 p-4">
                <div className="w-full grid grid-cols-1 gap-2">
                  {actions.map((action) => (
                    <Button
                      key={action.label}
                      variant={action.variant}
                      onClick={() => handleAction(competitor.id, action.points)}
                      className="w-full justify-center py-6 text-base"
                    >
                      {action.icon}
                      {action.label} ({action.points > 0 ? "+" : ""}
                      {action.points})
                    </Button>
                  ))}
                </div>
              </CardFooter>
            </Card>
          ))}
        </main>
      </div>
    </div>
  );
};

export default Index;