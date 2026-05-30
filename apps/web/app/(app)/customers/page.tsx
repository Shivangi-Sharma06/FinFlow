'use client';

import { Button, Group, Paper, Stack, Table, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CustomerForm } from '@/components/masters/CustomerForm';
import { apiFetch } from '@/lib/api';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  async function load() {
    const response = await apiFetch<{ customers: Customer[] }>('/api/customers');
    setCustomers(response.customers);
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={1}>Customers</Title>
        <Button leftSection={<Plus size={16} />} color="white" c="#1f1a17" onClick={open}>
          Add Customer
        </Button>
      </Group>
      <Paper className="surface" p="lg">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>GSTIN</Table.Th>
              <Table.Th>State</Table.Th>
              <Table.Th>Outstanding</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {customers.map((customer) => (
              <Table.Tr key={customer.id}>
                <Table.Td>
                  <Link href={`/customers/${customer.id}`}>{customer.name}</Link>
                </Table.Td>
                <Table.Td>{customer.gstin ?? '-'}</Table.Td>
                <Table.Td>{customer.billingState}</Table.Td>
                <Table.Td>{currency(Number(customer.outstandingBalance ?? 0))}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
      <CustomerForm opened={opened} onClose={close} onSaved={() => void load()} />
    </Stack>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}
