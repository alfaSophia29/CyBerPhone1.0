
import React, { useState, useEffect, useRef } from 'react';
import { Post, PostType, User, UserType, AudioTrack } from '../types';
import { savePosts, getPosts, findAudioTrackById, updatePost, addPost } from '../services/storageService';
import { 
  SparklesIcon, 
  VideoCameraIcon, 
  PhotoIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  ChevronRightIcon,
  XMarkIcon,
  DocumentTextIcon,
  LockClosedIcon,
  FilmIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/solid';
import AudioSelectionModal from './AudioSelectionModal';

interface CreatePostProps {
  currentUser: User;
  onPostCreated: () => void;
  refreshUser: () => void;
  postId?: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onPostCreated, refreshUser, postId }) => {
  const [isExpanded, setIsExpanded] = useState(!!postId);
  const [postType, setPostType] = useState<PostType>(PostType.TEXT);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string | undefined>(undefined);
  const [showAudioModal, setShowAudioModal] = useState(false);
  
  // Agendamento
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const isEditing = !!postId;
  const isCreator = currentUser.userType === UserType.CREATOR;

  // Carregar dados se for edição
  useEffect(() => {
    if (postId) {
      const posts = getPosts();
      const postToEdit = posts.find(p => p.id === postId);
      if (postToEdit) {
        setPostType(postToEdit.type);
        setContent(postToEdit.content || '');
        setImageUrl(postToEdit.imageUrl || '');
        if (postToEdit.type === PostType.REEL && postToEdit.reel) {
          setVideoUrl(postToEdit.reel.videoUrl || '');
          setSelectedAudioTrackId(postToEdit.reel.audioTrackId);
          setContent(postToEdit.reel.description || '');
        }
        if (postToEdit.scheduledAt) {
          const date = new Date(postToEdit.scheduledAt);
          setScheduledDate(date.toISOString().split('T')[0]);
          setScheduledTime(date.toTimeString().split(' ')[0].slice(0, 5));
          setIsScheduled(true);
        }
      }
    }
  }, [postId]);

  const selectedTrack = selectedAudioTrackId ? findAudioTrackById(selectedAudioTrackId) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica baseada no tipo
    if (postType === PostType.TEXT && !content.trim()) return;
    if (postType === PostType.IMAGE && !imageUrl.trim()) return;
    if (postType === PostType.REEL && !videoUrl.trim()) return;

    setLoading(true);

    let scheduledTimestamp: number | undefined = undefined;
    if (isScheduled && scheduledDate && scheduledTime) {
       scheduledTimestamp = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
    }

    try {
      const posts = getPosts();
      const existingPost = isEditing ? posts.find(p => p.id === postId) : null;

      const postData: Post = {
        id: isEditing ? postId! : `post-${Date.now()}`,
        userId: currentUser.id,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        authorProfilePic: currentUser.profilePicture,
        type: postType,
        timestamp: isEditing && existingPost ? existingPost.timestamp : Date.now(),
        scheduledAt: scheduledTimestamp,
        content: postType !== PostType.REEL ? content : undefined,
        imageUrl: postType === PostType.IMAGE ? imageUrl : undefined,
        reel: postType === PostType.REEL ? {
          title: content.split('\n')[0] || 'Novo Reel',
          description: content,
          videoUrl: videoUrl,
          audioTrackId: selectedAudioTrackId
        } : undefined,
        likes: isEditing && existingPost ? existingPost.likes : [],
        comments: isEditing && existingPost ? existingPost.comments : [],
        shares: isEditing && existingPost ? existingPost.shares : [],
        saves: isEditing && existingPost ? existingPost.saves : [],
        indicatedUserIds: isEditing && existingPost ? existingPost.indicatedUserIds : [],
      };

      if (isEditing) {
        updatePost(postData);
      } else {
        addPost(postData);
      }
      
      // Resetar form
      if (!isEditing) {
        setContent(''); 
        setImageUrl(''); 
        setVideoUrl('');
        setSelectedAudioTrackId(undefined);
        setIsExpanded(false); 
        setIsScheduled(false);
      }
      
      onPostCreated();
    } catch (err) {
      alert('Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded && !isEditing) {
    return (
      <div className="bg-white dark:bg-darkcard rounded-2xl md:rounded-[2rem] shadow-sm p-4 border border-gray-100 dark:border-white/10 animate-fade-in group hover:shadow-md transition-all flex flex-col gap-3">
         <div className="flex items-start gap-3">
            <img 
              src={currentUser.profilePicture} 
              className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform shrink-0" 
            />
            <button 
              onClick={() => setIsExpanded(true)}
              className="flex-1 text-left px-4 py-2.5 bg-slate-50 dark:bg-white/5 rounded-xl text-gray-400 dark:text-gray-500 font-bold hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-xs md:text-sm"
            >
              O que você quer ensinar hoje, {currentUser.firstName}?
            </button>
         </div>
         
         <div className="flex items-center gap-4 md:gap-8 px-1 border-t border-gray-50 dark:border-white/5 pt-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => { setIsExpanded(true); setPostType(PostType.IMAGE); }} 
              className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-all shrink-0"
            >
               <PhotoIcon className="h-5 w-5 text-blue-500" />
               <span className="text-[10px] font-black uppercase tracking-widest">Imagem</span>
            </button>
            <button 
              onClick={() => { setIsExpanded(true); setPostType(PostType.REEL); }} 
              className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-all shrink-0"
            >
               <FilmIcon className="h-5 w-5 text-purple-500" />
               <span className="text-[10px] font-black uppercase tracking-widest">Reel</span>
            </button>
            <button 
              onClick={() => { 
                if(!isCreator) {
                  alert("A função de Live é exclusiva para Criadores. Desbloqueie em 'Minha Loja'.");
                  return;
                }
                setIsExpanded(true); 
                setPostType(PostType.LIVE); 
              }} 
              className={`flex items-center gap-2 transition-all shrink-0 ${isCreator ? 'text-gray-500 hover:text-red-600' : 'text-gray-300 cursor-not-allowed'}`}
            >
               {isCreator ? <VideoCameraIcon className="h-5 w-5 text-red-500" /> : <LockClosedIcon className="h-4 w-4 text-gray-300" />}
               <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-darkcard rounded-[2.5rem] shadow-2xl p-6 md:p-8 border border-blue-50 dark:border-white/5 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
           <div className={`p-3 text-white rounded-2xl shadow-lg transform -rotate-3 ${postType === PostType.REEL ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200'}`}>
             {postType === PostType.REEL ? <FilmIcon className="h-6 w-6" /> : <SparklesIcon className="h-6 w-6" />}
           </div>
           <div>
              <h3 className="font-black text-gray-900 dark:text-white uppercase text-[10px] tracking-[0.2em]">{isEditing ? 'Editar Publicação' : 'Criar Publicação'}</h3>
              <p className="text-[8px] text-blue-500 font-black uppercase mt-0.5 tracking-widest">Comunidade Educacional</p>
           </div>
        </div>
        <button onClick={() => { if(isEditing) onPostCreated(); else setIsExpanded(false); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-300">
            <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 dark:bg-white/5 rounded-2xl w-fit border border-slate-100 dark:border-white/5">
           {[
             { id: PostType.TEXT, icon: DocumentTextIcon, label: 'Texto', color: 'blue', locked: false },
             { id: PostType.IMAGE, icon: PhotoIcon, label: 'Imagem', color: 'indigo', locked: false },
             { id: PostType.REEL, icon: FilmIcon, label: 'Reel', color: 'purple', locked: false },
             { id: PostType.LIVE, icon: VideoCameraIcon, label: 'Aula', color: 'red', locked: !isCreator }
           ].map(t => (
             <button 
               key={t.id} 
               type="button" 
               disabled={t.locked}
               onClick={() => setPostType(t.id)}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${postType === t.id ? `bg-white dark:bg-white/10 text-${t.color}-600 dark:text-white shadow-sm` : 'text-gray-400 hover:text-gray-600'} ${t.locked ? 'opacity-30 cursor-not-allowed' : ''}`}
             >
                {t.locked ? <LockClosedIcon className="h-3 w-3" /> : <t.icon className="h-4 w-4" />} 
                {t.label}
             </button>
           ))}
        </div>

        <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={postType === PostType.REEL ? 3 : 4}
              className="w-full p-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-darkcard rounded-2xl outline-none font-medium text-lg transition-all shadow-inner dark:text-white"
              placeholder={
                postType === PostType.LIVE ? "Título da aula ao vivo..." : 
                postType === PostType.REEL ? "Legenda do seu vídeo educativo..." :
                "O que você quer compartilhar?"
              }
            />
        </div>

        {postType === PostType.IMAGE && (
          <div className="animate-fade-in p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
             <label className="block text-[8px] font-black text-indigo-400 uppercase mb-2 ml-1">Link da Imagem</label>
             <div className="relative">
                <PhotoIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" />
                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white dark:bg-darkcard rounded-xl outline-none font-bold border border-transparent focus:border-indigo-400 text-xs shadow-sm dark:text-white" placeholder="URL da foto..." />
             </div>
          </div>
        )}

        {postType === PostType.REEL && (
          <div className="animate-fade-in space-y-4">
            <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/20">
               <label className="block text-[8px] font-black text-purple-400 uppercase mb-2 ml-1">URL do Vídeo (MP4)</label>
               <div className="relative">
                  <FilmIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" />
                  <input 
                    type="text" 
                    value={videoUrl} 
                    onChange={e => setVideoUrl(e.target.value)} 
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-darkcard rounded-xl outline-none font-bold border border-transparent focus:border-purple-400 text-xs shadow-sm dark:text-white" 
                    placeholder="Link do vídeo para o Reel..." 
                  />
               </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <MusicalNoteIcon className="h-4 w-4 text-purple-600" />
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Trilha Sonora</p>
                      <p className="text-xs font-bold dark:text-white">{selectedTrack ? `${selectedTrack.title} - ${selectedTrack.artist}` : 'Nenhuma selecionada'}</p>
                   </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowAudioModal(true)}
                  className="px-4 py-2 bg-white dark:bg-white/10 text-purple-600 dark:text-purple-400 rounded-xl text-[10px] font-black uppercase border border-purple-100 dark:border-purple-900/30 shadow-sm"
                >
                  {selectedAudioTrackId ? 'Trocar' : 'Escolher Música'}
                </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-50 dark:border-white/5">
           <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isScheduled ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-white/5 text-gray-500 border border-slate-100 dark:border-white/5'}`}
              >
                 <CalendarDaysIcon className="h-4 w-4" /> {isScheduled ? 'Agendado' : 'Agendar'}
              </button>
              {showScheduleForm && (
                <div className="flex items-center gap-2 animate-fade-in">
                   <input type="date" value={scheduledDate} onChange={e => {setScheduledDate(e.target.value); setIsScheduled(true);}} className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-[10px] font-black outline-none focus:border-blue-500 dark:text-white" />
                   <input type="time" value={scheduledTime} onChange={e => {setScheduledTime(e.target.value); setIsScheduled(true);}} className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-[10px] font-black outline-none focus:border-blue-500 dark:text-white" />
                </div>
              )}
           </div>

           <button
             type="submit"
             disabled={loading || (postType === PostType.TEXT && !content.trim()) || (postType === PostType.IMAGE && !imageUrl.trim()) || (postType === PostType.REEL && !videoUrl.trim())}
             className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 ${postType === PostType.REEL ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-900 dark:bg-white dark:text-black text-white hover:bg-blue-600'}`}
           >
             {loading ? <div className="w-5 h-5 border-3 border-white border-t-transparent animate-spin rounded-full"></div> : <>{isEditing ? 'Atualizar' : 'Publicar'} <ChevronRightIcon className="h-5 w-5" /></>}
           </button>
        </div>
      </form>

      {showAudioModal && (
        <AudioSelectionModal 
          onClose={() => setShowAudioModal(false)}
          onSelectTrack={(id) => {
            setSelectedAudioTrackId(id);
            setShowAudioModal(false);
          }}
        />
      )}
    </div>
  );
};

export default CreatePost;
