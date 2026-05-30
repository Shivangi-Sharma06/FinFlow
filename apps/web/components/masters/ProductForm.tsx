'use client';

import { Button, Group, Modal, NumberInput, Select, SimpleGrid, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { GST_RATES } from '@/lib/gst';

export function ProductForm({ opened, onClose, onSaved }: { opened: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [hsnSacCode, setHsnSacCode] = useState('');
  const [type, setType] = useState<'GOODS' | 'SERVICE'>('GOODS');
  const [unit, setUnit] = useState('pcs');
  const [gstRate, setGstRate] = useState(18);
  const [cessRate, setCessRate] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);

  async function save() {
    try {
      await apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify({ name, hsnSacCode, type, unit, gstRate, cessRate, purchasePrice, sellingPrice })
      });
      onSaved();
      onClose();
    } catch (error) {
      notifications.show({ color: 'red', title: 'Unable to save product', message: error instanceof Error ? error.message : 'Try again' });
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Add product" centered>
      <SimpleGrid cols={2}>
        <TextInput label="Name" value={name} onChange={(event) => setName(event.currentTarget.value)} />
        <TextInput label="HSN/SAC" value={hsnSacCode} onChange={(event) => setHsnSacCode(event.currentTarget.value)} />
        <Select label="Type" data={['GOODS', 'SERVICE']} value={type} onChange={(value) => setType((value ?? 'GOODS') as 'GOODS' | 'SERVICE')} />
        <TextInput label="Unit" value={unit} onChange={(event) => setUnit(event.currentTarget.value)} />
        <Select label="GST rate" data={GST_RATES.map((rate) => ({ value: String(rate), label: `${rate}%` }))} value={String(gstRate)} onChange={(value) => setGstRate(Number(value))} />
        <NumberInput label="Cess rate" value={cessRate} onChange={(value) => setCessRate(Number(value))} />
        <NumberInput label="Purchase price" value={purchasePrice} onChange={(value) => setPurchasePrice(Number(value))} />
        <NumberInput label="Selling price" value={sellingPrice} onChange={(value) => setSellingPrice(Number(value))} />
      </SimpleGrid>
      <Group justify="flex-end" mt="lg">
        <Button onClick={() => void save()} color="white" c="#1f1a17">
          Save
        </Button>
      </Group>
    </Modal>
  );
}
