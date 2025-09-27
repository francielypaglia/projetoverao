import { Leaderboard } from "@/components/Leaderboard";
import { ProofForm } from "@/components/ProofForm";
import { RecentProofs } from "@/components/RecentProofs";
import { PerfectDaysCalendar } from "@/components/PerfectDaysCalendar";
import { WeeklyLeaderboard } from "@/components/WeeklyLeaderboard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="p-4 flex justify-between items-center border-b shadow-sm">
        <div className="flex items-center gap-4">
          <img src="https://barvwsrvajuskejieyaj.supabase.co/storage/v1/object/public/proof_photos/story%20(3).png" alt="Logo" className="h-10" />
          <h1 className="text-xl md:text-2xl font-bold text-primary">Verão Fitness</h1>
        </div>
        <Button onClick={handleLogout} variant="outline">Sair</Button>
      </header>
      <main className="p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Rankings e Calendário */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <Leaderboard />
            </section>
            <section>
              <WeeklyLeaderboard />
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
    </div>
  );
};

export default Index;