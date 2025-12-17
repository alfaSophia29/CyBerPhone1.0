
import React, { useState, useEffect, useRef } from 'react';
import { AudioTrack } from '../types';
import { getAudioTracks } from '../services/storageService';
import { PlayIcon, PauseIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface AudioSelectionModalProps {
  onClose: () => void;
  onSelectTrack: (trackId: string) => void;
}

const AudioSelectionModal: React.FC<AudioSelectionModalProps> = ({ onClose, onSelectTrack }) => {
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setAudioTracks(getAudioTracks());
  }, []);

  useEffect(() => {
    // Cleanup audio when modal is closed
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayPause = (track: AudioTrack) => {
    if (audioRef.current) {
      if (playingTrackId === track.id) {
        audioRef.current.pause();
        setPlayingTrackId(null);
      } else {
        audioRef.current.src = track.url;
        audioRef.current.play();
        setPlayingTrackId(track.id);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Selecionar Áudio</h2>
        <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar pr-2">
          {audioTracks.map((track) => (
            <div key={track.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <button
                onClick={() => handlePlayPause(track)}
                className="p-2 bg-gray-200 rounded-full text-gray-700 hover:bg-gray-300"
              >
                {playingTrackId === track.id ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
              </button>
              <div className="ml-4 flex-grow">
                <p className="font-semibold text-gray-800">{track.title}</p>
                <p className="text-sm text-gray-500">{track.artist}</p>
              </div>
              <button
                onClick={() => onSelectTrack(track.id)}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                aria-label={`Selecionar ${track.title}`}
              >
                <CheckCircleIcon className="h-6 w-6" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-bold"
        >
          Fechar
        </button>
        <audio ref={audioRef} onEnded={() => setPlayingTrackId(null)} />
      </div>
    </div>
  );
};

export default AudioSelectionModal;
