// Multilingual agent – detects and translates user input using Google Translate API
import axios from 'axios';

export async function detectLanguage(text: string): Promise<string> {
  // Detection using Google Cloud Translation API or similar
  // Replace 'YOUR_API_KEY' with your actual API key!
  const apiKey = 'YOUR_API_KEY';
  const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${apiKey}`;
  try {
    const response = await axios.post(url, { q: text });
    return response.data.data.detections[0][0].language;
  } catch {
    return 'und'; // Unknown language
  }
}

export async function translateToEnglish(text: string): Promise<string> {
  const apiKey = 'YOUR_API_KEY';
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  try {
    const response = await axios.post(url, { q: text, target: 'en' });
    return response.data.data.translations[0].translatedText;
  } catch {
    return text; // Fall back to original input
  }
}

/**
 * Takes user input (any language), auto-detects language, returns English translation.
 */
export async function handleMultilingualInput(text: string): Promise<{ original: string, language: string, translated: string }> {
  const lang = await detectLanguage(text);
  const translated = lang !== 'en' ? await translateToEnglish(text) : text;
  return { original: text, language: lang, translated };
}
