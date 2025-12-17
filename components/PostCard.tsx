
import React, { useState, useRef, useEffect } from 'react';
import { Post, PostType, User, UserType, Comment } from '../types';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { findUserById, updateUserBalance, updatePostLikes, addPostComment, updatePostShares, updatePostSaves, getUsers, deletePost, pinPost, unpinPost, updatePostReactions, reportPost } from '../services/storageService';
import {
  HeartIcon as HeartIconOutline, ChatBubbleOvalLeftIcon as ChatIconOutline, ShareIcon as ShareIconOutline, BookmarkIcon as BookmarkIconOutline, FaceSmileIcon as FaceSmileIconOutline,
  EllipsisHorizontalIcon, XMarkIcon, PencilIcon, TrashIcon, FilmIcon as FilmIconOutline,
  FlagIcon as FlagIconOutline, ExclamationTriangleIcon, UserMinusIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid, BookmarkIcon as BookmarkIconSolid, ChatBubbleOvalLeftIcon as ChatIconSolid, ShareIcon as ShareIconSolid, FaceSmileIcon as FaceSmileIconSolid, FilmIcon as FilmIconSolid,
  FlagIcon as FlagIconSolid
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
  const isFollowing = currentUser.followedUsers.includes(post.userId);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const hasLiked = post.likes.includes(currentUser.id);
  const hasSaved = post.saves.includes(currentUser.id);
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [animateLike, setAnimateLike] = useState(false);
  const EMOJIS = ['👍', '❤️', '😂', '🔥', '👏'];
  const isAuthor = currentUser.id === post.userId;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) setShowOptions(false);
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) setShowEmojiPicker(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (videoPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const handleLike = () => {
    updatePostLikes(post.id, currentUser.id);
    refreshUser();
    onPostUpdatedOrDeleted();
    setAnimateLike(true);
    setTimeout(() => setAnimateLike(false), 1000);
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
    refreshUser();
    onPostUpdatedOrDeleted();
  };

  const handleShare = () => {
    updatePostShares(post.id, currentUser.id);
    alert('Publicação compartilhada!');
    onPostUpdatedOrDeleted();
  };

  const handleSave = () => {
    updatePostSaves(post.id, currentUser.id);
    refreshUser();
    onPostUpdatedOrDeleted();
  };

  const handleEditPost = () => {
    onNavigate('edit-post', { postId: post.id });
    setShowOptions(false);
  };

  const handleDeletePost = () => {
    if (window.confirm('Tem certeza de que deseja excluir esta publicação?')) {
      deletePost(post.id);
      onPostUpdatedOrDeleted();
      setShowOptions(false);
    }
  };

  const handlePinUnpin = () => {
    onPinToggle(post.id, !!post.isPinned);
    setShowOptions(false);
  };

  const handleReactToPost = (emoji: string) => {
    updatePostReactions(post.id, currentUser.id, emoji);
    onPostUpdatedOrDeleted();
    setShowEmojiPicker(null);
  };

  const handleReportPost = () => {
    if (window.confirm('Deseja realmente denunciar esta postagem por conteúdo impróprio?')) {
      reportPost(post.id, currentUser.id);
      alert('Obrigado. Sua denúncia do post foi enviada.');
      setShowOptions(false);
    }
  };

  const handleReportUser = () => {
    onNavigate('report-user', { userId: post.userId });
    setShowOptions(false);
  };

  if (!postAuthor) return null;

  return (
    <div className={`bg-white rounded-2xl shadow-xl p-6 border ${post.isPinned ? 'border-yellow-400 ring-2 ring-yellow-300' : 'border-gray-100'} transform transition-all duration-300 hover:scale-[1.007] hover:shadow-2xl`}>
      <div className="flex items-center mb-4 relative">
        <img src={postAuthor.profilePicture || DEFAULT_PROFILE_PIC} alt={postAuthor.firstName} className="w-12 h-12 rounded-full object-cover border-2 border-blue-400 shadow-md cursor-pointer" onClick={() => onNavigate('profile', { userId: post.userId })} />
        <div className="ml-3 flex-grow">
          <p className="font-bold text-lg text-gray-800 hover:text-blue-600 cursor-pointer transition-colors" onClick={() => onNavigate('profile', { userId: post.userId })}>
            {post.authorName}
            {postAuthor.userType === UserType.CREATOR && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">Criador</span>}
            {post.isPinned && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1"><FlagIconSolid className="h-4 w-4" />Fixado</span>}
          </p>
          <p className="text-gray-500 text-sm">{new Date(post.timestamp).toLocaleString()}</p>
        </div>
        <div className="relative" ref={optionsRef}>
          <button onClick={() => setShowOptions(!showOptions)} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500" aria-label="Opções do post">
            <EllipsisHorizontalIcon className="h-6 w-6" />
          </button>
          {showOptions && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-10 border border-gray-100">
              {isAuthor ? (
                <>
                  <button onClick={handleEditPost} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"><PencilIcon className="h-4 w-4 mr-3 text-blue-500" /> Editar Publicação</button>
                  <button onClick={handleDeletePost} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"><TrashIcon className="h-4 w-4 mr-3 text-red-500" /> Excluir Publicação</button>
                  <button onClick={handlePinUnpin} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"><FlagIconSolid className="h-4 w-4 mr-3 text-yellow-500" /> {post.isPinned ? 'Desafixar do Feed' : 'Fixar no Topo'}</button>
                </>
              ) : (
                <>
                  <button onClick={handleReportPost} className="flex items-center w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-3 text-orange-500" /> Denunciar Postagem
                  </button>
                  <button onClick={handleReportUser} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-semibold">
                    <UserMinusIcon className="h-5 w-5 mr-3 text-red-500" /> Denunciar Usuário
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {post.type === PostType.TEXT && <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>}
      {post.type === PostType.IMAGE && (
        <>
          {post.content && <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>}
          {post.imageUrl && <img src={post.imageUrl} alt="Post" className="w-full h-auto rounded-lg mt-4 object-cover max-h-96 shadow-md" />}
        </>
      )}

      {post.type === PostType.LIVE && post.liveStream && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200 shadow-inner">
          <h3 className="text-xl font-bold text-blue-700 mb-2 flex items-center">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
            AO VIVO: {post.liveStream.title}
          </h3>
          <p className="text-gray-700 mb-3">{post.liveStream.description}</p>
          {post.liveStream.isPaid && <p className="text-orange-600 font-semibold mb-3">Live Paga: ${post.liveStream.price?.toFixed(2)}</p>}
          <button onClick={() => onNavigate('live', { postId: post.id })} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors shadow-md flex items-center justify-center w-full">Assistir Agora</button>
        </div>
      )}

      {post.type === PostType.REEL && post.reel && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
          <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center"><FilmIconOutline className="h-5 w-5 mr-2 text-purple-600" />REEL: {post.reel.title}</h3>
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden cursor-pointer" onClick={toggleVideoPlay}>
            <video ref={videoRef} src={post.reel.videoUrl} loop className="w-full h-full object-contain" onPlay={() => setVideoPlaying(true)} onPause={() => setVideoPlaying(false)} />
            {!videoPlaying && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><HeartIconSolid className="h-16 w-16 text-white/50" /></div>}
          </div>
        </div>
      )}

      {post.reactions && Object.keys(post.reactions).length > 0 && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          {(Object.entries(post.reactions) as [string, string[]][]).map(([emoji, userIds]) => (
            <div key={emoji} className="flex items-center bg-gray-100 rounded-full px-2 py-1 shadow-sm"><span className="text-lg mr-1">{emoji}</span><span className="font-semibold text-gray-700">{userIds.length}</span></div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-around mt-4 pt-4 border-t border-gray-100 text-gray-600 text-sm font-semibold relative">
        <button onClick={handleLike} className={`flex items-center p-2 rounded-full transition-colors group relative ${hasLiked ? 'text-blue-600 bg-blue-50' : 'hover:bg-gray-100 hover:text-blue-600'}`}>
          {hasLiked ? <HeartIconSolid className="h-6 w-6 text-blue-600" /> : <HeartIconOutline className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />}
          {post.likes.length > 0 && <span className="ml-1">{post.likes.length}</span>}
          {animateLike && <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"><HeartIconSolid className="h-6 w-6 text-red-500 animate-like-heart" /></span>}
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center p-2 rounded-full transition-colors group hover:bg-gray-100 hover:text-blue-600">
          <ChatIconOutline className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />
          {post.comments.length > 0 && <span className="ml-1">{post.comments.length}</span>}
        </button>
        <button onClick={handleShare} className="flex items-center p-2 rounded-full transition-colors group hover:bg-gray-100 hover:text-blue-600"><ShareIconOutline className="h-6 w-6 text-gray-400 group-hover:text-blue-500" /></button>
        <button onClick={handleSave} className={`flex items-center p-2 rounded-full transition-colors group ${hasSaved ? 'text-blue-600 bg-blue-50' : 'hover:bg-gray-100 hover:text-blue-600'}`}>
          {hasSaved ? <BookmarkIconSolid className="h-6 w-6 text-blue-600" /> : <BookmarkIconOutline className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />}
        </button>
        <div className="relative" ref={emojiPickerRef}>
          <button onClick={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)} className="flex items-center p-2 rounded-full transition-colors group hover:bg-gray-100 hover:text-blue-600"><FaceSmileIconOutline className="h-6 w-6 text-gray-400 group-hover:text-blue-500" /></button>
          {showEmojiPicker === post.id && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white p-2 rounded-xl shadow-2xl flex gap-1 z-10 border border-gray-100">
              {EMOJIS.map(e => <button key={e} onClick={() => handleReactToPost(e)} className="p-2 rounded-full text-lg hover:bg-gray-100 transition-colors">{e}</button>)}
            </div>
          )}
        </div>
      </div>

      {showComments && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-2">
            {post.comments.length === 0 ? <p className="text-gray-500 text-sm italic">Nenhum comentário ainda.</p> :
              [...post.comments].reverse().map(c => (
                <div key={c.id} className="flex items-start bg-white p-3 rounded-lg shadow-sm border border-gray-50">
                  <img src={c.profilePic || DEFAULT_PROFILE_PIC} alt={c.userName} className="w-8 h-8 rounded-full mr-3" />
                  <div><p className="font-semibold text-gray-800 text-xs">{c.userName}</p><p className="text-gray-700 text-sm">{c.text}</p></div>
                </div>
              ))}
          </div>
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input type="text" value={newCommentText} onChange={e => setNewCommentText(e.target.value)} placeholder="Comentar..." className="flex-grow p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" required />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Enviar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;
