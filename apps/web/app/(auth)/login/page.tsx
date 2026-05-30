'use client';

import { Button, Center, Paper, PasswordInput, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Building2, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { setStoredToken } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organisationId, setOrganisationId] = useState('');
  const [organisationOptions, setOrganisationOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, organisationId: organisationId || undefined })
      });

      if (response.status === 409) {
        const data = (await response.json()) as { organisations?: Array<{ id: string; name: string }> };
        const options = (data.organisations ?? []).map((organisation) => ({
          value: organisation.id,
          label: organisation.name
        }));
        setOrganisationOptions(options);
        notifications.show({
          color: 'yellow',
          title: 'Select organisation',
          message: 'This account can access multiple organisations. Choose one to continue.'
        });
        return;
      }

      if (!response.ok) throw new Error('Invalid credentials');
      const data = (await response.json()) as { sessionToken: string };
      setStoredToken(data.sessionToken);
      router.push('/dashboard');
    } catch (error) {
      notifications.show({ color: 'red', title: 'Sign in failed', message: error instanceof Error ? error.message : 'Try again' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Center mih="100vh" bg="#322b26" p="xl">
      <Paper className="surface" p="xl" w="100%" maw={420}>
        <form onSubmit={submit}>
          <Stack>
            <div>
              <Title order={1} c="#f7f5f0">
                Welcome to LedgerX
              </Title>
              <Text c="#c9c0ad" size="sm">
                Sign in to your organisation workspace
              </Text>
            </div>
            <TextInput label="Work email" leftSection={<Mail size={16} />} value={email} onChange={(event) => setEmail(event.currentTarget.value)} required />
            <PasswordInput label="Password" leftSection={<Lock size={16} />} value={password} onChange={(event) => setPassword(event.currentTarget.value)} required />
            {organisationOptions.length > 0 ? (
              <Select
                label="Organisation"
                data={organisationOptions}
                leftSection={<Building2 size={16} />}
                value={organisationId}
                onChange={(value) => setOrganisationId(value ?? '')}
                placeholder="Select organisation"
                required
              />
            ) : (
              <TextInput
                label="Organisation ID (optional)"
                leftSection={<Building2 size={16} />}
                value={organisationId}
                onChange={(event) => setOrganisationId(event.currentTarget.value)}
                placeholder="Only required for platform admins"
              />
            )}
            <Button type="submit" loading={loading} color="white" c="#1f1a17">
              Continue to dashboard
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
