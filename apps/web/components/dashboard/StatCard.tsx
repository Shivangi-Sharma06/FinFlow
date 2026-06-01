import { Paper, Stack, Text } from '@mantine/core';

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper className="surface" p="lg">
      <Stack gap={4}>
        <Text size="xs" c="#6b5a61" tt="uppercase" ff="monospace">
          {label}
        </Text>
        <Text size="xl" c="#111111" fw={500}>
          {value}
        </Text>
      </Stack>
    </Paper>
  );
}
