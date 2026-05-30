'use client';

import { ActionIcon, NumberInput, Select, Table, TextInput } from '@mantine/core';
import { Plus, Trash2 } from 'lucide-react';
import type { Product } from '@/types';

export type DraftLine = {
  productId: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
};

export function InvoiceLineItems({
  products,
  lines,
  onChange
}: {
  products: Product[];
  lines: DraftLine[];
  onChange: (lines: DraftLine[]) => void;
}) {
  const productOptions = products.map((product) => ({ value: product.id, label: `${product.name} | GST ${Number(product.gstRate)}%` }));
  function update(index: number, patch: Partial<DraftLine>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }
  return (
    <Table withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Product</Table.Th>
          <Table.Th>Description</Table.Th>
          <Table.Th>Qty</Table.Th>
          <Table.Th>Rate</Table.Th>
          <Table.Th>Discount</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {lines.map((line, index) => (
          <Table.Tr key={index}>
            <Table.Td>
              <Select
                data={productOptions}
                value={line.productId}
                onChange={(value) => {
                  const product = products.find((candidate) => candidate.id === value);
                  update(index, {
                    productId: value ?? '',
                    description: product?.name ?? '',
                    rate: Number(product?.sellingPrice ?? 0)
                  });
                }}
              />
            </Table.Td>
            <Table.Td>
              <TextInput value={line.description} onChange={(event) => update(index, { description: event.currentTarget.value })} />
            </Table.Td>
            <Table.Td>
              <NumberInput min={0} value={line.quantity} onChange={(value) => update(index, { quantity: Number(value) })} />
            </Table.Td>
            <Table.Td>
              <NumberInput min={0} value={line.rate} onChange={(value) => update(index, { rate: Number(value) })} />
            </Table.Td>
            <Table.Td>
              <NumberInput min={0} value={line.discount} onChange={(value) => update(index, { discount: Number(value) })} />
            </Table.Td>
            <Table.Td>
              <ActionIcon variant="subtle" color="red" onClick={() => onChange(lines.filter((_, i) => i !== index))} aria-label="Remove line">
                <Trash2 size={16} />
              </ActionIcon>
            </Table.Td>
          </Table.Tr>
        ))}
        <Table.Tr>
          <Table.Td colSpan={6}>
            <ActionIcon variant="light" color="warm" onClick={() => onChange([...lines, { productId: '', description: '', quantity: 1, rate: 0, discount: 0 }])} aria-label="Add line">
              <Plus size={16} />
            </ActionIcon>
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
}
