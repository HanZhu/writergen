import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}

const TextInput: React.FC<TextInputProps> = ({ value, onChange, maxLength }) => {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Writing</h2>
        <span className="text-sm text-gray-500">
          {wordCount} / {maxLength} words
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder="Type or paste your writing here..."
        className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
      />
    </div>
  );
};

export default TextInput; 