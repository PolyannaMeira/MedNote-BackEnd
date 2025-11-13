import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { client } from '../lib/openai';

const router = Router();

// Middleware de validação para chat
function validateChatPayload(req: Request, res: Response, next: NextFunction) {
  const { message, context, language } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ 
      error: 'Campo "message" é obrigatório e deve ser uma string' 
    });
  }

  if (message.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Campo "message" não pode estar vazio' 
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({ 
      error: 'Mensagem muito longa (máximo 1.000 caracteres)' 
    });
  }

  if (!context || typeof context !== 'object') {
    return res.status(400).json({ 
      error: 'Campo "context" é obrigatório e deve ser um objeto' 
    });
  }

  if (language && !['pt', 'en'].includes(language)) {
    return res.status(400).json({ 
      error: 'Campo "language" deve ser "pt" ou "en"' 
    });
  }

  next();
}

// --- POST /api/chat ---
router.post('/', validateChatPayload, async (req, res) => {
  try {
    const { message, context, language = 'pt' } = req.body;
    
    // Se não houver client da OpenAI, usa resposta padrão
    if (!client) {
      const fallbackResponse = language === 'pt' 
        ? `Desculpe, o serviço de chat está temporariamente indisponível. 

Com base no diagnóstico de **${context.diagnosis || 'diagnóstico médico'}**, algumas informações gerais:

• **Medicamentos prescritos**: ${context.medications?.join(', ') || 'Conforme prescrição'}
• **Exames recomendados**: ${context.exams?.join(', ') || 'Conforme avaliação'}
• **Condições identificadas**: ${context.conditions?.join(', ') || 'Em análise'}

💡 **Recomendação**: Sempre siga as orientações do seu médico e retorne se os sintomas persistirem.`
        : `Sorry, the chat service is temporarily unavailable.

Based on the diagnosis of **${context.diagnosis || 'medical diagnosis'}**, some general information:

• **Prescribed medications**: ${context.medications?.join(', ') || 'As prescribed'}
• **Recommended exams**: ${context.exams?.join(', ') || 'As evaluated'}
• **Identified conditions**: ${context.conditions?.join(', ') || 'Under analysis'}

💡 **Recommendation**: Always follow your doctor's guidance and return if symptoms persist.`;

      return res.json({ response: fallbackResponse });
    }

    // Prompt dinâmico para a OpenAI
    const systemPrompt = language === 'pt' 
      ? `Você é um assistente médico inteligente. O usuário fez uma pergunta sobre um diagnóstico médico.

CONTEXTO DO DIAGNÓSTICO:
- Diagnóstico: ${context.diagnosis}
- Condições: ${context.conditions?.join(', ') || 'Não especificado'}
- Medicamentos: ${context.medications?.join(', ') || 'Não especificado'}
- Exames: ${context.exams?.join(', ') || 'Não especificado'}
- Explicação: ${context.explanation || 'Não disponível'}

INSTRUÇÕES:
- Responda de forma clara e útil em português
- Use informações do contexto quando relevante
- Seja empático e profissional
- NÃO faça diagnósticos ou prescrições definitivas
- Sempre reforce que é uma orientação inicial
- Use emojis apropriados para melhor comunicação
- Se a pergunta não for relacionada ao contexto médico, redirecione gentilmente

PERGUNTA DO USUÁRIO: ${message}`
      : `You are an intelligent medical assistant. The user asked a question about a medical diagnosis.

DIAGNOSIS CONTEXT:
- Diagnosis: ${context.diagnosis}
- Conditions: ${context.conditions?.join(', ') || 'Not specified'}
- Medications: ${context.medications?.join(', ') || 'Not specified'}
- Exams: ${context.exams?.join(', ') || 'Not specified'}
- Explanation: ${context.explanation || 'Not available'}

INSTRUCTIONS:
- Respond clearly and helpfully in English
- Use context information when relevant
- Be empathetic and professional
- DO NOT make definitive diagnoses or prescriptions
- Always reinforce this is initial guidance
- Use appropriate emojis for better communication
- If the question is not medically related, redirect gently

USER QUESTION: ${message}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || (
      language === 'pt' 
        ? 'Desculpe, não consegui processar sua pergunta. Tente reformular.'
        : 'Sorry, I couldn\'t process your question. Please try rephrasing.'
    );

    return res.json({ response });
    
  } catch (e: unknown) {
    const msg = String(e && typeof e === 'object' && 'message' in e ? e.message : e || '');
    const isAuth = /401|Incorrect API key|Unauthorized/i.test(msg);
    
    console.error('[chat] erro:', msg);
    
    if (isAuth) {
      // Fallback em caso de erro de autenticação
      const { language = 'pt' } = req.body;
      const fallbackResponse = language === 'pt'
        ? 'Serviço temporariamente indisponível. Consulte seu médico para esclarecimentos adicionais.'
        : 'Service temporarily unavailable. Please consult your doctor for additional clarification.';
        
      return res.json({ response: fallbackResponse });
    }
    
    return res.status(500).json({ 
      error: req.body.language === 'pt' ? 'Erro interno do servidor' : 'Internal server error' 
    });
  }
});

export default router;