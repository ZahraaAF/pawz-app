import { requireUser } from "@/lib/auth/dal";
import { createPet } from "@/lib/pets/actions";
import PetForm from "@/components/PetForm";

export default async function NewPetPage() {
  await requireUser();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Add a pet</h1>
          <div className="lede">
            Only name and species are required — fill in the rest as you know it.
          </div>
        </div>
      </div>
      <PetForm action={createPet} submitLabel="Add pet" />
    </>
  );
}
