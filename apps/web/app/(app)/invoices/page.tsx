'use client';

import { Button, Group, Paper, Select, Stack, Title } from '@mantine/core';
import { Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InvoiceTable } from '@/components/invoice/InvoiceTable';
import { apiFetch } from '@/lib/api';
import type { Invoice } from '@/types';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  async function load() {
    const query = status ? `?status=${status}` : '';
    const response = await apiFetch<{ invoices: Invoice[] }>(`/api/invoices${query}`);
    setInvoices(response.invoices);
  }
  useEffect(() => {
    void load();
  }, [status]);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={1}>Invoices</Title>
        <Group>
          <Select
            placeholder="Status"
            clearable
            data={['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']}
            value={status}
            onChange={setStatus}
            w={180}
          />
          <Button leftSection={<RefreshCw size={16} />} variant="light" onClick={() => void load()}>
            Refresh
          </Button>
          <Button component={Link} href="/invoices/new" color="warm" c="#2b2622" leftSection={<Plus size={16} />}>
            New Invoice
          </Button>
        </Group>
      </Group>
      <Paper className="surface" p="lg">
        <InvoiceTable invoices={invoices} />
      </Paper>
    </Stack>
  );
}
