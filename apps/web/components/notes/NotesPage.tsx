'use client';

import { Button, Group, Paper, Stack, Table, Title } from '@mantine/core';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Note = { id: string; noteNumber: string; reason: string; grandTotal: string | number; status: string; customer?: { name: string } };

export function NotesPage({ endpoint, title, createHref }: { endpoint: string; title: string; createHref: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  useEffect(() => {
    void apiFetch<{ notes: Note[] }>(endpoint).then((response) => setNotes(response.notes));
  }, [endpoint]);
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={1}>{title}</Title>
        <Button component={Link} href={createHref} leftSection={<Plus size={16} />} color="warm" c="#2b2622">
          New
        </Button>
      </Group>
      <Paper className="surface" p="lg">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>No</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {notes.map((note) => (
              <Table.Tr key={note.id}>
                <Table.Td>{note.noteNumber}</Table.Td>
                <Table.Td>{note.customer?.name ?? '-'}</Table.Td>
                <Table.Td>{note.reason}</Table.Td>
                <Table.Td>{currency(Number(note.grandTotal))}</Table.Td>
                <Table.Td>{note.status}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}
