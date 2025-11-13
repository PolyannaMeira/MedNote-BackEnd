import { Router } from 'express';
import type { DiagnosePayload, DiagnosisResponse } from '../types';
import { client } from '../lib/openai';
import { initSSE } from '../lib/sse';
import { validateDiagnosePayload } from '../lib/validation';

const router = Router();

/** Força a saída em JSON puro mesmo se vier cercada por ```json ... ``` */
function safeParseJSON(maybeJSON: string) {
  let t = (maybeJSON || '').trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  // Tenta isolar o primeiro objeto JSON plausível
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) {
    t = t.slice(start, end + 1);
  }

  try {
    return JSON.parse(t);
  } catch {
    // Último recurso: objeto mínimo válido
    return {
      diagnosis: 'Avaliação inicial indisponível',
      conditions: [],
      exams: [],
      medications: [],
      explanation: 'Falha ao interpretar resposta da IA; use versão MOCK ou tente novamente.',
      language: 'pt'
    };
  }
}

const systemPrompt = (lang: 'pt' | 'en') =>
  lang === 'pt'
    ? `Você é um assistente médico. Dado o texto da consulta, responda em JSON com as chaves: diagnosis, conditions[], exams[], medications[], explanation. Não faça prescrição médica real; indique que é sugestão inicial.`
    : `You are a medical assistant. Given the visit transcript, reply in JSON with keys: diagnosis, conditions[], exams[], medications[], explanation. Do not make real prescriptions; indicate this is an initial suggestion.`;

// --- GET /api/diagnose/stream (demo SSE) ---
router.get('/stream', async (req, res) => {
  console.log('Acessando rota /stream');
  const language = (String(req.query.language || 'pt') as 'pt' | 'en');
  const query = String(req.query.q || '');
  
  console.log('Language:', language, 'Query:', query ? 'presente' : 'ausente');
  
  const push = initSSE(res);

  if (!client) {
    console.log('Cliente OpenAI não disponível, usando mock');
    push(JSON.stringify({
      type: 'error',
      message: language === 'pt' ? 'Serviço de IA temporariamente indisponível' : 'AI service temporarily unavailable'
    }));
    return res.end();
  }

  try {
    push(JSON.stringify({
      type: 'status',
      message: language === 'pt' ? 'Gerando resposta com IA...' : 'Generating AI response...'
    }));
    
    // Mock response para teste
    setTimeout(() => {
      push(JSON.stringify({
        type: 'result',
        data: {
          diagnosis: 'Diagnóstico de teste via SSE',
          conditions: ['Condição 1', 'Condição 2'],
          exams: ['Exame 1', 'Exame 2'],
          medications: ['Medicação 1'],
          explanation: 'Esta é uma resposta de teste para verificar se o SSE está funcionando.',
          language
        }
      }));
      res.end();
    }, 1500);
  } catch (error) {
    console.error('Erro no streaming:', error);
    push(JSON.stringify({
      type: 'error',
      message: 'Erro no streaming'
    }));
    res.end();
  }
});

// --- POST /api/diagnose ---
router.post('/', validateDiagnosePayload, async (req, res) => {
  const { transcript, language = 'pt' } = req.body as DiagnosePayload;

  // Sem API key → resposta MOCK imediata
  if (!client) {
    const mock: DiagnosisResponse = {
      diagnosis: language === 'pt' ? 'Infecção de vias aéreas superiores (suspeita)' : 'Upper respiratory tract infection (suspected)',
      conditions: language === 'pt' ? ['Resfriado comum', 'Rinite alérgica'] : ['Common cold', 'Allergic rhinitis'],
      exams: language === 'pt' ? ['Hemograma', 'PCR', 'Raio-X se necessário'] : ['CBC', 'CRP', 'X-ray if needed'],
      medications: language === 'pt' ? ['Analgésico', 'Antitérmico'] : ['Analgesic', 'Antipyretic'],
      explanation:
        language === 'pt'
          ? 'Sugestão inicial com base nos sintomas; avaliação presencial é recomendada.'
          : 'Initial suggestion based on symptoms; in-person evaluation recommended.',
      language,
    };
    return res.json(mock);
  }

  try {
    const prompt =
`${systemPrompt(language)}
TRANSCRIPT:
${transcript}

IMPORTANTE:
- Responda APENAS JSON VÁLIDO.
- Sem markdown, sem crases, sem texto extra.
- NÃO use \`\`\`json nem \`\`\`.
`;

    // Sem response_format — mantemos prompt rígido + safeParseJSON
    const completion = await client.responses.create({
      model: 'gpt-4o-mini',
      input: prompt
    });

    const text = completion.output_text || '{}';
    const raw = safeParseJSON(text) as Partial<DiagnosisResponse>;

    // Garante o shape mínimo do objeto de resposta
    const json: DiagnosisResponse = {
      diagnosis: raw.diagnosis ?? (language === 'pt' ? 'Hipótese diagnóstica inicial' : 'Initial diagnostic hypothesis'),
      conditions: raw.conditions ?? [],
      exams: raw.exams ?? [],
      medications: raw.medications ?? [],
      explanation:
        raw.explanation ??
        (language === 'pt'
          ? 'Sugestão inicial; avaliação presencial é recomendada.'
          : 'Initial suggestion; in-person evaluation recommended.'),
      language
    };

    return res.json(json);
  } catch (e: unknown) {
    const msg = String(e && typeof e === 'object' && 'message' in e ? e.message : e || '');
    const isAuth = /401|Incorrect API key|Unauthorized/i.test(msg);

    // Fallback seguro em erro de autenticação → devolve MOCK (sem 500)
    if (isAuth) {
      console.warn('[openai] auth error, usando fallback MOCK');
      const mock: DiagnosisResponse = {
        diagnosis: language === 'pt' ? 'Infecção de vias aéreas superiores (suspeita)' : 'Upper respiratory tract infection (suspected)',
        conditions: language === 'pt' ? ['Resfriado comum', 'Rinite alérgica'] : ['Common cold', 'Allergic rhinitis'],
        exams: language === 'pt' ? ['Hemograma', 'PCR', 'Raio-X se necessário'] : ['CBC', 'CRP', 'X-ray if needed'],
        medications: language === 'pt' ? ['Analgésico', 'Antitérmico'] : ['Analgesic', 'Antipyretic'],
        explanation:
          language === 'pt'
            ? 'Sugestão inicial com base nos sintomas; avaliação presencial é recomendada.'
            : 'Initial suggestion based on symptoms; in-person evaluation recommended.',
        language,
      };
      return res.json(mock);
    }

    console.error('[diagnose] erro interno:', msg);
    // Mensagem genérica (não vazar detalhes da API)
    return res.status(500).json({ 
      error: 'Erro interno do servidor. Tente novamente mais tarde.' 
    });
  }
});

export default router;
