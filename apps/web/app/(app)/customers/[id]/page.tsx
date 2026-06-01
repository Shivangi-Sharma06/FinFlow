'use client';

import { Paper, Stack, Table, Text, Title } from '@mantine/core';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type CustomerDetail = { name: string; gstin: string | null; invoices: Array<{ id: string; invoiceNumber: string; grandTotal: string | number; balanceDue: string | number; status: string }> };

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  useEffect(() => {
    void apiFetch<{ customer: CustomerDetail }>(`/api/customers/${params.id}`).then((response) => setCustomer(response.customer));
  }, [params.id]);
  if (!customer) return <Text c="#4b3b41">Loading customer...</Text>;
  return (
    <Stack>
      <Title order={1}>{customer.name}</Title>
      <Text c="#4b3b41">GSTIN: {customer.gstin ?? '-'}</Text>
      <Paper className="surface" p="lg">
        <Title order={2} mb="md">
          Statement
        </Title>
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th>Balance</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {customer.invoices.map((invoice) => (
              <Table.Tr key={invoice.id}>
                <Table.Td>{invoice.invoiceNumber}</Table.Td>
                <Table.Td>{currency(Number(invoice.grandTotal))}</Table.Td>
                <Table.Td>{currency(Number(invoice.balanceDue))}</Table.Td>
                <Table.Td>{invoice.status}</Table.Td>
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
