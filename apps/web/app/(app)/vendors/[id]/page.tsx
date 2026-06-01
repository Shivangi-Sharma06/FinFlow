'use client';

import { Paper, Stack, Text, Title } from '@mantine/core';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type VendorDetail = { name: string; gstin: string | null; billingState: string };

export default function VendorDetailPage() {
  const params = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  useEffect(() => {
    void apiFetch<{ vendor: VendorDetail }>(`/api/vendors/${params.id}`).then((response) => setVendor(response.vendor));
  }, [params.id]);
  if (!vendor) return <Text c="#4b3b41">Loading vendor...</Text>;
  return (
    <Stack>
      <Title order={1}>{vendor.name}</Title>
      <Paper className="surface" p="lg">
        <Text>GSTIN: {vendor.gstin ?? '-'}</Text>
        <Text>State: {vendor.billingState}</Text>
      </Paper>
    </Stack>
  );
}
