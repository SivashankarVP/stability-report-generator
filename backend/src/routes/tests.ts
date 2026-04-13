import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Add a stability test point and result for a batch
router.post('/result', async (req, res) => {
  try {
    const { 
      batchId, interval, storageCondition, testDate,
      assayPotency, dissolution, pHLevel, moistureContent, impurityLevel, microbialLimit, passFail 
    } = req.body;

    // Create the test interval record and its results transactionally
    const stabilityTest = await prisma.stabilityTest.create({
      data: {
        batchId: Number(batchId),
        interval: Number(interval),
        storageCondition,
        testDate: new Date(testDate || Date.now()),
        results: {
          create: {
            assayPotency: Number(assayPotency),
            dissolution: Number(dissolution),
            pHLevel: Number(pHLevel),
            moistureContent: Number(moistureContent),
            impurityLevel: Number(impurityLevel),
            microbialLimit: Number(microbialLimit),
            passFail: Boolean(passFail)
          }
        }
      },
      include: { results: true }
    });

    res.status(201).json(stabilityTest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
