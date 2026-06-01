'use client';

import { Button, Group, Paper, Select, SimpleGrid, Stack, Text, Textarea, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Save, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { calculateInvoiceTotals, calculateLineItemTax, isInterStateSupply } from '@/lib/gst';
import type { Branch, Customer, Product } from '@/types';
import { DraftLine, InvoiceLineItems } from './InvoiceLineItems';
import { InvoiceSummary } from './InvoiceSummary';

export function InvoiceForm() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchId, setBranchId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('Payment due as per agreed credit terms.');
  const [lines, setLines] = useState<DraftLine[]>([{ productId: '', description: '', quantity: 1, rate: 0, discount: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [branchRes, customerRes, productRes] = await Promise.all([
          apiFetch<{ branches: Branch[] }>('/api/branches'),
          apiFetch<{ customers: Customer[] }>('/api/customers'),
          apiFetch<{ products: Product[] }>('/api/products')
        ]);
        setBranches(branchRes.branches);
        setCustomers(customerRes.customers);
        setProducts(productRes.products);
        setBranchId(branchRes.branches[0]?.id ?? '');
        setCustomerId(customerRes.customers[0]?.id ?? '');
      } catch (error) {
        notifications.show({ color: 'red', title: 'Unable to load invoice data', message: error instanceof Error ? error.message : 'Try again' });
      }
    }
    void load();
  }, []);

  const selectedBranch = branches.find((branch) => branch.id === branchId);
  const selectedCustomer = customers.find((customer) => customer.id === customerId);
  const isInterState = selectedBranch && selectedCustomer ? isInterStateSupply(selectedBranch.stateCode, selectedCustomer.billingStateCode) : false;
  const totals = useMemo(() => {
    const taxes = lines.map((line) => {
      const product = products.find((candidate) => candidate.id === line.productId);
      return calculateLineItemTax(
        {
          quantity: line.quantity,
          rate: line.rate,
          discount: line.discount,
          gstRate: Number(product?.gstRate ?? 0),
          cessRate: Number(product?.cessRate ?? 0)
        },
        Boolean(isInterState)
      );
    });
    return calculateInvoiceTotals(taxes);
  }, [isInterState, lines, products]);

  async function submit(issue: boolean) {
    setSaving(true);
    try {
      const payload = { branchId, customerId, invoiceDate, dueDate: dueDate || undefined, notes, termsConditions, issue, items: lines.filter((line) => line.productId) };
      const response = await apiFetch<{ invoice: { id: string } }>('/api/invoices', { method: 'POST', body: JSON.stringify(payload) });
      notifications.show({ color: 'green', title: issue ? 'Invoice issued' : 'Draft saved', message: 'GST totals were recalculated on the server.' });
      router.push(`/invoices/${response.invoice.id}`);
    } catch (error) {
      notifications.show({ color: 'red', title: 'Invoice failed', message: error instanceof Error ? error.message : 'Try again' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack>
      <Paper className="surface" p="lg">
        <Stack>
          <Title order={2}>Invoice Details</Title>
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Select label="Branch" data={branches.map((branch) => ({ value: branch.id, label: branch.name }))} value={branchId} onChange={(value) => setBranchId(value ?? '')} />
            <Select label="Customer" data={customers.map((customer) => ({ value: customer.id, label: `${customer.name} | ${customer.billingState}` }))} value={customerId} onChange={(value) => setCustomerId(value ?? '')} />
            <TextInput label="Invoice date" type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.currentTarget.value)} />
            <TextInput label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.currentTarget.value)} />
          </SimpleGrid>
          <Text c="#4b3b41" size="sm">
            {isInterState ? 'Inter-state supply (IGST)' : 'Intra-state supply (CGST + SGST)'}
          </Text>
        </Stack>
      </Paper>
      <Paper className="surface" p="lg">
        <Stack>
          <Title order={2}>Line Items</Title>
          <InvoiceLineItems products={products} lines={lines} onChange={setLines} />
        </Stack>
      </Paper>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper className="surface" p="lg">
          <Stack>
            <Textarea label="Notes" value={notes} onChange={(event) => setNotes(event.currentTarget.value)} />
            <Textarea label="Terms & conditions" value={termsConditions} onChange={(event) => setTermsConditions(event.currentTarget.value)} />
          </Stack>
        </Paper>
        <InvoiceSummary totals={totals} isInterState={Boolean(isInterState)} />
      </SimpleGrid>
      <Group justify="flex-end">
        <Button variant="filled" color="warm" leftSection={<Save size={16} />} loading={saving} onClick={() => void submit(false)}>
          Save draft
        </Button>
        <Button color="warm" leftSection={<Send size={16} />} loading={saving} onClick={() => void submit(true)}>
          Issue invoice
        </Button>
      </Group>
    </Stack>
  );
}
