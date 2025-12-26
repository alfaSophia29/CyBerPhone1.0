
import { User, Post, ChatConversation, AdCampaign, UserType, Store, Product, AffiliateSale, Comment, ShippingAddress, ProductType, Notification, NotificationType, AudioTrack, CartItem, Transaction, TransactionType, OrderStatus, Story, CyberEvent, PaymentCard, ProductRating, StoryItem } from '../types';
import { DEFAULT_USERS, DEFAULT_POSTS, DEFAULT_ADS, DEFAULT_STORES, DEFAULT_PRODUCTS, DEFAULT_AUDIO_TRACKS, DEFAULT_STORIES } from '../constants';

const KEYS = {
  USERS: 'cyber_users',
  POSTS: 'cyber_posts',
  CHATS: 'cyber_chats',
  ADS: 'cyber_ads',
  CURRENT_USER: 'cyber_current_user_id',
  STORES: 'cyber_stores',
  PRODUCTS: 'cyber_products',
  SALES: 'cyber_sales',
  NOTIFICATIONS: 'cyber_notifications',
  STORIES: 'cyber_stories',
  REPORTS: 'cyber_reports',
  EVENTS: 'cyber_events',
  AUDIO_TRACKS: 'cyber_audio_tracks',
  CART: 'cyber_cart',
  AFFILIATE_LINKS: 'cyber_affiliate_links'
};

const get = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

const set = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const initializeDatabase = () => {
  if (!localStorage.getItem(KEYS.USERS)) set(KEYS.USERS, DEFAULT_USERS);
  if (!localStorage.getItem(KEYS.POSTS)) set(KEYS.POSTS, DEFAULT_POSTS);
  if (!localStorage.getItem(KEYS.ADS)) set(KEYS.ADS, DEFAULT_ADS);
  if (!localStorage.getItem(KEYS.STORES)) set(KEYS.STORES, DEFAULT_STORES);
  if (!localStorage.getItem(KEYS.PRODUCTS)) set(KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  if (!localStorage.getItem(KEYS.STORIES)) set(KEYS.STORIES, DEFAULT_STORIES);
  if (!localStorage.getItem(KEYS.AUDIO_TRACKS)) set(KEYS.AUDIO_TRACKS, DEFAULT_AUDIO_TRACKS);
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) set(KEYS.NOTIFICATIONS, []);
  if (!localStorage.getItem(KEYS.CHATS)) set(KEYS.CHATS, []);
  if (!localStorage.getItem(KEYS.REPORTS)) set(KEYS.REPORTS, []);
  if (!localStorage.getItem(KEYS.EVENTS)) set(KEYS.EVENTS, []);
  if (!localStorage.getItem(KEYS.CART)) set(KEYS.CART, []);
  if (!localStorage.getItem(KEYS.SALES)) set(KEYS.SALES, []);
};

initializeDatabase();

export const getUsers = (): User[] => get(KEYS.USERS, []);
export const findUserById = (id: string) => getUsers().find(u => u.id === id);
export const saveCurrentUser = (id: string | null) => id ? localStorage.setItem(KEYS.CURRENT_USER, id) : localStorage.removeItem(KEYS.CURRENT_USER);
export const getCurrentUserId = () => localStorage.getItem(KEYS.CURRENT_USER);

export const createNotification = (notif: Omit<Notification, 'id' | 'isRead'>) => {
  const all = get<Notification[]>(KEYS.NOTIFICATIONS, []);
  const newNotif: Notification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    isRead: false
  };
  set(KEYS.NOTIFICATIONS, [newNotif, ...all]);
};

export const getPosts = (userId?: string): Post[] => {
  const posts = get<Post[]>(KEYS.POSTS, []);
  if (userId) return posts.filter(p => p.userId === userId);
  return posts;
};

export const savePosts = (posts: Post[]) => set(KEYS.POSTS, posts);

// Fix: Added missing updatePost function
export const updatePost = (updatedPost: Post) => {
  const posts = getPosts();
  const index = posts.findIndex(p => p.id === updatedPost.id);
  if (index > -1) {
    posts[index] = updatedPost;
    set(KEYS.POSTS, posts);
  }
};

// Fix: Added missing addPost function
export const addPost = (post: Post) => {
  const posts = getPosts();
  set(KEYS.POSTS, [post, ...posts]);
};

