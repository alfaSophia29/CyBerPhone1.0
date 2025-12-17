
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Post, User, PostType, AudioTrack } from '../types';
import { getPosts, findUserById, updatePostLikes, updatePostShares, toggleFollowUser, findAudioTrackById, updatePostSaves } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import {
  HeartIcon as HeartIconOutline,
  ChatBubbleOvalLeftIcon as ChatIconOutline,
  ShareIcon as ShareIconOutline,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  BookmarkIcon as BookmarkIconOutline,
  MusicalNoteIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';
import CommentsModal from './CommentsModal';

interface ReelsPageProps {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  refreshUser: () => void;
}

interface ReelVideoProps {
  post: Post;
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onFollowToggle: (userIdToFollow: string) => void;
  refreshUser: () => void;
  isIntersecting: boolean;
  onPostUpdate: () => void;
}

const ReelVideo: React.FC<ReelVideoProps> = ({ post, currentUser, onNavigate, onFollowToggle, refreshUser, isIntersecting, onPostUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  
  // Estados para animação de coração central
  const [showLikeHeart, setShowLikeHeart] = useState(false);
  const [heartKey, setHeartKey] = useState(0); 
  const [animateLikeButton, setAnimateLikeButton] = useState(false);
  
  const [progress, setProgress] = useState(0);
  const clickTimeout = useRef<number | null>(null);

  const postAuthor = findUserById(post.userId);
  const isFollowing = currentUser.followedUsers.includes(post.userId);
  const hasLiked = post.likes.includes(currentUser.id);
  const hasSaved = post.saves.includes(currentUser.id);
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);

  useEffect(() => {
    if (post.reel?.audioTrackId) {
      setAudioTrack(findAudioTrackById(post.reel.audioTrackId) || null);
    } else {
      setAudioTrack(null);
    }
  }, [post.reel?.audioTrackId]);

  const syncPlay = useCallback(async () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (video && video.src && video.paused && video.readyState >= 2) {
      try {
        await video.play();
      } catch (e: any) {
        if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
          console.warn("Autoplay falhou:", e.message);
        }
      }
    }
    
    if (audio && audio.src && audio.paused && audio.readyState >= 2) {
      try {
        await audio.play();
      } catch (e: any) {
        console.warn("Áudio falhou:", e.message);
      }
    }
  }, []);
  
  const syncPause = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (video && !video.paused) video.pause();
    if (audio && !audio.paused) audio.pause();
  }, []);

  useEffect(() => {
    if (isIntersecting) {
      syncPlay();
    } else {
      syncPause();
      if (videoRef.current) {
          videoRef.current.currentTime = 0;
          if (audioRef.current) audioRef.current.currentTime = 0;
      }
    }
  }, [isIntersecting, syncPlay, syncPause]);
  
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = !!audioTrack;
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted, audioTrack]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      syncPlay();
    } else {
      syncPause();
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 500);
    }
  }, [syncPlay, syncPause]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleLike = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setAnimateLikeButton(true);
    setTimeout(() => setAnimateLikeButton(false), 300);

    updatePostLikes(post.id, currentUser.id);
    onPostUpdate();
    refreshUser();
  };

  const triggerBigHeart = () => {
    setHeartKey(prev => prev + 1);
    setShowLikeHeart(true);
    // Removemos do DOM após a animação de 1s definida no CSS
    setTimeout(() => setShowLikeHeart(false), 1000);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };
  
  const handleContainerClick = () => {
    if (clickTimeout.current) {
      // Clique Duplo: Like
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      
      triggerBigHeart();
      if (!hasLiked) {
        handleLike();
      }
    } else {
      // Clique Simples: Play/Pause (Aguardando janela de 300ms)
      clickTimeout.current = window.setTimeout(() => {
        togglePlayPause();
        clickTimeout.current = null;
      }, 300);
    }
  };
  
  if (!postAuthor || !post.reel) return null;

  return (
    <div
      className="relative w-full h-full flex-shrink-0 snap-start snap-always bg-black overflow-hidden"
      onClick={handleContainerClick}
    >
      <video
        ref={videoRef}
        src={post.reel.videoUrl}
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
      />
      
      {audioTrack && <audio ref={audioRef} src={audioTrack.url} loop />}
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none"></div>

      {/* Play/Pause Overlay */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${showPlayIcon ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-black/40 rounded-full p-4 backdrop-blur-sm">
          <PlayIcon className="h-12 w-12 text-white/90" />
        </div>
      </div>
      
      {/* CORAÇÃO CENTRAL (Double Tap) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden">
          {showLikeHeart && (
            <HeartIconSolid 
              key={heartKey}
              className="w-32 h-32 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-like-heart" 
            />
          )}
      </div>

      {/* Mute Button */}
      <div className="absolute top-4 right-4 z-20">
          <button onClick={toggleMute} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors">
          {isMuted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Autor Info */}
      <div className="absolute bottom-4 left-0 w-full pl-4 pr-16 pb-6 z-10 text-white">
        <div className="flex flex-col items-start gap-2 max-w-[85%]">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={(e) => { e.stopPropagation(); onNavigate('profile', { userId: post.userId }); }}>
            <span className="font-bold text-lg drop-shadow-md group-hover:underline">@{post.authorName}</span>
          </div>
          <p className="text-sm md:text-base font-light drop-shadow-md line-clamp-2 leading-tight">{post.reel.description}</p>
          
          {audioTrack && (
            <div className="flex items-center gap-2 mt-2 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full overflow-hidden max-w-[80%]">
              <MusicalNoteIcon className="h-3 w-3 flex-shrink-0" />
              <div className="marquee text-xs font-medium w-full">
                <span className="marquee-content pr-4">{audioTrack.title} - {audioTrack.artist}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Sidebar */}
      <div className="absolute bottom-8 right-2 flex flex-col items-center gap-5 z-20 pb-4">
        <div className="relative mb-2">
            <img 
              src={postAuthor.profilePicture || DEFAULT_PROFILE_PIC} 
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-105" 
              onClick={(e) => { e.stopPropagation(); onNavigate('profile', { userId: post.userId }); }}
              alt={postAuthor.firstName}
            />
            {!isFollowing && currentUser.id !== post.userId && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onFollowToggle(post.userId); }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full text-white p-0.5 border-2 border-white shadow-sm hover:scale-110 transition-transform"
                >
                    <PlusIcon className="h-3 w-3 font-bold" />
                </button>
            )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <button onClick={handleLike} className={`group transition-transform ${animateLikeButton ? 'scale-125' : 'active:scale-90'}`}>
              {hasLiked ? (
                <HeartIconSolid className="h-9 w-9 text-red-500 drop-shadow-xl" />
              ) : (
                <HeartIconSolid className="h-9 w-9 text-white opacity-90 drop-shadow-xl group-hover:scale-110 transition-transform" />
              )}
          </button>
          <span className="text-xs font-semibold text-white drop-shadow-md">{post.likes.length}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setIsCommentsModalOpen(true); }} className="group transition-transform active:scale-90">
              <ChatIconOutline className="h-8 w-8 text-white drop-shadow-xl group-hover:scale-110 transition-transform" strokeWidth={2} />
          </button>
          <span className="text-xs font-semibold text-white drop-shadow-md">{post.comments.length}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); updatePostSaves(post.id, currentUser.id); onPostUpdate(); }} className="group transition-transform active:scale-90">
            {hasSaved ? <BookmarkIconSolid className="h-8 w-8 text-yellow-400 drop-shadow-xl"/> : <BookmarkIconOutline className="h-8 w-8 text-white drop-shadow-xl group-hover:scale-110 transition-transform" strokeWidth={2} />}
          </button>
          <span className="text-xs font-semibold text-white drop-shadow-md">{post.saves.length}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); updatePostShares(post.id, currentUser.id); alert('Link copiado!'); }} className="group transition-transform active:scale-90">
              <ShareIconOutline className="h-8 w-8 text-white drop-shadow-xl group-hover:scale-110 transition-transform" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-2 relative">
            <div className={`w-10 h-10 rounded-full bg-gray-800 border-[3px] border-gray-900 overflow-hidden ${!videoRef.current?.paused ? 'animate-spin-slow' : ''}`}>
              <img src={postAuthor.profilePicture || DEFAULT_PROFILE_PIC} className="w-full h-full object-cover opacity-80" alt="Music" />
            </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-600/30 z-30">
        <div className="h-full bg-white/90 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
      </div>

      {isCommentsModalOpen && (
        <CommentsModal
            postId={post.id}
            currentUser={currentUser}
            onClose={() => setIsCommentsModalOpen(false)}
            onCommentsUpdated={onPostUpdate}
        />
      )}
    </div>
  );
};

