
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
  const [showLikeHeart, setShowLikeHeart] = useState(false);
  const [animateLike, setAnimateLike] = useState(false);

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
    
    if (video && video.src && video.paused) {
      try {
        await video.play();
      } catch (e: any) {
        // Ignore expected errors during autoplay/scroll
        if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
          console.warn("Video autoplay prevented:", e.message);
        }
      }
    }
    if (audio && audio.src && audio.paused) {
      try {
        await audio.play();
      } catch (e: any) {
        if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
          console.warn("Audio autoplay prevented:", e.message);
        }
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


  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };
  
  const handleLike = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAnimateLike(true);
    setTimeout(() => setAnimateLike(false), 400);
    updatePostLikes(post.id, currentUser.id);
    onPostUpdate();
    refreshUser();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePostShares(post.id, currentUser.id);
    alert('Reel compartilhado!');
    onPostUpdate();
  };
  
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePostSaves(post.id, currentUser.id);
    onPostUpdate();
    refreshUser();
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    syncPause();
    setIsCommentsModalOpen(true);
  };
  
  const handleCloseComments = () => {
    setIsCommentsModalOpen(false);
    if(isIntersecting) syncPlay();
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFollowToggle(post.userId);
  };
  
  const navigateToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate('profile', { userId: post.userId });
  };

  const handleContainerClick = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      
      setShowLikeHeart(true);
      setTimeout(() => setShowLikeHeart(false), 1000);

      if (!hasLiked) {
        handleLike();
      }
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
        className="relative w-full h-screen flex-shrink-0 snap-center bg-black"
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
        
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none bg-black/20 ${showPlayIcon ? 'opacity-100' : 'opacity-0'}`}>
          <PlayIcon className="h-20 w-20 text-white/80 drop-shadow-lg" />
        </div>
        
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity pointer-events-none`}>
            <HeartIconSolid className={`w-32 h-32 text-white/90 drop-shadow-lg ${showLikeHeart ? 'animate-like-heart' : 'opacity-0'}`} />
        </div>

        <button onClick={toggleMute} className="absolute top-5 right-5 z-20 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors">
          {isMuted ? <SpeakerXMarkIcon className="h-6 w-6" /> : <SpeakerWaveIcon className="h-6 w-6" />}
        </button>

        <div className="absolute bottom-20 left-0 p-4 text-white z-10 w-full bg-gradient-to-t from-black/70 via-black/30 to-transparent flex-shrink-0 md:bottom-24">
          <div className="flex items-center mb-2 cursor-pointer" onClick={navigateToProfile}>
            <span className="font-bold text-lg ml-1 drop-shadow-lg">@{post.authorName}</span>
          </div>
          <p className="text-sm drop-shadow-lg line-clamp-2">{post.reel.description}</p>
          
          {audioTrack && (
            <div className="mt-4 flex items-center gap-2 overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.447-.894L4 6.424V2.5a1 1 0 00-2 0v11.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L4 15.586V10.42l12.553-3.261A1 1 0 0018 7V3z" /></svg>
              <div className="marquee text-sm font-semibold">
                <span className="marquee-content">{audioTrack.title} - {audioTrack.artist}</span>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-20 md:bottom-24 right-2.5 flex flex-col items-center space-y-6 z-10">
          <div className="relative flex flex-col items-center">
              <img src={postAuthor.profilePicture || DEFAULT_PROFILE_PIC} onClick={navigateToProfile} className="w-12 h-12 rounded-full object-cover border-2 border-white cursor-pointer" alt={postAuthor.firstName}/>
              {!isFollowing && currentUser.id !== post.userId && (
                  <button onClick={handleFollow} className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-500 rounded-full text-white flex items-center justify-center border-2 border-black">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                  </button>
              )}
          </div>

          <button onClick={handleLike} className="flex flex-col items-center text-white" aria-label="Curtir">
              {hasLiked ? <HeartIconSolid className={`h-8 w-8 text-blue-500 drop-shadow-lg ${animateLike ? 'animate-scale-in-out' : ''}`} /> : <HeartIconOutline className={`h-8 w-8 drop-shadow-lg ${animateLike ? 'animate-scale-in-out' : ''}`} />}
              <span className="text-xs font-bold drop-shadow-lg mt-1">{post.likes.length}</span>
          </button>

          <button onClick={handleCommentClick} className="flex flex-col items-center text-white" aria-label="Comentar">
              <ChatIconOutline className="h-8 w-8 drop-shadow-lg" />
              <span className="text-xs font-bold drop-shadow-lg mt-1">{post.comments.length}</span>
          </button>
          
          <button onClick={handleSave} className="flex flex-col items-center text-white" aria-label="Salvar">
            {hasSaved ? ( <BookmarkIconSolid className="h-8 w-8 text-yellow-400 drop-shadow-lg"/> ) : ( <BookmarkIconOutline className="h-8 w-8 drop-shadow-lg" /> )}
            <span className="text-xs font-bold drop-shadow-lg mt-1">{post.saves.length}</span>
          </button>
          
          <button onClick={handleShare} className="flex flex-col items-center text-white" aria-label="Compartilhar">
              <ShareIconOutline className="h-8 w-8 drop-shadow-lg" />
              <span className="text-xs font-bold drop-shadow-lg mt-1">{post.shares.length}</span>
          </button>
        </div>
      </div>
      {isCommentsModalOpen && (
        <CommentsModal
            postId={post.id}
            currentUser={currentUser}
            onClose={handleCloseComments}
            onCommentsUpdated={onPostUpdate}
        />
      )}
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
      { threshold: 0.5 }
    );

    const currentContainer = containerRef.current;
    if (currentContainer) {
      Array.from(currentContainer.children).forEach((child: Element, index) => {
        // Skip style tags
        if (child.tagName === 'STYLE') return;
        (child as HTMLElement).dataset.index = index.toString();
        observer.observe(child);
      });
    }

    return () => {
      if (currentContainer) {
        Array.from(currentContainer.children).forEach((child: Element) => {
           if (child.tagName !== 'STYLE') observer.unobserve(child);
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
      // Filter out style tags to get actual reel elements
      const children = (Array.from(containerRef.current.children) as HTMLElement[]).filter(c => c.tagName !== 'STYLE');
      if (children[index]) {
        children[index].scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Keyboard navigation support
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
        Carregando Reels...
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-black text-white text-xl">
        Nenhum Reel disponível no momento.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black no-scrollbar"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
  );
};

export default ReelsPage;
