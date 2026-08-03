import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getPetById } from "@/lib/pets/queries";
import { archivePet, updatePet } from "@/lib/pets/actions";
import PetForm from "@/components/PetForm";

export default async function EditPetPage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  await requireUser();
  const { petId } = await params;
  const pet = await getPetById(petId);
  if (!pet) notFound();

  const boundUpdatePet = updatePet.bind(null, petId);
  const boundArchivePet = archivePet.bind(null, petId);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Edit {pet.name}</h1>
        </div>
      </div>
      <PetForm action={boundUpdatePet} pet={pet} submitLabel="Save changes" />
      <form action={boundArchivePet} style={{ marginTop: 16 }}>
        <button className="btn secondary" type="submit">
          Archive {pet.name}
        </button>
      </form>
    </>
  );
}
