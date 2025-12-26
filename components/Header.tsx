
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { MagnifyingGlassIcon, ShoppingCartIcon, BellIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  currentUser: User | null;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onLogout: () => void;
  unreadNotificationsCount: number;
  cartItemCount: number;
  onOpenCart: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onNavigate, onLogout, unreadNotificationsCount, cartItemCount, onOpenCart }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search-results', { query: searchQuery.trim() });
      setSearchQuery(''); 
      setIsMobileSearchOpen(false);
    }
  };

  useEffect(() => {
    if (isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileSearchOpen]);

  return (
    <>
      <header className="bg-white/90 dark:bg-darkbg/90 backdrop-blur-md shadow-sm px-4 py-2 md:px-6 md:py-4 flex justify-between items-center fixed top-0 left-0 w-full z-50 border-b border-gray-100 dark:border-white/5 h-[64px] md:h-[72px]">
        <div className="flex items-center gap-2">
          <h1 
            className="text-xl md:text-2xl font-black text-blue-600 cursor-pointer tracking-tighter flex-shrink-0 mr-2 md:mr-6" 
            onClick={() => onNavigate('feed')}
          >
            CyBer<span className="text-gray-900 dark:text-white">Phone</span>
          </h1>
        </div>

        {currentUser && (
          <>
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4 relative group">
              <div className="relative w-full text-gray-400 focus-within:text-blue-600 transition-colors">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-9 pr-4 py-2 border border-gray-100 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all shadow-inner dark:text-white"
                  placeholder="Buscar especialistas, cursos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            <button 
              onClick={() => setIsMobileSearchOpen(true)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors ml-auto mr-1"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>
          </>
        )}

        {currentUser ? (
          <div className="flex items-center gap-1 md:gap-4 flex-shrink-0">
            <button
              onClick={onOpenCart}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 relative transition-colors"
            >
              <ShoppingCartIcon className="h-5 w-5 md:h-6 md:w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 bg-blue-600 text-white text-[8px] font-black rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => onNavigate('notifications')}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 relative transition-colors"
            >
              <BellIcon className="h-5 w-5 md:h-6 md:w-6" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-[8px] font-black rounded-full h-3.5 w-3.5 flex items-center justify-center animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            <img
              src={currentUser.profilePicture || DEFAULT_PROFILE_PIC}
              alt="Profile"
              className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover cursor-pointer border-2 border-transparent hover:border-blue-600 transition-all shadow-sm"
              onClick={() => onNavigate('profile')}
            />
          </div>
        ) : (
          <button
            onClick={() => onNavigate('auth')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-100"
          >
            Entrar
          </button>
        )}
      </header>

      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-darkbg animate-fade-in md:hidden">
          <div className="flex items-center p-4 border-b border-gray-100 dark:border-white/5">
            <button 
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-gray-500 dark:text-gray-400 mr-2"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <input
                autoFocus
                type="text"
                placeholder="O que você procura?"
                className="w-full bg-transparent text-lg font-bold outline-none dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-2 text-gray-400"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <div className="p-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Sugestões de busca</p>
            <div className="flex flex-wrap gap-2">
              {['Design', 'Negócios', 'Cursos Online', 'E-books', 'Lives'].map(tag => (
                <button 
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    onNavigate('search-results', { query: tag });
                    setIsMobileSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/5"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
