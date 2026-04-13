import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Create Default Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  await prisma.user.upsert({
    where: { email: 'admin@pharma.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@pharma.com',
      passwordHash,
      role: 'Admin'
    }
  });

  // 2. Sample Medicines List
  const sampleMedicines = [
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', manufacturer: 'PharmaCorp', dosageForm: 'Tablet', storageCondition: 'Room Temp', initialPotency: 100 },
    { name: 'Amoxicillin 250mg', genericName: 'Amoxicillin Trihydrate', manufacturer: 'BioHeal', dosageForm: 'Capsule', storageCondition: 'Cool & Dry', initialPotency: 100 },
    { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', manufacturer: 'MediLife', dosageForm: 'Tablet', storageCondition: 'Room Temp', initialPotency: 100 },
    { name: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', manufacturer: 'CureAll', dosageForm: 'Tablet', storageCondition: 'Room Temp', initialPotency: 100 },
    { name: 'Azithromycin 500mg', genericName: 'Azithromycin', manufacturer: 'MaxPharma', dosageForm: 'Tablet', storageCondition: 'Room Temp', initialPotency: 100 }
  ];

  const dbMedicines = [];
  for (const med of sampleMedicines) {
    const createdMed = await prisma.medicine.create({ data: med });
    dbMedicines.push(createdMed);
  }

  // 3. Create precisely 50 Batches (Range 101-150)
  for (let i = 0; i < 50; i++) {
    const batchId = 101 + i;
    const medAssigned = dbMedicines[i % 5];
    
    // Distribute expiry dates (some expired, some critical, some early warning, some safe)
    const now = new Date();
    const manufactureDate = new Date();
    manufactureDate.setMonth(now.getMonth() - (6 + (i % 12))); // Manuf 6-18 months ago

    const expiryDate = new Date(manufactureDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 2); // 2 years expiry standard

    // For demonstration of alerts:
    // Some batches will expire very soon (Critical)
    if (i === 1) expiryDate.setDate(now.getDate() + 5);
    // Some will expire in 3 months (Early Warning)
    if (i === 2) expiryDate.setMonth(now.getMonth() + 3);

    const createdBatch = await prisma.batch.create({
      data: {
        id: batchId,
        medicineId: medAssigned.id,
        manufactureDate,
        expiryDate
      }
    });

    // Generate simulated Stability Tests for the batch
    const intervals = [0, 3, 6, 9, 12];
    let potency = medAssigned.initialPotency;

    for (const month of intervals) {
      if (month > 0) {
        // Degrade linearly roughly 0.5 - 1.5% per 3 months
        potency -= Math.random() + 0.5;
      }

      await prisma.stabilityTest.create({
        data: {
          batchId: createdBatch.id,
          interval: month,
          storageCondition: medAssigned.storageCondition,
          testDate: new Date(manufactureDate.setMonth(manufactureDate.getMonth() + (month > 0 ? 3 : 0))),
          results: {
            create: {
              assayPotency: Number(potency.toFixed(2)),
              dissolution: 98.5 - (month * 0.1),
              pHLevel: 5.5 + (month * 0.02),
              moistureContent: 2.1 + (month * 0.05),
              impurityLevel: 0.1 + (month * 0.15),
              microbialLimit: 10,
              passFail: potency >= 90 // Fail if too degraded
            }
          }
        }
      });
    }
  }

  console.log('Seeding Completed: 50 batches created with mock stability data.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
