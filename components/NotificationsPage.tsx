
import React, { useState, useEffect, useMemo } from 'react';
import { Notification, User, Post, NotificationType } from '../types';
import { getNotificationsForUser, findUserById, getPosts, toggleFollowUser } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { HeartIcon, ChatBubbleOvalLeftIcon, UserPlusIcon, CurrencyDollarIcon, StarIcon } from '@heroicons/react/24/solid';

interface NotificationsPageProps {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  refreshUser: () => void;
}

const timeAgo = (timestamp: number): string => {
  const now = new Date();
  const secondsPast = (now.getTime() - timestamp) / 1000;

  if (secondsPast < 60) return `${Math.round(secondsPast)}s atrás`;
  if (secondsPast < 3600) return `${Math.round(secondsPast / 60)}m atrás`;
  if (secondsPast <= 86400) return `${Math.round(secondsPast / 3600)}h atrás`;
  const days = Math.round(secondsPast / 86400);
  if (days <= 7) return `${days}d atrás`;
  return new Date(timestamp).toLocaleDateString();
};

const NotificationItem: React.FC<{ notification: Notification; onNavigate: Function; refreshUser: Function; currentUser: User; allPosts: Post[] }> = ({ notification, onNavigate, refreshUser, currentUser, allPosts }) => {
  const actor = findUserById(notification.actorId);
  const post = notification.postId ? allPosts.find(p => p.id === notification.postId) : null;
  const isFollowingActor = currentUser.followedUsers.includes(notification.actorId);

  if (!actor) return null;

  const handleFollowToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFollowUser(currentUser.id, actor.id);
    refreshUser();
  };

  const handleNavigation = () => {
    if (notification.postId && post) {
      onNavigate('feed'); // Navigate to feed, where post will be visible
    } else if (notification.type === NotificationType.NEW_FOLLOWER) {
      onNavigate('profile', { userId: actor.id });
    }
  };

  const renderIcon = () => {
    switch (notification.type) {
      case NotificationType.LIKE: return <HeartIcon className="h-6 w-6 text-white bg-red-500 rounded-full p-1" />;
      case NotificationType.COMMENT: return <ChatBubbleOvalLeftIcon className="h-6 w-6 text-white bg-blue-500 rounded-full p-1" />;
      case NotificationType.NEW_FOLLOWER: return <UserPlusIcon className="h-6 w-6 text-white bg-green-500 rounded-full p-1" />;
      case NotificationType.AFFILIATE_SALE: return <CurrencyDollarIcon className="h-6 w-6 text-white bg-yellow-500 rounded-full p-1" />;
      case NotificationType.REACTION: return <StarIcon className="h-6 w-6 text-white bg-purple-500 rounded-full p-1" />;
      default: return null;
    }
  };

  const renderMessage = () => {
    const actorName = <strong className="font-semibold">{`${actor.firstName} ${actor.lastName}`}</strong>;
    switch (notification.type) {
      case NotificationType.LIKE: return <>{actorName} curtiu sua publicação.</>;
      case NotificationType.COMMENT: return <>{actorName} comentou em sua publicação.</>;
      case NotificationType.NEW_FOLLOWER: return <>{actorName} começou a seguir você.</>;
      case NotificationType.AFFILIATE_SALE: return <>Parabéns! Você ganhou uma comissão pela venda de um produto indicado por {actorName}.</>;
      case NotificationType.REACTION: return <>{actorName} reagiu à sua publicação.</>;
      default: return 'Nova notificação.';
    }
  };

  return (
    <div onClick={handleNavigation} className="flex items-center p-3 space-x-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200">
      <div className="relative">
        <img src={actor.profilePicture || DEFAULT_PROFILE_PIC} alt={actor.firstName} className="w-12 h-12 rounded-full object-cover" />
        <div className="absolute -bottom-1 -right-1">{renderIcon()}</div>
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-800">{renderMessage()}</p>
        <span className="text-xs text-gray-500">{timeAgo(notification.timestamp)}</span>
      </div>
      {post && post.imageUrl && (
        <img src={post.imageUrl} alt="Post thumbnail" className="w-12 h-12 object-cover rounded-md" />
      )}
      {notification.type === NotificationType.NEW_FOLLOWER && (
        <button onClick={handleFollowToggle} className={`px-3 py-1 text-sm font-semibold rounded-full ${isFollowingActor ? 'bg-gray-200 text-gray-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
          {isFollowingActor ? 'Seguindo' : 'Seguir de volta'}
        </button>
      )}
    </div>
  );
};

const NotificationsPage: React.FC<NotificationsPageProps> = ({ currentUser, onNavigate, refreshUser }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const userNotifications = getNotificationsForUser(currentUser.id).sort((a, b) => b.timestamp - a.timestamp);
    setNotifications(userNotifications);
    setAllPosts(getPosts()); // Cache all posts for quick lookup
    setLoading(false);
  }, [currentUser.id]);

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {
      "Hoje": [],
      "Esta Semana": [],
      "Este Mês": [],
      "Mais Antigas": [],
    };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = today - 30 * 24 * 60 * 60 * 1000;

    notifications.forEach(n => {
      if (n.timestamp >= today) groups["Hoje"].push(n);
      else if (n.timestamp >= oneWeekAgo) groups["Esta Semana"].push(n);
      else if (n.timestamp >= oneMonthAgo) groups["Este Mês"].push(n);
      else groups["Mais Antigas"].push(n);
    });

    return groups;
  }, [notifications]);

  if (loading) {
    return <div className="p-8 text-center">Carregando notificações...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 pb-20 md:pb-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3 border-gray-200">Notificações</h2>
      {notifications.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-2xl shadow-sm border border-gray-200">
          <p className="text-xl text-gray-600">Você não tem notificações.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100 space-y-6">
          {/* FIX: Explicitly type the destructured array from Object.entries to resolve 'unknown' type error. */}
          {Object.entries(groupedNotifications).map(([groupName, groupNotifications]: [string, Notification[]]) =>
            groupNotifications.length > 0 && (
              <div key={groupName}>
                <h3 className="text-lg font-bold text-gray-800 mb-3 px-2">{groupName}</h3>
                <div className="space-y-2">
                  {groupNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onNavigate={onNavigate}
                      refreshUser={refreshUser}
                      currentUser={currentUser}
                      allPosts={allPosts}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
