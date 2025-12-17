
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Post, Product, Store, ProductType, UserType } from '../types';
import { getUsers, getPosts, getProducts, getStores, pinPost, unpinPost, toggleFollowUser, findUserById } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import PostCard from './PostCard';
import { BuildingStorefrontIcon, UserPlusIcon, UserMinusIcon, CheckBadgeIcon, ShoppingBagIcon, NewspaperIcon, UsersIcon, Squares2X2Icon, StarIcon } from '@heroicons/react/24/solid';

interface SearchResultsPageProps {
  currentUser: User;
  query: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  refreshUser: () => void;
}

type SearchTab = 'all' | 'users' | 'posts' | 'products' | 'stores';

const UserSearchResultCard: React.FC<{ 
  user: User; 
  currentUser: User; 
  onNavigate: Function; 
  onFollowToggle: Function 
}> = ({ user, currentUser, onNavigate, onFollowToggle }) => {
  const isFollowing = currentUser.followedUsers.includes(user.id);
  const isSelf = currentUser.id === user.id;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center text-center transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative mb-3">
        <img 
          src={user.profilePicture || DEFAULT_PROFILE_PIC} 
          alt={user.firstName} 
          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md cursor-pointer" 
          onClick={() => onNavigate('profile', { userId: user.id })}
        />
        {user.userType === UserType.CREATOR && (
          <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white">
            <CheckBadgeIcon className="h-5 w-5" />
          </div>
        )}
      </div>
      
      <h4 
        className="font-black text-gray-900 text-lg hover:text-blue-600 cursor-pointer truncate w-full px-2"
        onClick={() => onNavigate('profile', { userId: user.id })}
      >
        {user.firstName} {user.lastName}
      </h4>
      
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
        {user.userType === UserType.CREATOR ? 'Criador Profissional' : 'Membro Standard'}
      </p>

      {user.bio && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-4 italic px-2">
          "{user.bio}"
        </p>
      )}

      {!isSelf && (
        <button
          onClick={(e) => { e.stopPropagation(); onFollowToggle(user.id); }}
          className={`mt-auto w-full py-2 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            isFollowing 
              ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 group' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
          }`}
        >
          {isFollowing ? (
            <>
              <UserMinusIcon className="h-4 w-4 hidden group-hover:block" />
              <span className="group-hover:hidden">Seguindo</span>
              <span className="hidden group-hover:block">Deixar de seguir</span>
            </>
          ) : (
            <>
              <UserPlusIcon className="h-4 w-4" />
              Seguir
            </>
          )}
        </button>
      )}
    </div>
  );
};

