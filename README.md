# MedNote.IA Backend

Backend para análise de diagnósticos médicos usando IA.

## 🚀 Como executar

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o arquivo `.env` e adicione sua chave da OpenAI.

3. Execute em modo desenvolvimento:
```bash
npm run dev
```

## 📋 Endpoints

### POST /api/diagnose
Analisa transcrição médica e retorna diagnóstico sugerido.

**Body:**
```json
{
  "transcript": "paciente relata dor de cabeça e febre",
  "language": "pt"
}
```

**Response:**
```json
{
  "diagnosis": "Infecção viral suspeita",
  "conditions": ["Resfriado", "Gripe"],
  "exams": ["Hemograma"],
  "medications": ["Paracetamol"],
  "explanation": "Sugestão inicial...",
  "language": "pt"
}
```

### POST /api/transcribe/text
Processa texto como transcrição.

**Body:**
```json
{
  "text": "texto da consulta médica"
}
```

### POST /api/transcribe/audio
Transcreve áudio em texto usando OpenAI Whisper.

**Body (multipart/form-data):**
- `audio`: Arquivo de áudio (MP3, WAV, M4A, etc.)
- `language`: "pt" ou "en" (opcional, padrão: "pt")

**Exemplo usando curl:**
```bash
curl -X POST http://localhost:3000/api/transcribe/audio \
  -F "audio=@consulta.wav" \
  -F "language=pt"
```

**Response:**
```json
{
  "transcript": "Paciente relata dor de cabeça e febre há dois dias..."
}
```

## 🔧 Variáveis de Ambiente

- `OPENAI_API_KEY`: Chave da API OpenAI
- `PORT`: Porta do servidor (padrão: 3000)

## ⚠️ Aviso Importante

Este sistema é apenas para demonstração. Não substitui consulta médica real.