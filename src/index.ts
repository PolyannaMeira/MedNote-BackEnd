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
  next();
});


app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

app.get('/', (_req, res) => res.send('MedNote.IA backend ok'));
app.use('/api/diagnose', rateLimiter, diagnoseRoute);
app.use('/api/transcribe', transcribeRoute);
app.use('/api/chat', rateLimiter, chatRoute);


app.listen(ENV.PORT, () => console.log(`api on http://localhost:${ENV.PORT}`));