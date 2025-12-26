
import React from 'react';
import { User } from '../types';
import { 
    HomeIcon, 
    ChatBubbleLeftRightIcon, 
    UserCircleIcon, 
    BuildingStorefrontIcon, 
    FilmIcon,
    ArrowRightOnRectangleIcon,
    Cog6ToothIcon,
    MegaphoneIcon
} from '@heroicons/react/24/outline';
import { 
    HomeIcon as HomeIconSolid, 
    ChatBubbleLeftRightIcon as ChatIconSolid, 
    UserCircleIcon as UserIconSolid, 
    BuildingStorefrontIcon as StoreIconSolid, 
    FilmIcon as FilmIconSolid,
    Cog6ToothIcon as CogIconSolid,
    MegaphoneIcon as MegaphoneIconSolid
} from '@heroicons/react/24/solid';

interface FooterProps {
  currentUser: User | null;
  onNavigate: (page: any) => void;
  activePage: string;
}

const Footer: React.FC<FooterProps> = ({ currentUser, onNavigate, activePage }) => {
  if (!currentUser) return null;

  const navItems = [
    { name: 'Feed', page: 'feed', Icon: HomeIcon, SolidIcon: HomeIconSolid },
    { name: 'Reels', page: 'reels-page', Icon: FilmIcon, SolidIcon: FilmIconSolid },
    { name: 'Chat', page: 'chat', Icon: ChatBubbleLeftRightIcon, SolidIcon: ChatIconSolid },
    { name: 'Loja', page: 'store', Icon: BuildingStorefrontIcon, SolidIcon: StoreIconSolid },
    { name: 'Anúncios', page: 'ads', Icon: MegaphoneIcon, SolidIcon: MegaphoneIconSolid },
    { name: 'Perfil', page: 'profile', Icon: UserCircleIcon, SolidIcon: UserIconSolid },
    { name: 'Ajustes', page: 'settings', Icon: Cog6ToothIcon, SolidIcon: CogIconSolid },
  ];

  return (
    <>
      {/* MOBILE NAV: Refatorado para caber 7 itens sem scroll em telas de 320px+ */}
      <nav className="fixed bottom-0 left-0 w-full z-30 bg-white/95 dark:bg-darkcard/95 backdrop-blur-xl border-t border-gray-100 dark:border-white/10 flex justify-between items-center h-16 md:hidden px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {navItems.map((item) => {
          const isActive = activePage === item.page;
          const IconComponent = isActive ? item.SolidIcon : item.Icon;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 h-full transition-all duration-300 relative group ${isActive ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}
              aria-label={item.name}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 scale-110' : 'group-active:scale-90'}`}>
                <IconComponent className="h-[22px] w-[22px] md:h-6 md:w-6" />
              </div>
              {isActive && <span className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full"></span>}
            </button>
          );
        })}
      </nav>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col fixed left-0 top-[72px] w-64 h-[calc(100vh-72px)] bg-white dark:bg-darkcard border-r border-gray-100 dark:border-white/10 z-20 overflow-y-auto p-4 custom-scrollbar shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
        <div className="space-y-2 flex-grow">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 ml-4">Menu</p>
          {navItems.map((item) => {
            const isActive = activePage === item.page;
            const IconComponent = isActive ? item.SolidIcon : item.Icon;
            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 group ${
                  isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-blue-600'
                }`}
              >
                <IconComponent className={`h-6 w-6 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'}`} />
                {item.name}
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/10 mb-4">
          <button onClick={() => window.location.reload()} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};

export default Footer;
