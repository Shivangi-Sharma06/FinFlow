import { Paper, Stack, Text } from '@mantine/core';

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper className="surface" p="lg">
      <Stack gap={4}>
        <Text size="xs" c="#aea69c" tt="uppercase" ff="monospace">
          {label}
        </Text>
        <Text size="xl" c="#f7f5f0" fw={500}>
          {value}
        </Text>
      </Stack>
    </Paper>
  );
}
