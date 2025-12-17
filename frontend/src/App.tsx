
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
import CreatePost from './components/CreatePost';
import ReelsPage from './components/ReelsPage';
import SearchResultsPage from './components/SearchResultsPage';
import NotificationsPage from './components/NotificationsPage';
import AffiliatesPage from './components/AffiliatesPage';
import CartModal from './components/CartModal';
import { requestNotificationPermission, showNotification } from './services/notificationService';

type Page = 'auth' | 'feed' | 'profile' | 'chat' | 'ads' | 'live' | 'store' | 'edit-post' | 'create-post' | 'reels-page' | 'search-results' | 'notifications' | 'affiliates';

const NOTIFICATION_POLL_INTERVAL = 5000;
const LAST_NOTIFICATION_CHECK_KEY = 'cyberphone_last_notification_check';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    // Initialize currentPage based on auth state immediately to prevent flash
    const [currentPage, setCurrentPage] = useState<Page>(() => {
        return getCurrentUserId() ? 'feed' : 'auth';
    });
    const [pageParams, setPageParams] = useState<Record<string, string>>({});
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [cartItems, setCartItems] = useState<CartItem[]>(getCart());
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'denied'
    );

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

    // Initial Load Effect - Runs ONLY once
    useEffect(() => {
        refreshCurrentUser();
        refreshCart();
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []); // Empty dependency array ensures this runs only once

    // CRITICAL FIX: Removed the useEffect that watched [currentUser] and reset currentPage to 'reels-page'.
    // This prevents the app from navigating away when the user likes a post or adds to cart.

    const handleLoginSuccess = useCallback((user: User) => {
        setCurrentUser(user);
        saveCurrentUser(user.id);
        refreshCurrentUser();
        refreshCart();
        // Explicitly go to FEED after login
        setCurrentPage('feed');
        
        // Clear last check timestamp for the new user
        localStorage.removeItem(`${LAST_NOTIFICATION_CHECK_KEY}_${user.id}`);
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
    
    const handleAddToCart = (productId: string) => {
        addToCart(productId);
        refreshCart();
    };

    const handleRequestNotificationPermission = useCallback(async () => {
        const permission = await requestNotificationPermission();
        setNotificationPermission(permission);
    }, []);

    // Notification Polling Logic
    useEffect(() => {
        let notificationInterval: number | null = null;

        if (currentUser && notificationPermission === 'granted') {
            notificationInterval = window.setInterval(() => {
                const lastCheckTime = parseInt(
                    localStorage.getItem(`${LAST_NOTIFICATION_CHECK_KEY}_${currentUser.id}`) || '0',
                    10
                );
                const currentTime = Date.now();
                let newNotificationsDetected = 0;

                // Note: This mimics fetching from backend.
                const chats = JSON.parse(localStorage.getItem('cyberphone_chats') || '[]');
                const users = JSON.parse(localStorage.getItem('cyberphone_users') || '[]');
                const findUserByIdLocal = (id: string) => users.find((u: any) => u.id === id);

                const userChats = chats.filter((chat: any) => chat.participants.includes(currentUser.id));

                userChats.forEach((chat: any) => {
                    chat.messages.forEach((message: any) => {
                        if (message.senderId !== currentUser.id && message.timestamp > lastCheckTime) {
                            const sender = findUserByIdLocal(message.senderId);
                            if (sender) {
                                showNotification(
                                    `Nova mensagem de ${sender.firstName}`,
                                    {
                                        body: message.text || (message.imageUrl ? 'Imagem enviada.' : 'Você recebeu uma nova mensagem.'),
                                        icon: sender.profilePicture,
                                        url: `/chat`,
                                        tag: `new-chat-message-${message.id}`
                                    }
                                );
                                newNotificationsDetected++;
                            }
                        }
                    });
                });
                
                if (newNotificationsDetected > 0) {
                    setUnreadNotificationsCount(prevCount => prevCount + newNotificationsDetected);
                }

                localStorage.setItem(`${LAST_NOTIFICATION_CHECK_KEY}_${currentUser.id}`, currentTime.toString());
            }, NOTIFICATION_POLL_INTERVAL);
        }

        return () => {
            if (notificationInterval) {
                clearInterval(notificationInterval);
            }
        };
    }, [currentUser, notificationPermission]);

    const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const renderPage = () => {
        if (!currentUser) {
            return <AuthPage onLoginSuccess={handleLoginSuccess} />;
        }

        switch (currentPage) {
            case 'feed':
                return <FeedPage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
            case 'reels-page':
                return <ReelsPage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
            case 'profile':
                return <ProfilePage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} userId={pageParams.userId} />;
            case 'chat':
                return <ChatPage currentUser={currentUser} />;
            case 'ads':
                return <AdCampaignPage currentUser={currentUser} refreshUser={refreshCurrentUser} />;
            case 'live':
                if (pageParams.postId) {
                    return <LiveStreamViewer currentUser={currentUser} postId={pageParams.postId} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
                }
                return <FeedPage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
            case 'store':
                return <StorePage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} storeId={pageParams.storeId} onAddToCart={handleAddToCart} />;
            case 'affiliates':
                return <AffiliatesPage currentUser={currentUser} onNavigate={handleNavigate} />;
            case 'create-post':
                return <CreatePost currentUser={currentUser} onPostCreated={() => handleNavigate('feed')} refreshUser={refreshCurrentUser} />;
            case 'edit-post':
                if (pageParams.postId) {
                    return <CreatePost currentUser={currentUser} onPostCreated={() => handleNavigate('feed')} refreshUser={refreshCurrentUser} postId={pageParams.postId} />;
                }
                return <FeedPage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
            case 'search-results':
                return <SearchResultsPage currentUser={currentUser} query={pageParams.query || ''} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
            case 'notifications':
                return <NotificationsPage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
            default:
                return <FeedPage currentUser={currentUser} onNavigate={handleNavigate} refreshUser={refreshCurrentUser} />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                unreadNotificationsCount={unreadNotificationsCount}
                cartItemCount={cartItemCount}
                onOpenCart={() => setIsCartModalOpen(true)}
            />
            <main className="flex-grow pt-[72px] pb-[72px] md:pb-0">
                {renderPage()}
            </main>
            <Footer
                currentUser={currentUser}
                onNavigate={handleNavigate}
                activePage={currentPage}
            />
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
