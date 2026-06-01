'use client';

import { Button, Modal, Select, SimpleGrid, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { INDIAN_STATES } from '@/lib/gst';

export function VendorForm({ opened, onClose, onSaved }: { opened: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [stateCode, setStateCode] = useState('27');
  const states = Object.entries(INDIAN_STATES).map(([value, label]) => ({ value, label: `${label} (${value})` }));
  async function save() {
    try {
      await apiFetch('/api/vendors', {
        method: 'POST',
        body: JSON.stringify({
          name,
          gstin,
          billingAddress: 'Address pending',
          billingCity: INDIAN_STATES[stateCode] ?? '',
          billingState: INDIAN_STATES[stateCode] ?? '',
          billingStateCode: stateCode,
          billingPincode: '000000'
        })
      });
      onSaved();
      onClose();
    } catch (error) {
      notifications.show({ color: 'red', title: 'Unable to save vendor', message: error instanceof Error ? error.message : 'Try again' });
    }
  }
  return (
    <Modal opened={opened} onClose={onClose} title="Add vendor" centered>
      <SimpleGrid cols={1}>
        <TextInput label="Name" value={name} onChange={(event) => setName(event.currentTarget.value)} />
        <TextInput label="GSTIN" value={gstin} onChange={(event) => setGstin(event.currentTarget.value)} />
        <Select label="State" data={states} value={stateCode} onChange={(value) => setStateCode(value ?? '27')} searchable />
        <Button onClick={() => void save()} color="warm">
          Save
        </Button>
      </SimpleGrid>
    </Modal>
  );
}
