import type { Request, Response, NextFunction } from 'express';

// Sanitiza strings removendo caracteres perigosos
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove atributos de evento como onclick=
    .trim();
}

// Middleware para validar payload do diagnóstico
export function validateDiagnosePayload(req: Request, res: Response, next: NextFunction) {
  const { transcript, language } = req.body;

  if (!transcript || typeof transcript !== 'string') {
    return res.status(400).json({ 
      error: 'Campo "transcript" é obrigatório e deve ser uma string' 
    });
  }

  if (transcript.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Campo "transcript" não pode estar vazio' 
    });
  }

  if (transcript.length > 10000) { // Limite de 10k caracteres
    return res.status(400).json({ 
      error: 'Campo "transcript" muito longo (máximo 10.000 caracteres)' 
    });
  }

  if (language && !['pt', 'en'].includes(language)) {
    return res.status(400).json({ 
      error: 'Campo "language" deve ser "pt" ou "en"' 
    });
  }

  // Sanitiza o input
  req.body.transcript = sanitizeString(transcript);
  
  next();
}

// Middleware para validar payload de transcrição
export function validateTranscribePayload(req: Request, res: Response, next: NextFunction) {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ 
      error: 'Campo "text" é obrigatório e deve ser uma string' 
    });
  }

  if (text.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Campo "text" não pode estar vazio' 
    });
  }

  if (text.length > 10000) { // Limite de 10k caracteres
    return res.status(400).json({ 
      error: 'Campo "text" muito longo (máximo 10.000 caracteres)' 
    });
  }

  // Sanitiza o input
  req.body.text = sanitizeString(text);
  
  next();
}