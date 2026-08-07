import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getPetById, getPetsForUser, getWeightHistory } from "@/lib/pets/queries";
import { formatWeight } from "@/lib/pets/format";
import { getCareEventsForPet, getRemindersForPet } from "@/lib/reminders/queries";
import { getSymptomsForPet } from "@/lib/symptoms/queries";
import { getVetReportData } from "@/lib/report/queries";
import { REPORT_RANGE_PRESETS, resolveReportRange, type ReportRangePreset } from "@/lib/report/format";
import ProfileHeader from "@/components/ProfileHeader";
import PetSwitcher from "@/components/PetSwitcher";
import ViewToggle from "@/components/ViewToggle";
import CollapsibleSection from "@/components/CollapsibleSection";
import FieldGrid from "@/components/FieldGrid";
import WeightPanel from "@/components/WeightPanel";
import ReminderPanel from "@/components/ReminderPanel";
import Timeline from "@/components/Timeline";
import SymptomPanel from "@/components/SymptomPanel";
import VetReportPanel from "@/components/VetReportPanel";

function resolveRangePreset(raw: string | undefined): ReportRangePreset {
  const match = REPORT_RANGE_PRESETS.find((p) => p.value === raw);
  return match?.value ?? "30d";
}

export default async function PetProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ petId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  await requireUser();
  const { petId } = await params;
  const { range } = await searchParams;
  const rangePreset = resolveRangePreset(range);

  const [pet, allPets] = await Promise.all([getPetById(petId), getPetsForUser()]);
  if (!pet) notFound();

  const { from, to } = resolveReportRange(rangePreset);
  const [weightHistory, reminders, careEvents, symptoms, reportData] = await Promise.all([
    getWeightHistory(petId),
    getRemindersForPet(petId),
    getCareEventsForPet(petId),
    getSymptomsForPet(petId),
    getVetReportData(petId, from, to),
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
        actions={
          <>
            <CollapsibleSection
              title="Symptoms"
              subtitle={symptoms.length === 0 ? "None logged" : `${symptoms.length} entries`}
            >
              <SymptomPanel pet={pet} symptoms={symptoms} />
            </CollapsibleSection>
            <CollapsibleSection id="vet-report-card" title="Vet report" subtitle="Generate a summary report before vet visits">
              <VetReportPanel pet={pet} range={rangePreset} data={reportData} />
            </CollapsibleSection>
          </>
        }
      />
    </>
  );
}
