import express from 'express';
import cors from 'cors';
import { ENV } from './env';
import diagnoseRoute from './routes/diagnose';
import transcribeRoute from './routes/transcribe';
import chatRoute from './routes/chat';
import { rateLimiter } from './lib/rateLimit';

const app = express();


app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Headers CORS adicionais para garantir compatibilidade
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Access-Control-Allow-Origin', 'https://med-note-front-end.vercel.app');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  next();
});


app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://med-note-front-end.vercel.app'] 
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
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