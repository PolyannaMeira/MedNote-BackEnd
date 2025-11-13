import type { Response } from 'express';

export function initSSE(res: Response){
  res.setHeader('Content-Type','text/event-stream');
  res.setHeader('Cache-Control','no-cache');
  res.setHeader('Connection','keep-alive');
  res.flushHeaders?.();
  return (data: string) => res.write(`data: ${data}\n\n`);
}