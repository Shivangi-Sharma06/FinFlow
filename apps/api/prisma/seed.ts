import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.creditNoteItem.deleteMany();
  await prisma.creditNote.deleteMany();
  await prisma.debitNoteItem.deleteMany();
  await prisma.debitNote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.organisation.deleteMany();

  const organisation = await prisma.organisation.create({
    data: {
      name: 'Demo Corp',
      gstin: '27AABCU9603R1ZX',
      pan: 'AABCU9603R',
      address: '42 Market Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400001',
      email: 'accounts@democorp.com',
      phone: '+91 22 4000 1000'
    }
  });

  const [mumbai, bangalore, delhi] = await Promise.all([
    prisma.branch.create({
      data: {
        organisationId: organisation.id,
        name: 'Mumbai HQ',
        code: 'MUM',
        gstin: '27AABCU9603R1ZX',
        address: '42 Market Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        stateCode: '27',
        pincode: '400001'
      }
    }),
    prisma.branch.create({
      data: {
        organisationId: organisation.id,
        name: 'Bangalore Branch',
        code: 'BLR',
        gstin: '29AABCU9603R1ZV',
        address: '18 Residency Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        stateCode: '29',
        pincode: '560025'
      }
    }),
    prisma.branch.create({
      data: {
        organisationId: organisation.id,
        name: 'Delhi Branch',
        code: 'DEL',
        gstin: '07AABCU9603R1Z2',
        address: '11 Nehru Place',
        city: 'New Delhi',
        state: 'Delhi',
        stateCode: '07',
        pincode: '110019'
      }
    })
  ]);

  await Promise.all([
    prisma.user.create({
      data: {
        organisationId: organisation.id,
        branchId: null,
        name: 'Demo Super Admin',
        email: 'admin@democorp.com',
        passwordHash: await bcrypt.hash('Admin@1234', 12),
        role: 'SUPER_ADMIN'
      }
    }),
    prisma.user.create({
      data: {
        organisationId: organisation.id,
        branchId: mumbai.id,
        name: 'Mumbai Accountant',
        email: 'accountant@democorp.com',
        passwordHash: await bcrypt.hash('Account@1234', 12),
        role: 'ACCOUNTANT'
      }
    }),
    prisma.user.create({
      data: {
        organisationId: organisation.id,
        branchId: bangalore.id,
        name: 'Bangalore Manager',
        email: 'manager@democorp.com',
        passwordHash: await bcrypt.hash('Manager@1234', 12),
        role: 'BRANCH_MANAGER'
      }
    })
  ]);

  await prisma.customer.createMany({
    data: [
      {
        organisationId: organisation.id,
        name: 'Maharashtra Retailers',
        gstin: '27AADCM1234A1Z5',
        billingAddress: '12 Linking Road',
        billingCity: 'Mumbai',
        billingState: 'Maharashtra',
        billingStateCode: '27',
        billingPincode: '400050',
        email: 'billing@maharetail.example'
      },
      {
        organisationId: organisation.id,
        name: 'Karnataka Traders',
        gstin: '29AADCK5678B1Z3',
        billingAddress: '55 MG Road',
        billingCity: 'Bengaluru',
        billingState: 'Karnataka',
        billingStateCode: '29',
        billingPincode: '560001'
      },
      {
        organisationId: organisation.id,
        name: 'Delhi Wholesale Co',
        gstin: '07AADCD9876C1Z8',
        billingAddress: '21 Chandni Chowk',
        billingCity: 'New Delhi',
        billingState: 'Delhi',
        billingStateCode: '07',
        billingPincode: '110006'
      },
      {
        organisationId: organisation.id,
        name: 'Tamil Nadu Stores',
        gstin: '33AADCT5555D1Z1',
        billingAddress: '88 Anna Salai',
        billingCity: 'Chennai',
        billingState: 'Tamil Nadu',
        billingStateCode: '33',
        billingPincode: '600002'
      },
      {
        organisationId: organisation.id,
        name: 'Goa Resorts Supply',
        gstin: '30AADCG2222E1Z6',
        billingAddress: '7 Beach Road',
        billingCity: 'Panaji',
        billingState: 'Goa',
        billingStateCode: '30',
        billingPincode: '403001'
      }
    ]
  });

  await prisma.vendor.createMany({
    data: [
      vendor(organisation.id, 'Prime Packaging', '27AAACP1111A1Z1', 'Maharashtra', '27', 'Mumbai'),
      vendor(organisation.id, 'Kaveri Logistics', '29AAACK2222B1Z2', 'Karnataka', '29', 'Bengaluru'),
      vendor(organisation.id, 'North Office Supplies', '07AAACN3333C1Z3', 'Delhi', '07', 'New Delhi'),
      vendor(organisation.id, 'Coromandel Services', '33AAACC4444D1Z4', 'Tamil Nadu', '33', 'Chennai'),
      vendor(organisation.id, 'Western Components', '24AAACW5555E1Z5', 'Gujarat', '24', 'Ahmedabad')
    ]
  });

  await prisma.product.createMany({
    data: [
      product(organisation.id, 'Rice 25kg Bag', '1006', 'GOODS', 'bag', 0, 0, 1200, 1350),
      product(organisation.id, 'Tea Pack', '0902', 'GOODS', 'box', 5, 0, 80, 120),
      product(organisation.id, 'Stationery Kit', '4820', 'GOODS', 'pcs', 12, 0, 250, 420),
      product(organisation.id, 'Accounting Consultation', '9982', 'SERVICE', 'hr', 18, 0, 800, 1500),
      product(organisation.id, 'Premium Appliance', '8516', 'GOODS', 'pcs', 28, 0, 12000, 18500),
      product(organisation.id, 'Luxury Tobacco Case', '2402', 'GOODS', 'pcs', 28, 12, 950, 1400),
      product(organisation.id, 'Cloud Subscription', '9983', 'SERVICE', 'month', 18, 0, 300, 799),
      product(organisation.id, 'Cotton Fabric', '5208', 'GOODS', 'mtr', 5, 0, 90, 140),
      product(organisation.id, 'Industrial Tool', '8205', 'GOODS', 'pcs', 18, 0, 850, 1299),
      product(organisation.id, 'Repair Service', '9987', 'SERVICE', 'job', 12, 0, 400, 950)
    ]
  });

  void delhi;
}

function vendor(organisationId: string, name: string, gstin: string, state: string, stateCode: string, city: string) {
  return {
    organisationId,
    name,
    gstin,
    billingAddress: 'Supplier Market',
    billingCity: city,
    billingState: state,
    billingStateCode: stateCode,
    billingPincode: '000000'
  };
}

function product(
  organisationId: string,
  name: string,
  hsnSacCode: string,
  type: 'GOODS' | 'SERVICE',
  unit: string,
  gstRate: number,
  cessRate: number,
  purchasePrice: number,
  sellingPrice: number
) {
  return { organisationId, name, hsnSacCode, type, unit, gstRate, cessRate, purchasePrice, sellingPrice };
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Seed failed'}\n`);
    await prisma.$disconnect();
    process.exit(1);
  });
