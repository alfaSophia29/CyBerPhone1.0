
import React, { useState } from 'react';
import { User } from '../types';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { MagnifyingGlassIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search-results', { query: searchQuery.trim() });
      setSearchQuery(''); 
    }
  };

  return (
    <header className="bg-white dark:bg-darkbg shadow-lg p-3 md:p-4 flex justify-between items-center fixed top-0 left-0 w-full z-20 border-b border-gray-100 dark:border-white/5 h-[72px]">
      <h1 className="text-xl md:text-3xl font-extrabold text-blue-600 cursor-pointer tracking-tighter flex-shrink-0 mr-2" onClick={() => onNavigate('feed')} aria-label="CyBerPhone">
        CyBer<span className="text-gray-900 dark:text-white">Phone</span>
      </h1>

      {currentUser && (
        <form onSubmit={handleSearchSubmit} className="flex-grow max-w-sm md:max-w-xl mx-1 md:mx-4 relative group">
          <div className="relative text-gray-400 focus-within:text-blue-600 transition-colors">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-1.5 md:py-2.5 border border-gray-100 dark:border-white/10 rounded-xl leading-5 bg-gray-50 dark:bg-white/5 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-darkcard focus:ring-2 focus:ring-blue-500 text-xs md:text-sm transition-all shadow-inner"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      )}

      {currentUser ? (
        <div className="flex items-center space-x-1 md:space-x-4 flex-shrink-0">
          <button
            onClick={onOpenCart}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 relative transition-colors"
          >
            <ShoppingCartIcon className="h-5 w-5 md:h-6 md:w-6" />
            {cartItemCount > 0 && (
              <span className="absolute top-1 right-1 bg-blue-600 text-white text-[8px] font-black rounded-full h-4 w-4 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => onNavigate('notifications')}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 relative transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 0 01-2.312 6.022c1.733.64 3.56 1.043 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-600 text-white text-[8px] font-black rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          <img
            src={currentUser.profilePicture || DEFAULT_PROFILE_PIC}
            alt="Profile"
            className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-cover cursor-pointer border-2 border-transparent hover:border-blue-600 transition-all shadow-md ml-1"
            onClick={() => onNavigate('profile')}
          />
        </div>
      ) : (
        <button
          onClick={() => onNavigate('auth')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all shadow-lg"
        >
          Entrar
        </button>
      )}
    </header>
  );
};

export default Header;
