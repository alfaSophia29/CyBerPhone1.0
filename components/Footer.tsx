
import React from 'react';
import { User, UserType } from '../types';
import { 
    HomeIcon, 
    ChatBubbleLeftRightIcon, 
    UserCircleIcon, 
    BuildingStorefrontIcon, 
    MegaphoneIcon, 
    FilmIcon, 
    CurrencyDollarIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { 
    HomeIcon as HomeIconSolid, 
    ChatBubbleLeftRightIcon as ChatIconSolid, 
    UserCircleIcon as UserIconSolid, 
    BuildingStorefrontIcon as StoreIconSolid, 
    MegaphoneIcon as MegaphoneIconSolid, 
    FilmIcon as FilmIconSolid, 
    CurrencyDollarIcon as CurrencyDollarIconSolid 
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
    { name: 'Lojas', page: 'store', Icon: BuildingStorefrontIcon, SolidIcon: StoreIconSolid },
    { name: 'Afiliados', page: 'affiliates', Icon: CurrencyDollarIcon, SolidIcon: CurrencyDollarIconSolid },
    { name: 'Anúncios', page: 'ads', Icon: MegaphoneIcon, SolidIcon: MegaphoneIconSolid, requiresCreator: true },
    { name: 'Perfil', page: 'profile', Icon: UserCircleIcon, SolidIcon: UserIconSolid },
  ];

  return (
    <>
      {/* MOBILE BOTTOM NAVIGATION (Fixed) */}
      <nav className="fixed bottom-0 left-0 w-full z-30 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center h-16 md:hidden px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          if (item.requiresCreator && currentUser.userType !== UserType.CREATOR) return null;
          const isActive = activePage === item.page;
          const IconComponent = isActive ? item.SolidIcon : item.Icon;

          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative ${isActive ? 'text-blue-600 scale-110' : 'text-gray-400'}`}
              aria-label={item.name}
            >
              <IconComponent className="h-6 w-6" />
              {isActive && <span className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full"></span>}
            </button>
          );
        })}
      </nav>

      {/* DESKTOP SIDEBAR NAVIGATION (Fixed) */}
      <aside className="hidden md:flex flex-col fixed left-0 top-[72px] w-64 h-[calc(100vh-72px)] bg-white border-r border-gray-100 z-20 overflow-y-auto p-4 custom-scrollbar shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
        <div className="space-y-2 flex-grow">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-4">Navegação Principal</p>
          {navItems.map((item) => {
            if (item.requiresCreator && currentUser.userType !== UserType.CREATOR) return null;
            const isActive = activePage === item.page;
            const IconComponent = isActive ? item.SolidIcon : item.Icon;

            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                <IconComponent className={`h-6 w-6 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'}`} />
                {item.name}
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 mb-4">
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-4 mb-6 border border-white">
            <p className="text-xs font-black text-blue-900 mb-1">Dica Pro ✨</p>
            <p className="text-[11px] text-blue-700 leading-tight">Explore a aba Afiliados para monetizar seu conteúdo hoje!</p>
          </div>
          
          <button 
             onClick={() => window.location.reload()} // Mock logout/reload for menu example
             className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            Encerrar Sessão
          </button>
          
          <p className="text-[10px] text-gray-400 text-center mt-6">&copy; {new Date().getFullYear()} CyBerPhone</p>
        </div>
      </aside>
    </>
  );
};

export default Footer;
