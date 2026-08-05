import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getPetById, getPetsForUser, getWeightHistory } from "@/lib/pets/queries";
import { formatWeight } from "@/lib/pets/format";
import { getCareEventsForPet, getRemindersForPet } from "@/lib/reminders/queries";
import ProfileHeader from "@/components/ProfileHeader";
import PetSwitcher from "@/components/PetSwitcher";
import ViewToggle from "@/components/ViewToggle";
import CollapsibleSection from "@/components/CollapsibleSection";
import FieldGrid from "@/components/FieldGrid";
import WeightPanel from "@/components/WeightPanel";
import ReminderPanel from "@/components/ReminderPanel";
import Timeline from "@/components/Timeline";
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

  const [weightHistory, reminders, careEvents] = await Promise.all([
    getWeightHistory(petId),
    getRemindersForPet(petId),
    getCareEventsForPet(petId),
  ]);

  return (
    <>
      <PetSwitcher pets={allPets} currentPetId={pet.id} />
      <ProfileHeader pet={pet} />
      <ViewToggle
        overview={
          <>
            <CollapsibleSection title="Details" defaultOpen>
              <FieldGrid pet={pet} />
            </CollapsibleSection>
            <CollapsibleSection
              title="Weight"
              subtitle={pet.current_weight ? formatWeight(pet.current_weight) : "No entries yet"}
            >
              <WeightPanel pet={pet} history={weightHistory} />
            </CollapsibleSection>
            <CollapsibleSection
              title="Reminders"
              subtitle={
                reminders.length === 0
                  ? "None set"
                  : `${reminders.length} active`
              }
            >
              <ReminderPanel pet={pet} reminders={reminders} />
            </CollapsibleSection>
          </>
        }
        timeline={<Timeline pet={pet} events={careEvents} />}
        actions={<ActionsStub />}
      />
    </>
  );
}
