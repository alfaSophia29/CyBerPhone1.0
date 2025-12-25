
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserType, Post } from '../types';
import {
  findUserById,
  getPosts,
  toggleFollowUser,
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
  UsersIcon, HeartIcon, ChartBarIcon
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

  const isFollowing = currentUser.followedUsers.includes(profileOwnerId);

  const fetchProfileData = useCallback(() => {
    setLoading(true);
    const owner = findUserById(profileOwnerId);
    if (owner) {
      setProfileOwner(owner);
      const posts = getPosts().filter((p) => p.userId === owner.id);
      setOwnerPosts(posts);
    }
    setLoading(false);
  }, [profileOwnerId]);

  useEffect(() => { fetchProfileData(); }, [fetchProfileData]);

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
      {/* Visual Header / Cover */}
      <div className="relative w-full h-36 md:h-72 bg-gradient-to-br from-blue-700 via-indigo-600 to-purple-800">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        {isCurrentUserProfile && (
          <button 
            onClick={() => onNavigate('settings')}
            className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-xl text-white rounded-xl border border-white/10 z-10 active:scale-95"
          >
            <Cog8ToothIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Profile Core Info */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative -mt-16 md:-mt-24 mb-6 md:mb-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-10">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-[2.5rem] md:rounded-[3.2rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <img 
                src={profileOwner.profilePicture || DEFAULT_PROFILE_PIC} 
                className="relative w-32 h-32 md:w-52 md:h-52 rounded-[2.2rem] md:rounded-[3rem] border-[4px] md:border-[8px] border-white dark:border-darkcard shadow-2xl object-cover bg-white" 
              />
              {profileOwner.userType === UserType.CREATOR && (
                <div className="absolute bottom-2 right-2 bg-blue-600 p-1.5 rounded-xl border-2 border-white dark:border-darkcard shadow-lg">
                  <CheckBadgeIcon className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
              )}
            </div>
            
            {/* Identity & Actions */}
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
                <div>
                  <h2 className="text-2xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">
                    {profileOwner.firstName} {profileOwner.lastName}
                  </h2>
                  <p className="text-blue-600 dark:text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mt-1">
                    {profileOwner.userType === UserType.CREATOR ? 'Professor Autor' : 'Membro CyBer'}
                  </p>
                </div>
                
                <div className="flex items-center justify-center md:justify-end gap-2 w-full md:w-auto">
                  {!isCurrentUserProfile && (
                    <button 
                      onClick={() => { toggleFollowUser(currentUser.id, profileOwnerId); refreshUser(); fetchProfileData(); }} 
                      className={`flex-1 md:flex-none px-8 py-3 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isFollowing ? 'bg-gray-100 text-gray-400 dark:bg-white/5' : 'bg-blue-600 text-white shadow-blue-500/20'}`}
                    >
                      {isFollowing ? 'Seguindo' : 'Seguir Perfil'}
                    </button>
                  )}
                  {isCurrentUserProfile && (
                    <button onClick={() => onNavigate('settings')} className="flex-1 md:flex-none px-8 py-3 bg-gray-900 dark:bg-white dark:text-black text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest active:scale-95">
                      Editar Perfil
                    </button>
                  )}
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="flex items-center justify-center md:justify-start gap-8 md:gap-14 mb-4 py-4 border-y md:border-none border-gray-50 dark:border-white/5">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-lg md:text-2xl font-black text-gray-900 dark:text-white">{ownerPosts.length}</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Posts</span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-lg md:text-2xl font-black text-gray-900 dark:text-white">{(profileOwner.followedUsers?.length || 0) * 8 + 12}</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Alunos</span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-lg md:text-2xl font-black text-gray-900 dark:text-white">{(profileOwner.followedUsers?.length || 0)}</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seguindo</span>
                </div>
              </div>

              <p className="text-gray-500 dark:text-gray-400 font-medium text-xs md:text-lg leading-relaxed italic max-w-2xl mx-auto md:mx-0">
                "{profileOwner.bio || 'Criando o futuro da educação no CyBerPhone.'}"
              </p>
            </div>
          </div>
        </div>

        {/* Responsive Tab Nav - Sticky with horizontal scroll on mobile */}
        <div className="sticky top-[72px] z-30 -mx-4 md:mx-0 mb-6 bg-white/90 dark:bg-darkcard/90 backdrop-blur-xl md:rounded-[2rem] border-b md:border border-gray-100 dark:border-white/5 shadow-sm overflow-x-auto no-scrollbar">
          <div className="flex items-center min-w-max md:justify-center p-2 gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`flex items-center gap-2 py-2.5 px-5 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="pb-20 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
            
            {/* Content Area */}
            <div className="lg:col-span-8 space-y-6">
              {activeTab === 'feed' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {ownerPosts.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-white/5">
                      <NewspaperIcon className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Sem publicações ainda</p>
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
            
            {/* Sidebar Info - Stacked on Mobile */}
            <div className="lg:col-span-4 space-y-6 order-last lg:order-none">
              {isCurrentUserProfile && (
                <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Carteira</p>
                    <p className="text-4xl md:text-5xl font-black mb-10 tracking-tighter">${(profileOwner.balance || 0).toFixed(2)}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="bg-white/10 text-white py-4 rounded-2xl font-black text-[10px] uppercase border border-white/10 hover:bg-white/20 transition-all">Historico</button>
                      <button className="bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700 transition-all">Sacar</button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white dark:bg-darkcard p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-sm">
                <h4 className="font-black text-gray-900 dark:text-white uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4 text-blue-600" /> Bio Profissional
                </h4>
                {profileOwner.credentials && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-600/5 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                    <p className="text-blue-600 text-[9px] font-black uppercase mb-1">Qualificações</p>
                    <p className="text-gray-800 dark:text-gray-300 text-sm font-bold leading-tight">{profileOwner.credentials}</p>
                  </div>
                )}
                <p className="text-gray-500 dark:text-gray-400 text-sm italic leading-relaxed">
                  {profileOwner.bio || 'Nenhuma informação adicional fornecida.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
