import React, { useState } from 'react';
import axios from 'axios';

interface EmotionCluesOutputProps {
  text: string;
}

const COLORS = [
  'bg-pink-200 text-pink-800',
  'bg-yellow-200 text-yellow-800',
  'bg-green-200 text-green-800',
  'bg-blue-200 text-blue-800',
  'bg-purple-200 text-purple-800',
  'bg-orange-200 text-orange-800',
  'bg-red-200 text-red-800',
];

const EmotionCluesOutput: React.FC<EmotionCluesOutputProps> = ({ text }) => {
  const [clues, setClues] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  const fetchEmotions = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    setClues([]);
    setHasAnalyzed(false);
    setFallbackUsed(false);
    try {
      const prompt = `You are an expert literary emotion analyst. Read the following text and extract both the core/main emotions and any underlying or hidden emotions expressed (not moods, not phrases, not situations). Respond ONLY with a single valid minified JSON array of 3-7 single-word emotions (surface or underlying, in the input language, or English if not available). Do not include any extra text, commentary, formatting, markdown, code block, or object—just the array itself. If you cannot comply, respond with ["ERROR"].`;
      const response = await axios.post(
        'https://api.siliconflow.cn/chat/completions',
        {
          model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: text },
          ],
          temperature: 0.5,
          max_tokens: 64,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SILICONFLOW_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      let jsonString = response.data.choices[0].message.content.trim();
      // Remove markdown code block if present
      jsonString = jsonString.replace(/```[a-zA-Z]*[\s\n]*([\s\S]*?)```/g, '$1').trim();
      // Only use array output, ignore object output
      const firstBracket = jsonString.indexOf('[');
      const lastBracket = jsonString.indexOf(']', firstBracket);
      let result: string[] = [];
      let parsed = false;
      if (firstBracket !== -1 && lastBracket !== -1) {
        try {
          jsonString = jsonString.substring(firstBracket, lastBracket + 1);
          result = JSON.parse(jsonString);
          if (Array.isArray(result) && result[0] !== 'ERROR') {
            setClues(result);
            setHasAnalyzed(true);
            setError(null);
            parsed = true;
          } else if (Array.isArray(result) && result[0] === 'ERROR') {
            setClues([]);
            setHasAnalyzed(false);
            setError('未能识别情感，请尝试更丰富的文本。');
            parsed = true;
          }
        } catch (e) {
          // fall through to fallback
        }
      }
      // Fallback: try to split by commas or newlines if not valid JSON array
      if (!parsed) {
        // If object detected, ignore and show error
        if (jsonString.trim().startsWith('{')) {
          setError('Model returned an object instead of an array. Please try again.');
        } else {
          // Try splitting by comma or newline
          let fallbackArr = jsonString.split(/,|\n|\r/).map((s: string) => s.trim()).filter(Boolean);
          if (fallbackArr.length > 0 && fallbackArr[0] !== 'ERROR') {
            setClues(fallbackArr);
            setHasAnalyzed(true);
            setFallbackUsed(true);
            setError(null);
          } else if (fallbackArr.length > 0 && fallbackArr[0] === 'ERROR') {
            setClues([]);
            setHasAnalyzed(false);
            setError('未能识别情感，请尝试更丰富的文本。');
          } else {
            setError('Model output was not valid JSON. Showing best guess.');
          }
        }
      }
    } catch (e) {
      setError('Failed to fetch emotional clues.');
    }
    setIsLoading(false);
  };

  // Remove auto-analyze on text change
  React.useEffect(() => {
    setClues([]);
    setError(null);
    setHasAnalyzed(false);
    setIsLoading(false);
  }, [text]);

  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Emotional Clues</h2>
      {isLoading ? (
        <div className="text-gray-400 py-8 text-center">Analyzing emotions...</div>
      ) : error ? (
        <div className="text-red-500 text-sm py-4 text-center">{error}</div>
      ) : clues.length > 0 && hasAnalyzed ? (
        <>
          {fallbackUsed && (
            <div className="text-xs text-yellow-600 text-center mb-2">Model output was not valid JSON. Showing best guess.</div>
          )}
          <div className="flex flex-wrap gap-2 py-2 justify-center">
            {clues.map((clue, i) => (
              <span
                key={clue + i}
                className={`px-3 py-1 rounded-full font-semibold text-sm shadow-sm ${COLORS[i % COLORS.length]}`}
                style={{
                  background: `linear-gradient(90deg, var(--tw-gradient-stops))`,
                  opacity: 0.95,
                }}
              >
                {clue}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="text-gray-400 py-8 text-center">Emotional clues will appear here.</div>
      )}
      {text.trim() && !isLoading && (
        <div className="flex justify-center mt-4">
          <button
            className="px-4 py-2 rounded bg-accent text-white font-semibold shadow hover:bg-accent/90 transition"
            onClick={fetchEmotions}
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmotionCluesOutput; 