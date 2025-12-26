
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
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  PlusIcon
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
  const [likeHearts, setLikeHearts] = useState<{ id: number; x: number; y: number }[]>([]);

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
    
    if (video && video.paused) {
      try {
        await video.play();
      } catch (e) {}
    }
    if (audio && audio.paused) {
      try {
        await audio.play();
      } catch (e) {}
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
    }
  }, [isIntersecting, syncPlay, syncPause]);
  
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = !!audioTrack;
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted, audioTrack]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      syncPlay();
    } else {
      syncPause();
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 500);
    }
  };

  const handleLike = () => {
    updatePostLikes(post.id, currentUser.id);
    onPostUpdate();
    refreshUser();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newHeart = { id: Date.now(), x, y };
    setLikeHearts(prev => [...prev, newHeart]);
    
    if (!hasLiked) {
      handleLike();
    }

    setTimeout(() => {
      setLikeHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1000);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (clickTimeout.current) {
      window.clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      handleDoubleClick(e);
    } else {
      clickTimeout.current = window.setTimeout(() => {
        togglePlayPause();
        clickTimeout.current = null;
      }, 250);
    }
  };

  if (!postAuthor || !post.reel) return null;

  return (
    <>
      <div
        className="relative w-full h-full flex-shrink-0 snap-start bg-black overflow-hidden"
        onClick={handleContainerClick}
      >
        <video
          ref={videoRef}
          src={post.reel.videoUrl}
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {audioTrack && <audio ref={audioRef} src={audioTrack.url} loop />}
        
        {/* Play/Pause Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none bg-black/10 ${showPlayIcon ? 'opacity-100' : 'opacity-0'}`}>
          <PlayIcon className="h-16 w-16 text-white/80" />
        </div>

        {/* Double Click Like Hearts */}
        {likeHearts.map(heart => (
          <div 
            key={heart.id} 
            className="absolute z-50 pointer-events-none animate-like-heart"
            style={{ left: heart.x - 40, top: heart.y - 40 }}
          >
            <HeartIconSolid className="w-20 h-20 text-red-500 drop-shadow-lg" />
          </div>
        ))}

        <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="absolute top-5 right-5 z-30 p-2 bg-black/20 rounded-full text-white/80 hover:bg-black/40">
          {isMuted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
        </button>

        {/* Informações (Bottom Left) */}
        <div className="absolute bottom-0 left-0 p-4 text-white z-20 w-[80%] pointer-events-none">
          <div className="flex flex-col space-y-2 pointer-events-auto">
            <h4 
              className="font-black text-base drop-shadow-md cursor-pointer hover:underline inline-block w-fit"
              onClick={(e) => { e.stopPropagation(); onNavigate('profile', { userId: post.userId }); }}
            >
              @{post.authorName}
            </h4>
            <p className="text-sm font-medium drop-shadow-md leading-snug line-clamp-3">
              {post.reel.description}
            </p>
            
            {audioTrack && (
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full w-fit max-w-full overflow-hidden border border-white/10">
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current shrink-0"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                <div className="marquee text-[11px] font-bold uppercase tracking-wider whitespace-nowrap overflow-hidden">
                   <span className="marquee-content">{audioTrack.title} - {audioTrack.artist}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="absolute bottom-6 right-2 flex flex-col items-center space-y-5 z-30 w-14">
          
          {/* Avatar com Botão de Follow */}
          <div className="relative mb-2">
             <div 
               className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-lg cursor-pointer"
               onClick={(e) => { e.stopPropagation(); onNavigate('profile', { userId: post.userId }); }}
             >
                <img src={postAuthor.profilePicture || DEFAULT_PROFILE_PIC} className="w-full h-full object-cover" alt="" />
             </div>
             {!isFollowing && currentUser.id !== post.userId && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onFollowToggle(post.userId); }}
                 className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5 border-2 border-black"
               >
                 <PlusIcon className="w-3 h-3 text-white" />
               </button>
             )}
          </div>

          <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="flex flex-col items-center group">
              <div className="p-1 group-active:scale-125 transition-transform">
                {hasLiked ? <HeartIconSolid className="h-9 w-9 text-red-500" /> : <HeartIconSolid className="h-9 w-9 text-white/90" />}
              </div>
              <span className="text-[11px] font-black text-white drop-shadow-md">{post.likes.length}</span>
          </button>

          <button onClick={(e) => { e.stopPropagation(); setIsCommentsModalOpen(true); }} className="flex flex-col items-center group">
              <div className="p-1 group-active:scale-125 transition-transform">
                <ChatIconOutline className="h-9 w-9 text-white/90 fill-white/10" />
              </div>
              <span className="text-[11px] font-black text-white drop-shadow-md">{post.comments.length}</span>
          </button>
          
          <button onClick={(e) => { e.stopPropagation(); updatePostSaves(post.id, currentUser.id); onPostUpdate(); }} className="flex flex-col items-center group">
              <div className="p-1 group-active:scale-125 transition-transform">
                {hasSaved ? <BookmarkIconSolid className="h-9 w-9 text-yellow-400" /> : <BookmarkIconSolid className="h-9 w-9 text-white/90" />}
              </div>
              <span className="text-[11px] font-black text-white drop-shadow-md">{post.saves.length}</span>
          </button>
          
          <button onClick={(e) => { e.stopPropagation(); alert('Link copiado!'); }} className="flex flex-col items-center group">
              <div className="p-1 group-active:scale-125 transition-transform">
                <ShareIconOutline className="h-9 w-9 text-white/90" />
              </div>
              <span className="text-[11px] font-black text-white drop-shadow-md">{post.shares.length}</span>
          </button>

          {/* Disco Giratório (Music Icon) */}
          <div className="pt-4">
             <div className={`w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-600 border-[6px] border-gray-900 shadow-xl flex items-center justify-center overflow-hidden ${isIntersecting ? 'animate-spin-slow' : ''}`}>
                <img src={postAuthor.profilePicture || DEFAULT_PROFILE_PIC} className="w-4 h-4 rounded-full" alt="" />
             </div>
          </div>
        </div>

        {/* Gradiente Inferior para Melhor Leitura */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none"></div>
      </div>
      
      {isCommentsModalOpen && (
        <CommentsModal
            postId={post.id}
            currentUser={currentUser}
            onClose={() => setIsCommentsModalOpen(false)}
            onCommentsUpdated={onPostUpdate}
        />
      )}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        @keyframes like-heart {
          0% { transform: scale(0.5); opacity: 0; }
          20% { transform: scale(1.2); opacity: 1; }
          80% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-like-heart {
          animation: like-heart 0.8s ease-out forwards;
        }
      `}</style>
    </>
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
        if ((child as HTMLElement).dataset.index !== undefined) {
          observer.observe(child);
        }
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

  const handleFollowToggle = (userIdToFollow: string) => {
    toggleFollowUser(currentUser.id, userIdToFollow);
    refreshUser();
    fetchReels();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-[calc(100dvh-72px)] bg-black">
        <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100dvh-136px)] md:h-[calc(100dvh-72px)] overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black no-scrollbar"
    >
      {reels.map((reelPost, index) => (
        <div key={reelPost.id} data-index={index} className="h-full w-full snap-start">
          <ReelVideo
            post={reelPost}
            currentUser={currentUser}
            onNavigate={onNavigate}
            onFollowToggle={handleFollowToggle}
            refreshUser={refreshUser}
            isIntersecting={index === visibleVideoIndex}
            onPostUpdate={fetchReels}
          />
        </div>
      ))}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ReelsPage;
