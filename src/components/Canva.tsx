import React, { useState } from 'react';
import {
  DndContext,
  useDraggable,
  DragEndEvent,
} from '@dnd-kit/core';

interface CanvaProps {
  cards: { id: string; type: string; url?: string; x: number; y: number }[];
  onCardMove: (id: string, x: number, y: number) => void;
  renderCard: (card: { id: string; type: string; url?: string; x: number; y: number }, idx: number) => React.ReactNode;
}

const DraggableCard: React.FC<{
  id: string;
  x: number;
  y: number;
  isTop: boolean;
  children: React.ReactNode;
}> = ({ id, x, y, isTop, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style: React.CSSProperties = {
    position: 'absolute',
    left: x + (transform?.x || 0),
    top: y + (transform?.y || 0),
    zIndex: isDragging || isTop ? 100 : 1,
    width: '92vw',
    maxWidth: 360,
    minWidth: 280,
    background: 'white',
    padding: 24,
    overflow: 'hidden',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    boxShadow: isDragging
      ? '0 20px 40px rgba(0, 0, 0, 0.1)'
      : '0 2px 4px rgba(0, 0, 0, 0.05)',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="creative-card"
    >
      {/* Drag handle - always visible, taller, visually distinct */}
      <div 
        className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center bg-gradient-to-b from-gray-100 to-transparent border-b border-gray-200 cursor-grab select-none"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        {...listeners}
        {...attributes}
      >
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 shadow-sm border border-gray-200">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="4" cy="5" r="1.5" fill="#bbb" />
            <circle cx="4" cy="9" r="1.5" fill="#bbb" />
            <circle cx="4" cy="13" r="1.5" fill="#bbb" />
            <circle cx="9" cy="5" r="1.5" fill="#bbb" />
            <circle cx="9" cy="9" r="1.5" fill="#bbb" />
            <circle cx="9" cy="13" r="1.5" fill="#bbb" />
            <circle cx="14" cy="5" r="1.5" fill="#bbb" />
            <circle cx="14" cy="9" r="1.5" fill="#bbb" />
            <circle cx="14" cy="13" r="1.5" fill="#bbb" />
          </svg>
          <span className="text-xs text-gray-500 font-medium">Drag card</span>
        </div>
      </div>
      {children}
    </div>
  );
};

const Canva: React.FC<CanvaProps> = ({ cards, onCardMove, renderCard }) => {
  const [lastDraggedId, setLastDraggedId] = useState<string | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const card = cards.find(card => card.id === active.id);
    if (!card) return;
    let newX = card.x + (delta?.x || 0);
    let newY = card.y + (delta?.y || 0);
    // Prevent moving above the top border
    if (newY < 0) newY = 0;
    onCardMove(card.id, newX, newY);
    setLastDraggedId(card.id);
  };

  return (
    <div
      className="relative w-full bg-[#fafafa] rounded-lg overflow-auto"
      style={{ 
        minHeight: 'calc(100vh - 200px)',
        backgroundImage: 'radial-gradient(circle at 1px 1px, #e5e5e5 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}
    >
      <DndContext onDragEnd={handleDragEnd}>
        {cards.map((card, idx) => (
          <DraggableCard
            key={card.id}
            id={card.id}
            x={card.x}
            y={card.y}
            isTop={lastDraggedId === card.id}
          >
            {renderCard(card, idx)}
          </DraggableCard>
        ))}
      </DndContext>
    </div>
  );
};

export default Canva;