const ProductResultCard: React.FC<{ product: Product; onNavigate: Function }> = ({ product, onNavigate }) => (
  <div 
    onClick={() => onNavigate('store', { storeId: product.storeId })}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group transform transition-all hover:shadow-xl hover:-translate-y-1"
  >
    <div className="relative h-40 overflow-hidden">
      <img src={product.imageUrls[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={product.name} />
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
        <span className="text-[10px] font-black uppercase text-blue-600">{product.type === ProductType.PHYSICAL ? 'Físico' : 'Digital'}</span>
      </div>
    </div>
    <div className="p-4">
      <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{product.name}</h4>
      <div className="flex items-center gap-1 my-1">
        <StarIcon className="h-3 w-3 text-yellow-400" />
        <span className="text-[10px] font-bold text-gray-500">{product.averageRating.toFixed(1)} ({product.ratingCount})</span>
      </div>
      <p className="text-blue-600 font-black text-lg mt-2">${product.price.toFixed(2)}</p>
    </div>
  </div>
);

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ currentUser, query, onNavigate, refreshUser }) => {
  const [foundUsers, setFoundUsers] = useState<User[]>([]);
  const [foundPosts, setFoundPosts] = useState<Post[]>([]);
  const [foundProducts, setFoundProducts] = useState<Product[]>([]);
  const [foundStores, setFoundStores] = useState<Store[]>([]);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [loading, setLoading] = useState(true);

  const performSearch = useCallback(() => {
    if (!query) return;

    setLoading(true);
    const lowerQuery = query.toLowerCase();

    // 1. Usuários
    const allUsers = getUsers();
    setFoundUsers(allUsers.filter(u => 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(lowerQuery) ||
      u.bio?.toLowerCase().includes(lowerQuery)
    ));

    // 2. Posts
    const allPosts = getPosts();
    setFoundPosts(allPosts.filter(p => 
      p.content?.toLowerCase().includes(lowerQuery) ||
      p.authorName.toLowerCase().includes(lowerQuery) ||
      p.reel?.title?.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => b.timestamp - a.timestamp));

    // 3. Produtos (A funcionalidade pedida)
    const allProducts = getProducts();
    setFoundProducts(allProducts.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.type.toLowerCase().includes(lowerQuery)
    ));

    // 4. Lojas
    const allStores = getStores();
    setFoundStores(allStores.filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery)
    ));

    setTimeout(() => setLoading(false), 400);
  }, [query]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleFollowToggle = (userId: string) => {
    toggleFollowUser(currentUser.id, userId);
    refreshUser();
    performSearch();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-bold animate-pulse">Explorando a CyBerPhone...</p>
      </div>
    );
  }

  const hasResults = foundUsers.length > 0 || foundPosts.length > 0 || foundProducts.length > 0 || foundStores.length > 0;

  const tabs = [
    { id: 'all', label: 'Tudo', icon: Squares2X2Icon, count: foundUsers.length + foundPosts.length + foundProducts.length + foundStores.length },
    { id: 'users', label: 'Pessoas', icon: UsersIcon, count: foundUsers.length },
    { id: 'posts', label: 'Conteúdo', icon: NewspaperIcon, count: foundPosts.length },
    { id: 'products', label: 'Produtos', icon: ShoppingBagIcon, count: foundProducts.length },
    { id: 'stores', label: 'Lojas', icon: BuildingStorefrontIcon, count: foundStores.length },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 pb-20">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-gray-900 mb-2">Resultados da Busca</h2>
        <p className="text-gray-500 font-medium">Você pesquisou por: <span className="text-blue-600 font-black italic">"{query}"</span></p>
      </header>

      {/* TABS DE NAVEGAÇÃO DE BUSCA */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SearchTab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {!hasResults ? (
        <div className="bg-white rounded-[3rem] p-16 text-center shadow-xl border border-gray-100 animate-fade-in">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Squares2X2Icon className="h-12 w-12 text-gray-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-800">Nada encontrado</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">Tente usar termos mais genéricos ou verifique a ortografia do que você procura.</p>
        </div>
      ) : (
        <div className="space-y-12 animate-fade-in">
          {/* SEÇÃO DE PRODUTOS (Ativada se Aba 'all' ou 'products') */}
          {(activeTab === 'all' || activeTab === 'products') && foundProducts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-orange-500 rounded-full"></div>
                  <h3 className="text-2xl font-black text-gray-800">Produtos em Destaque</h3>
                </div>
                {activeTab === 'all' && (
                  <button onClick={() => setActiveTab('products')} className="text-blue-600 font-bold text-xs hover:underline">Ver todos</button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {foundProducts.slice(0, activeTab === 'all' ? 5 : undefined).map(product => (
                  <ProductResultCard key={product.id} product={product} onNavigate={onNavigate} />
                ))}
              </div>
            </section>
          )}

          {/* SEÇÃO DE USUÁRIOS */}
          {(activeTab === 'all' || activeTab === 'users') && foundUsers.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
                <h3 className="text-2xl font-black text-gray-800">Pessoas</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {foundUsers.slice(0, activeTab === 'all' ? 4 : undefined).map(user => (
                  <UserSearchResultCard key={user.id} user={user} currentUser={currentUser} onNavigate={onNavigate} onFollowToggle={handleFollowToggle} />
                ))}
              </div>
            </section>
          )}

          {/* SEÇÃO DE LOJAS */}
          {(activeTab === 'all' || activeTab === 'stores') && foundStores.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-8 bg-green-500 rounded-full"></div>
                <h3 className="text-2xl font-black text-gray-800">Lojas Oficiais</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {foundStores.slice(0, activeTab === 'all' ? 3 : undefined).map(store => {
                  const owner = findUserById(store.professorId);
                  return (
                    <div key={store.id} onClick={() => onNavigate('store', { storeId: store.id })} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all group">
                      <img src={owner?.profilePicture || DEFAULT_PROFILE_PIC} className="w-14 h-14 rounded-xl object-cover border-2 border-green-50" alt={store.name} />
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{store.name}</h4>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-0.5">Visitar Loja &rarr;</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SEÇÃO DE PUBLICAÇÕES */}
          {(activeTab === 'all' || activeTab === 'posts') && foundPosts.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-8 bg-purple-500 rounded-full"></div>
                <h3 className="text-2xl font-black text-gray-800">Publicações e Vídeos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {foundPosts.slice(0, activeTab === 'all' ? 6 : undefined).map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onNavigate={onNavigate}
                    onFollowToggle={handleFollowToggle}
                    refreshUser={refreshUser}
                    onPostUpdatedOrDeleted={performSearch}
                    onPinToggle={() => {}}
                  />
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
