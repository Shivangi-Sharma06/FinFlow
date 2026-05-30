import { describe, expect, it } from 'vitest';
import { calculateInvoiceTotals, calculateLineItemTax, isInterStateSupply } from './gst.service.js';

describe('GST calculations', () => {
  it('splits GST into CGST and SGST for intra-state supply', () => {
    const tax = calculateLineItemTax({ quantity: 2, rate: 1000, discount: 100, gstRate: 18, cessRate: 0 }, false);
    expect(tax).toEqual({ taxableAmount: 1900, cgst: 171, sgst: 171, igst: 0, cess: 0, lineTotal: 2242 });
  });

  it('uses IGST only for inter-state supply', () => {
    const tax = calculateLineItemTax({ quantity: 2, rate: 1000, discount: 100, gstRate: 18, cessRate: 0 }, true);
    expect(tax).toEqual({ taxableAmount: 1900, cgst: 0, sgst: 0, igst: 342, cess: 0, lineTotal: 2242 });
  });

  it('adds cess on top of GST', () => {
    const tax = calculateLineItemTax({ quantity: 1, rate: 1000, discount: 0, gstRate: 28, cessRate: 12 }, true);
    expect(tax.lineTotal).toBe(1400);
    expect(tax.cess).toBe(120);
  });

  it('rounds invoice totals with round-off', () => {
    const totals = calculateInvoiceTotals([
      calculateLineItemTax({ quantity: 1, rate: 999.4, discount: 0, gstRate: 18, cessRate: 0 }, true)
    ]);
    expect(totals.grandTotal).toBe(1179);
  });

  it('detects inter-state supply by state code', () => {
    expect(isInterStateSupply('27', '29')).toBe(true);
    expect(isInterStateSupply('29', '29')).toBe(false);
  });
});
