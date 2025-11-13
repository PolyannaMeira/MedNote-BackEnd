import type { Response } from 'express';

export function initSSE(res: Response){
  res.setHeader('Content-Type','text/event-stream');
  res.setHeader('Cache-Control','no-cache');
  res.setHeader('Connection','keep-alive');
  res.setHeader('X-Accel-Buffering','no'); // Para Nginx
  
  // Headers CORS abertos para SSE - permite qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
  
  res.flushHeaders?.();
  return (data: string) => res.write(`data: ${data}\n\n`);
}