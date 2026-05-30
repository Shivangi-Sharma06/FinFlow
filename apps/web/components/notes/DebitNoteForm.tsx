'use client';

import { NoteForm } from './CreditNoteForm';

export function DebitNoteForm() {
  return <NoteForm endpoint="/api/debit-notes" title="New Debit Note" />;
}
