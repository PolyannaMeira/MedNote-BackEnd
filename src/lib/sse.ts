import type { Response } from 'express';

export function initSSE(res: Response){
  res.setHeader('Content-Type','text/event-stream');
  res.setHeader('Cache-Control','no-cache');
  res.setHeader('Connection','keep-alive');
  res.setHeader('X-Accel-Buffering','no'); // Para Nginx
  
  // Headers CORS para SSE
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Access-Control-Allow-Origin', 'https://med-note-front-end.vercel.app');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  res.flushHeaders?.();
  return (data: string) => res.write(`data: ${data}\n\n`);
}