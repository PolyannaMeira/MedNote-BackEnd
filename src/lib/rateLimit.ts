import type { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS = 1000; // máximo 100 requests por IP a cada 15 minutos

// Rate limiting simples (em produção, use redis ou similar)
export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Limpa entradas expiradas
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
  
  // Verifica limite para o IP atual
  if (!store[ip]) {
    store[ip] = {
      count: 1,
      resetTime: now + WINDOW_MS
    };
  } else {
    store[ip].count++;
  }
  
  if (store[ip].count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Muitas requisições. Tente novamente em 15 minutos.',
      resetTime: new Date(store[ip].resetTime).toISOString()
    });
  }
  
  // Headers informativos
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - store[ip].count));
  res.setHeader('X-RateLimit-Reset', new Date(store[ip].resetTime).toISOString());
  
  next();
}