export const indicatePostToUser = (postId: string, fromUserId: string, toUserId: string) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    if (!post.indicatedUserIds) post.indicatedUserIds = [];
    if (!post.indicatedUserIds.includes(toUserId)) {
      post.indicatedUserIds.push(toUserId);
      set(KEYS.POSTS, posts);
      
      // Notifica o aluno que recebeu a indicação
      createNotification({
        type: NotificationType.POST_INDICATION,
        recipientId: toUserId,
        actorId: fromUserId,
        postId: postId,
        timestamp: Date.now()
      });

      // Notifica o autor que seu post foi indicado
      createNotification({
        type: 'POST_RECOMMENDED',
        recipientId: post.userId,
        actorId: fromUserId,
        postId: postId,
        timestamp: Date.now()
      });
      return true;
    }
  }
  return false;
};

// Fix: Added missing recommendProfileToUser function
export const recommendProfileToUser = (fromUserId: string, recipientId: string) => {
  createNotification({
    type: NotificationType.PROFILE_RECOMMENDATION,
    recipientId: recipientId,
    actorId: fromUserId,
    timestamp: Date.now()
  });
  
  const users = getUsers();
  const recipient = users.find(u => u.id === recipientId);
  if (recipient) {
    if (!recipient.profileIndicatedTo) recipient.profileIndicatedTo = [];
    if (!recipient.profileIndicatedTo.includes(fromUserId)) {
        recipient.profileIndicatedTo.push(fromUserId);
        set(KEYS.USERS, users);
    }
  }
  return true;
};

export const updatePostLikes = (postId: string, userId: string) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    const idx = post.likes.indexOf(userId);
    if (idx > -1) post.likes.splice(idx, 1);
    else {
      post.likes.push(userId);
      createNotification({
        type: NotificationType.LIKE,
        recipientId: post.userId,
        actorId: userId,
        postId: postId,
        timestamp: Date.now()
      });
    }
    set(KEYS.POSTS, posts);
  }
};

export const addPostComment = (postId: string, comment: Comment) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.comments.push(comment);
    createNotification({
      type: NotificationType.COMMENT,
      recipientId: post.userId,
      actorId: comment.userId,
      postId: postId,
      timestamp: Date.now()
    });
    set(KEYS.POSTS, posts);
  }
};

export const updatePostShares = (postId: string, userId: string) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post && !post.shares.includes(userId)) {
    post.shares.push(userId);
    set(KEYS.POSTS, posts);
  }
};

export const deletePost = (id: string) => {
  const posts = getPosts();
  const filtered = posts.filter(p => p.id !== id);
  set(KEYS.POSTS, filtered);
};

export const updatePostSaves = (postId: string, userId: string) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    const idx = post.saves.indexOf(userId);
    if (idx > -1) post.saves.splice(idx, 1);
    else post.saves.push(userId);
    set(KEYS.POSTS, posts);
  }
};

export const reportPost = (postId: string, userId: string) => {
  const reports = get(KEYS.REPORTS, []);
  reports.push({ postId, userId, timestamp: Date.now() });
  set(KEYS.REPORTS, reports);
};

export const getUsers_list = (): User[] => get(KEYS.USERS, []);

export const toggleFollowUser = (currentUserId: string, userIdToFollow: string) => {
  const users = getUsers();
  const currentUser = users.find(u => u.id === currentUserId);
  const userToFollow = users.find(u => u.id === userIdToFollow);
  if (currentUser && userToFollow) {
    const isFollowing = currentUser.followedUsers.includes(userIdToFollow);
    if (isFollowing) {
      currentUser.followedUsers = currentUser.followedUsers.filter(id => id !== userIdToFollow);
      userToFollow.followers = userToFollow.followers.filter(id => id !== currentUserId);
    } else {
      currentUser.followedUsers.push(userIdToFollow);
      userToFollow.followers.push(currentUserId);
      createNotification({
        type: NotificationType.NEW_FOLLOWER,
        recipientId: userIdToFollow,
        actorId: currentUserId,
        timestamp: Date.now()
      });
    }
    set(KEYS.USERS, users);
  }
};

export const getNotificationsForUser = (userId: string) => get<Notification[]>(KEYS.NOTIFICATIONS, []).filter(n => n.recipientId === userId);
export const markNotificationsAsRead = (userId: string) => {
  const all = get<Notification[]>(KEYS.NOTIFICATIONS, []);
  all.forEach(n => { if (n.recipientId === userId) n.isRead = true; });
  set(KEYS.NOTIFICATIONS, all);
};

// Fix: Added missing chat functions
export const getChats = (): ChatConversation[] => get(KEYS.CHATS, []);
export const saveChats = (chats: ChatConversation[]) => set(KEYS.CHATS, chats);

