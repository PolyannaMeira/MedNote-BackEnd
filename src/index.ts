import express from 'express';
import { ENV } from './env';
import diagnoseRoute from './routes/diagnose';
import transcribeRoute from './routes/transcribe';
import chatRoute from './routes/chat';
import { rateLimiter } from './lib/rateLimit';

const app = express();

// 👇 SEM a barra no final!
const ALLOWED_ORIGIN =
  process.env.NODE_ENV === 'production'
    ? 'https://med-note-front-end.vercel.app'
    : '*';

// 🔹 Middleware de CORS global
app.use((req, res, next) => {
  // Em produção, só seu front
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Trata preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// 🔹 Headers de segurança básicos (fora do middleware anterior)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use(express.json({ limit: '10mb' }));

app.get('/', (_req, res) => res.send('MedNote.IA backend ok'));

app.get('/api', (_req, res) =>
  res.json({
    message: 'API funcionando',
    endpoints: ['/api/diagnose', '/api/transcribe', '/api/chat'],
  }),
);

// Rotas
app.use('/api/diagnose', rateLimiter, diagnoseRoute);
app.use('/api/transcribe', transcribeRoute);
app.use('/api/chat', rateLimiter, chatRoute);

// Middleware para capturar 404s
app.use((req, res) => {
  console.log(`404 - Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Rota não encontrada',
    method: req.method,
    path: req.originalUrl,
  });
});

app.listen(ENV.PORT, () => console.log(`api on http://localhost:${ENV.PORT}`));
