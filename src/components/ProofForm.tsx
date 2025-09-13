// 1) Remova toda a interface Competitor e a função fetchCompetitors.
// 2) Altere o import de react-query para não trazer useQuery:
//    de: import { useQuery, useMutation, useQueryClient } ...
//    para: import { useMutation, useQueryClient } ...

// 3) Atualize o formSchema tirando competitor_id:
const formSchema = z.object({
  category: z.enum(["GAIN", "LOSE"], {
    required_error: "Selecione uma categoria.",
  }),
  event: z.string({ required_error: "Selecione um tipo de pontuação." }),
  photo: z.any().optional(),
});

// 4) No useEffect, retire todas as referências a competitor_id:
useEffect(() => {
  if (isEditMode && proofToEdit) {
    const eventCategory = proofToEdit.points > 0 ? "GAIN" : "LOSE";
    const eventValue = POINT_EVENTS[eventCategory].find(
      (e) => e.label === proofToEdit.event_type
    )?.value;

    form.reset({
      category: eventCategory,
      event: eventValue,
      photo: undefined,
    });
    setSelectedCategory(eventCategory);
  } else {
    form.reset({
      category: "GAIN",
      event: undefined,
      photo: undefined,
    });
    setSelectedCategory("GAIN");
  }
}, [proofToEdit, isEditMode, form]);

// 5) Na mutationFn, pegue o session.user.id:
mutationFn: async (values: FormValues) => {
  // obtenha sessão atual
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  const eventData = POINT_EVENTS[values.category].find(
    (e) => e.value === values.event
  );
  if (!eventData) throw new Error("Evento inválido.");

  let photoUrl: string | null = proofToEdit?.photo_url || null;
  const photoFile = values.photo?.[0];

  if (photoFile) {
    const fileName = `${crypto.randomUUID()}-${photoFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("proof_photos")
      .upload(fileName, photoFile, { upsert: isEditMode });

    if (uploadError) throw new Error("Falha no upload da foto.");

    photoUrl = supabase.storage
      .from("proof_photos")
      .getPublicUrl(uploadData.path).data.publicUrl;
  }

  // use userId em vez de values.competitor_id
  const proofData = {
    competitor_id: userId,
    event_type: eventData.label,
    points: eventData.points,
    photo_url: photoUrl,
  };

  if (isEditMode) {
    const { error } = await supabase
      .from("proofs")
      .update(proofData)
      .eq("id", proofToEdit.id);
    if (error) throw new Error("Falha ao atualizar a prova.");
  } else {
    const { error } = await supabase.from("proofs").insert(proofData);
    if (error) throw new Error("Falha ao registrar a prova.");
  }
},

// 6) No JSX do formulário, remova totalmente o bloco <FormField name="competitor_id" ... />