const ReelsPage: React.FC<ReelsPageProps> = ({ currentUser, onNavigate, refreshUser }) => {
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleVideoIndex, setVisibleVideoIndex] = useState(0);

  const fetchReels = useCallback(() => {
    const allPosts = getPosts();
    const reelPosts = allPosts.filter(post => post.type === PostType.REEL)
                                .sort((a, b) => b.timestamp - a.timestamp);
    setReels(reelPosts);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchReels();
  }, [fetchReels]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt((entry.target as HTMLElement).dataset.index || '0');
            setVisibleVideoIndex(index);
          }
        });
      },
      { threshold: 0.6 } 
    );

    const currentContainer = containerRef.current;
    if (currentContainer) {
      Array.from(currentContainer.children).forEach((child: Element, index) => {
        if (child.tagName === 'STYLE') return;
        (child as HTMLElement).dataset.index = index.toString();
        observer.observe(child);
      });
    }

    return () => {
      if (currentContainer) {
        Array.from(currentContainer.children).forEach((child: Element) => {
           observer.unobserve(child);
        });
      }
    };
  }, [reels]);

  const handleFollowToggle = useCallback(
    (userIdToFollow: string) => {
      toggleFollowUser(currentUser.id, userIdToFollow);
      refreshUser();
      fetchReels();
    },
    [currentUser.id, refreshUser, fetchReels],
  );

  const scrollToReel = (index: number) => {
    if (containerRef.current) {
      const children = (Array.from(containerRef.current.children) as HTMLElement[]).filter(c => c.tagName !== 'STYLE');
      if (children[index]) {
        children[index].scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToReel(visibleVideoIndex - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToReel(visibleVideoIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleVideoIndex, reels]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-black text-white text-xl">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3"></div>
        Carregando...
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-black text-white text-xl flex-col gap-4">
        <p>Nenhum Reel disponível.</p>
        <button onClick={() => onNavigate('create-post')} className="bg-blue-600 px-6 py-2 rounded-xl text-sm font-bold">Criar Primeiro Reel</button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <div
        ref={containerRef}
        className="relative w-full h-[calc(100dvh-152px)] md:h-[calc(100dvh-72px)] overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {reels.map((reelPost, index) => (
          <ReelVideo
            key={reelPost.id}
            post={reelPost}
            currentUser={currentUser}
            onNavigate={onNavigate}
            onFollowToggle={handleFollowToggle}
            refreshUser={refreshUser}
            isIntersecting={index === visibleVideoIndex}
            onPostUpdate={fetchReels}
          />
        ))}
      </div>
    </>
  );
};

export default ReelsPage;
