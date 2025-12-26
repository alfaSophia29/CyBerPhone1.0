
import React, { useState, useEffect, useCallback } from 'react';
import { Story } from '../types';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface StoryViewerModalProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000;

const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ stories, initialIndex, onClose }) => {
  const [currentUserIdx, setCurrentUserIdx] = useState(initialIndex);
  const [currentItemIdx, setCurrentItemIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentUserIdx];
  const currentItem = currentStory.items[currentItemIdx];

  const handleNext = useCallback(() => {
    if (currentItemIdx < currentStory.items.length - 1) {
      setCurrentItemIdx(prev => prev + 1);
      setProgress(0);
    } else if (currentUserIdx < stories.length - 1) {
      setCurrentUserIdx(prev => prev + 1);
      setCurrentItemIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentItemIdx, currentUserIdx, currentStory.items.length, stories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentItemIdx > 0) {
      setCurrentItemIdx(prev => prev - 1);
      setProgress(0);
    } else if (currentUserIdx > 0) {
      setCurrentUserIdx(prev => prev - 1);
      setCurrentItemIdx(stories[currentUserIdx - 1].items.length - 1);
      setProgress(0);
    }
  }, [currentItemIdx, currentUserIdx, stories]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(timer);
  }, [handleNext]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center animate-fade-in">
      <div className="relative w-full max-w-lg h-full md:h-[90vh] md:rounded-[2rem] overflow-hidden bg-black flex flex-col">
        
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
          {currentStory.items.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-white transition-all duration-100 ease-linear"
                 style={{ 
                   width: idx === currentItemIdx ? `${progress}%` : idx < currentItemIdx ? '100%' : '0%' 
                 }}
               />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-6 right-6 flex items-center justify-between z-20">
           <div className="flex items-center gap-3">
              <img src={currentStory.userProfilePic} className="w-10 h-10 rounded-full border-2 border-white object-cover" />
              <span className="font-black text-white text-sm shadow-sm">{currentStory.userName}</span>
           </div>
           <button onClick={onClose} className="p-2 text-white/70 hover:text-white">
              <XMarkIcon className="h-7 w-7" />
           </button>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center">
           <img src={currentItem.imageUrl} className="w-full h-full object-contain" alt="Story" />
        </div>

        {/* Controls Overlay */}
        <div className="absolute inset-0 z-10 flex">
           <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev}></div>
           <div className="w-2/3 h-full cursor-pointer" onClick={handleNext}></div>
        </div>

        {/* Nav Buttons (Desktop) */}
        <button 
          onClick={handlePrev} 
          className="hidden md:flex absolute -left-16 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white z-50"
        >
           <ChevronLeftIcon className="h-8 w-8" />
        </button>
        <button 
          onClick={handleNext} 
          className="hidden md:flex absolute -right-16 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white z-50"
        >
           <ChevronRightIcon className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
};

export default StoryViewerModal;
