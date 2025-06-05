import React, { useState } from 'react';
import TextInput from './components/TextInput';
import TranslationOutput from './components/TranslationOutput';
import ImageOutput from './components/ImageOutput';
import Canva from './components/Canva';
// import VideoOutput from './components/VideoOutput';
import './theme.css'; // Add this import for global styles and font
import EmotionCluesOutput from './components/EmotionCluesOutput';

// Helper to generate a unique id
const genId = () => Math.random().toString(36).slice(2) + Date.now();

// Card types: writing, translation, image-gen, image
const CARD_TYPES = {
  WRITING: 'writing',
  EMOTION: 'emotion',
  TRANSLATION: 'translation',
  IMAGE_GEN: 'image-gen',
  IMAGE: 'image',
};

const gridPosition = (idx: number, cardsPerRow = 3, gap = 32, isMobile = false): {x: number, y: number} => {
  const marginLeft = isMobile ? 24 : 48;
  const marginTop = isMobile ? 40 : 72;
  const cardVertical = isMobile ? 320 : 360;
  if (isMobile) {
    return {
      x: marginLeft,
      y: marginTop + idx * (cardVertical + gap),
    };
  }
  const row = Math.floor(idx / cardsPerRow);
  const col = idx % cardsPerRow;
  return {
    x: marginLeft + col * (360 + gap),
    y: marginTop + row * (cardVertical + gap),
  };
};

const App: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<{
    translation: boolean;
    image: boolean;
    // video: boolean;
  }>({
    translation: false,
    image: false,
    // video: false,
  });

  // Initialize cards in a grid
  const initialCards = [
    { id: 'writing', type: CARD_TYPES.WRITING, ...gridPosition(0) },
    { id: 'image-gen', type: CARD_TYPES.IMAGE_GEN, ...gridPosition(1) },
    { id: 'translation', type: CARD_TYPES.TRANSLATION, ...gridPosition(2) },
    { id: 'emotion', type: CARD_TYPES.EMOTION, ...gridPosition(3) },
  ];
  const [cards, setCards] = useState<Array<{ id: string; type: string; url?: string; x: number; y: number }>>(initialCards);

  // Handler for new images
  const handleImagesGenerated = (urls: string[]) => {
    setCards(prev => [
      ...prev,
      ...urls.map((url, i) => ({ id: genId(), type: CARD_TYPES.IMAGE, url, ...gridPosition(prev.length + i) })),
    ]);
  };

  // Handler for moving a card
  const handleCardMove = (id: string, x: number, y: number) => {
    setCards(prev => prev.map(card => card.id === id ? { ...card, x, y } : card));
  };

  // Render cards based on their type
  const renderCard = (card: { id: string; type: string; url?: string; x: number; y: number }, idx: number) => {
    const cardMarginClass = 'mt-8';
    switch (card.type) {
      case CARD_TYPES.WRITING:
        return (
          <div key={card.id} data-dragid={card.id} className={`card-writing fade-in ${cardMarginClass}`}>
            <h2 className="text-xl font-medium mb-4">Your Original World</h2>
            <p className="text-gray-700 whitespace-pre-line break-words font-light">
              {text || <span className="text-gray-400">Begin your journey—write or paste your story here.</span>}
            </p>
            <div className="mt-4 text-sm text-gray-500 font-light">
              {text.trim().split(/\s+/).filter(Boolean).length} / 5000 words
            </div>
          </div>
        );
      case CARD_TYPES.EMOTION:
        return (
          <div key={card.id} data-dragid={card.id} className={`card-emotion fade-in ${cardMarginClass}`}>
            <EmotionCluesOutput text={text} />
          </div>
        );
      case CARD_TYPES.TRANSLATION:
        return (
          <div key={card.id} data-dragid={card.id} className={`card-translation fade-in ${cardMarginClass}`}>
            <TranslationOutput
              text={text}
              isGenerating={isGenerating.translation}
              onGenerateStart={() => setIsGenerating(prev => ({ ...prev, translation: true }))}
              onGenerateEnd={() => setIsGenerating(prev => ({ ...prev, translation: false }))}
              cardTitle="Your Story, Reimagined"
              cardInstruction="See your words come alive in a new language. Select a language and translate to explore your story's new voice."
            />
          </div>
        );
      case CARD_TYPES.IMAGE_GEN:
        return (
          <div key={card.id} data-dragid={card.id} className={`card-image fade-in ${cardMarginClass}`}>
            <h2 className="text-xl font-medium mb-4">Your World, Illustrated</h2>
            <p className="text-gray-500 mb-6 font-light">Turn your story into vivid images. Generate artwork inspired by your words.</p>
            <ImageOutput
              text={text}
              isGenerating={isGenerating.image}
              onGenerateStart={() => setIsGenerating(prev => ({ ...prev, image: true }))}
              onGenerateEnd={() => setIsGenerating(prev => ({ ...prev, image: false }))}
              onImagesGenerated={handleImagesGenerated}
              cardTitle=""
              cardInstruction=""
            />
          </div>
        );
      case CARD_TYPES.IMAGE:
        return (
          <div key={card.id} data-dragid={card.id} className={`card-image fade-in ${cardMarginClass}`}>
            <img
              src={card.url}
              alt={`Generated from your text #${idx + 1}`}
              className="w-full h-64 object-cover rounded-sm mb-4"
            />
            <a
              href={card.url}
              download={`generated-image-${idx + 1}.png`}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            >
              Download Image #{idx + 1}
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] relative overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight" style={{fontFamily: 'Playfair Display, serif'}}>WriterGen</h1>
          <div className="subtitle text-base font-light text-gray-500 tracking-wide" style={{fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em'}}>Visualize and expand the world you wrote.</div>
        </div>
      </header>

      <main className="pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <TextInput
              value={text}
              onChange={setText}
              maxLength={5000}
            />
          </div>
          <Canva cards={cards} onCardMove={handleCardMove} renderCard={renderCard} />
        </div>
      </main>

      <footer className="fixed bottom-6 left-6 z-50">
        <button
          className="px-4 py-1.5 rounded-full shadow-md text-white font-semibold flex items-center gap-2 animate-float-in"
          style={{
            background: 'linear-gradient(90deg, #7c3aed 0%, #f472b6 100%)',
            fontSize: '0.98rem',
            boxShadow: '0 2px 12px 0 rgba(124,58,237,0.10)',
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
            minWidth: 0,
          }}
          disabled
          tabIndex={-1}
          aria-label="Coming soon"
        >
          <span style={{fontSize: '1.05em', filter: 'drop-shadow(0 0 2px #fff8)'}}>🎬</span>
          <span>Video of your story coming soon</span>
        </button>
      </footer>
    </div>
  );
};

export default App; 