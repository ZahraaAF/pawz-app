"use client";

// Scopes window.print() to just the Vet Report accordion card (see the
// body.printing-vet-report rule in globals.css) - without this, whichever
// other Actions accordion cards (e.g. Symptoms) happen to be open would
// print too, since CollapsibleSection has no shared "only one open"
// exclusivity.
export default function PrintReportButton() {
  function handlePrint() {
    document.body.classList.add("printing-vet-report");
    const cleanup = () => {
      document.body.classList.remove("printing-vet-report");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  return (
    <button type="button" className="btn secondary" onClick={handlePrint}>
      Print / Export PDF
    </button>
  );
}
