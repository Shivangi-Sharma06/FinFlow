'use client';

import { Paper, Stack, Table, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { ApiUser } from '@/types';

type UserRow = ApiUser & { branch?: { name: string } | null; isActive: boolean };

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  useEffect(() => {
    void apiFetch<{ users: UserRow[] }>('/api/users').then((response) => setUsers(response.users));
  }, []);
  return (
    <Stack>
      <Title order={1}>Users</Title>
      <Paper className="surface" p="lg">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Branch</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.name}</Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>{user.role}</Table.Td>
                <Table.Td>{user.branch?.name ?? 'All branches'}</Table.Td>
                <Table.Td>{user.isActive ? 'Active' : 'Inactive'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}
