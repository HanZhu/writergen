import React, { useState, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';

interface TranslationOutputProps {
  text: string;
  isGenerating: boolean;
  onGenerateStart: () => void;
  onGenerateEnd: () => void;
  cardTitle?: string;
  cardInstruction?: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
];

// Robust JSON extraction: find all JSON objects and return the last one
function extractLastJsonObject(text: string): string | null {
  const regex = /\{[\s\S]*?\}/g;
  const matches = text.match(regex);
  if (matches && matches.length > 0) {
    return matches[matches.length - 1];
  }
  return null;
}

const TranslationOutput: React.FC<TranslationOutputProps> = ({
  text,
  isGenerating,
  onGenerateStart,
  onGenerateEnd,
  cardTitle,
  cardInstruction,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [translatedText, setTranslatedText] = useState('');
  const [rawModelOutput, setRawModelOutput] = useState('');
  const [parseError, setParseError] = useState(false);
  const [parseErrorMessage, setParseErrorMessage] = useState('');
  const translationCardRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleTranslate = async () => {
    if (!text.trim()) return;

    onGenerateStart();
    setParseError(false);
    setRawModelOutput('');
    setParseErrorMessage('');
    try {
      const targetLangName = LANGUAGES.find(lang => lang.code === selectedLanguage)?.name;
      // Unified single-step translation for all languages
      const prompt = `You are a professional translator. Translate the following text to ${targetLangName}. Respond ONLY with a single valid minified JSON object: {"translation": "..."} (no extra text, no commentary, no original text, no separators, no markdown, no code block, no multiple objects). If you cannot comply, respond with {"translation": "ERROR"}.`;
      let jsonString = '';
      try {
        const response = await axios.post(
          'https://api.siliconflow.cn/chat/completions',
          {
            model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
            messages: [
              { role: 'system', content: prompt },
              { role: 'user', content: text }
            ],
            temperature: 0.5,
            max_tokens: 128,
          },
          {
            headers: {
              'Authorization': 'Bearer sk-bvzmpseywrtsakqtnxaqfpilmrydalevpgrdcicsexfojmti',
              'Content-Type': 'application/json',
            },
          }
        );
        jsonString = response.data.choices[0].message.content.trim();
        setRawModelOutput(jsonString);
        let lastJson = extractLastJsonObject(jsonString);
        if (lastJson) {
          jsonString = lastJson;
        }
        // Replace unescaped newlines, carriage returns, and tabs in value strings with \n
        jsonString = jsonString.replace(/"([^"]*)":\s*"([\s\S]*?)"/g, (match: string, key: string, value: string) => {
          // Only replace inside value
          const safeValue = value.replace(/[\r\n\t]/g, '\\n');
          return `"${key}": "${safeValue}"`;
        });
        let result = JSON.parse(jsonString);
        const hasTranslation = !!result.translation && result.translation !== 'ERROR';
        if (hasTranslation) {
          setTranslatedText(result.translation);
          setParseError(false);
          setParseErrorMessage('');
        } else {
          setTranslatedText('');
          setParseError(true);
          setParseErrorMessage('Model did not return translation field or returned an error.');
        }
      } catch (e) {
        console.error('JSON parse error:', e, jsonString);
        // Fallback: Try to extract last non-JSON text block (e.g., after ---)
        const lines = jsonString.split(/\n|\r|---/).map((l: string) => l.trim()).filter(Boolean);
        let lastText = '';
        for (let i = lines.length - 1; i >= 0; i--) {
          if (!lines[i].startsWith('{') && !lines[i].endsWith('}')) {
            lastText = lines[i];
            break;
          }
        }
        if (lastText) {
          setTranslatedText(lastText);
          setParseErrorMessage('模型输出不规范，已自动修正。');
          setParseError(false);
        } else {
          setTranslatedText('');
          setParseError(true);
          setParseErrorMessage('Failed to parse model output as JSON.');
        }
      }
      onGenerateEnd();
      return;
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('');
      setParseError(true);
      setParseErrorMessage(error instanceof Error ? error.message : String(error));
    }
    onGenerateEnd();
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 1200);
      });
    }
  };

  // Download as image
  const handleDownloadImage = async () => {
    if (!translationCardRef.current) return;
    try {
      const canvas = await html2canvas(translationCardRef.current, { backgroundColor: null, scale: 2 });
      const link = document.createElement('a');
      link.download = 'translation.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 1200);
    } catch (e) {
      alert('Failed to download image.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{cardTitle || 'Translation'}</h2>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4 text-gray-500 text-sm">{cardInstruction || 'Click translate to see your text in another language'}</div>

      {translatedText ? (
        <div className="flex flex-col items-center">
          <div
            ref={translationCardRef}
            className="relative w-full max-w-xl mx-auto mb-4 p-8 rounded-3xl shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #f3f0ff 0%, #e0e7ff 100%)',
              border: '2px solid #c4b5fd',
              minHeight: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative quote mark */}
            <span
              style={{
                position: 'absolute',
                top: 18,
                left: 28,
                fontSize: 64,
                color: '#e0e7ff',
                opacity: 0.5,
                zIndex: 0,
                pointerEvents: 'none',
                fontFamily: 'serif',
              }}
              aria-hidden
            >
              “
            </span>
            <span
              className="w-full text-center text-lg sm:text-xl font-semibold text-gray-800 whitespace-pre-line z-10"
              style={{
                fontFamily: 'Dancing Script, Caveat, Noto Sans Hand, cursive, sans-serif',
                lineHeight: 1.5,
                letterSpacing: 0.2,
                wordBreak: 'break-word',
                whiteSpace: 'pre-line',
              }}
            >
              {translatedText}
            </span>
          </div>
          <div className="flex gap-3 mb-2">
            <button
              className={`creative-btn px-4 py-2 text-base border border-gray-300 rounded-md bg-white transition-colors duration-150 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer ${copySuccess ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
              onClick={handleCopy}
              title="Copy translation"
              type="button"
            >
              {copySuccess ? 'Copied!' : 'Copy Text'}
            </button>
            <button
              className={`creative-btn px-4 py-2 text-base border border-gray-300 rounded-md bg-white transition-colors duration-150 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer ${downloadSuccess ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
              onClick={handleDownloadImage}
              title="Download as image"
              type="button"
            >
              {downloadSuccess ? 'Downloaded!' : 'Download as Image'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          {isGenerating ? 'Translating...' : 'Click translate to see your text in another language'}
        </p>
      )}

      <button
        disabled={!text.trim() || isGenerating}
        className={`mt-4 w-full py-2 px-4 rounded-md text-white font-medium ${
          !text.trim() || isGenerating
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-accent hover:bg-accent/90'
        }`}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); handleTranslate(); }}
      >
        {isGenerating ? 'Translating...' : 'Translate'}
      </button>
      {parseError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <div className="font-semibold mb-1">Translation failed: Model did not return valid JSON or expected fields.</div>
          <div className="mb-2">Raw model output:</div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all bg-red-100 p-2 rounded text-xs">{rawModelOutput}</pre>
          {parseErrorMessage && (
            <div className="mt-2 text-xs text-red-600">{parseErrorMessage}</div>
          )}
          <button
            className="mt-2 px-3 py-1 rounded bg-accent text-white hover:bg-accent/90"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); handleTranslate(); }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default TranslationOutput; 