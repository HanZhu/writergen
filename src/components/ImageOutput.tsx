import React from 'react';
import { generateImage } from '../services/api';

interface ImageOutputProps {
  text: string;
  isGenerating: boolean;
  onGenerateStart: () => void;
  onGenerateEnd: () => void;
  onImagesGenerated?: (urls: string[]) => void;
  cardTitle?: string;
  cardInstruction?: string;
}

const ImageOutput: React.FC<ImageOutputProps> = ({
  text,
  isGenerating,
  onGenerateStart,
  onGenerateEnd,
  onImagesGenerated,
  cardTitle,
  cardInstruction,
}) => {
  const handleGenerateImage = async () => {
    if (!text.trim()) return;

    onGenerateStart();
    try {
      const response = await generateImage(text);
      const urls = response.images.map((img: { url: string }) => img.url);
      if (onImagesGenerated) onImagesGenerated(urls);
    } catch (error) {
      console.error('Image generation error:', error);
    } finally {
      onGenerateEnd();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{cardTitle || 'Image Generation'}</h2>
      </div>
      <p className="text-gray-500 text-center mb-4">
        {isGenerating ? 'Generating images...' : (cardInstruction || 'Click generate to create images from your text')}
      </p>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); handleGenerateImage(); }}
        disabled={!text.trim() || isGenerating}
        className={`mt-4 w-full py-2 px-4 rounded-md text-white font-medium ${
          !text.trim() || isGenerating
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-accent hover:bg-accent/90'
        }`}
        style={{ cursor: (!text.trim() || isGenerating) ? 'not-allowed' : 'pointer' }}
      >
        {isGenerating ? 'Generating...' : 'Generate Images'}
      </button>
    </div>
  );
};

export default ImageOutput;