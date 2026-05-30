import { Table, Text } from '@mantine/core';

type Row = {
  branchId: string;
  branchName: string;
  invoices: number;
  revenue: number;
  outstanding: number;
};

export function BranchSummaryTable({ rows }: { rows: Row[] }) {
  return (
    <div className="tableWrap">
      <Table highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Branch</Table.Th>
            <Table.Th>Invoices</Table.Th>
            <Table.Th>Revenue</Table.Th>
            <Table.Th>Outstanding</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.branchId}>
              <Table.Td>{row.branchName}</Table.Td>
              <Table.Td>{row.invoices}</Table.Td>
              <Table.Td>{currency(row.revenue)}</Table.Td>
              <Table.Td>{currency(row.outstanding)}</Table.Td>
            </Table.Tr>
          ))}
          {rows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text c="#aea69c" ta="center">
                  No branch activity yet
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : null}
        </Table.Tbody>
      </Table>
    </div>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}
