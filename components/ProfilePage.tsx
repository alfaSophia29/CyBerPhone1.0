
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserType, Post } from '../types';
import {
  findUserById,
  getPosts,
  toggleFollowUser,
  getUsers,
  recommendProfileToUser
} from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import PostCard from './PostCard';
import PurchasesPage from './PurchasesPage';
import EventsPage from './EventsPage';
import AffiliatesPage from './AffiliatesPage';
import { 
  StarIcon, CalendarIcon, Cog8ToothIcon, 
  ShoppingBagIcon, NewspaperIcon, CurrencyDollarIcon,
  UserPlusIcon, UserMinusIcon, CheckBadgeIcon,
  UsersIcon, HeartIcon, ChartBarIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/solid';

interface ProfilePageProps {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  refreshUser: () => void;
  userId?: string;
}

type ProfileTab = 'feed' | 'events' | 'purchases' | 'affiliates';

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onNavigate, refreshUser, userId }) => {
  const profileOwnerId = userId || currentUser.id;
  const isCurrentUserProfile = profileOwnerId === currentUser.id;
  const [profileOwner, setProfileOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerPosts, setOwnerPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('feed');
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recommendSearch, setRecommendSearch] = useState('');

  const isFollowing = currentUser.followedUsers.includes(profileOwnerId);

  const fetchProfileData = useCallback(() => {
    setLoading(true);
    const owner = findUserById(profileOwnerId);
    if (owner) {
      setProfileOwner(owner);
      const posts = getPosts(currentUser.id).filter((p) => p.userId === owner.id);
      setOwnerPosts(posts);
    }
    setLoading(false);
  }, [profileOwnerId, currentUser.id]);

  useEffect(() => { fetchProfileData(); }, [fetchProfileData]);

  const handleRecommendProfile = (recipientId: string) => {
    if (recommendProfileToUser(currentUser.id, recipientId)) {
        alert('Perfil indicado com sucesso! Agora este usuário pode ver seu feed.');
    }
  };

  const followersToRecommend = (profileOwner?.followers || [])
    .map(id => findUserById(id))
    .filter(u => u && `${u.firstName} ${u.lastName}`.toLowerCase().includes(recommendSearch.toLowerCase()));

  if (loading || !profileOwner) return (
    <div className="min-h-[80vh] flex items-center justify-center dark:bg-darkbg">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const tabs = [
    { id: 'feed', label: 'Feed', icon: NewspaperIcon },
    { id: 'events', label: 'Eventos', icon: CalendarIcon },
    { id: 'purchases', label: 'Compras', icon: ShoppingBagIcon },
    ...(profileOwner.userType === UserType.CREATOR || isCurrentUserProfile ? [{ id: 'affiliates', label: 'Painel', icon: CurrencyDollarIcon }] : [])
  ];

  return (
    <div className="w-full min-h-screen bg-white dark:bg-darkbg transition-colors duration-500 overflow-x-hidden">
      <div className="relative w-full h-28 md:h-72 bg-gradient-to-br from-blue-700 via-indigo-600 to-purple-800">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        {isCurrentUserProfile && (
          <button 
            onClick={() => onNavigate('settings')}
            className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-xl text-white rounded-xl border border-white/10 z-10"
          >
            <Cog8ToothIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="relative -mt-12 md:-mt-24 mb-6 md:mb-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-3 md:gap-10">
            <div className="relative group shrink-0">
              <img 
                src={profileOwner.profilePicture || DEFAULT_PROFILE_PIC} 
                className="relative w-24 h-24 md:w-52 md:h-52 rounded-[1.8rem] md:rounded-[3rem] border-[4px] md:border-[8px] border-white dark:border-darkcard shadow-2xl object-cover bg-white" 
              />
              {profileOwner.userType === UserType.CREATOR && (
                <div className="absolute bottom-1 right-1 bg-blue-600 p-1 rounded-lg border-2 border-white dark:border-darkcard">
                  <CheckBadgeIcon className="h-3 w-3 md:h-6 md:w-6 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left w-full overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h2 className="text-xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter truncate">
                    {profileOwner.firstName} {profileOwner.lastName}
                  </h2>
                  <p className="text-blue-600 dark:text-blue-400 text-[9px] md:text-xs font-black uppercase tracking-[0.2em]">
                    {profileOwner.userType === UserType.CREATOR ? 'Professor Autor' : 'Membro CyBer'}
                  </p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                  {!isCurrentUserProfile && (
                    <button 
                      onClick={() => { toggleFollowUser(currentUser.id, profileOwnerId); refreshUser(); fetchProfileData(); }} 
                      className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${isFollowing ? 'bg-gray-100 text-gray-400 dark:bg-white/5' : 'bg-blue-600 text-white shadow-lg'}`}
                    >
                      {isFollowing ? 'Seguindo' : 'Seguir'}
                    </button>
                  )}
                  {isCurrentUserProfile && (
                    <>
                        <button onClick={() => onNavigate('settings')} className="flex-1 md:flex-none px-4 py-2.5 bg-gray-900 dark:bg-white dark:text-black text-white rounded-xl font-black text-[10px] uppercase">
                        Editar
                        </button>
                        {currentUser.userType === UserType.CREATOR && (
                            <button 
                                onClick={() => setShowRecommendModal(true)} 
                                className="flex-1 md:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2"
                            >
                                <PaperAirplaneIcon className="h-4 w-4 -rotate-45" /> Indicar Perfil
                            </button>
                        )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-around md:justify-start gap-4 md:gap-14 mb-4 py-3 border-y md:border-none border-gray-50 dark:border-white/5">
                <div className="flex flex-col items-center md:items-start min-w-[60px]">
                  <span className="text-base md:text-2xl font-black text-gray-900 dark:text-white">{ownerPosts.length}</span>
                  <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Posts Visíveis</span>
                </div>
                <div className="flex flex-col items-center md:items-start min-w-[60px]">
                  <span className="text-base md:text-2xl font-black text-gray-900 dark:text-white">{(profileOwner.followers?.length || 0)}</span>
                  <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Alunos</span>
                </div>
                <div className="flex flex-col items-center md:items-start min-w-[60px]">
                  <span className="text-base md:text-2xl font-black text-gray-900 dark:text-white">{(profileOwner.followedUsers?.length || 0)}</span>
                  <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Seguindo</span>
                </div>
              </div>

              <p className="text-gray-500 dark:text-gray-400 font-medium text-[11px] md:text-lg leading-relaxed italic max-w-2xl px-2 md:px-0">
                "{profileOwner.bio || 'Bem-vindo ao meu perfil educacional.'}"
              </p>
            </div>
          </div>
        </div>

        <div className="sticky top-[72px] z-30 mb-6 bg-white/95 dark:bg-darkcard/95 backdrop-blur-xl md:rounded-2xl border-b md:border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between p-1 gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1.5 py-3 px-1 rounded-xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-blue-600'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tight">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
            <div className="lg:col-span-8 space-y-4">
              {activeTab === 'feed' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ownerPosts.length === 0 ? (
                      <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-white/5">
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Nenhum post liberado para você.</p>
                      </div>
                  ) : (
                    ownerPosts.map(post => (
                        <PostCard 
                          key={post.id} post={post} currentUser={currentUser} 
                          onNavigate={onNavigate} onFollowToggle={() => {}} 
                          refreshUser={refreshUser} onPostUpdatedOrDeleted={fetchProfileData} onPinToggle={() => {}} 
                        />
                      ))
                  )}
                </div>
              )}
              {activeTab === 'events' && <EventsPage currentUser={currentUser} />}
              {activeTab === 'purchases' && <PurchasesPage currentUser={currentUser} onNavigate={onNavigate} />}
              {activeTab === 'affiliates' && <AffiliatesPage currentUser={currentUser} onNavigate={onNavigate} />}
            </div>
            
            <div className="lg:col-span-4 space-y-4">
              {isCurrentUserProfile && (
                <div className="bg-gray-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo</p>
                    <p className="text-3xl font-black mb-6">${(profileOwner.balance || 0).toFixed(2)}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="bg-white/10 text-white py-3 rounded-xl font-black text-[10px] uppercase border border-white/10">Histórico</button>
                      <button className="bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase">Sacar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: INDICAR MEU PERFIL */}
      {showRecommendModal && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white dark:bg-darkcard w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative border border-white/10">
              <button onClick={() => setShowRecommendModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckBadgeIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-black dark:text-white tracking-tighter">Liberar meu Feed</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Quem poderá ver suas aulas?</p>
              </div>

              <input 
                type="text" 
                placeholder="Buscar seguidor..." 
                value={recommendSearch}
                onChange={e => setRecommendSearch(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-white/5 dark:text-white rounded-2xl border-none outline-none font-bold text-xs mb-4"
              />

              <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                 {followersToRecommend.map(user => {
                   if (!user) return null;
                   const alreadyRecommended = profileOwner.profileIndicatedTo?.includes(user.id);
                   return (
                     <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-2xl transition-all">
                        <div className="flex items-center gap-3">
                           <img src={user.profilePicture || DEFAULT_PROFILE_PIC} className="w-8 h-8 rounded-lg object-cover" />
                           <span className="font-black text-[10px] dark:text-white truncate max-w-[120px]">{user.firstName} {user.lastName}</span>
                        </div>
                        <button 
                          onClick={() => !alreadyRecommended && handleRecommendProfile(user.id)}
                          disabled={alreadyRecommended}
                          className={`p-2 rounded-xl transition-all ${alreadyRecommended ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                        >
                           {alreadyRecommended ? <CheckIcon className="h-4 w-4" /> : <PaperAirplaneIcon className="h-4 w-4 -rotate-45" />}
                        </button>
                     </div>
                   );
                 })}
                 {followersToRecommend.length === 0 && <p className="text-center text-gray-400 text-[10px] font-bold py-4">Nenhum aluno encontrado.</p>}
              </div>

              <button 
                onClick={() => setShowRecommendModal(false)}
                className="w-full mt-6 py-4 bg-gray-900 dark:bg-white dark:text-black text-white rounded-2xl font-black text-xs uppercase tracking-widest"
              >
                Concluir
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
