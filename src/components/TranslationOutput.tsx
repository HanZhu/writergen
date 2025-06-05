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
  const [missingTranslation, setMissingTranslation] = useState(false);
  const translationCardRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleTranslate = async () => {
    if (!text.trim()) return;

    onGenerateStart();
    setParseError(false);
    setRawModelOutput('');
    setParseErrorMessage('');
    setMissingTranslation(false);
    try {
      const targetLangName = LANGUAGES.find(lang => lang.code === selectedLanguage)?.name;
      let finalTranslation = '';
      let englishText = '';
      let rawOutputs = [];
      if (selectedLanguage === 'en') {
        // Single step: input to English
        const prompt = `You are a professional translator. Translate the following text to ${targetLangName}. Respond ONLY with a single valid minified JSON object: {\"translation\": \"...\"} (no extra text, no commentary, no original text, no separators, no markdown, no code block, no multiple objects). If you cannot comply, respond with {\"translation\": \"ERROR\"}.`;
        const response = await axios.post(
          'https://api.siliconflow.cn/chat/completions',
          {
            model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
            messages: [
              { role: 'system', content: prompt },
              { role: 'user', content: text }
            ],
            temperature: 0.5,
            max_tokens: 800,
          },
          {
            headers: {
              'Authorization': 'Bearer sk-bvzmpseywrtsakqtnxaqfpilmrydalevpgrdcicsexfojmti',
              'Content-Type': 'application/json',
            },
          }
        );
        // Extract and parse the last JSON object from the output
        let jsonString = response.data.choices[0].message.content.trim();
        setRawModelOutput(jsonString);
        // Extract and parse the last JSON object from the output
        let lastJson = extractLastJsonObject(jsonString);
        if (lastJson) {
          jsonString = lastJson;
        }
        // Escape unescaped line breaks inside string values
        jsonString = jsonString.replace(/:(\s*)"([\s\S]*?)"/g, function(match: string, p1: string, p2: string) {
          return `:${p1}"${p2.replace(/[\r\n]+/g, '\\n')}"`;
        });
        let result;
        let parsed = false;
        try {
          result = JSON.parse(jsonString);
          const hasTranslation = !!result.translation && result.translation !== 'ERROR';
          setTranslatedText(result.translation || '');
          setMissingTranslation(!hasTranslation);
          setParseError(false);
          setParseErrorMessage('');
          if (!hasTranslation) {
            setParseError(true);
            setParseErrorMessage('Model did not return translation field or returned an error.');
          }
          parsed = true;
        } catch (e) {
          // Fallback: If not valid JSON, try to extract last non-JSON text block
          setTranslatedText('');
          setMissingTranslation(false);
          setParseError(true);
          // Try to split by lines and use the last non-empty, non-JSON line
          const lines = jsonString.split(/\n|\r/).map((l: string) => l.trim()).filter(Boolean);
          let lastText = '';
          for (let i = lines.length - 1; i >= 0; i--) {
            if (!lines[i].startsWith('{') && !lines[i].endsWith('}')) {
              lastText = lines[i];
              break;
            }
          }
          if (lastText) {
            setTranslatedText(lastText);
            setParseErrorMessage('Model did not return valid JSON, but returned text. Displaying as translation.');
          } else {
            setParseErrorMessage(e instanceof Error ? e.message : String(e));
          }
        }
      } else {
        // Step 1: input to English
        const prompt1 = `You are a professional translator and literary author. Translate the following text to English. Your response MUST be in English only. Do NOT include any words or characters from the original text in your response. If you return any language other than English, or if you cannot fully translate, respond with {\"translation\": \"ERROR\"}. Respond ONLY with a single valid minified JSON object: {\"translation\": \"...\"}. Do not include any extra text, commentary, or formatting.`;
        const response1Promise = axios.post(
          'https://api.siliconflow.cn/chat/completions',
          {
            model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
            messages: [
              { role: 'system', content: prompt1 },
              { role: 'user', content: text }
            ],
            temperature: 0.5,
            max_tokens: 800,
          },
          {
            headers: {
              'Authorization': 'Bearer sk-bvzmpseywrtsakqtnxaqfpilmrydalevpgrdcicsexfojmti',
              'Content-Type': 'application/json',
            },
          }
        );
        // Wait for English translation
        const response1 = await response1Promise;
        let jsonString1 = response1.data.choices[0].message.content.trim();
        rawOutputs.push(jsonString1);
        // Extract and parse only the first JSON object from the output
        const firstBrace1 = jsonString1.indexOf('{');
        let braceCount1 = 0;
        let endIdx1 = -1;
        for (let i = firstBrace1; i < jsonString1.length; i++) {
          if (jsonString1[i] === '{') braceCount1++;
          if (jsonString1[i] === '}') braceCount1--;
          if (braceCount1 === 0 && firstBrace1 !== -1) {
            endIdx1 = i;
            break;
          }
        }
        if (firstBrace1 !== -1 && endIdx1 !== -1) {
          jsonString1 = jsonString1.substring(firstBrace1, endIdx1 + 1);
        }
        jsonString1 = jsonString1.replace(/:(\s*)"([\s\S]*?)"/g, function(match: string, p1: string, p2: string) {
          return `:${p1}"${p2.replace(/[\r\n]+/g, '\\n')}"`;
        });
        let result1;
        try {
          result1 = JSON.parse(jsonString1);
          englishText = result1.translation || '';
        } catch (e) {
          setParseError(true);
          setParseErrorMessage('Failed to parse English translation.');
          setTranslatedText('');
          onGenerateEnd();
          return;
        }
        // Step 2: English to target
        const prompt2 = `You are a professional translator and literary author. Translate the following text to ${targetLangName}. Your response MUST be in ${targetLangName} only. Do NOT include any words or characters from the original text in your response. If you return any language other than ${targetLangName}, or if you cannot fully translate, respond with {\"translation\": \"ERROR\"}. Respond ONLY with a single valid minified JSON object: {\"translation\": \"...\"}. Do not include any extra text, commentary, or formatting.`;
        const response2Promise = axios.post(
          'https://api.siliconflow.cn/chat/completions',
          {
            model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
            messages: [
              { role: 'system', content: prompt2 },
              { role: 'user', content: englishText }
            ],
            temperature: 0.5,
            max_tokens: 800,
          },
          {
            headers: {
              'Authorization': 'Bearer sk-bvzmpseywrtsakqtnxaqfpilmrydalevpgrdcicsexfojmti',
              'Content-Type': 'application/json',
            },
          }
        );
        // Wait for target translation
        const response2 = await response2Promise;
        let jsonString2 = response2.data.choices[0].message.content.trim();
        rawOutputs.push(jsonString2);
        setRawModelOutput(rawOutputs.join('\n---\n'));
        // Extract and parse only the first JSON object from the output
        const firstBrace2 = jsonString2.indexOf('{');
        let braceCount2 = 0;
        let endIdx2 = -1;
        for (let i = firstBrace2; i < jsonString2.length; i++) {
          if (jsonString2[i] === '{') braceCount2++;
          if (jsonString2[i] === '}') braceCount2--;
          if (braceCount2 === 0 && firstBrace2 !== -1) {
            endIdx2 = i;
            break;
          }
        }
        if (firstBrace2 !== -1 && endIdx2 !== -1) {
          jsonString2 = jsonString2.substring(firstBrace2, endIdx2 + 1);
        }
        jsonString2 = jsonString2.replace(/:(\s*)"([\s\S]*?)"/g, function(match: string, p1: string, p2: string) {
          return `:${p1}"${p2.replace(/[\r\n]+/g, '\\n')}"`;
        });
        let result2;
        try {
          result2 = JSON.parse(jsonString2);
          finalTranslation = result2.translation || '';
        } catch (e) {
          setParseError(true);
          setParseErrorMessage('Failed to parse target language translation.');
          setTranslatedText('');
          onGenerateEnd();
          return;
        }
      }
      // Set final translation
      setTranslatedText(finalTranslation);
      setMissingTranslation(!finalTranslation);
      setParseError(!finalTranslation);
      setParseErrorMessage(!finalTranslation ? 'Model did not return translation field or returned an error.' : '');
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('');
      setMissingTranslation(false);
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