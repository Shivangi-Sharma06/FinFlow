import { NotesPage } from '@/components/notes/NotesPage';

export default function CreditNotesPage() {
  return <NotesPage endpoint="/api/credit-notes" title="Credit Notes" createHref="/credit-notes/new" />;
}