export const getStories = (): Story[] => get(KEYS.STORIES, []);
export const getAds = (): AdCampaign[] => get(KEYS.ADS, []);
export const saveAds = (ads: AdCampaign[]) => set(KEYS.ADS, ads);
export const getEvents = (): CyberEvent[] => get(KEYS.EVENTS, []);

// Fix: Added missing event functions
export const createEvent = (event: CyberEvent) => {
  const events = getEvents();
  set(KEYS.EVENTS, [event, ...events]);
};

export const toggleJoinEvent = (eventId: string, userId: string) => {
  const events = getEvents();
  const event = events.find(e => e.id === eventId);
  if (event) {
    const idx = event.attendees.indexOf(userId);
    if (idx > -1) event.attendees.splice(idx, 1);
    else event.attendees.push(userId);
    set(KEYS.EVENTS, events);
  }
};

export const getProducts = (): Product[] => get(KEYS.PRODUCTS, []);
export const findProductById = (id: string) => getProducts().find(p => p.id === id);

// Fix: Added missing product and store persistence
export const saveProducts = (products: Product[]) => set(KEYS.PRODUCTS, products);
export const saveStores = (stores: Store[]) => set(KEYS.STORES, stores);

export const getStores = (): Store[] => get(KEYS.STORES, []);
export const findStoreById = (id: string) => getStores().find(s => s.id === id);

export const addToCart = (productId: string, quantity: number = 1, selectedColor?: string) => {
  const cart = get<CartItem[]>(KEYS.CART, []);
  const existing = cart.find(i => i.productId === productId && i.selectedColor === selectedColor);
  if (existing) existing.quantity += quantity;
  else cart.push({ productId, quantity, selectedColor });
  set(KEYS.CART, cart);
};

export const getCart = (): CartItem[] => get(KEYS.CART, []);
export const clearCart = () => set(KEYS.CART, []);

// Fix: Added missing cart modification functions
export const removeFromCart = (productId: string, selectedColor?: string) => {
  const cart = get<CartItem[]>(KEYS.CART, []);
  const filtered = cart.filter(i => !(i.productId === productId && i.selectedColor === selectedColor));
  set(KEYS.CART, filtered);
};

export const updateCartItemQuantity = (productId: string, quantity: number, selectedColor?: string) => {
  const cart = get<CartItem[]>(KEYS.CART, []);
  const item = cart.find(i => i.productId === productId && i.selectedColor === selectedColor);
  if (item) {
    item.quantity = quantity;
    if (item.quantity <= 0) {
      removeFromCart(productId, selectedColor);
      return;
    }
  }
  set(KEYS.CART, cart);
};

export const pinPost = (postId: string, userId: string) => {
  let posts = getPosts();
  let userPosts = posts.filter(p => p.userId === userId);
  userPosts.forEach(p => { if (p.id !== postId && p.isPinned) p.isPinned = false; });
  const targetPost = userPosts.find(p => p.id === postId);
  if (targetPost) {
    targetPost.isPinned = true;
    posts = posts.map(p => {
      const updatedUserPost = userPosts.find(up => up.id === p.id);
      return updatedUserPost ? updatedUserPost : p;
    });
    set(KEYS.POSTS, posts);
    return true;
  }
  return false;
};

export const unpinPost = (postId: string, userId: string) => {
  let posts = getPosts();
  const targetPost = posts.find(p => p.id === postId && p.userId === userId);
  if (targetPost) {
    targetPost.isPinned = false;
    set(KEYS.POSTS, posts);
    return true;
  }
  return false;
};

export const updateUserBalance = (userId: string, amount: number, description?: string) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.balance = (user.balance || 0) + amount;
    set(KEYS.USERS, users);
    return true;
  }
  return false;
};

export const updateStore = (updatedStore: Store) => {
  const stores = getStores();
  const index = stores.findIndex(s => s.id === updatedStore.id);
  if (index > -1) {
    stores[index] = updatedStore;
    set(KEYS.STORES, stores);
  }
};

