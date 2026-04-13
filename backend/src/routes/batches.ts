import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all batches across all medicines, includes medicine detail
router.get('/', async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      include: { medicine: true, stabilityTests: true }
    });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get batch by ID with full test results
router.get('/:id', async (req, res) => {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        medicine: true,
        stabilityTests: {
          include: { results: true },
          orderBy: { interval: 'asc' }
        }
      }
    });
    if (!batch) return res.status(404).json({ error: 'Not found' });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new batch (Ensure ID 101-150 range per requirements)
router.post('/', async (req, res) => {
  try {
    const { id, medicineId, manufactureDate, expiryDate } = req.body;
    
    if (id < 101 || id > 150) {
      return res.status(400).json({ error: 'Batch ID must be between 101 and 150' });
    }

    const batch = await prisma.batch.create({
      data: {
        id: Number(id),
        medicineId: Number(medicineId),
        manufactureDate: new Date(manufactureDate),
        expiryDate: new Date(expiryDate)
      }
    });
    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
