import express from 'express';
import { ENV } from './env';
import diagnoseRoute from './routes/diagnose';
import transcribeRoute from './routes/transcribe';
import chatRoute from './routes/chat';
import { rateLimiter } from './lib/rateLimit';

const app = express();

// CORS completamente aberto - permite qualquer origem para testes
app.use((req, res, next) => {
  // Headers CORS liberados para todas as origens
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'false'); 
  
  // Para requisições OPTIONS, responde imediatamente
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Headers de segurança
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
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