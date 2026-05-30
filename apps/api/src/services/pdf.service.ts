import { Document, Page, StyleSheet, Text, View, renderToStream } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import React from 'react';

type InvoicePdf = {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  placeOfSupply: string;
  placeOfSupplyCode: string;
  isInterState: boolean;
  subtotal: unknown;
  totalCgst: unknown;
  totalSgst: unknown;
  totalIgst: unknown;
  totalCess: unknown;
  roundOff: unknown;
  grandTotal: unknown;
  notes: string | null;
  termsConditions: string | null;
  organisation: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstin: string;
  };
  branch: {
    name: string;
    gstin: string | null;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  customer: {
    name: string;
    gstin: string | null;
    billingAddress: string;
    billingCity: string;
    billingState: string;
    billingPincode: string;
  };
  items: Array<{
    description: string | null;
    hsnSacCode: string;
    quantity: unknown;
    unit: string;
    rate: unknown;
    discount: unknown;
    taxableAmount: unknown;
    gstRate: unknown;
    cess: unknown;
    cgst: unknown;
    sgst: unknown;
    igst: unknown;
    lineTotal: unknown;
  }>;
};

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: 'Helvetica', color: '#201b18' },
  row: { flexDirection: 'row' },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
  h2: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
  muted: { color: '#5f5750' },
  box: { border: '1px solid #d8d2c8', padding: 8, marginTop: 12 },
  table: { marginTop: 14, border: '1px solid #d8d2c8' },
  th: { backgroundColor: '#f1ede5', fontWeight: 700 },
  cell: { padding: 4, borderRight: '1px solid #d8d2c8', borderBottom: '1px solid #d8d2c8' },
  summary: { marginLeft: 'auto', marginTop: 12, width: 210, border: '1px solid #d8d2c8' },
  total: { fontWeight: 700, fontSize: 11 },
  footer: { position: 'absolute', bottom: 24, left: 28, right: 28, textAlign: 'center', color: '#5f5750', fontSize: 8 }
});

export async function renderInvoicePdf(invoice: InvoicePdf) {
  const document = InvoicePdfDocument({ invoice }) as React.ReactElement<DocumentProps>;
  return renderToStream(document);
}

