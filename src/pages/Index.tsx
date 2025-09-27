import { Leaderboard } from "@/components/Leaderboard";
import { ProofForm } from "@/components/ProofForm";
import { RecentProofs } from "@/components/RecentProofs";
import { PerfectDaysCalendar } from "@/components/PerfectDaysCalendar";
import { WeeklyLeaderboard } from "@/components/WeeklyLeaderboard";
import { HallOfFame } from "@/components/HallOfFame";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="p-4 flex justify-between items-center border-b shadow-sm sticky top-0 bg-background z-10">
        <div className="flex items-center gap-4">
          <img src="https://barvwsrvajuskejieyaj.supabase.co/storage/v1/object/public/proof_photos/story%20(3).png" alt="Logo" className="h-10" />
          <h1 className="text-xl md:text-2xl font-bold text-primary">Verão Fitness</h1>
        </div>
        <Button onClick={handleLogout} variant="outline">Sair</Button>
      </header>
      
      <main className="flex-grow p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Destaques e Calendário */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <WeeklyLeaderboard />
            </section>
            <section>
              <HallOfFame />
            </section>
            <section>
              <PerfectDaysCalendar />
            </section>
          </div>

          {/* Coluna Direita - Formulário e Provas Recentes */}
          <div className="lg:col-span-1 space-y-8">
            <section>
              <ProofForm />
            </section>
            <section>
              <RecentProofs />
            </section>
          </div>
        </div>
      </main>

      <footer className="p-4 md:p-8 border-t mt-auto bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <Leaderboard />
        </div>
      </footer>
    </div>
  );
};

export default Index;