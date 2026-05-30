'use client';

import { Anchor, Box, Button, Divider, Group, Stack, Text } from '@mantine/core';
import { Building2, FileText, Gauge, Landmark, LogOut, Package, ReceiptText, Users, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearStoredToken } from '@/lib/api';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/credit-notes', label: 'Credit Notes', icon: ReceiptText },
  { href: '/debit-notes', label: 'Debit Notes', icon: WalletCards },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/vendors', label: 'Vendors', icon: Landmark },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/branches', label: 'Branches', icon: Building2 },
  { href: '/users', label: 'Users', icon: Users }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <Stack h="100%" gap="md">
      <Box>
        <Text size="lg" fw={500} c="#f7f5f0">
          LedgerX
        </Text>
        <Text size="xs" c="#aea69c" ff="monospace">
          GST command center
        </Text>
      </Box>
      <Divider color="#3f3a36" />
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
              bg={active ? '#383330' : 'transparent'}
              c={active ? '#f7f5f0' : '#c9c0ad'}
              style={{ borderRadius: 3, border: active ? '1px solid #3f3a36' : '1px solid transparent' }}
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
        Sign out
      </Button>
    </Stack>
  );
}
