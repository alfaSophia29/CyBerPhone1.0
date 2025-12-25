
import React, { useState, useRef, useEffect } from 'react';
import { Post, PostType, User, UserType, Comment } from '../types';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { findUserById, updatePostLikes, addPostComment, updatePostShares, updatePostSaves, deletePost, pinPost, unpinPost, reportPost } from '../services/storageService';
import {
  HeartIcon as HeartIconOutline, 
  ChatBubbleOvalLeftIcon as ChatIconOutline, 
  ShareIcon as ShareIconOutline, 
  BookmarkIcon as BookmarkIconOutline, 
  EllipsisHorizontalIcon, 
  PencilIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  VideoCameraIcon,
  MapPinIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid, 
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onFollowToggle: (userIdToFollow: string) => void;
  refreshUser: () => void;
  onPostUpdatedOrDeleted: () => void;
  onPinToggle: (postId: string, isCurrentlyPinned: boolean) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onNavigate, onFollowToggle, refreshUser, onPostUpdatedOrDeleted, onPinToggle }) => {
  const postAuthor = findUserById(post.userId);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  
  const hasLiked = post.likes.includes(currentUser.id);
  const hasSaved = post.saves.includes(currentUser.id);
  const isAuthor = currentUser.id === post.userId;

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
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      profilePic: currentUser.profilePicture,
      text: newCommentText,
      timestamp: Date.now(),
    });
    setNewCommentText('');
    onPostUpdatedOrDeleted();
  };

  if (!postAuthor) return null;

  return (
    <div className={`bg-white dark:bg-darkcard rounded-[2rem] md:rounded-[2.5rem] shadow-sm border ${post.isPinned ? 'border-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/10' : 'border-gray-50 dark:border-white/10'} overflow-hidden transition-all duration-300 hover:shadow-lg w-full`}>
      
      {/* Header */}
      <div className="p-4 md:p-6 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('profile', { userId: post.userId })}>
          <div className="relative">
            <img src={postAuthor.profilePicture || DEFAULT_PROFILE_PIC} className="w-10 h-10 md:w-12 md:h-12 rounded-[1.2rem] object-cover shadow-sm group-hover:scale-105 transition-transform" />
            {postAuthor.userType === UserType.CREATOR && <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 border-2 border-white dark:border-darkcard"><CheckBadgeIcon className="h-3 w-3" /></div>}
          </div>
          <div>
            <h4 className="font-black text-gray-900 dark:text-white text-xs md:text-sm group-hover:text-blue-600 transition-colors leading-none">{postAuthor.firstName} {postAuthor.lastName}</h4>
            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
              {new Date(post.timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="relative" ref={optionsRef}>
          <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-gray-300 hover:text-blue-600 transition-colors">
            <EllipsisHorizontalIcon className="h-6 w-6" />
          </button>
          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-darkcard rounded-2xl shadow-2xl py-2 z-20 border border-gray-100 dark:border-white/10 animate-fade-in">
              {isAuthor ? (
                <>
                  <button onClick={() => onNavigate('edit-post', { postId: post.id })} className="flex items-center w-full px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"><PencilIcon className="h-4 w-4 mr-3 text-blue-500" /> Editar</button>
                  <button onClick={() => { if(window.confirm('Excluir?')) { deletePost(post.id); onPostUpdatedOrDeleted(); } }} className="flex items-center w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><TrashIcon className="h-4 w-4 mr-3" /> Apagar</button>
                </>
              ) : (
                <button onClick={() => { reportPost(post.id, currentUser.id); alert('Reportado.'); setShowOptions(false); }} className="flex items-center w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><ExclamationTriangleIcon className="h-4 w-4 mr-3" /> Reportar</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        {post.content && (
          <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base font-medium leading-relaxed mb-4 whitespace-pre-wrap line-clamp-6">
            {post.content}
          </p>
        )}
        
        {post.imageUrl && (
          <div className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-gray-50 dark:border-white/5 mb-4 bg-gray-50 dark:bg-white/5">
            <img src={post.imageUrl} className="w-full h-auto object-cover max-h-[400px] md:max-h-[500px]" alt="Post" />
          </div>
        )}

        {post.type === PostType.LIVE && post.liveStream && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-4 flex items-center justify-between group/live cursor-pointer" onClick={() => onNavigate('live', { postId: post.id })}>
             <div className="flex-1 pr-4">
                <span className="text-[8px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest block mb-1">Aula ao Vivo</span>
                <h5 className="font-black text-gray-900 dark:text-white text-sm md:text-base leading-tight truncate">{post.liveStream.title}</h5>
             </div>
             <button className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg">Entrar</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 md:px-6 pb-4 md:pb-6 flex items-center justify-between border-t border-gray-50 dark:border-white/5 pt-3">
        <div className="flex items-center gap-1">
          <button onClick={handleLike} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${hasLiked ? 'bg-red-50 dark:bg-red-500/10 text-red-600' : 'text-gray-400 hover:bg-gray-50'}`}>
            {hasLiked ? <HeartIconSolid className="h-5 w-5" /> : <HeartIconOutline className="h-5 w-5" />}
            <span className="font-black text-[10px]">{post.likes.length}</span>
          </button>
          <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${showComments ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}>
            <ChatIconOutline className="h-5 w-5" />
            <span className="font-black text-[10px]">{post.comments.length}</span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { updatePostSaves(post.id, currentUser.id); onPostUpdatedOrDeleted(); }} className={`p-2.5 rounded-xl ${hasSaved ? 'text-orange-500' : 'text-gray-300'}`}>
            {hasSaved ? <BookmarkIconSolid className="h-5 w-5" /> : <BookmarkIconOutline className="h-5 w-5" />}
          </button>
          <button onClick={() => { updatePostShares(post.id, currentUser.id); alert('Link copiado!'); }} className="p-2.5 rounded-xl text-gray-300 hover:text-blue-500">
            <ShareIconOutline className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showComments && (
        <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 animate-fade-in">
           <div className="space-y-4 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
              {post.comments.map(c => (
                <div key={c.id} className="flex gap-2">
                   <img src={c.profilePic || DEFAULT_PROFILE_PIC} className="w-7 h-7 rounded-lg object-cover" />
                   <div className="bg-white dark:bg-darkcard p-2 rounded-xl rounded-tl-none shadow-sm flex-1">
                      <p className="font-black text-[9px] dark:text-white">{c.userName}</p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">{c.text}</p>
                   </div>
                </div>
              ))}
           </div>
           <form onSubmit={handleAddComment} className="flex gap-2">
              <input type="text" value={newCommentText} onChange={e => setNewCommentText(e.target.value)} placeholder="Reflexão..." className="flex-1 px-3 py-2.5 bg-white dark:bg-darkcard border border-gray-100 dark:border-white/10 dark:text-white rounded-xl text-[11px] font-bold outline-none" />
              <button type="submit" disabled={!newCommentText.trim()} className="bg-blue-600 text-white px-4 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95">Ir</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;
