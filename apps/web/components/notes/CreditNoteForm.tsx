'use client';

import { Button, Paper, Select, Stack, Textarea, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Branch, Customer } from '@/types';

export function CreditNoteForm() {
  return <NoteForm endpoint="/api/credit-notes" title="New Credit Note" />;
}

export function NoteForm({ endpoint, title }: { endpoint: string; title: string }) {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branchId, setBranchId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [reason, setReason] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  useEffect(() => {
    async function load() {
      try {
        const [branchRes, customerRes] = await Promise.all([apiFetch<{ branches: Branch[] }>('/api/branches'), apiFetch<{ customers: Customer[] }>('/api/customers')]);
        setBranches(branchRes.branches);
        setCustomers(customerRes.customers);
        setBranchId(branchRes.branches[0]?.id ?? '');
        setCustomerId(customerRes.customers[0]?.id ?? '');
      } catch (error) {
        notifications.show({ color: 'red', title: 'Unable to load note data', message: error instanceof Error ? error.message : 'Try again' });
      }
    }
    void load();
  }, []);
  async function save() {
    await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        branchId,
        customerId,
        reason,
        noteDate,
        items: [{ description: reason || 'Adjustment', hsnSacCode: '9982', quantity: 1, unit: 'job', rate: 100, discount: 0, gstRate: 18, cessRate: 0 }]
      })
    });
    notifications.show({ color: 'green', title: 'Note saved', message: 'The note is ready to issue.' });
    router.push(endpoint.replace('/api', ''));
  }
  return (
    <Paper className="surface" p="lg">
      <Stack>
        <Title order={1}>{title}</Title>
        <Select label="Branch" data={branches.map((branch) => ({ value: branch.id, label: branch.name }))} value={branchId} onChange={(value) => setBranchId(value ?? '')} />
        <Select label="Customer" data={customers.map((customer) => ({ value: customer.id, label: customer.name }))} value={customerId} onChange={(value) => setCustomerId(value ?? '')} />
        <TextInput label="Date" type="date" value={noteDate} onChange={(event) => setNoteDate(event.currentTarget.value)} />
        <Textarea label="Reason" value={reason} onChange={(event) => setReason(event.currentTarget.value)} required />
        <Button onClick={() => void save()} color="warm">
          Save Draft
        </Button>
      </Stack>
    </Paper>
  );
}
