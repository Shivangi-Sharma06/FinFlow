import { AppShellWrapper } from '@/components/layout/AppShellWrapper';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShellWrapper>{children}</AppShellWrapper>;
}
