export type Document = {
  id: string;
  pet_id: string;
  file_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  care_event_id: string | null;
  symptom_entry_id: string | null;
  created_at: string;
};

// Shape returned by getDocumentsForPet - the linked record's display
// label embedded directly via a Postgres join, no second round-trip.
export type DocumentWithLink = Document & {
  care_event: { id: string; label: string } | null;
  symptom_entry: { id: string; description: string; occurred_at: string } | null;
};
