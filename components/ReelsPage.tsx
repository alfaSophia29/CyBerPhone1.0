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
  PlusIcon,
  SparklesIcon,
  FilmIcon as FilmIconOutline
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
  
  const [showBigHeart, setShowBigHeart] = useState(false);
  const [heartAnimationKey, setHeartAnimationKey] = useState(0); 
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

  const triggerDoubleTapHeart = () => {
    setHeartAnimationKey(prev => prev + 1);
    setShowBigHeart(true);
    setTimeout(() => setShowBigHeart(false), 1000);
    if (!hasLiked) {
      handleLike();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };
  
  const handleContainerClick = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      triggerDoubleTapHeart();
    } else {
      clickTimeout.current = window.setTimeout(() => {
        togglePlayPause();
        clickTimeout.current = null;
      }, 300);
    }
  };

  // Fix: Defined missing navigateToProfile function for interaction handlers
  const navigateToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate('profile', { userId: post.userId });
  };

  const getFilterStyle = () => {
    // Filtro Neon CyBer: Intensifica azuis, rosas e o contraste geral
    let filter = "brightness(1.15) contrast(1.3) saturate(1.8) drop-shadow(0 0 5px rgba(59, 130, 246, 0.4))";
    
    if (post.reel?.aiEffectPrompt) {
      const p = post.reel.aiEffectPrompt.toLowerCase();
      if (p.includes("neon") || p.includes("cyberpunk")) {
        filter = "brightness(1.2) contrast(1.4) saturate(2.4) hue-rotate(285deg) drop-shadow(0 0 10px rgba(236, 72, 153, 0.5))";
      } else if (p.includes("vibrant") || p.includes("satura")) {
        filter = "saturate(260%) contrast(120%)";
      } else if (p.includes("vintage") || p.includes("antigo")) {
        filter = "sepia(40%) contrast(100%) brightness(1.1) grayscale(10%)";
      } else if (p.includes("preto") || p.includes("black")) {
        filter = "grayscale(100%) contrast(140%) brightness(0.9)";
      }
    }
    
    return { filter };
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
        style={getFilterStyle()}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
        onTimeUpdate={handleTimeUpdate}
      />
      
      {audioTrack && <audio ref={audioRef} src={audioTrack.url} loop />}
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none"></div>

      {/* Neon Scanline Effect Overlay (simulado) */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%]"></div>

      {/* IA Visuals Badge */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
         <SparklesIcon className="h-4 w-4 text-pink-500 animate-pulse" />
         <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Neon CyBer Visuals</span>
      </div>

      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${showPlayIcon ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-black/60 rounded-full p-6 backdrop-blur-xl border border-white/10 shadow-2xl">
          <PlayIcon className="h-16 w-16 text-white" />
        </div>
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden">
          {showBigHeart && (
            <HeartIconSolid 
              key={heartAnimationKey}
              className="w-48 h-48 text-pink-500 drop-shadow-[0_0_30px_rgba(236,72,153,0.8)] animate-like-heart" 
            />
          )}
      </div>

      <div className="absolute top-6 right-6 z-20">
          <button onClick={toggleMute} className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl text-white hover:bg-blue-600 transition-all border border-white/10 shadow-2xl">
          {isMuted ? <SpeakerXMarkIcon className="h-6 w-6" /> : <SpeakerWaveIcon className="h-6 w-6" />}
        </button>
      </div>

      <div className="absolute bottom-6 left-0 w-full pl-6 pr-20 pb-8 z-10 text-white">
        <div className="flex flex-col items-start gap-4 max-w-[90%]">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={navigateToProfile}>
            <div className="w-12 h-12 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl">
              <img src={postAuthor.profilePicture || DEFAULT_PROFILE_PIC} className="w-full h-full object-cover" alt={post.authorName}/>
            </div>
            <div>
              <span className="font-black text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:text-blue-400 transition-colors">@{post.authorName}</span>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mt-1">Criador Certificado</p>
            </div>
          </div>
          <p className="text-base font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] line-clamp-3 leading-relaxed text-gray-100">{post.reel.description}</p>
          
          {audioTrack && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl overflow-hidden max-w-[85%] border border-white/5 shadow-xl">
              <MusicalNoteIcon className="h-4 w-4 text-pink-400 flex-shrink-0 animate-bounce" />
              <div className="marquee text-[10px] font-black uppercase tracking-widest w-full">
                <span className="marquee-content pr-8">{audioTrack.title} &bull; {audioTrack.artist}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-10 right-4 flex flex-col items-center gap-7 z-20 pb-4">
        <div className="flex flex-col items-center gap-2">
          <button onClick={handleLike} className={`group transition-all ${animateLikeButton ? 'scale-150' : 'active:scale-90 hover:scale-110'}`}>
              {hasLiked ? (
                <HeartIconSolid className="h-10 w-10 text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.6)]" />
              ) : (
                <HeartIconSolid className="h-10 w-10 text-white opacity-80 drop-shadow-2xl" />
              )}
          </button>
          <span className="text-[10px] font-black text-white drop-shadow-2xl uppercase tracking-tighter">{post.likes.length}</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setIsCommentsModalOpen(true); }} className="group transition-all hover:scale-110 active:scale-90">
              <ChatIconOutline className="h-9 w-9 text-white opacity-80 drop-shadow-2xl" strokeWidth={2.5} />
          </button>
          <span className="text-[10px] font-black text-white drop-shadow-2xl uppercase tracking-tighter">{post.comments.length}</span>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); updatePostSaves(post.id, currentUser.id); onPostUpdate(); }} className="group transition-all hover:scale-110 active:scale-90">
            {hasSaved ? <BookmarkIconSolid className="h-9 w-9 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"/> : <BookmarkIconOutline className="h-9 w-9 text-white opacity-80 drop-shadow-2xl" strokeWidth={2.5} />}
          </button>
          <span className="text-[10px] font-black text-white drop-shadow-2xl uppercase tracking-tighter">{post.saves.length}</span>
        </div>
        
        <button onClick={(e) => { e.stopPropagation(); updatePostShares(post.id, currentUser.id); alert('Link de convite copiado!'); }} className="group transition-all hover:scale-110 active:scale-90">
            <ShareIconOutline className="h-9 w-9 text-white opacity-80 drop-shadow-2xl" strokeWidth={2.5} />
        </button>

        <div className="mt-4 relative group cursor-pointer" onClick={navigateToProfile}>
            <div className={`w-12 h-12 rounded-full bg-gray-800 border-[3px] border-white/20 overflow-hidden shadow-2xl ${!videoRef.current?.paused ? 'animate-spin-slow' : ''}`}>
              <img src={postAuthor.profilePicture || DEFAULT_PROFILE_PIC} className="w-full h-full object-cover opacity-90" alt="Music" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-pink-500 animate-ping opacity-20"></div>
        </div>
      </div>

      {/* Progress Bar with Glow */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/10 z-30 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-pink-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-100 ease-linear" 
          style={{ width: `${progress}%` }}
        ></div>
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
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mr-3 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
        <p className="font-black uppercase tracking-widest text-sm animate-pulse">Sintonizando CyBer Reels...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-black text-white text-xl flex-col gap-6">
        <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 text-center">
           <FilmIconOutline className="h-20 w-20 text-gray-700 mx-auto mb-4" />
           <p className="font-black text-lg">A galeria está vazia.</p>
           <button onClick={() => onNavigate('create-post')} className="bg-blue-600 px-10 py-4 rounded-[2rem] text-sm font-black uppercase mt-8 shadow-2xl active:scale-95 transition-all">Criar Primeiro Reel</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-spin-slow { animation: spin 5s linear infinite; }
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