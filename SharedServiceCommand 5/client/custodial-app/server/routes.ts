import { Request, Response, Router } from 'express';
import { storage } from './storage.js';
import { insertInspectionSchema, insertCustodialNoteSchema } from '../shared/schema.js';

const router = Router();

// Inspection routes
router.post('/inspections', async (req: Request, res: Response) => {
  try {
    const validatedData = insertInspectionSchema.parse(req.body);
    const inspection = await storage.createInspection(validatedData);
    res.status(201).json(inspection);
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(400).json({ error: 'Invalid inspection data' });
  }
});

router.get('/inspections', async (req: Request, res: Response) => {
  try {
    const inspections = await storage.getInspections();
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ error: 'Failed to fetch inspections' });
  }
});

router.get('/inspections/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const inspection = await storage.getInspection(id);
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    res.json(inspection);
  } catch (error) {
    console.error('Error fetching inspection:', error);
    res.status(500).json({ error: 'Failed to fetch inspection' });
  }
});

// Custodial notes routes
router.post('/custodial-notes', async (req: Request, res: Response) => {
  try {
    const validatedData = insertCustodialNoteSchema.parse(req.body);
    const note = await storage.createCustodialNote(validatedData);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating custodial note:', error);
    res.status(400).json({ error: 'Invalid custodial note data' });
  }
});

router.get('/custodial-notes', async (req: Request, res: Response) => {
  try {
    const notes = await storage.getCustodialNotes();
    res.json(notes);
  } catch (error) {
    console.error('Error fetching custodial notes:', error);
    res.status(500).json({ error: 'Failed to fetch custodial notes' });
  }
});

router.get('/custodial-notes/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const note = await storage.getCustodialNote(id);
    if (!note) {
      return res.status(404).json({ error: 'Custodial note not found' });
    }
    res.json(note);
  } catch (error) {
    console.error('Error fetching custodial note:', error);
    res.status(500).json({ error: 'Failed to fetch custodial note' });
  }
});

export default router;