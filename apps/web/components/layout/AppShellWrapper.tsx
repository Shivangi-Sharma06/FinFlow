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
        main: { background: '#2b2622', color: '#f7f5f0' },
        header: { background: '#2b2622', borderColor: '#3f3a36' },
        navbar: { background: '#2b2622', borderColor: '#3f3a36', padding: 16 }
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="xl">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="#f7f5f0" />
          <Text c="#c9c0ad" size="sm">
            Multi-branch accounting, GST-first
          </Text>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main>{authChecked ? children : <Text c="#c9c0ad">Loading workspace...</Text>}</AppShell.Main>
    </AppShell>
  );
}
