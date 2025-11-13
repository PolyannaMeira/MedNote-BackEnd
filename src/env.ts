import 'dotenv/config';

export const ENV = {
  PORT: process.env.PORT || '3000',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
};

if (!ENV.OPENAI_API_KEY) {
  console.warn('[warn] OPENAI_API_KEY não configurada. /api/diagnose usará resposta mock.');
}
