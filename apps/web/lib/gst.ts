export const INDIAN_STATES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction'
};

export const GST_RATES = [0, 5, 12, 18, 28] as const;

export interface LineItemInput {
  quantity: number;
  rate: number;
  discount: number;
  gstRate: number;
  cessRate: number;
}

export interface LineItemTax {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  lineTotal: number;
}

export function calculateLineItemTax(item: LineItemInput, isInterState: boolean): LineItemTax {
  const taxableAmount = Math.max(0, item.quantity * item.rate - item.discount);
  const cgst = isInterState ? 0 : round2((taxableAmount * (item.gstRate / 2)) / 100);
  const sgst = isInterState ? 0 : round2((taxableAmount * (item.gstRate / 2)) / 100);
  const igst = isInterState ? round2((taxableAmount * item.gstRate) / 100) : 0;
  const cess = item.cessRate > 0 ? round2((taxableAmount * item.cessRate) / 100) : 0;
  return { taxableAmount: round2(taxableAmount), cgst, sgst, igst, cess, lineTotal: round2(taxableAmount + cgst + sgst + igst + cess) };
}

export function isInterStateSupply(branchStateCode: string, customerStateCode: string): boolean {
  return branchStateCode !== customerStateCode;
}

export function calculateInvoiceTotals(items: LineItemTax[]) {
  const subtotal = items.reduce((sum, item) => sum + item.taxableAmount, 0);
  const totalCgst = items.reduce((sum, item) => sum + item.cgst, 0);
  const totalSgst = items.reduce((sum, item) => sum + item.sgst, 0);
  const totalIgst = items.reduce((sum, item) => sum + item.igst, 0);
  const totalCess = items.reduce((sum, item) => sum + item.cess, 0);
  const grandTotal = subtotal + totalCgst + totalSgst + totalIgst + totalCess;
  const roundOff = round2(Math.round(grandTotal) - grandTotal);
  return { subtotal: round2(subtotal), totalCgst: round2(totalCgst), totalSgst: round2(totalSgst), totalIgst: round2(totalIgst), totalCess: round2(totalCess), roundOff, grandTotal: round2(grandTotal + roundOff) };
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
