
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Post, AdCampaign, PostType, Story, UserType } from '../types';
import { getPosts, getAds, getStories, getUsers, toggleFollowUser } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import AdCard from './AdCard';
import StoryViewerModal from './StoryViewerModal';
import CreateStoryModal from './CreateStoryModal';
import { 
  PlusIcon, ArrowPathIcon, UserPlusIcon, CheckBadgeIcon, SparklesIcon
} from '@heroicons/react/24/outline';

interface FeedPageProps {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  refreshUser: () => void;
}

const ITEMS_PER_PAGE = 5;

const FeedPage: React.FC<FeedPageProps> = ({ currentUser, onNavigate, refreshUser }) => {
  const [allItems, setAllItems] = useState<(Post | AdCampaign | { type: 'SUGGESTIONS' })[]>([]);
  const [visibleItems, setVisibleItems] = useState<(Post | AdCampaign | { type: 'SUGGESTIONS' })[]>([]);
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    const allPosts = getPosts().sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.timestamp - a.timestamp;
    });
    const allAds = getAds();
    const allUsers = getUsers();
    const allStories = getStories();

    setStories(allStories);

    const suggestions = allUsers
      .filter(u => u.id !== currentUser.id && !currentUser.followedUsers.includes(u.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
    
    setSuggestedUsers(suggestions);

    let combined: (Post | AdCampaign | { type: 'SUGGESTIONS' })[] = [];
    allPosts.forEach((post, idx) => {
        combined.push(post);
        if (idx === 1 && suggestions.length > 0) {
            combined.push({ type: 'SUGGESTIONS' });
        }
        if ((idx + 1) % 5 === 0 && allAds.length > 0) {
            const randomAd = allAds[Math.floor(Math.random() * allAds.length)];
            combined.push(randomAd);
        }
    });

    setAllItems(combined);
    setVisibleItems(combined.slice(0, ITEMS_PER_PAGE));
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && !loadingMore && visibleItems.length < allItems.length) {
          setLoadingMore(true);
          setTimeout(() => {
            const nextLimit = displayLimit + ITEMS_PER_PAGE;
            setVisibleItems(allItems.slice(0, nextLimit));
            setDisplayLimit(nextLimit);
            setLoadingMore(false);
          }, 600);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [allItems, visibleItems, loading, loadingMore, displayLimit]);

  const handleFollow = (userId: string) => {
    toggleFollowUser(currentUser.id, userId);
    refreshUser();
    setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 md:px-6 lg:px-10 py-4 md:py-8">
      
      {/* Stories Section */}
      <section className="mb-8 bg-white dark:bg-darkcard rounded-[2rem] p-4 shadow-sm border dark:border-white/10 overflow-hidden">
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          <div 
            onClick={() => setIsCreatingStory(true)}
            className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group"
          >
            <div className="relative p-0.5 rounded-full border-2 border-dashed border-blue-400 group-hover:border-blue-600 transition-colors">
              <img src={currentUser.profilePicture || DEFAULT_PROFILE_PIC} className="w-14 h-14 rounded-full object-cover shadow-sm" />
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 border-2 border-white dark:border-darkcard">
                <PlusIcon className="w-3 h-3 stroke-[4]" />
              </div>
            </div>
            <span className="text-[9px] font-black dark:text-white uppercase">Novo</span>
          </div>
          {stories.map((s, i) => (
            <div key={i} onClick={() => setSelectedStoryIndex(i)} className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group">
              <div className="p-1 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 shadow-md group-hover:scale-105 transition-transform">
                <div className="p-0.5 bg-white dark:bg-darkcard rounded-full">
                  <img src={s.userProfilePic || DEFAULT_PROFILE_PIC} className="w-14 h-14 rounded-full object-cover" />
                </div>
              </div>
              <span className="text-[9px] font-black dark:text-white truncate w-14 text-center">{s.userName.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <main className="col-span-1 lg:col-span-8 space-y-8">
          <CreatePost currentUser={currentUser} onPostCreated={loadData} refreshUser={refreshUser} />
          
          <div className="space-y-8">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando Feed...</p>
              </div>
            ) : (
              <>
                {visibleItems.map((item, idx) => {
                  if ('authorName' in item) {
                    return (
                      <div key={(item as Post).id} className="animate-fade-in">
                        <PostCard 
                          post={item as Post} 
                          currentUser={currentUser} 
                          onNavigate={onNavigate} 
                          onFollowToggle={handleFollow} 
                          refreshUser={refreshUser} 
                          onPostUpdatedOrDeleted={loadData} 
                          onPinToggle={() => {}} 
                        />
                      </div>
                    );
                  }
                  
                  if ('type' in item && item.type === 'SUGGESTIONS') {
                    return (
                      <div key="suggestions-card" className="bg-white dark:bg-darkcard rounded-[2.5rem] p-8 border border-blue-50 dark:border-white/10 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-3 mb-6">
                           <SparklesIcon className="h-6 w-6 text-blue-600" />
                           <h4 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest">Professores Sugeridos</h4>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                           {suggestedUsers.map(user => (
                             <div key={user.id} className="flex-shrink-0 w-40 bg-gray-50 dark:bg-darkbg rounded-3xl p-5 flex flex-col items-center text-center border border-gray-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-darkcard hover:shadow-lg group">
                                <div className="relative mb-3">
                                  <img src={user.profilePicture || DEFAULT_PROFILE_PIC} className="w-16 h-16 rounded-2xl object-cover shadow-md transition-transform group-hover:scale-105" />
                                  {user.userType === UserType.CREATOR && <CheckBadgeIcon className="h-4 w-4 text-blue-600 absolute -top-1 -right-1 fill-white dark:fill-darkcard" />}
                                </div>
                                <p className="font-black text-[11px] dark:text-white truncate w-full">{user.firstName}</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase mb-4 truncate w-full h-3">{user.credentials || 'Especialista'}</p>
                                <button 
                                  onClick={() => handleFollow(user.id)}
                                  className="w-full py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-md"
                                >
                                  Seguir
                                </button>
                             </div>
                           ))}
                        </div>
                      </div>
                    );
                  }

                  return <AdCard key={(item as AdCampaign).id} ad={item as AdCampaign} />;
                })}
                
                <div ref={observerTarget} className="h-20 w-full flex items-center justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-3 bg-white dark:bg-darkcard px-6 py-3 rounded-full shadow-lg border dark:border-white/5">
                       <ArrowPathIcon className="h-4 w-4 text-blue-600 animate-spin" />
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando mais conhecimento...</span>
                    </div>
                  )}
                  {!loadingMore && visibleItems.length >= allItems.length && allItems.length > 0 && (
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-6 py-2 rounded-full">Fim da linha por agora</p>
                  )}
                </div>
              </>
            )}
          </div>
        </main>

        <aside className="hidden lg:block lg:col-span-4">
           <div className="sticky top-24 space-y-6">
              <div className="bg-white dark:bg-darkcard rounded-[2.5rem] p-8 shadow-sm border dark:border-white/10 flex flex-col items-center">
                 <img src={currentUser.profilePicture || DEFAULT_PROFILE_PIC} className="w-20 h-20 rounded-[1.8rem] border-4 border-blue-50 shadow-lg object-cover mb-4" />
                 <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight">{currentUser.firstName} {currentUser.lastName}</h3>
                 <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">
                   {currentUser.userType === UserType.CREATOR ? 'Professor Autor' : 'Membro CyBer'}
                 </p>
                 <div className="mt-6 w-full pt-6 border-t border-gray-50 dark:border-white/5 flex justify-around">
                    <div className="text-center">
                       <p className="text-lg font-black dark:text-white">{currentUser.followers.length}</p>
                       <p className="text-[8px] font-black text-gray-400 uppercase">Alunos</p>
                    </div>
                    <div className="text-center">
                       <p className="text-lg font-black dark:text-white">{currentUser.followedUsers.length}</p>
                       <p className="text-[8px] font-black text-gray-400 uppercase">Seguindo</p>
                    </div>
                 </div>
              </div>

              {suggestedUsers.length > 0 && (
                <div className="bg-white dark:bg-darkcard rounded-[2.5rem] p-6 border dark:border-white/10 shadow-sm">
                   <h4 className="font-black text-gray-900 dark:text-white text-[10px] uppercase tracking-widest mb-6">Sugestões</h4>
                   <div className="space-y-4">
                      {suggestedUsers.slice(0, 3).map(user => (
                        <div key={user.id} className="flex items-center justify-between group">
                           <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('profile', { userId: user.id })}>
                              <img src={user.profilePicture || DEFAULT_PROFILE_PIC} className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                              <div className="overflow-hidden">
                                 <p className="font-black text-[11px] dark:text-white truncate max-w-[120px]">{user.firstName}</p>
                                 <p className="text-[8px] font-bold text-gray-400 uppercase truncate">{user.userType === UserType.CREATOR ? 'Prof.' : 'Membro'}</p>
                              </div>
                           </div>
                           <button onClick={() => handleFollow(user.id)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/5 rounded-lg transition-all active:scale-90">
                              <UserPlusIcon className="h-5 w-5" />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </div>
        </aside>
      </div>

      {/* Story Modals */}
      {selectedStoryIndex !== null && (
        <StoryViewerModal 
          stories={stories} 
          initialIndex={selectedStoryIndex} 
          onClose={() => setSelectedStoryIndex(null)} 
        />
      )}

      {isCreatingStory && (
        <CreateStoryModal 
          currentUser={currentUser} 
          onClose={() => setIsCreatingStory(false)} 
          onStoryCreated={() => {
            setIsCreatingStory(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default FeedPage;
