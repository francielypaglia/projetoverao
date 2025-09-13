import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProofForm } from "@/components/ProofForm";
import { RecentProofs } from "@/components/RecentProofs";
import { Button } from "@/components/ui/button";

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
    console.error("Error fetching competitors:", error);
    throw new Error("Não foi possível carregar os competidores.");
  }

  return data;
};

const Index = () => {
  const queryClient = useQueryClient();
  const {
    data: competitors,
    isLoading,
    isError,
    error,
  } = useQuery<Competitor[]>({
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const leader =
    competitors && competitors.length > 0 && competitors[0].score > 0
      ? competitors[0]
      : null;

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Skeleton className="h-[200px] rounded-xl" />
      <Skeleton className="h-[200px] rounded-xl" />
    </div>
  );

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h2 className="text-2xl font-bold text-destructive mb-4">
          Ocorreu um erro
        </h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-8 relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOut className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </div>
        <header className="text-center mb-12">
          <img src="/logo.png" alt="Verão Fitness Logo" className="w-64 mx-auto" />
          <p className="text-muted-foreground mt-2">
            Acompanhamento de desempenho diário
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Ranking</h2>
              {isLoading ? (
                renderSkeletons()
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {competitors?.map((competitor) => (
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
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <section>
              <ProofForm />
            </section>
            <section>
              <RecentProofs />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;