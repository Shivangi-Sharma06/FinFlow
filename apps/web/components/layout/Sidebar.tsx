'use client';

import { Anchor, Box, Button, Divider, Group, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Building2, FileText, Gauge, Landmark, LogOut, Package, ReceiptText, UserRound, Users, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch, clearStoredToken, setStoredToken, switchOrganisation } from '@/lib/api';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/credit-notes', label: 'Credit Notes', icon: ReceiptText },
  { href: '/debit-notes', label: 'Debit Notes', icon: WalletCards },
  { href: '/customers', label: 'Customers', icon: UserRound },
  { href: '/vendors', label: 'Vendors', icon: Landmark },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/branches', label: 'Branches', icon: Building2 },
  { href: '/users', label: 'Users', icon: Users }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [organisations, setOrganisations] = useState<Array<{ id: string; name: string }>>([]);
  const [activeOrganisationId, setActiveOrganisationId] = useState('');
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const loadAuthContext = async () => {
      try {
        const me = await apiFetch<{
          user: { organisationId: string; isPlatformAdmin?: boolean; availableOrganisations?: Array<{ id: string; name: string }> };
        }>('/api/auth/me');
        const platformAdmin = Boolean(me.user.isPlatformAdmin);
        setIsPlatformAdmin(platformAdmin);
        setActiveOrganisationId(me.user.organisationId);
        setOrganisations(me.user.availableOrganisations ?? [{ id: me.user.organisationId, name: 'Current organisation' }]);
      } catch {
        setIsPlatformAdmin(false);
      }
    };

    void loadAuthContext();
  }, []);

  const canSwitch = isPlatformAdmin && organisations.length > 1;

  async function handleSwitchOrganisation() {
    if (!activeOrganisationId) return;
    setSwitching(true);
    try {
      const result = await switchOrganisation(activeOrganisationId);
      setStoredToken(result.sessionToken);
      notifications.show({ color: 'green', title: 'Organisation switched', message: 'Context updated successfully.' });
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Switch failed',
        message: error instanceof Error ? error.message : 'Unable to switch organisation'
      });
    } finally {
      setSwitching(false);
    }
  }

  return (
    <Stack h="100%" gap="md">
      <Box>
        <Text size="lg" fw={500} c="#111111">
          LedgerX
        </Text>
        <Text size="xs" c="#6b5a61" ff="monospace">
          Business accounting hub
        </Text>
      </Box>
      <Divider color="#e8d6dd" />
      {canSwitch ? (
        <Stack gap="xs">
          <Text size="xs" c="#6b5a61" tt="uppercase" fw={600}>
            Active Organisation
          </Text>
          <Select
            data={organisations.map((org) => ({ value: org.id, label: org.name }))}
            value={activeOrganisationId}
            onChange={(value) => setActiveOrganisationId(value ?? '')}
            size="xs"
            placeholder="Select organisation"
          />
          <Button size="xs" variant="light" color="warm" loading={switching} onClick={handleSwitchOrganisation}>
            Switch organisation
          </Button>
          <Divider color="#e8d6dd" />
        </Stack>
      ) : null}
      <Stack gap={4} flex={1}>
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname.startsWith(link.href);
          return (
            <Anchor
              key={link.href}
              component={Link}
              href={link.href}
              px="sm"
              py={8}
              bg={active ? '#f2dce5' : 'transparent'}
              c={active ? '#111111' : '#4b3b41'}
              style={{ borderRadius: 3, border: active ? '1px solid #ddbfcb' : '1px solid transparent' }}
            >
              <Group gap="sm">
                <Icon size={16} />
                <Text size="sm" fw={500}>
                  {link.label}
                </Text>
              </Group>
            </Anchor>
          );
        })}
      </Stack>
      <Button
        variant="subtle"
        color="warm"
        leftSection={<LogOut size={16} />}
        onClick={() => {
          clearStoredToken();
          router.push('/login');
        }}
      >
        Log out
      </Button>
    </Stack>
  );
}
