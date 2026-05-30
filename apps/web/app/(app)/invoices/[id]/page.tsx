'use client';

import { Badge, Button, Group, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { Download, RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch, apiPdfUrl, getStoredToken } from '@/lib/api';

type Detail = {
  id: string;
  invoiceNumber: string;
  status: string;
  grandTotal: string | number;
  balanceDue: string | number;
  isInterState: boolean;
  customer: { name: string; gstin: string | null };
  branch: { name: string };
  items: Array<{ id: string; description: string; quantity: string | number; rate: string | number; cgst: string | number; sgst: string | number; igst: string | number; lineTotal: string | number }>;
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Detail | null>(null);
  async function load() {
    const response = await apiFetch<{ invoice: Detail }>(`/api/invoices/${params.id}`);
    setInvoice(response.invoice);
  }
  useEffect(() => {
    void load();
  }, [params.id]);
  if (!invoice) return <Text c="#c9c0ad">Loading invoice...</Text>;
  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={1}>{invoice.invoiceNumber}</Title>
          <Text c="#c9c0ad">
            {invoice.customer.name} | {invoice.branch.name}
          </Text>
        </div>
        <Group>
          <Badge size="lg" variant="light">
            {invoice.status}
          </Badge>
          <Button variant="light" leftSection={<RefreshCw size={16} />} onClick={() => void load()}>
            Refresh
          </Button>
          <Button
            color="warm"
            c="#2b2622"
            leftSection={<Download size={16} />}
            onClick={() => {
              const token = getStoredToken();
              window.open(`${apiPdfUrl(invoice.id)}${token ? `?token=${token}` : ''}`, '_blank');
            }}
          >
            Download PDF
          </Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 3 }}>
        <Paper className="surface" p="lg">
          <Text c="#aea69c" size="xs" tt="uppercase" ff="monospace">
            Supply
          </Text>
          <Text>{invoice.isInterState ? 'Inter-state supply (IGST)' : 'Intra-state supply (CGST + SGST)'}</Text>
        </Paper>
        <Paper className="surface" p="lg">
          <Text c="#aea69c" size="xs" tt="uppercase" ff="monospace">
            Grand total
          </Text>
          <Text size="xl">{currency(Number(invoice.grandTotal))}</Text>
        </Paper>
        <Paper className="surface" p="lg">
          <Text c="#aea69c" size="xs" tt="uppercase" ff="monospace">
            Balance due
          </Text>
          <Text size="xl">{currency(Number(invoice.balanceDue))}</Text>
        </Paper>
      </SimpleGrid>
      <Paper className="surface" p="lg">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Description</Table.Th>
              <Table.Th>Qty</Table.Th>
              <Table.Th>Rate</Table.Th>
              <Table.Th>CGST</Table.Th>
              <Table.Th>SGST</Table.Th>
              <Table.Th>IGST</Table.Th>
              <Table.Th>Total</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {invoice.items.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>{item.description}</Table.Td>
                <Table.Td>{Number(item.quantity)}</Table.Td>
                <Table.Td>{currency(Number(item.rate))}</Table.Td>
                <Table.Td>{currency(Number(item.cgst))}</Table.Td>
                <Table.Td>{currency(Number(item.sgst))}</Table.Td>
                <Table.Td>{currency(Number(item.igst))}</Table.Td>
                <Table.Td>{currency(Number(item.lineTotal))}</Table.Td>
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
