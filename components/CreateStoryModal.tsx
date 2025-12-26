
import React, { useState } from 'react';
import { User } from '../types';
import { addStory } from '../services/storageService';
import { XMarkIcon, PhotoIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface CreateStoryModalProps {
  currentUser: User;
  onClose: () => void;
  onStoryCreated: () => void;
}

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ currentUser, onClose, onStoryCreated }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    setLoading(true);
    // Simula upload/processamento
    setTimeout(() => {
      addStory(currentUser.id, imageUrl);
      onStoryCreated();
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
       <div className="bg-white dark:bg-darkcard w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border border-white/10">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
             <XMarkIcon className="h-6 w-6" />
          </button>

          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="h-8 w-8 text-blue-600" />
             </div>
             <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Novo History</h3>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Compartilhe um momento rápido</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL da Imagem</label>
                <div className="relative">
                   <PhotoIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                   <input 
                     type="text" 
                     value={imageUrl} 
                     onChange={e => setImageUrl(e.target.value)}
                     className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 dark:text-white rounded-2xl border-none outline-none font-bold text-sm" 
                     placeholder="Cole o link da foto aqui..." 
                     required 
                   />
                </div>
             </div>

             {imageUrl && (
               <div className="rounded-2xl overflow-hidden border-2 border-blue-500/30 h-64 bg-gray-100 dark:bg-black/20">
                  <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" onError={() => alert('Link de imagem inválido')} />
               </div>
             )}

             <button 
               type="submit" 
               disabled={loading || !imageUrl.trim()}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
             >
                {loading ? 'Publicando...' : 'Publicar History'}
             </button>
          </form>
       </div>
    </div>
  );
};

export default CreateStoryModal;
