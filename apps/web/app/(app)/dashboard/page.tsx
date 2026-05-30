'use client';

import { Button, Group, Paper, SimpleGrid, Stack, Title } from '@mantine/core';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BranchSummaryTable } from '@/components/dashboard/BranchSummaryTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { apiFetch } from '@/lib/api';

type DashboardData = {
  stats: { invoicesThisMonth: number; totalRevenue: number; totalOutstanding: number };
  branches: Array<{ branchId: string; branchName: string; invoices: number; revenue: number; outstanding: number }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  async function load() {
    const response = await apiFetch<DashboardData>('/api/dashboard');
    setData(response);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={1}>Dashboard</Title>
        <Button leftSection={<RefreshCw size={16} />} variant="light" color="warm" onClick={() => void load()}>
          Refresh
        </Button>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <StatCard label="Invoices this month" value={String(data?.stats.invoicesThisMonth ?? 0)} />
        <StatCard label="Revenue collected" value={currency(data?.stats.totalRevenue ?? 0)} />
        <StatCard label="Outstanding" value={currency(data?.stats.totalOutstanding ?? 0)} />
      </SimpleGrid>
      <Paper className="surface" p="lg">
        <Title order={2} mb="md">
          Branch Summary
        </Title>
        <BranchSummaryTable rows={data?.branches ?? []} />
      </Paper>
    </Stack>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}
