// backend/routes/transcribe.ts (Versão Simplificada)
import { Router } from 'express';

import { validateTranscribePayload } from '../lib/validation';

const router = Router();


router.post('/text', validateTranscribePayload, (req, res) => {
  const { text } = req.body as { text: string };
  
  
  return res.json({ 
    transcript: text 
  });
});

export default router;