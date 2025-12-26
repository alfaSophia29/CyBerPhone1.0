
import React, { useState, useEffect, useCallback } from 'react';
import { User, CartItem } from './types';
import {
    getCurrentUserId,
    findUserById,
    saveCurrentUser,
    getNotificationsForUser,
    markNotificationsAsRead,
    getCart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart
} from './services/storageService';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import FeedPage from './components/FeedPage';
import ProfilePage from './components/ProfilePage';
import ChatPage from './components/ChatPage';
import AdCampaignPage from './components/AdCampaignPage';
import LiveStreamViewer from './components/LiveStreamViewer';
import { StorePage } from './components/StorePage';
import StoreManagerPage from './components/StoreManagerPage';
import CreatePost from './components/CreatePost';
import ReelsPage from './components/ReelsPage';
import SearchResultsPage from './components/SearchResultsPage';
import NotificationsPage from './components/NotificationsPage';
import CartModal from './components/CartModal';
import ReportUserPage from './components/ReportUserPage';
import SettingsPage from './components/SettingsPage';

type Page = 'auth' | 'feed' | 'profile' | 'chat' | 'ads' | 'live' | 'store' | 'manage-store' | 'edit-post' | 'create-post' | 'reels-page' | 'search-results' | 'notifications' | 'report-user' | 'settings';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('cyberphone_theme') === 'dark');
    const [currentPage, setCurrentPage] = useState<Page>(() => {
        return getCurrentUserId() ? 'feed' : 'auth';
    });
    const [pageParams, setPageParams] = useState<Record<string, string>>({});
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [cartItems, setCartItems] = useState<CartItem[]>(getCart());
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);

    const toggleTheme = useCallback(() => {
        setDarkMode(prev => {
            const newVal = !prev;
            localStorage.setItem('cyberphone_theme', newVal ? 'dark' : 'light');
            return newVal;
        });
    }, []);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    const refreshCurrentUser = useCallback(() => {
        const userId = getCurrentUserId();
        if (userId) {
            const user = findUserById(userId);
            setCurrentUser(user || null);
            if (user) {
                const notifications = getNotificationsForUser(user.id);
                setUnreadNotificationsCount(notifications.filter(n => !n.isRead).length);
            }
        } else {
            setCurrentUser(null);
            setUnreadNotificationsCount(0);
        }
    }, []);
    
    const refreshCart = useCallback(() => {
        setCartItems(getCart());
    }, []);

    useEffect(() => {
        refreshCurrentUser();
        refreshCart();
    }, [refreshCurrentUser, refreshCart]);

    const handleLoginSuccess = useCallback((user: User) => {
        setCurrentUser(user);
        saveCurrentUser(user.id);
        refreshCurrentUser();
        refreshCart();
        setCurrentPage('feed');
        setUnreadNotificationsCount(0);
    }, [refreshCurrentUser, refreshCart]);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        saveCurrentUser(null);
        setCurrentPage('auth');
        setUnreadNotificationsCount(0);
        clearCart();
        refreshCart();
    }, [refreshCart]);

    const handleNavigate = useCallback((page: Page, params: Record<string, string> = {}) => {
        if (page === 'notifications' && currentUser) {
            markNotificationsAsRead(currentUser.id);
            refreshCurrentUser();
        }
        setCurrentPage(page);
        setPageParams(params);
        window.scrollTo(0, 0);
    }, [currentUser, refreshCurrentUser]);
    
    const handleAddToCart = (productId: string, quantity: number = 1, selectedColor?: string) => {
        addToCart(productId, quantity, selectedColor);
        refreshCart();
    };

    const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const renderPage = () => {
        if (!currentUser) return <AuthPage onLoginSuccess={handleLoginSuccess} />;
        switch (currentPage) {
            case 'feed': return <FeedPage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
            case 'reels-page': return <ReelsPage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
            case 'profile': return <ProfilePage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} userId={pageParams.userId} />;
            case 'chat': return <ChatPage currentUser={currentUser} />;
            case 'settings': return <SettingsPage currentUser={currentUser} onNavigate={handleNavigate} darkMode={darkMode} toggleTheme={toggleTheme} refreshUser={refreshCurrentUser} />;
            case 'ads': return <AdCampaignPage currentUser={currentUser} refreshUser={refreshCurrentUser} />;
            case 'live':
                if (pageParams.postId) return <LiveStreamViewer currentUser={currentUser} postId={pageParams.postId} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
                return <FeedPage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
            case 'store': return <StorePage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} storeId={pageParams.storeId} onAddToCart={handleAddToCart} />;
            case 'manage-store': return <StoreManagerPage currentUser={currentUser} refreshUser={refreshCurrentUser} onNavigate={handleNavigate} />;
            case 'create-post': return <CreatePost currentUser={currentUser} onPostCreated={() => handleNavigate('feed')} refreshUser={refreshCurrentUser} />;
            case 'edit-post':
                if (pageParams.postId) return <CreatePost currentUser={currentUser} onPostCreated={() => handleNavigate('feed')} refreshUser={refreshCurrentUser} postId={pageParams.postId} />;
                return <FeedPage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
            case 'search-results': return <SearchResultsPage currentUser={currentUser} query={pageParams.query || ''} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
            case 'notifications': return <NotificationsPage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
            case 'report-user': return <ReportUserPage currentUser={currentUser} targetUserId={pageParams.userId} onNavigate={handleNavigate} />;
            default: return <FeedPage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-x-hidden">
            <Header
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                unreadNotificationsCount={unreadNotificationsCount}
                cartItemCount={cartItemCount}
                onOpenCart={() => setIsCartModalOpen(true)}
            />
            <div className="flex flex-1 overflow-x-hidden">
                {currentUser && (
                    <Footer currentUser={currentUser} onNavigate={handleNavigate} activePage={currentPage} />
                )}
                <main className={`flex-grow pt-[72px] pb-[72px] md:pb-8 transition-all duration-300 ${currentUser ? 'md:ml-64 px-4 md:px-8' : 'px-0'}`}>
                    <div className="max-w-7xl mx-auto">
                        {renderPage()}
                    </div>
                </main>
            </div>
            {currentUser && (
              <CartModal 
                isOpen={isCartModalOpen}
                onClose={() => setIsCartModalOpen(false)}
                currentUser={currentUser}
                onCartUpdate={refreshCart}
                refreshUser={refreshCurrentUser}
              />
            )}
        </div>
    );
};

export default App;
