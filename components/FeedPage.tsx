
import React, { useState, useEffect, useCallback } from 'react';
import { User, Post, AdCampaign, PostType, CyberEvent } from '../types';
import { getPosts, getAds, getUsers, getEvents, findUserById } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import AdCard from './AdCard';
import { 
  AdjustmentsHorizontalIcon, 
  AcademicCapIcon,
  VideoCameraIcon,
  SparklesIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface FeedPageProps {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  refreshUser: () => void;
}

const FeedPage: React.FC<FeedPageProps> = ({ currentUser, onNavigate, refreshUser }) => {
  const [allFeedItems, setAllFeedItems] = useState<(Post | AdCampaign)[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostType, setSelectedPostType] = useState<PostType | 'all'>('all');
  const [liveHighlights, setLiveHighlights] = useState<Post[]>([]);

  const fetchFeedItems = useCallback(() => {
    setLoading(true);
    let allPosts = getPosts();
    let allAds = getAds();
    
    setLiveHighlights(allPosts.filter(p => p.type === PostType.LIVE).slice(0, 8));

    let filteredPosts = allPosts;
    if (selectedPostType !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.type === selectedPostType);
    }

    filteredPosts.sort((a, b) => b.timestamp - a.timestamp);

    const activeAds = allAds.filter(ad => ad.isActive);
    let combinedItems: (Post | AdCampaign)[] = [];
    activeAds.forEach((ad, i) => {
        if (i < filteredPosts.length) combinedItems.push(filteredPosts[i]);
        combinedItems.push(ad);
    });
    // Add remaining posts
    if (filteredPosts.length > activeAds.length) {
        combinedItems = [...combinedItems, ...filteredPosts.slice(activeAds.length)];
    }

    setAllFeedItems(combinedItems);
    setLoading(false);
  }, [selectedPostType]);

  useEffect(() => {
    fetchFeedItems();
  }, [fetchFeedItems]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-10 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-[100px] space-y-6">
            <div className="bg-white dark:bg-darkcard rounded-[2.5rem] p-8 shadow-sm border border-gray-50 dark:border-white/10 overflow-hidden relative group">
               <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-600 to-indigo-700"></div>
               <div className="relative pt-10 flex flex-col items-center">
                  <img 
                    src={currentUser.profilePicture || DEFAULT_PROFILE_PIC} 
                    className="w-20 h-20 rounded-[1.8rem] border-4 border-white dark:border-darkcard shadow-2xl object-cover mb-4" 
                  />
                  <h3 className="font-black text-gray-900 dark:text-white text-lg">{currentUser.firstName}</h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Membro CyBer</p>
                  <button onClick={() => onNavigate('profile')} className="w-full mt-6 py-3 bg-gray-50 dark:bg-white/5 dark:text-gray-300 hover:bg-gray-100 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-500 transition-all">Ver Perfil</button>
               </div>
            </div>

            <div className="bg-white dark:bg-darkcard rounded-[2.5rem] p-8 shadow-sm border border-gray-50 dark:border-white/10">
               <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-widest mb-6">Explorar</h4>
               <div className="space-y-2">
                  {[
                    { id: 'all', label: 'Feed Geral', icon: SparklesIcon },
                    { id: PostType.LIVE, label: 'Ao Vivo', icon: VideoCameraIcon },
                    { id: PostType.IMAGE, label: 'Galeria', icon: AdjustmentsHorizontalIcon },
                  ].map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setSelectedPostType(t.id as any)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all ${selectedPostType === t.id ? 'bg-blue-600 text-white shadow-xl' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-blue-600'}`}
                    >
                      <t.icon className="h-5 w-5" />
                      {t.label}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </aside>

        {/* Central Feed */}
        <main className="lg:col-span-6 space-y-8">
          
          {liveHighlights.length > 0 && (
            <section className="bg-white dark:bg-darkcard rounded-[2.5rem] p-6 shadow-sm border border-gray-50 dark:border-white/10">
               <div className="flex items-center justify-between mb-5 px-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> Em Transmissão
                  </h4>
               </div>
               <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
                  {liveHighlights.map(live => (
                    <div key={live.id} onClick={() => onNavigate('live', { postId: live.id })} className="flex-shrink-0 flex flex-col items-center gap-3 cursor-pointer group">
                       <div className="relative p-1 rounded-[1.8rem] border-2 border-red-500 group-hover:scale-105 transition-transform">
                          <img src={live.authorProfilePic || DEFAULT_PROFILE_PIC} className="w-14 h-14 rounded-[1.5rem] object-cover" />
                       </div>
                       <span className="text-[9px] font-black dark:text-white uppercase truncate w-14 text-center">{live.authorName.split(' ')[0]}</span>
                    </div>
                  ))}
               </div>
            </section>
          )}

          <CreatePost currentUser={currentUser} onPostCreated={fetchFeedItems} refreshUser={refreshUser} />
          
          <div className="space-y-8">
            {loading ? (
              <div className="py-20 text-center dark:text-white animate-pulse font-black uppercase tracking-widest">Sincronizando...</div>
            ) : (
              allFeedItems.map((item, index) => (
                'type' in item ? (
                  <PostCard key={item.id} post={item as Post} currentUser={currentUser} onNavigate={onNavigate} onFollowToggle={() => {}} refreshUser={refreshUser} onPostUpdatedOrDeleted={fetchFeedItems} onPinToggle={() => {}} />
                ) : (
                  <AdCard key={`ad-${index}`} ad={item as AdCampaign} />
                )
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-[100px] space-y-6">
            <div className="bg-white dark:bg-darkcard rounded-[2.5rem] p-8 border dark:border-white/10">
               <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2"><AcademicCapIcon className="h-4 w-4"/> Sugestões</h4>
               <p className="text-gray-400 text-[10px] font-medium italic">Siga perfis para ver mais conteúdo aqui.</p>
            </div>
            <div className="px-10 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">CyBerPhone &copy; {new Date().getFullYear()}</div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default FeedPage;
