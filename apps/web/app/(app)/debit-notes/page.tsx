import { NotesPage } from '@/components/notes/NotesPage';

export default function DebitNotesPage() {
  return <NotesPage endpoint="/api/debit-notes" title="Debit Notes" createHref="/debit-notes/new" />;
}
