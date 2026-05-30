'use client';

import { Paper, Stack, Table, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Branch } from '@/types';

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  useEffect(() => {
    void apiFetch<{ branches: Branch[] }>('/api/branches').then((response) => setBranches(response.branches));
  }, []);
  return (
    <Stack>
      <Title order={1}>Branches</Title>
      <Paper className="surface" p="lg">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Code</Table.Th>
              <Table.Th>GSTIN</Table.Th>
              <Table.Th>State</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {branches.map((branch) => (
              <Table.Tr key={branch.id}>
                <Table.Td>{branch.name}</Table.Td>
                <Table.Td>{branch.code}</Table.Td>
                <Table.Td>{branch.gstin ?? '-'}</Table.Td>
                <Table.Td>{branch.state}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}
