import OpenAI from 'openai';
import { ENV } from '../env';


export const client = ENV.OPENAI_API_KEY ? new OpenAI({ apiKey: ENV.OPENAI_API_KEY }) : null;