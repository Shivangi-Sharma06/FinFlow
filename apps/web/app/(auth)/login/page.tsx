'use client';

import { Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { setStoredToken } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@democorp.com');
  const [password, setPassword] = useState('Admin@1234');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
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
    <Center mih="100vh" bg="#2b2622" p="xl">
      <Paper className="surface" p="xl" w="100%" maw={420}>
        <form onSubmit={submit}>
          <Stack>
            <div>
              <Title order={1} c="#f7f5f0">
                LedgerX
              </Title>
              <Text c="#c9c0ad" size="sm">
                Sign in to your accounting workspace
              </Text>
            </div>
            <TextInput label="Email" leftSection={<Mail size={16} />} value={email} onChange={(event) => setEmail(event.currentTarget.value)} required />
            <PasswordInput label="Password" leftSection={<Lock size={16} />} value={password} onChange={(event) => setPassword(event.currentTarget.value)} required />
            <Button type="submit" loading={loading} color="warm" c="#2b2622">
              Sign in
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
