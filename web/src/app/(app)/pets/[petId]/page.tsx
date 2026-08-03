import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getPetById, getPetsForUser, getWeightHistory } from "@/lib/pets/queries";
import ProfileHeader from "@/components/ProfileHeader";
import PetSwitcher from "@/components/PetSwitcher";
import ViewToggle from "@/components/ViewToggle";
import FieldGrid from "@/components/FieldGrid";
import WeightPanel from "@/components/WeightPanel";
import TimelineStub from "@/components/TimelineStub";
import ActionsStub from "@/components/ActionsStub";

export default async function PetProfilePage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  await requireUser();
  const { petId } = await params;

  const [pet, allPets] = await Promise.all([getPetById(petId), getPetsForUser()]);
  if (!pet) notFound();

  const weightHistory = await getWeightHistory(petId);

  return (
    <>
      <PetSwitcher pets={allPets} currentPetId={pet.id} />
      <ProfileHeader pet={pet} />
      <ViewToggle
        overview={
          <>
            <FieldGrid pet={pet} />
            <WeightPanel pet={pet} history={weightHistory} />
          </>
        }
        timeline={<TimelineStub />}
        actions={<ActionsStub />}
      />
    </>
  );
}
