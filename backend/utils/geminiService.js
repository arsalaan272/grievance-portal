// utils/geminiService.js

// Small wrapper around the official Google GenAI SDK.
// Keeps the client setup and response parsing in one place so controllers
// just call generateWithGemini(prompt) and get plain text back.

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-3.5-flash';

const generateWithGemini = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const text = response?.text;

    if (!text) {
      throw new Error('Gemini returned an empty response');
    }

    return text.trim();
  } catch (error) {
    // Re-throw with a consistent message so controllers can just
    // catch and send error.message back in the response, same as
    // the rest of the codebase does.
    throw new Error(error.message || 'Gemini API request failed');
  }
};

export default generateWithGemini;