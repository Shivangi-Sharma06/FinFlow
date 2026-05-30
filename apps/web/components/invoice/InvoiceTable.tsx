'use client';

import { Anchor, Badge, Button, Group, Table, Text } from '@mantine/core';
import { Download, Eye } from 'lucide-react';
import Link from 'next/link';
import { apiPdfUrl, getStoredToken } from '@/lib/api';
import type { Invoice } from '@/types';

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="tableWrap">
      <Table highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Invoice No</Table.Th>
            <Table.Th>Customer</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invoices.map((invoice) => (
            <Table.Tr key={invoice.id}>
              <Table.Td>{invoice.invoiceNumber}</Table.Td>
              <Table.Td>{invoice.customer?.name ?? '-'}</Table.Td>
              <Table.Td>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</Table.Td>
              <Table.Td>{currency(Number(invoice.grandTotal))}</Table.Td>
              <Table.Td>
                <Badge variant="light" color={invoice.status === 'PAID' ? 'green' : invoice.status === 'CANCELLED' ? 'red' : 'warm'}>
                  {invoice.status}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Button component={Link} href={`/invoices/${invoice.id}`} size="xs" variant="subtle" leftSection={<Eye size={14} />}>
                    View
                  </Button>
                  <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<Download size={14} />}
                    onClick={() => {
                      const token = getStoredToken();
                      window.open(`${apiPdfUrl(invoice.id)}${token ? `?token=${token}` : ''}`, '_blank');
                    }}
                  >
                    PDF
                  </Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {invoices.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text ta="center" c="#aea69c">
                  No invoices yet
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : null}
        </Table.Tbody>
      </Table>
    </div>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}
