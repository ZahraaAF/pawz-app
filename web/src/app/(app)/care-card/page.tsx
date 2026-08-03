import { requireUser } from "@/lib/auth/dal";

export default async function CareCardPage() {
  await requireUser();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Care Card</h1>
          <div className="lede">
            A curated summary for a sitter or family member — lands in a later
            update.
          </div>
        </div>
      </div>
      <div className="card stub-panel">Coming soon.</div>
    </>
  );
}
