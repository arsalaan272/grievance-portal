// utils/geminiService.js

// Fallback chain: Gemini key 1 → Gemini key 2 → DeepSeek.
// Controllers just call generateWithGemini(prompt) and get plain text back —
// they don't need to know which provider actually served the request.

import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const genAI2 = process.env.GEMINI_API_KEY2
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY2 })
  : null;

const deepseek = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    })
  : null;

const GEMINI_MODEL = 'gemini-3.5-flash';
const DEEPSEEK_MODEL = 'deepseek-chat';

const MAX_RETRIES = 2;      // retries on top of the first attempt, per provider
const RETRY_DELAY_MS = 800; // base delay, doubles each retry

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Transient errors worth retrying on the SAME provider (brief blips).
// Quota errors (429) are NOT retried here — retrying won't help, we move
// to the next provider in the chain instead.
const isTransientError = (error) => {
  const msg = (error?.message || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('fetch failed')
  );
};

// --- Gemini (used for both keys) ---
const tryGemini = async (client, label, prompt) => {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      const text = response?.text;
      if (!text) throw new Error(`${label} returned an empty response`);

      return text.trim();
    } catch (error) {
      lastError = error;

      if (!isTransientError(error)) break; // fail fast on quota/auth errors
      if (attempt === MAX_RETRIES) break;

      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      console.warn(`${label} attempt ${attempt + 1} failed (${error.message}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
};

// --- DeepSeek ---
const tryDeepSeek = async (prompt) => {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await deepseek.chat.completions.create({
        model: DEEPSEEK_MODEL,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = completion?.choices?.[0]?.message?.content;
      if (!text) throw new Error('DeepSeek returned an empty response');

      return text.trim();
    } catch (error) {
      lastError = error;

      if (!isTransientError(error)) break;
      if (attempt === MAX_RETRIES) break;

      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      console.warn(`DeepSeek attempt ${attempt + 1} failed (${error.message}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
};

const generateWithGemini = async (prompt) => {
  const errors = {};

  // 1. Gemini key 1
  try {
    return await tryGemini(genAI, 'Gemini (key 1)', prompt);
  } catch (error) {
    errors.gemini1 = error.message;
    console.warn(`Gemini key 1 failed (${error.message}), trying key 2...`);
  }

  // 2. Gemini key 2
  if (genAI2) {
    try {
      return await tryGemini(genAI2, 'Gemini (key 2)', prompt);
    } catch (error) {
      errors.gemini2 = error.message;
      console.warn(`Gemini key 2 failed (${error.message}), trying DeepSeek...`);
    }
  }

  // 3. DeepSeek
  if (deepseek) {
    try {
      return await tryDeepSeek(prompt);
    } catch (error) {
      errors.deepseek = error.message;
    }
  }

  // Everything failed — build a clear combined error message.
  const details = Object.entries(errors)
    .map(([provider, msg]) => `${provider}: ${msg}`)
    .join(' | ');

  throw new Error(`All AI providers failed. ${details}`);
};

export default generateWithGemini;