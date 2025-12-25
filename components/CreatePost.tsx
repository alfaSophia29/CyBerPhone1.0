
import React, { useState, useEffect, useRef } from 'react';
import { Post, PostType, User, UserType } from '../types';
import { savePosts, getPosts } from '../services/storageService';
import { 
  SparklesIcon, 
  VideoCameraIcon, 
  PhotoIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  ChevronRightIcon,
  XMarkIcon,
  DocumentTextIcon,
  ChevronDownIcon
} from '@heroicons/react/24/solid';

interface CreatePostProps {
  currentUser: User;
  onPostCreated: () => void;
  refreshUser: () => void;
  postId?: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onPostCreated, refreshUser, postId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [postType, setPostType] = useState<PostType>(PostType.TEXT);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Agendamento
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const isEditing = !!postId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl.trim()) return;
    setLoading(true);

    let scheduledTimestamp: number | undefined = undefined;
    if (isScheduled && scheduledDate && scheduledTime) {
       scheduledTimestamp = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
    }

    try {
      const allPosts = getPosts(true);
      const postData: Post = {
        id: isEditing ? postId : `post-${Date.now()}`,
        userId: currentUser.id,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        authorProfilePic: currentUser.profilePicture,
        type: postType,
        timestamp: Date.now(),
        scheduledAt: scheduledTimestamp,
        content,
        imageUrl: postType === PostType.IMAGE ? imageUrl : undefined,
        likes: [], comments: [], shares: [], saves: [],
      };

      if (isEditing) savePosts(allPosts.map(p => p.id === postId ? postData : p));
      else savePosts([postData, ...allPosts]);
      
      setContent(''); setImageUrl(''); setIsExpanded(false); setIsScheduled(false);
      onPostCreated();
    } catch (err) {
      alert('Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-sm p-5 border border-gray-100 flex items-center gap-5 animate-fade-in group hover:shadow-md transition-all">
         <img src={currentUser.profilePicture} className="w-14 h-14 rounded-[1.2rem] object-cover shadow-sm group-hover:scale-105 transition-transform" />
         <button 
           onClick={() => setIsExpanded(true)}
           className="flex-1 text-left px-8 py-5 bg-slate-50 rounded-[1.5rem] text-gray-500 font-bold hover:bg-slate-100 transition-all border border-slate-100 hover:border-slate-200"
         >
           Deseja compartilhar algo novo hoje, {currentUser.firstName}?
         </button>
         <div className="flex items-center gap-2 px-2">
            <button onClick={() => { setIsExpanded(true); setPostType(PostType.IMAGE); }} className="p-4 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-all shadow-sm"><PhotoIcon className="h-6 w-6" /></button>
            <button onClick={() => { setIsExpanded(true); setPostType(PostType.LIVE); }} className="p-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition-all shadow-sm"><VideoCameraIcon className="h-6 w-6" /></button>
         </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-10 border border-blue-50 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2.5 h-full bg-blue-600"></div>
      
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-lg shadow-blue-200 transform -rotate-3"><SparklesIcon className="h-7 w-7" /></div>
           <div>
              <h3 className="font-black text-gray-900 uppercase text-xs tracking-[0.2em]">Criar Publicação</h3>
              <p className="text-[10px] text-blue-500 font-black uppercase mt-0.5 tracking-widest">Enriqueça a comunidade CyBerPhone</p>
           </div>
        </div>
        <button onClick={() => setIsExpanded(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors text-gray-300 hover:text-gray-900">
            <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-wrap gap-3 p-2 bg-slate-50 rounded-[2rem] w-fit border border-slate-100 shadow-inner">
           {[
             { id: PostType.TEXT, icon: DocumentTextIcon, label: 'Pensamento', color: 'blue' },
             { id: PostType.IMAGE, icon: PhotoIcon, label: 'Imagem', color: 'indigo' },
             { id: PostType.LIVE, icon: VideoCameraIcon, label: 'Aula ao Vivo', color: 'red' }
           ].map(t => (
             <button 
               key={t.id} 
               type="button" 
               onClick={() => setPostType(t.id)}
               className={`flex items-center gap-3 px-6 py-3 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${postType === t.id ? `bg-white text-${t.color}-600 shadow-xl border border-${t.color}-100` : 'text-gray-400 hover:text-gray-600'}`}
             >
                <t.icon className="h-5 w-5" /> {t.label}
             </button>
           ))}
        </div>

        <div className="relative">
            <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full p-8 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[2.5rem] outline-none font-medium text-xl transition-all shadow-inner"
            placeholder={postType === PostType.LIVE ? "Título e detalhes da aula ao vivo..." : "Escreva sua mensagem educacional aqui..."}
            />
            {content.length > 0 && <div className="absolute bottom-6 right-8 text-[10px] font-black text-gray-300 uppercase">{content.length} caracteres</div>}
        </div>

        {postType === PostType.IMAGE && (
          <div className="animate-fade-in p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
             <label className="block text-[10px] font-black text-indigo-400 uppercase mb-3 ml-2 tracking-[0.2em]">Link da Imagem Ilustrativa</label>
             <div className="relative">
                <PhotoIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" />
                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full pl-12 pr-6 py-5 bg-white rounded-2xl outline-none font-bold border border-transparent focus:border-indigo-400 text-sm shadow-sm" placeholder="Cole a URL da foto (ex: unsplash.com/...)" />
             </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-50">
           <div className="flex items-center gap-5">
              <button 
                type="button" 
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isScheduled ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-slate-50 text-gray-500 hover:bg-slate-100 border border-slate-100'}`}
              >
                 <CalendarDaysIcon className="h-5 w-5" /> {isScheduled ? 'Data Definida' : 'Agendar Post'}
              </button>
              {showScheduleForm && (
                <div className="flex items-center gap-3 animate-fade-in">
                   <input type="date" value={scheduledDate} onChange={e => {setScheduledDate(e.target.value); setIsScheduled(true);}} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-500" />
                   <input type="time" value={scheduledTime} onChange={e => {setScheduledTime(e.target.value); setIsScheduled(true);}} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-500" />
                </div>
              )}
           </div>

           <button
             type="submit"
             disabled={loading || (!content.trim() && !imageUrl.trim())}
             className="w-full md:w-auto bg-black text-white px-12 py-6 rounded-[2.2rem] font-black text-lg shadow-2xl hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-4 group disabled:opacity-30 disabled:cursor-not-allowed"
           >
             {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent animate-spin rounded-full"></div> : <>Publicar Agora <ChevronRightIcon className="h-6 w-6 group-hover:translate-x-1 transition-transform" /></>}
           </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