export const registerUser = async (userData: any): Promise<User> => {
  const users = getUsers();
  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}`,
    followedUsers: [],
    followers: [],
    balance: 0,
    transactions: []
  };
  set(KEYS.USERS, [...users, newUser]);
  return newUser;
};

export const updateUser = (updatedUser: User) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index > -1) {
    users[index] = updatedUser;
    set(KEYS.USERS, users);
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (user) return user;
  throw new Error('Credenciais inválidas.');
};

export const addStory = (userId: string, imageUrl: string) => {
  const stories = getStories();
  const user = findUserById(userId);
  if (!user) return;
  const existingUserStoryIdx = stories.findIndex(s => s.userId === userId);
  const newItem: StoryItem = { id: `story-item-${Date.now()}`, imageUrl, timestamp: Date.now() };
  if (existingUserStoryIdx > -1) stories[existingUserStoryIdx].items.unshift(newItem);
  else stories.push({ userId: user.id, userName: `${user.firstName} ${user.lastName}`, userProfilePic: user.profilePicture || '', items: [newItem] });
  set(KEYS.STORIES, stories);
};

// Fix: Added missing audio track functions
export const getAudioTracks = (): AudioTrack[] => get(KEYS.AUDIO_TRACKS, []);
export const findAudioTrackById = (id: string) => getAudioTracks().find(t => t.id === id);

// Fix: Added missing affiliate link function
export const saveAffiliateLink = (userId: string, productId: string, link: string) => {
  const links = get<any[]>(KEYS.AFFILIATE_LINKS, []);
  links.push({ userId, productId, link, timestamp: Date.now() });
  set(KEYS.AFFILIATE_LINKS, links);
};

// Fix: Added missing sales functions
export const getAffiliateSales = (): AffiliateSale[] => get(KEYS.SALES, []);
export const getSalesByAffiliateId = (affiliateId: string) => getAffiliateSales().filter(s => s.affiliateUserId === affiliateId);
export const getSalesByStoreId = (storeId: string) => getAffiliateSales().filter(s => s.storeId === storeId);
export const getPurchasesByBuyerId = (buyerId: string) => getAffiliateSales().filter(s => s.buyerId === buyerId);

// Fix: Added missing purchase processing logic
export const processProductPurchase = (cartItems: CartItem[], buyerId: string, affiliateUserId: string | null, shippingAddress?: ShippingAddress) => {
  const users = getUsers();
  const sales = getAffiliateSales();
  const products = getProducts();

  for (const item of cartItems) {
    const product = products.find(p => p.id === item.productId);
    if (!product) continue;

    const store = findStoreById(product.storeId);
    const seller = users.find(u => u.id === store?.professorId);
    const itemTotal = product.price * item.quantity;
    const commission = itemTotal * product.affiliateCommissionRate;
    
    if (seller) {
      seller.balance = (seller.balance || 0) + (itemTotal - commission);
    }

    if (affiliateUserId) {
      const affiliate = users.find(u => u.id === affiliateUserId);
      if (affiliate) {
        affiliate.balance = (affiliate.balance || 0) + commission;
        createNotification({
          type: NotificationType.AFFILIATE_SALE,
          recipientId: affiliateUserId,
          actorId: buyerId,
          timestamp: Date.now(),
          saleId: `sale-${Date.now()}`
        });
      }
    }

    const newSale: AffiliateSale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      productId: item.productId,
      buyerId,
      affiliateUserId: affiliateUserId || '',
      storeId: product.storeId,
      commissionEarned: commission,
      saleAmount: itemTotal,
      timestamp: Date.now(),
      status: OrderStatus.DELIVERED,
      shippingAddress,
      selectedColor: item.selectedColor
    };
    sales.push(newSale);
  }

  set(KEYS.USERS, users);
  set(KEYS.SALES, sales);
  clearCart();
  return true;
};

// Fix: Added missing rating functionality
export const addProductRating = (saleId: string, rating: number, comment?: string) => {
  const sales = getAffiliateSales();
  const products = getProducts();
  const sale = sales.find(s => s.id === saleId);
  if (sale) {
    sale.isRated = true;
    const product = products.find(p => p.id === sale.productId);
    if (product) {
      const newRating: ProductRating = {
        id: `rating-${Date.now()}`,
        saleId,
        userId: sale.buyerId,
        rating,
        comment,
        timestamp: Date.now()
      };
      if (!product.ratings) product.ratings = [];
      product.ratings.push(newRating);
      product.ratingCount = product.ratings.length;
      product.averageRating = product.ratings.reduce((a, b) => a + b.rating, 0) / product.ratingCount;
      saveProducts(products);
    }
    set(KEYS.SALES, sales);
    return true;
  }
  return false;
};

// Fix: Added missing debit card request function
export const requestDebitCard = (userId: string, card: PaymentCard) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.card = card;
    set(KEYS.USERS, users);
    return true;
  }
  return false;
};
