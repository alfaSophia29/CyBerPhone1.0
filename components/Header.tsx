
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
      setSearchQuery(''); // Limpa a barra após a busca
    }
  };

  return (
    <header className="bg-white shadow-lg p-4 flex justify-between items-center fixed top-0 left-0 w-full z-20 border-b border-gray-100 h-[72px]">
      <h1 className="text-2xl md:text-3xl font-extrabold text-blue-600 cursor-pointer tracking-wide flex-shrink-0 mr-4" onClick={() => onNavigate('feed')} aria-label="Navegar para o Feed (CyBerPhone)">
        <span className="hidden md:inline">CyBerPhone</span>
        <span className="md:hidden">CP</span>
      </h1>

      {currentUser && (
        <form onSubmit={handleSearchSubmit} className="flex-grow max-w-xl mx-2 relative group">
          <div className="relative text-gray-400 focus-within:text-blue-600 transition-colors">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300 shadow-inner"
              placeholder="Buscar usuários ou conteúdos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      )}

      {currentUser ? (
        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0 ml-2">
          {/* Cart Icon */}
          <div className="relative">
            <button
              onClick={onOpenCart}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors relative"
              aria-label={`Ver carrinho de compras. Você tem ${cartItemCount} itens.`}
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] px-1">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Notification Icon */}
          <div className="relative">
            <button
              onClick={() => onNavigate('notifications')}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors relative"
              aria-label={`Ver Notificações. Você tem ${unreadNotificationsCount} não lidas.`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 0 01-2.312 6.022c1.733.64 3.56 1.043 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] px-1 animate-pulse">
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>

          <img
            src={currentUser.profilePicture || DEFAULT_PROFILE_PIC}
            alt="Profile"
            className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover cursor-pointer border-2 border-blue-400 hover:border-blue-600 transition-colors shadow-md"
            onClick={() => onNavigate('profile')}
            aria-label={`Ver perfil de ${currentUser.firstName}`}
          />
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-lg font-medium transition-colors shadow-sm text-sm hidden md:block"
            aria-label="Sair da conta"
          >
            Sair
          </button>
        </div>
      ) : (
        <button
          onClick={() => onNavigate('auth')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md"
          aria-label="Entrar na sua conta"
        >
          Entrar
        </button>
      )}
    </header>
  );
};

export default Header;
