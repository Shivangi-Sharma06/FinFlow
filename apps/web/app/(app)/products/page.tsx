'use client';

import { Button, Group, Paper, Stack, Table, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProductForm } from '@/components/masters/ProductForm';
import { apiFetch } from '@/lib/api';
import type { Product } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  async function load() {
    const response = await apiFetch<{ products: Product[] }>('/api/products');
    setProducts(response.products);
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={1}>Products</Title>
        <Button leftSection={<Plus size={16} />} color="white" c="#1f1a17" onClick={open}>
          Add Product
        </Button>
      </Group>
      <Paper className="surface" p="lg">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>HSN/SAC</Table.Th>
              <Table.Th>GST</Table.Th>
              <Table.Th>Cess</Table.Th>
              <Table.Th>Unit</Table.Th>
              <Table.Th>Selling Price</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {products.map((product) => (
              <Table.Tr key={product.id}>
                <Table.Td>{product.name}</Table.Td>
                <Table.Td>{product.hsnSacCode}</Table.Td>
                <Table.Td>{Number(product.gstRate)}%</Table.Td>
                <Table.Td>{Number(product.cessRate)}%</Table.Td>
                <Table.Td>{product.unit}</Table.Td>
                <Table.Td>{currency(Number(product.sellingPrice))}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
      <ProductForm opened={opened} onClose={close} onSaved={() => void load()} />
    </Stack>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}
