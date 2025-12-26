
import React, { useState, useRef, useEffect } from 'react';
import { Post, PostType, User, UserType, Comment } from '../types';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { 
  findUserById, 
  updatePostLikes, 
  addPostComment, 
  updatePostShares, 
  updatePostSaves, 
  deletePost, 
  reportPost,
  pinPost,
  unpinPost
} from '../services/storageService';
import {
  HeartIcon as HeartIconOutline, 
  ChatBubbleOvalLeftIcon as ChatIconOutline, 
  BookmarkIcon as BookmarkIconOutline, 
  EllipsisHorizontalIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckBadgeIcon,
  FlagIcon,
  PaperAirplaneIcon,
  MapPinIcon as PinIconOutline,
  UserPlusIcon,
  VideoCameraIcon,
  SignalIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid, 
  BookmarkIcon as BookmarkIconSolid,
  MapPinIcon as PinIconSolid,
  PlayIcon
} from '@heroicons/react/24/solid';
import IndicateModal from './IndicateModal';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onFollowToggle: (userIdToFollow: string) => void;
  refreshUser: () => void;
  onPostUpdatedOrDeleted: () => void;
  onPinToggle: (postId: string, isCurrentlyPinned: boolean) => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  currentUser, 
  onNavigate, 
  onFollowToggle, 
  refreshUser, 
  onPostUpdatedOrDeleted 
}) => {
  const postAuthor = findUserById(post.userId);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [showIndicateModal, setShowIndicateModal] = useState(false);
  
  const optionsRef = useRef<HTMLDivElement>(null);
  const hasLiked = post.likes.includes(currentUser.id);
  const hasSaved = post.saves.includes(currentUser.id);
  const isAuthor = currentUser.id === post.userId;
  const isFollowing = currentUser.followedUsers.includes(post.userId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) setShowOptions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = () => {
    updatePostLikes(post.id, currentUser.id);
    onPostUpdatedOrDeleted();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addPostComment(post.id, {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      userName: `${currentUser.firstName}`,
      profilePic: currentUser.profilePicture,
      text: newCommentText,
      timestamp: Date.now(),
    });
    setNewCommentText('');
    onPostUpdatedOrDeleted();
  };

  const handleShareExternal = async () => {
    const shareData = {
      title: post.liveStream?.title || 'Aula CyBerPhone',
      text: post.content || 'Confira este conteúdo educativo na CyBerPhone!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        updatePostShares(post.id, currentUser.id);
        onPostUpdatedOrDeleted();
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta publicação?')) {
      deletePost(post.id);
      onPostUpdatedOrDeleted();
      setShowOptions(false);
    }
  };

  const handlePin = () => {
    if (post.isPinned) unpinPost(post.id, currentUser.id);
    else pinPost(post.id, currentUser.id);
    onPostUpdatedOrDeleted();
    setShowOptions(false);
  };

  if (!postAuthor) return null;

  return (
    <div className="bg-white dark:bg-darkcard rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-white/10 overflow-hidden w-full relative mb-6 transition-all hover:shadow-md animate-fade-in">
      
      {/* HEADER */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => onNavigate('profile', { userId: post.userId })}>
            <img src={postAuthor.profilePicture || DEFAULT_PROFILE_PIC} className="w-11 h-11 rounded-xl object-cover shadow-sm" />
            {postAuthor.userType === UserType.CREATOR && (
              <CheckBadgeIcon className="h-4 w-4 text-blue-600 absolute -bottom-1 -right-1 fill-white dark:fill-darkcard" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-gray-900 dark:text-white text-sm leading-tight hover:underline cursor-pointer" onClick={() => onNavigate('profile', { userId: post.userId })}>
                  {postAuthor.firstName} {postAuthor.lastName}
              </h4>
              {!isAuthor && !isFollowing && (
                <button 
                  onClick={() => onFollowToggle(post.userId)}
                  className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md hover:bg-blue-600 hover:text-white transition-all"
                >
                  Seguir
                </button>
              )}
              {post.isPinned && <PinIconSolid className="h-3 w-3 text-blue-500" />}
            </div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{new Date(post.timestamp).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="relative" ref={optionsRef}>
          <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-gray-300 hover:text-blue-600 transition-colors">
            <EllipsisHorizontalIcon className="h-6 w-6" />
          </button>
          {showOptions && (
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-darkcard rounded-2xl shadow-2xl py-2 z-20 border dark:border-white/10 animate-fade-in">
              {isAuthor ? (
                <>
                  <button onClick={handlePin} className="flex items-center w-full px-4 py-3 text-[10px] font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    {post.isPinned ? <><PinIconSolid className="h-4 w-4 mr-3 text-blue-500" /> Desafixar</> : <><PinIconOutline className="h-4 w-4 mr-3 text-blue-500" /> Fixar no Perfil</>}
                  </button>
                  <button onClick={() => onNavigate('edit-post', { postId: post.id })} className="flex items-center w-full px-4 py-3 text-[10px] font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <PencilIcon className="h-4 w-4 mr-3 text-indigo-500" /> Editar Aula
                  </button>
                  <button onClick={handleDelete} className="flex items-center w-full px-4 py-3 text-[10px] font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                    <TrashIcon className="h-4 w-4 mr-3" /> Excluir
                  </button>
                </>
              ) : (
                <button onClick={() => setShowReportConfirm(true)} className="flex items-center w-full px-4 py-3 text-[10px] font-black text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors">
                  <FlagIcon className="h-4 w-4 mr-3" /> Denunciar conteúdo
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-5 pb-4">
        {post.type === PostType.LIVE && post.liveStream ? (
           <div className="rounded-[2.5rem] overflow-hidden bg-gray-900 text-white p-8 relative shadow-2xl group border-4 border-blue-600/30">
              <div className="absolute top-6 left-6 z-10">
                 <div className="bg-red-600 px-3 py-1.5 rounded-lg text-[9px] font-black flex items-center gap-2 shadow-lg animate-pulse uppercase tracking-widest">
                    <SignalIcon className="h-3 w-3" /> Ao Vivo
                 </div>
              </div>
              <div className="relative z-10 py-10 flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mb-6 border border-blue-500/30">
                    <VideoCameraIcon className="h-10 w-10 text-blue-400" />
                 </div>
                 <h3 className="text-2xl font-black mb-3 tracking-tighter leading-tight uppercase">{post.liveStream.title}</h3>
                 <p className="text-gray-400 text-sm max-w-sm mb-8 font-medium">{post.liveStream.description}</p>
                 <button 
                    onClick={() => onNavigate('live', { postId: post.id })}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/40 active:scale-95 transition-all flex items-center gap-3"
                 >
                    <PlayIcon className="h-5 w-5" /> Assistir Aula
                 </button>
              </div>
           </div>
        ) : (
          <>
            {post.content && <p className="text-gray-700 dark:text-gray-300 text-sm font-medium leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>}
            {post.imageUrl && (
              <div className="rounded-[2rem] overflow-hidden border dark:border-white/5 bg-gray-50 dark:bg-darkbg">
                 <img src={post.imageUrl} className="w-full h-auto object-cover max-h-[600px]" alt="Post" />
              </div>
            )}
          </>
        )}
      </div>

      {/* ACTIONS */}
      <div className="px-5 py-3 flex items-center justify-between border-t dark:border-white/5">
        <div className="flex items-center gap-1 md:gap-2">
          {/* Like */}
          <button onClick={handleLike} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-90 ${hasLiked ? 'bg-red-50 dark:bg-red-500/10 text-red-600' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
            {hasLiked ? <HeartIconSolid className="h-5 w-5" /> : <HeartIconOutline className="h-5 w-5" />}
            <span className="font-black text-xs">{post.likes.length}</span>
          </button>
          
          {/* Comment */}
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
            <ChatIconOutline className="h-5 w-5" />
            <span className="font-black text-xs">{post.comments.length}</span>
          </button>

          {/* Indicar (Interno) */}
          <button onClick={() => setShowIndicateModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
            <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
            <span className="font-black text-[10px] uppercase hidden sm:inline">Indicar</span>
          </button>

          {/* Share (Externo) */}
          <button onClick={handleShareExternal} className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
            <ShareIcon className="h-5 w-5" />
            <span className="font-black text-[10px] uppercase hidden sm:inline">Compartilhar</span>
          </button>
        </div>
        
        <div className="flex gap-1">
          <button onClick={() => { updatePostSaves(post.id, currentUser.id); onPostUpdatedOrDeleted(); }} className={`p-2.5 rounded-xl transition-all active:scale-90 ${hasSaved ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
            {hasSaved ? <BookmarkIconSolid className="h-5 w-5" /> : <BookmarkIconOutline className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* COMMENTS */}
      {showComments && (
        <div className="p-5 bg-gray-50 dark:bg-white/5 border-t dark:border-white/5">
           <div className="space-y-4 mb-4 max-h-60 overflow-y-auto no-scrollbar">
              {post.comments.map(c => (
                <div key={c.id} className="flex gap-3">
                   <img src={c.profilePic || DEFAULT_PROFILE_PIC} className="w-8 h-8 rounded-lg object-cover" />
                   <div className="bg-white dark:bg-darkcard p-3 rounded-2xl shadow-sm flex-1 border dark:border-white/5">
                      <p className="font-black text-[9px] dark:text-white uppercase leading-none mb-1">{c.userName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{c.text}</p>
                   </div>
                </div>
              ))}
           </div>
           <form onSubmit={handleAddComment} className="flex gap-2">
              <input type="text" value={newCommentText} onChange={e => setNewCommentText(e.target.value)} placeholder="Sua dúvida..." className="flex-1 px-4 py-3 bg-white dark:bg-darkcard rounded-xl text-xs font-bold outline-none border border-transparent focus:border-blue-500 dark:text-white" />
              <button type="submit" disabled={!newCommentText.trim()} className="bg-blue-600 text-white px-5 rounded-xl font-black text-[10px] uppercase shadow-lg disabled:opacity-50">Enviar</button>
           </form>
        </div>
      )}

      {/* Indicate Modal */}
      {showIndicateModal && (
        <IndicateModal 
          post={post} 
          currentUser={currentUser} 
          onClose={() => setShowIndicateModal(false)} 
          onPostUpdated={onPostUpdatedOrDeleted}
        />
      )}
    </div>
  );
};

export default PostCard;
