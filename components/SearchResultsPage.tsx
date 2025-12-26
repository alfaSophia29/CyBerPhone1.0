
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Post, Product, Store, ProductType, UserType } from '../types';
import { getUsers, getPosts, getProducts, getStores, toggleFollowUser, findUserById } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import PostCard from './PostCard';
import { 
  BuildingStorefrontIcon, 
  UserPlusIcon, 
  CheckBadgeIcon, 
  ShoppingBagIcon, 
  NewspaperIcon, 
  UsersIcon, 
  Squares2X2Icon, 
  StarIcon,
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/solid';

interface SearchResultsPageProps {
  currentUser: User;
  query: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  refreshUser: () => void;
}

type SearchTab = 'all' | 'users' | 'posts' | 'products';

const UserResultCard: React.FC<{ user: User; currentUser: User; onNavigate: Function; onFollowToggle: Function }> = ({ user, currentUser, onNavigate, onFollowToggle }) => {
  const isFollowing = currentUser.followedUsers.includes(user.id);
  const isSelf = currentUser.id === user.id;

  return (
    <div className="bg-white dark:bg-darkcard p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col items-center text-center transition-all hover:shadow-xl hover:-translate-y-1 w-full max-w-[320px]">
      <div className="relative mb-4">
        <img 
          src={user.profilePicture || DEFAULT_PROFILE_PIC} 
          alt={user.firstName} 
          className="w-24 h-24 rounded-[2rem] object-cover border-4 border-white dark:border-darkcard shadow-lg cursor-pointer" 
          onClick={() => onNavigate('profile', { userId: user.id })}
        />
        {user.userType === UserType.CREATOR && (
          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-lg p-1 border-2 border-white dark:border-darkcard">
            <CheckBadgeIcon className="h-5 w-5" />
          </div>
        )}
      </div>
      
      <h4 className="font-black text-gray-900 dark:text-white text-lg truncate w-full mb-1">{user.firstName} {user.lastName}</h4>
      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-4">
        {user.userType === UserType.CREATOR ? 'Conta Profissional' : 'Membro'}
      </p>

      {user.bio && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 italic leading-relaxed px-2">"{user.bio}"</p>}

      {!isSelf && (
        <button
          onClick={(e) => { e.stopPropagation(); onFollowToggle(user.id); }}
          className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${
            isFollowing ? 'bg-gray-100 dark:bg-white/5 text-gray-400' : 'bg-blue-600 text-white shadow-lg'
          }`}
        >
          {isFollowing ? 'Seguindo' : <><UserPlusIcon className="h-4 w-4" /> Seguir</>}
        </button>
      )}
    </div>
  );
};

const ProductResultCard: React.FC<{ product: Product; onNavigate: Function }> = ({ product, onNavigate }) => (
  <div 
    onClick={() => onNavigate('store', { storeId: product.storeId })}
    className="bg-white dark:bg-darkcard rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden cursor-pointer group transition-all hover:shadow-xl w-full max-w-[280px]"
  >
    <div className="relative h-44 overflow-hidden">
      <img src={product.imageUrls[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={product.name} />
      <div className="absolute top-3 left-3 bg-white/90 dark:bg-darkcard/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-black/5">
        <span className="text-[8px] font-black uppercase text-blue-600">{product.type === ProductType.PHYSICAL ? 'Físico' : 'Digital'}</span>
      </div>
    </div>
    <div className="p-5">
      <h4 className="font-black text-gray-900 dark:text-white text-sm line-clamp-1 mb-1">{product.name}</h4>
      <div className="flex items-center gap-1 mb-3">
        <StarIcon className="h-3 w-3 text-yellow-400" />
        <span className="text-[10px] font-black text-gray-400">{product.averageRating.toFixed(1)}</span>
      </div>
      <p className="text-blue-600 dark:text-blue-400 font-black text-xl">${product.price.toFixed(2)}</p>
    </div>
  </div>
);

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ currentUser, query, onNavigate, refreshUser }) => {
  const [foundUsers, setFoundUsers] = useState<User[]>([]);
  const [foundPosts, setFoundPosts] = useState<Post[]>([]);
  const [foundProducts, setFoundProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback(() => {
    if (!query) return;
    setLoading(true);
    const lowerQuery = query.toLowerCase();

    setFoundUsers(getUsers().filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(lowerQuery)));
    setFoundPosts(getPosts().filter(p => p.content?.toLowerCase().includes(lowerQuery)));
    setFoundProducts(getProducts().filter(p => p.name.toLowerCase().includes(lowerQuery)));

    setTimeout(() => setLoading(false), 500);
  }, [query]);

  useEffect(() => { performSearch(); }, [performSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFollowToggle = (userId: string) => {
    toggleFollowUser(currentUser.id, userId);
    refreshUser();
    performSearch();
  };

  const tabs = [
    { id: 'all', label: 'Todos os Resultados', icon: Squares2X2Icon, count: foundUsers.length + foundPosts.length + foundProducts.length },
    { id: 'users', label: 'Contas Encontradas', icon: UsersIcon, count: foundUsers.length },
    { id: 'posts', label: 'Conteúdo e Aulas', icon: NewspaperIcon, count: foundPosts.length },
    { id: 'products', label: 'Produtos da Loja', icon: ShoppingBagIcon, count: foundProducts.length },
  ];

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Vasculhando a CyBerPhone...</p>
    </div>
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12 pt-24 flex flex-col items-center">
      
      <header className="mb-10 text-center flex flex-col items-center w-full">
        <div className="bg-blue-600/10 p-4 rounded-[2rem] mb-6">
           <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">Resultados<span className="text-blue-600"></span></h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] md:text-xs">
          Busca por: <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">"{query}"</span>
        </p>
      </header>

      <div className="relative w-full max-w-xs mb-16" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-darkcard rounded-[1.8rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all active:scale-95"
        >
          <div className="flex items-center gap-3">
             <currentTab.icon className="h-5 w-5 text-blue-600" />
             <span className="font-black text-xs uppercase tracking-widest dark:text-white">{currentTab.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{currentTab.count}</span>
            <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-3 z-[60] bg-white dark:bg-darkcard border border-gray-100 dark:border-white/5 rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in py-2">
             {tabs.map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => { setActiveTab(tab.id as SearchTab); setIsDropdownOpen(false); }}
                 className={`w-full flex items-center justify-between px-6 py-4 transition-all hover:bg-gray-50 dark:hover:bg-white/5 ${
                   activeTab === tab.id ? 'bg-blue-50 dark:bg-blue-600/10' : ''
                 }`}
               >
                  <div className="flex items-center gap-4">
                    <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`font-black text-[10px] uppercase tracking-widest ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>{tab.label}</span>
                  </div>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                    {tab.count}
                  </span>
               </button>
             ))}
          </div>
        )}
      </div>

      {foundUsers.length === 0 && foundPosts.length === 0 && foundProducts.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-darkcard rounded-[4rem] shadow-sm border border-gray-100 dark:border-white/5 w-full max-w-4xl">
           <Squares2X2Icon className="h-16 w-16 text-gray-200 dark:text-gray-800 mx-auto mb-6" />
           <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Nada por aqui, ainda.</h3>
           <p className="text-gray-500 text-sm font-medium">Tente outros termos ou verifique a ortografia.</p>
        </div>
      ) : (
        <div className="w-full space-y-24 animate-fade-in">
          
          {(activeTab === 'all' || activeTab === 'users') && foundUsers.length > 0 && (
            <section className="flex flex-col items-center w-full">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Contas</h3>
              </div>
              <div className="flex flex-wrap justify-center gap-6 w-full">
                {foundUsers.map(user => <UserResultCard key={user.id} user={user} currentUser={currentUser} onNavigate={onNavigate} onFollowToggle={handleFollowToggle} />)}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'products') && foundProducts.length > 0 && (
            <section className="flex flex-col items-center w-full">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1.5 h-8 bg-green-500 rounded-full"></div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Marketplace</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center w-full">
                {foundProducts.map(product => <ProductResultCard key={product.id} product={product} onNavigate={onNavigate} />)}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'posts') && foundPosts.length > 0 && (
            <section className="flex flex-col items-center w-full">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1.5 h-8 bg-purple-600 rounded-full"></div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Conteúdos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center w-full max-w-5xl">
                {foundPosts.map(post => (
                  <div key={post.id} className="w-full max-w-[420px]">
                    <PostCard
                      post={post} currentUser={currentUser} 
                      onNavigate={onNavigate} onFollowToggle={handleFollowToggle} 
                      refreshUser={refreshUser} onPostUpdatedOrDeleted={performSearch} onPinToggle={() => {}}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;
