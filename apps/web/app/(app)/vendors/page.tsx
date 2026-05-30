'use client';

import { Button, Group, Paper, Stack, Table, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { VendorForm } from '@/components/masters/VendorForm';
import { apiFetch } from '@/lib/api';

type Vendor = { id: string; name: string; gstin: string | null; billingState: string; billingStateCode: string };

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  async function load() {
    const response = await apiFetch<{ vendors: Vendor[] }>('/api/vendors');
    setVendors(response.vendors);
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={1}>Vendors</Title>
        <Button leftSection={<Plus size={16} />} color="warm" c="#2b2622" onClick={open}>
          Add Vendor
        </Button>
      </Group>
      <Paper className="surface" p="lg">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>GSTIN</Table.Th>
              <Table.Th>State</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {vendors.map((vendor) => (
              <Table.Tr key={vendor.id}>
                <Table.Td>
                  <Link href={`/vendors/${vendor.id}`}>{vendor.name}</Link>
                </Table.Td>
                <Table.Td>{vendor.gstin ?? '-'}</Table.Td>
                <Table.Td>{vendor.billingState}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
      <VendorForm opened={opened} onClose={close} onSaved={() => void load()} />
    </Stack>
  );
}
