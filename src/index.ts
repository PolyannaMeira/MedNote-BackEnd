import express from 'express';
import { ENV } from './env';
import diagnoseRoute from './routes/diagnose';
import transcribeRoute from './routes/transcribe';
import chatRoute from './routes/chat';
import { rateLimiter } from './lib/rateLimit';

const app = express();

// Middleware CORS ultra-permissivo para resolver problemas de teste
app.use((req, res, next) => {
  // Force CORS headers on EVERY response
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400'
  });
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  }
  
  next();
});

// Headers de segurança básicos
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use(express.json({ limit: '10mb' }));

app.get('/', (_req, res) => res.send('MedNote.IA backend ok'));
app.get('/api', (_req, res) => res.json({ message: 'API funcionando', endpoints: ['/api/diagnose', '/api/transcribe', '/api/chat'] }));
app.use('/api/diagnose', rateLimiter, diagnoseRoute);
app.use('/api/transcribe', transcribeRoute);
app.use('/api/chat', rateLimiter, chatRoute);

// Middleware para capturar 404s
app.use('*', (req, res) => {
  console.log(`404 - Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Rota não encontrada',
    method: req.method,
    path: req.originalUrl
  });
});

app.listen(ENV.PORT, () => console.log(`api on http://localhost:${ENV.PORT}`));