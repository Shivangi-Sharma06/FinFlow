'use client';

import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { getStoredToken } from '@/lib/api';

export function AppShellWrapper({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      router.replace('/login');
      return;
    }

    setAuthChecked(true);
  }, [router]);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="xl"
      styles={{
        main: { background: '#e6dfe4', color: '#111111' },
        header: { background: '#e6dfe4', borderColor: '#e8d6dd' },
        navbar: { background: '#e6dfe4', borderColor: '#e8d6dd', padding: 16 }
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="xl">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="#111111" />
          <Text c="#4b3b41" size="sm">
            GST-ready accounting across branches and organisations
          </Text>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main>{authChecked ? children : <Text c="#4b3b41">Securing your workspace...</Text>}</AppShell.Main>
    </AppShell>
  );
}
