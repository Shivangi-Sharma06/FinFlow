import { Paper, Stack, Text } from '@mantine/core';

export function InvoiceSummary({
  totals,
  isInterState
}: {
  totals: { subtotal: number; totalCgst: number; totalSgst: number; totalIgst: number; totalCess: number; roundOff: number; grandTotal: number };
  isInterState: boolean;
}) {
  return (
    <Paper className="surface" p="lg">
      <Stack gap={6}>
        <Text size="sm" c="#4b3b41">
          {isInterState ? 'Inter-state supply (IGST)' : 'Intra-state supply (CGST + SGST)'}
        </Text>
        <Line label="Subtotal" value={totals.subtotal} />
        {isInterState ? <Line label="IGST" value={totals.totalIgst} /> : null}
        {!isInterState ? <Line label="CGST" value={totals.totalCgst} /> : null}
        {!isInterState ? <Line label="SGST" value={totals.totalSgst} /> : null}
        <Line label="Cess" value={totals.totalCess} />
        <Line label="Round off" value={totals.roundOff} />
        <Line label="Grand total" value={totals.grandTotal} strong />
      </Stack>
    </Paper>
  );
}

function Line({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <Text component="div" size={strong ? 'lg' : 'sm'} fw={strong ? 600 : 400} c={strong ? '#111111' : '#4b3b41'} style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{label}</span>
      <span>{currency(value)}</span>
    </Text>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}