function InvoicePdfDocument({ invoice }: { invoice: InvoicePdf }): React.ReactElement {
  const taxHeader = invoice.isInterState ? ['IGST %', 'IGST Amt'] : ['CGST %', 'CGST Amt', 'SGST %', 'SGST Amt'];
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.between },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.h1 }, invoice.organisation.name),
          React.createElement(Text, null, `${invoice.organisation.address}, ${invoice.organisation.city}`),
          React.createElement(Text, null, `${invoice.organisation.state} ${invoice.organisation.pincode}`),
          React.createElement(Text, null, `GSTIN: ${invoice.organisation.gstin}`),
          React.createElement(Text, { style: styles.muted }, `Branch: ${invoice.branch.name}${invoice.branch.gstin ? ` | ${invoice.branch.gstin}` : ''}`)
        ),
        React.createElement(
          View,
          { style: { textAlign: 'right' } },
          React.createElement(Text, { style: styles.h1 }, 'TAX INVOICE'),
          React.createElement(Text, null, invoice.invoiceNumber),
          React.createElement(Text, null, `Date: ${formatDate(invoice.invoiceDate)}`),
          React.createElement(Text, null, `Due: ${invoice.dueDate ? formatDate(invoice.dueDate) : '-'}`)
        )
      ),
      React.createElement(
        View,
        { style: styles.between },
        React.createElement(
          View,
          { style: [styles.box, { flex: 1 }] },
          React.createElement(Text, { style: styles.h2 }, 'Bill To'),
          React.createElement(Text, null, invoice.customer.name),
          React.createElement(Text, null, invoice.customer.billingAddress),
          React.createElement(Text, null, `${invoice.customer.billingCity}, ${invoice.customer.billingState} ${invoice.customer.billingPincode}`),
          React.createElement(Text, null, `GSTIN: ${invoice.customer.gstin ?? '-'}`)
        ),
        React.createElement(
          View,
          { style: [styles.box, { flex: 1 }] },
          React.createElement(Text, { style: styles.h2 }, 'Supply'),
          React.createElement(Text, null, `Place: ${invoice.placeOfSupply} (${invoice.placeOfSupplyCode})`),
          React.createElement(Text, null, invoice.isInterState ? 'Inter-state supply (IGST)' : 'Intra-state supply (CGST + SGST)')
        )
      ),
      React.createElement(
        View,
        { style: styles.table },
        row(['S.No', 'Description', 'HSN/SAC', 'Qty', 'Rate', 'Disc', 'Taxable', ...taxHeader, 'Cess', 'Total'], true),
        ...invoice.items.map((item, index) =>
          row([
            String(index + 1),
            item.description ?? '-',
            item.hsnSacCode,
            `${money(item.quantity)} ${item.unit}`,
            money(item.rate),
            money(item.discount),
            money(item.taxableAmount),
            ...(invoice.isInterState
              ? [money(item.gstRate), money(item.igst)]
              : [money(Number(item.gstRate) / 2), money(item.cgst), money(Number(item.gstRate) / 2), money(item.sgst)]),
            money(item.cess),
            money(item.lineTotal)
          ])
        )
      ),
      React.createElement(
        View,
        { style: styles.summary },
        summaryRow('Subtotal', invoice.subtotal),
        !invoice.isInterState ? summaryRow('CGST', invoice.totalCgst) : null,
        !invoice.isInterState ? summaryRow('SGST', invoice.totalSgst) : null,
        invoice.isInterState ? summaryRow('IGST', invoice.totalIgst) : null,
        Number(invoice.totalCess) > 0 ? summaryRow('Cess', invoice.totalCess) : null,
        summaryRow('Round off', invoice.roundOff),
        summaryRow('Grand Total', invoice.grandTotal, true)
      ),
      React.createElement(Text, { style: { marginTop: 12 } }, `Amount in words: Rupees ${numberToWords(Math.round(Number(invoice.grandTotal)))} Only`),
      invoice.notes ? React.createElement(Text, { style: { marginTop: 10 } }, `Notes: ${invoice.notes}`) : null,
      invoice.termsConditions ? React.createElement(Text, { style: { marginTop: 4 } }, `Terms: ${invoice.termsConditions}`) : null,
      React.createElement(Text, { style: styles.footer }, 'This is a computer-generated invoice')
    )
  );
}

function row(values: string[], header = false) {
  return React.createElement(
    View,
    { style: [styles.row, header ? styles.th : {}] },
    ...values.map((value, index) =>
      React.createElement(Text, { key: `${value}-${index}`, style: [styles.cell, { flex: index === 1 ? 2 : 1 }] }, value)
    )
  );
}

function summaryRow(label: string, value: unknown, total = false) {
  return React.createElement(
    View,
    { style: [styles.between, { padding: 5, borderBottom: '1px solid #d8d2c8' }] },
    React.createElement(Text, { style: total ? styles.total : {} }, label),
    React.createElement(Text, { style: total ? styles.total : {} }, money(value))
  );
}

function money(value: unknown) {
  return Number(value).toFixed(2);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(value);
}

function numberToWords(value: number): string {
  if (value === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const words = (n: number): string => {
    if (n < 20) return ones[n] ?? '';
    if (n < 100) return `${tens[Math.floor(n / 10)] ?? ''} ${ones[n % 10] ?? ''}`.trim();
    if (n < 1000) return `${ones[Math.floor(n / 100)] ?? ''} Hundred ${words(n % 100)}`.trim();
    if (n < 100000) return `${words(Math.floor(n / 1000))} Thousand ${words(n % 1000)}`.trim();
    if (n < 10000000) return `${words(Math.floor(n / 100000))} Lakh ${words(n % 100000)}`.trim();
    return `${words(Math.floor(n / 10000000))} Crore ${words(n % 10000000)}`.trim();
  };
  return words(value).replace(/\s+/g, ' ');
}
