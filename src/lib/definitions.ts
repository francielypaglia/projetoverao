export const POINT_EVENTS = {
  GAIN: [
    { label: "Cada refeição perfeita", value: "perfect_meal", points: 1 },
    { label: "Cada treino de musculação", value: "weight_training", points: 10 },
    { label: "Cada cardio ≥ 20 min", value: "cardio", points: 10 },
    { label: "Meta diária de ingestão de água", value: "water_goal", points: 5 },
  ],
  LOSE: [
    { label: "Dia sem treino", value: "no_training_day", points: -5 },
    { label: "Refeição fora da dieta", value: "cheat_meal", points: -5 },
    { label: "“Refeição Louca Violenta”", value: "crazy_cheat_meal", points: -10 },
  ],
};

export type Proof = {
  id: string;
  created_at: string;
  competitor_id: string;
  event_type: string;
  points: number;
  photo_url: string | null;
  competitors: {
    name: string;
  };
};