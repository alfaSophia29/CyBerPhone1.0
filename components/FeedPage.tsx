
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Post, AdCampaign, UserType, PostType } from '../types';
import { getPosts, getAds, getUsers, pinPost, unpinPost, toggleFollowUser } from '../services/storageService';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import AdCard from './AdCard';
import { AdjustmentsHorizontalIcon, ChevronDownIcon, ChevronUpIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface FeedPageProps {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  refreshUser: () => void;
}

const ITEMS_PER_PAGE = 6;

const SkeletonPostCard: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100 transform transition-all duration-300 animate-pulse">
    <div className="flex items-center mb-4">
      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
      <div className="ml-3 flex-grow">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="w-20 h-8 bg-gray-200 rounded-full"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-11/12 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    <div className="w-full h-48 bg-gray-200 rounded-lg mt-4"></div>
  </div>
);

const FeedPage: React.FC<FeedPageProps> = ({ currentUser, onNavigate, refreshUser }) => {
  const [allFeedItems, setAllFeedItems] = useState<(Post | AdCampaign)[]>([]);
  const [visibleItems, setVisibleItems] = useState<(Post | AdCampaign)[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filtros
  const [selectedPostType, setSelectedPostType] = useState<PostType | 'all'>('all');
  const [selectedProfessorId, setSelectedProfessorId] = useState<string | 'all'>('all');
  const [creators, setCreators] = useState<User[]>([]);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchFeedItems = useCallback(() => {
    setLoading(true);
    setPage(1); 
    
    let allPosts = getPosts();
    let allAds = getAds();
    const followedUsers = currentUser.followedUsers;

    let currentUserPinnedPost: Post | undefined;
    let nonPinnedPosts: Post[] = [];

    allPosts.forEach(post => {
      if (post.userId === currentUser.id && post.isPinned) {
        currentUserPinnedPost = post;
      } else {
        nonPinnedPosts.push(post);
      }
    });

    let filteredPosts = nonPinnedPosts;
    if (selectedPostType !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.type === selectedPostType);
    }
    if (selectedProfessorId !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.userId === selectedProfessorId);
      allAds = allAds.filter(ad => ad.professorId === selectedProfessorId);
    }

    let finalFeed: (Post | AdCampaign)[] = [];
    if (currentUserPinnedPost) {
      const pinnedMatchesPostType = selectedPostType === 'all' || currentUserPinnedPost.type === selectedPostType;
      const pinnedMatchesCreator = selectedProfessorId === 'all' || currentUserPinnedPost.userId === selectedProfessorId;

      if (pinnedMatchesPostType && pinnedMatchesCreator) {
        finalFeed.push(currentUserPinnedPost);
      }
    }

    const postsToSort = filteredPosts;

    postsToSort.sort((a, b) => {
      const aIsFollowing = followedUsers.includes(a.userId) ? 1 : 0;
      const bIsFollowing = followedUsers.includes(b.userId) ? 1 : 0;
      if (aIsFollowing !== bIsFollowing) return bIsFollowing - aIsFollowing;

      const aEngagement = (a.likes?.length || 0) + (a.comments?.length || 0) * 2;
      const bEngagement = (b.likes?.length || 0) + (b.comments?.length || 0) * 2;
      if (aEngagement !== bEngagement) return bEngagement - aEngagement;

      return b.timestamp - a.timestamp;
    });

    const activeAdsForInjection = allAds.filter(ad => ad.isActive);
    let adIndex = 0;
    
    let combinedItems: (Post | AdCampaign)[] = [];
    for (let i = 0; i < postsToSort.length; i++) {
      combinedItems.push(postsToSort[i]);
      if ((i + 1) % 6 === 0 && activeAdsForInjection.length > adIndex) {
        combinedItems.push(activeAdsForInjection[adIndex % activeAdsForInjection.length]);
        adIndex++;
      }
    }

    const itemsToDisplay = [...finalFeed, ...combinedItems];
    setAllFeedItems(itemsToDisplay);
    setVisibleItems(itemsToDisplay.slice(0, ITEMS_PER_PAGE));
    setHasMore(itemsToDisplay.length > ITEMS_PER_PAGE);
    
    setTimeout(() => setLoading(false), 500);
  }, [selectedPostType, selectedProfessorId, currentUser.id, currentUser.followedUsers]);

  const loadMoreItems = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = page * ITEMS_PER_PAGE;
      const endIndex = nextPage * ITEMS_PER_PAGE;
      const newItems = allFeedItems.slice(startIndex, endIndex);

      if (newItems.length > 0) {
        setVisibleItems(prev => [...prev, ...newItems]);
        setPage(nextPage);
        setHasMore(allFeedItems.length > endIndex);
      } else {
        setHasMore(false);
      }
      setLoadingMore(false);
    }, 800);
  }, [page, allFeedItems, loadingMore, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMoreItems, hasMore, loading, loadingMore]);

  useEffect(() => {
    const allUsers = getUsers();
    setCreators(allUsers.filter(user => user.userType === UserType.CREATOR));
    fetchFeedItems();
  }, [fetchFeedItems]);

  const handlePostCreatedOrUpdatedOrDeleted = useCallback(() => {
    fetchFeedItems();
  }, [fetchFeedItems]);

  const handleFollowToggle = useCallback(
    (userIdToFollow: string) => {
      toggleFollowUser(currentUser.id, userIdToFollow);
      refreshUser();
    },
    [currentUser.id, refreshUser],
  );

  const handlePinToggle = useCallback((postId: string, isCurrentlyPinned: boolean) => {
    if (isCurrentlyPinned) {
      unpinPost(postId);
    } else {
      pinPost(postId, currentUser.id);
    }
    fetchFeedItems();
  }, [currentUser.id, fetchFeedItems]);

  const handleClearFilters = () => {
    setSelectedPostType('all');
    setSelectedProfessorId('all');
  };

  const hasActiveFilters = selectedPostType !== 'all' || selectedProfessorId !== 'all';

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <CreatePost currentUser={currentUser} onPostCreated={handlePostCreatedOrUpdatedOrDeleted} refreshUser={refreshUser} />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-black text-gray-900 border-b-4 border-blue-600 inline-block">Linha do Tempo</h2>
      </div>

      {/* STICKY FILTER MENU COM EXPANSÃO */}
      <div className="sticky top-[80px] z-10 mb-10 overflow-hidden bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 transition-all duration-300">
        {/* Header do Card de Filtros (Sempre Visível) */}
        <button 
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-white/50 transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${hasActiveFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="block font-black text-gray-900 text-sm uppercase tracking-wider">Filtros de Conteúdo</span>
              {hasActiveFilters && !isFiltersExpanded && (
                <div className="flex gap-2 mt-1">
                  {selectedPostType !== 'all' && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">{selectedPostType}</span>}
                  {selectedProfessorId !== 'all' && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold uppercase truncate max-w-[100px]">Criador Específico</span>}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {hasActiveFilters && isFiltersExpanded && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleClearFilters(); }}
                className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
              >
                Limpar Tudo
              </button>
            )}
            {isFiltersExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
          </div>
        </button>

        {/* Conteúdo Expansível */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isFiltersExpanded ? 'max-h-[500px] opacity-100 border-t border-gray-50' : 'max-h-0 opacity-0'}`}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">O que você quer ver?</label>
                <div className="flex flex-wrap gap-2">
                   {['all', PostType.TEXT, PostType.IMAGE, PostType.LIVE].map((type) => (
                     <button
                      key={type}
                      onClick={() => setSelectedPostType(type as any)}
                      className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${
                        selectedPostType === type 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                      }`}
                     >
                       {type === 'all' ? 'Tudo' : type === PostType.TEXT ? 'Textos' : type === PostType.IMAGE ? 'Imagens' : 'Lives'}
                     </button>
                   ))}
                </div>
              </div>

              <div>
                <label htmlFor="professorFilter" className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Filtrar por Autor</label>
                <div className="relative">
                  <select
                    id="professorFilter"
                    value={selectedProfessorId}
                    onChange={(e) => setSelectedProfessorId(e.target.value)}
                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">Todos os Criadores</option>
                    {creators.map(creator => (
                      <option key={creator.id} value={creator.id}>{creator.firstName} {creator.lastName}</option>
                    ))}
                  </select>
                  <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="flex justify-center pt-2">
               <button 
                onClick={() => setIsFiltersExpanded(false)}
                className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
               >
                 Recolher Menu
               </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, index) => (
            <SkeletonPostCard key={index} />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="bg-white p-16 rounded-[3rem] shadow-xl text-center border border-gray-100 animate-fade-in">
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          </div>
          <h3 className="text-2xl font-black text-gray-800 mb-2">Nenhum tesouro encontrado</h3>
          <p className="text-gray-500 max-w-sm mx-auto font-medium">Tente ajustar seus filtros para descobrir novas publicações da comunidade.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleItems.map((item, index) => {
              if ('type' in item) {
                const post = item as Post;
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onNavigate={onNavigate}
                    onFollowToggle={handleFollowToggle}
                    refreshUser={refreshUser}
                    onPostUpdatedOrDeleted={handlePostCreatedOrUpdatedOrDeleted}
                    onPinToggle={handlePinToggle}
                  />
                );
              } else {
                const ad = item as AdCampaign;
                return (
                  <AdCard
                    key={`ad-${ad.id}-${index}`}
                    ad={ad}
                  />
                );
              }
            })}
          </div>

          <div ref={observerTarget} className="w-full py-16 flex flex-col items-center justify-center">
            {loadingMore && (
              <div className="flex flex-col items-center">
                <div className="relative w-12 h-12">
                   <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] mt-6 animate-pulse">Carregando mais...</p>
              </div>
            )}
            {!hasMore && visibleItems.length > 0 && (
              <div className="text-center p-12 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 w-full max-w-lg">
                <p className="text-gray-400 font-black text-xl italic mb-2">✨ Você está atualizado!</p>
                <p className="text-gray-400 text-sm font-medium">Não há mais publicações disponíveis por aqui.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FeedPage;
