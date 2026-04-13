import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all medicines with their batches
router.get('/', async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany({
      include: { batches: true }
    });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get medicine by ID
router.get('/:id', async (req, res) => {
  try {
    const medicine = await prisma.medicine.findUnique({
      where: { id: Number(req.params.id) },
      include: { batches: true }
    });
    if (!medicine) return res.status(404).json({ error: 'Not found' });
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new medicine
router.post('/', async (req, res) => {
  try {
    const { name, genericName, manufacturer, dosageForm, storageCondition, initialPotency } = req.body;
    const medicine = await prisma.medicine.create({
      data: {
        name,
        genericName,
        manufacturer,
        dosageForm,
        storageCondition,
        initialPotency
      }
    });
    res.status(201).json(medicine);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
