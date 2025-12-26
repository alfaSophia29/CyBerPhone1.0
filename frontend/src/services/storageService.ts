
import { User, Post, ChatConversation, AdCampaign, UserType, Store, Product, AffiliateSale, Comment, ShippingAddress, ProductType, AudioTrack, Notification, NotificationType, CartItem, ProductRating } from '../types';
import { DEFAULT_USERS, DEFAULT_POSTS, DEFAULT_ADS, DEFAULT_STORES, DEFAULT_PRODUCTS, DEFAULT_AFFILIATE_SALES, DEFAULT_PROFILE_PIC, DEFAULT_AUDIO_TRACKS } from '../constants';

const USERS_KEY = 'cyberphone_users';
const POSTS_KEY = 'cyberphone_posts';
const CHATS_KEY = 'cyberphone_chats';
const ADS_KEY = 'cyberphone_ads';
const CURRENT_USER_KEY = 'cyberphone_current_user_id';
const STORES_KEY = 'cyberphone_stores';
const PRODUCTS_KEY = 'cyberphone_products';
const AFFILIATE_SALES_KEY = 'cyberphone_affiliate_sales';
const AUDIO_TRACKS_KEY = 'cyberphone_audio_tracks';
const NOTIFICATIONS_KEY = 'cyberphone_notifications';
const CART_KEY = 'cyberphone_cart';

const initializeData = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem(POSTS_KEY)) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(DEFAULT_POSTS));
  }
  if (!localStorage.getItem(ADS_KEY)) {
    localStorage.setItem(ADS_KEY, JSON.stringify(DEFAULT_ADS));
  }
  if (!localStorage.getItem(CHATS_KEY)) {
    localStorage.setItem(CHATS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORES_KEY)) {
    localStorage.setItem(STORES_KEY, JSON.stringify(DEFAULT_STORES));
  }
  if (!localStorage.getItem(PRODUCTS_KEY)) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
  }
  if (!localStorage.getItem(AFFILIATE_SALES_KEY)) {
    localStorage.setItem(AFFILIATE_SALES_KEY, JSON.stringify(DEFAULT_AFFILIATE_SALES));
  }
  if (!localStorage.getItem(AUDIO_TRACKS_KEY)) {
    localStorage.setItem(AUDIO_TRACKS_KEY, JSON.stringify(DEFAULT_AUDIO_TRACKS));
  }
  if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(CART_KEY)) {
    localStorage.setItem(CART_KEY, JSON.stringify([]));
  }
};

initializeData();

// --- Frontend Mock API Calls (Will be replaced by actual HTTP requests to backend) ---
const BASE_URL = 'http://localhost:3001/api'; // Assuming backend runs on port 3001

export const loginUser = async (email: string, password: string): Promise<User> => {
  // TODO: Replace with actual backend API call
  console.log('Simulating login via API for:', email);
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (user && password === 'password') { // Password check will be done on backend
    return user;
  }
  throw new Error('Credenciais inválidas.');
};

// Fix: Updated Omit type to include 'followers' which is generated internally
export const registerUser = async (userData: Omit<User, 'id' | 'followedUsers' | 'followers' | 'balance'> & { password: string }): Promise<User> => {
  // TODO: Replace with actual backend API call
  console.log('Simulating registration via API for:', userData.email);
  const users = getUsers();
  if (users.some(u => u.email === userData.email)) {
    throw new Error('Email já cadastrado.');
  }

  // Fix: Added missing 'followers' property to satisfy User interface
  const newUser: User = {
    id: `user-${Date.now()}`,
    userType: userData.userType,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    phone: userData.phone,
    documentId: userData.documentId,
    followedUsers: [],
    followers: [],
    balance: 0,
    profilePicture: userData.profilePicture || DEFAULT_PROFILE_PIC,
    credentials: userData.userType === UserType.CREATOR ? userData.credentials : undefined,
    bio: userData.userType === UserType.CREATOR ? userData.bio : undefined,
    storeId: userData.userType === UserType.CREATOR ? `store-${Date.now()}` : undefined, // Placeholder
  };

  // Simulate store creation for creator
  if (newUser.userType === UserType.CREATOR && newUser.storeId) {
    const allStores = getStores();
    saveStores([...allStores, {
      id: newUser.storeId,
      professorId: newUser.id,
      name: `Loja de ${newUser.firstName} ${newUser.lastName}`,
      description: 'Bem-vindo à minha loja!',
      productIds: [],
    }]);
  }
  saveUsers([...users, newUser]);
  return newUser;
};

// --- Cart Management ---

export const getCart = (): CartItem[] => {
  const cartJson = localStorage.getItem(CART_KEY);
  return cartJson ? JSON.parse(cartJson) : [];
};

export const saveCart = (cart: CartItem[]) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const addToCart = (productId: string, quantity: number = 1) => {
  const cart = getCart();
  const existingItem = cart.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  saveCart(cart);
};

export const updateCartItemQuantity = (productId: string, quantity: number) => {
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter(item => item.productId !== productId);
  } else {
    const item = cart.find(item => item.productId === productId);
    if (item) {
      item.quantity = quantity;
    }
  }
  saveCart(cart);
};

export const removeFromCart = (productId: string) => {
  const cart = getCart().filter(item => item.productId !== productId);
  saveCart(cart);
};

export const clearCart = () => {
  saveCart([]);
};

// --- Notification System ---

export const getNotifications = (): Notification[] => {
  const notificationsJson = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!notificationsJson) return [];
  try {
    return JSON.parse(notificationsJson);
  } catch (e) {
    console.error(`Error parsing ${NOTIFICATIONS_KEY} from localStorage:`, e);
    return [];
  }
};

export const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const createNotification = (notificationData: Omit<Notification, 'id' | 'isRead'>) => {
  if (notificationData.recipientId === notificationData.actorId) {
    return;
  }
  const notifications = getNotifications();
  const newNotification: Notification = {
    ...notificationData,
    id: `notif-${Date.now()}-${Math.random()}`,
    isRead: false,
  };
  saveNotifications([newNotification, ...notifications]);
};

export const getNotificationsForUser = (userId: string): Notification[] => {
  return getNotifications().filter(n => n.recipientId === userId);
};

export const markNotificationsAsRead = (userId: string) => {
  let notifications = getNotifications();
  notifications.forEach(n => {
    if (n.recipientId === userId && !n.isRead) {
      n.isRead = true;
    }
  });
  saveNotifications(notifications);
};

// --- Existing localStorage functions ---

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getUsers = (): User[] => {
  const usersJson = localStorage.getItem(USERS_KEY);
  if (!usersJson) {
    return [];
  }
  try {
    return JSON.parse(usersJson);
  } catch (e) {
    console.error(`Error parsing ${USERS_KEY} from localStorage:`, e);
    return [];
  }
};

export const savePosts = (posts: Post[]) => {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
};

export const getPosts = (): Post[] => {
  const postsJson = localStorage.getItem(POSTS_KEY);
  if (!postsJson) {
    return [];
  }
  try {
    return JSON.parse(postsJson);
  } catch (e) {
    console.error(`Error parsing ${POSTS_KEY} from localStorage:`, e);
    return [];
  }
};

export const deletePost = (postId: string) => {
  let posts = getPosts();
  posts = posts.filter(post => post.id !== postId);
  savePosts(posts);
};

// NEW: Pin/Unpin Post functionality
export const pinPost = (postId: string, userId: string) => {
  let posts = getPosts();
  let userPosts = posts.filter(p => p.userId === userId);

  // Unpin all other posts by this user
  userPosts.forEach(p => {
    if (p.id !== postId && p.isPinned) {
      p.isPinned = false;
    }
  });

  // Find and pin the target post
  const targetPost = userPosts.find(p => p.id === postId);
  if (targetPost) {
    targetPost.isPinned = true;
    // Merge updated userPosts back into all posts
    posts = posts.map(p => {
      const updatedUserPost = userPosts.find(up => up.id === p.id);
      return updatedUserPost ? updatedUserPost : p;
    });
    savePosts(posts);
    return true;
  }
  return false;
};

export const unpinPost = (postId: string, userId: string) => {
  let posts = getPosts();
  const targetPost = posts.find(p => p.id === postId && p.userId === userId);
  if (targetPost) {
    targetPost.isPinned = false;
    savePosts(posts);
    return true;
  }
  return false;
};


export const saveChats = (chats: ChatConversation[]) => {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
};

export const getChats = (): ChatConversation[] => {
  const chatsJson = localStorage.getItem(CHATS_KEY);
  if (!chatsJson) {
    return [];
  }
  try {
    return JSON.parse(chatsJson);
  } catch (e) {
    console.error(`Error parsing ${CHATS_KEY} from localStorage:`, e);
    return [];
  }
};

export const saveAds = (ads: AdCampaign[]) => {
  localStorage.setItem(ADS_KEY, JSON.stringify(ads));
};

export const getAds = (): AdCampaign[] => {
  const adsJson = localStorage.getItem(ADS_KEY);
  if (!adsJson) {
    return [];
  }
  try {
    return JSON.parse(adsJson);
  } catch (e) {
    console.error(`Error parsing ${ADS_KEY} from localStorage:`, e);
    return [];
  }
};

// New: Stores
export const saveStores = (stores: Store[]) => {
  localStorage.setItem(STORES_KEY, JSON.stringify(stores));
};

export const getStores = (): Store[] => {
  const storesJson = localStorage.getItem(STORES_KEY);
  if (!storesJson) {
    return [];
  }
  try {
    return JSON.parse(storesJson);
  }
  catch (e) {
    console.error(`Error parsing ${STORES_KEY} from localStorage:`, e);
    return [];
  }
};

export const findStoreById = (storeId: string): Store | undefined => {
  const stores = getStores();
  return stores.find(s => s.id === storeId);
};

export const updateStore = (updatedStore: Store) => {
  let stores = getStores();
  stores = stores.map(store => store.id === updatedStore.id ? updatedStore : store);
  saveStores(stores);
};

// New: Products
export const saveProducts = (products: Product[]) => {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const getProducts = (): Product[] => {
  const productsJson = localStorage.getItem(PRODUCTS_KEY);
  if (!productsJson) {
    return [];
  }
  try {
    return JSON.parse(productsJson);
  } catch (e) {
    console.error(`Error parsing ${PRODUCTS_KEY} from localStorage:`, e);
    return [];
  }
};

export const findProductById = (productId: string): Product | undefined => {
  const products = getProducts();
  return products.find(p => p.id === productId);
};

export const updateProduct = (updatedProduct: Product) => {
  let products = getProducts();
  products = products.map(product => product.id === updatedProduct.id ? updatedProduct : product);
  saveProducts(products);
};

// New: Affiliate Sales
export const saveAffiliateSales = (sales: AffiliateSale[]) => {
  localStorage.setItem(AFFILIATE_SALES_KEY, JSON.stringify(sales));
};

export const getAffiliateSales = (): AffiliateSale[] => {
  const salesJson = localStorage.getItem(AFFILIATE_SALES_KEY);
  if (!salesJson) {
    return [];
  }
  try {
    return JSON.parse(salesJson);
  } catch (e) {
    console.error(`Error parsing ${AFFILIATE_SALES_KEY} from localStorage:`, e);
    return [];
  }
};

export const getSalesByAffiliateId = (affiliateUserId: string): AffiliateSale[] => {
  return getAffiliateSales().filter(sale => sale.affiliateUserId === affiliateUserId);
};

export const getSalesByStoreId = (storeId: string): AffiliateSale[] => {
  return getAffiliateSales().filter(sale => sale.storeId === storeId);
};

// New: Audio Tracks
export const getAudioTracks = (): AudioTrack[] => {
  const tracksJson = localStorage.getItem(AUDIO_TRACKS_KEY);
  if (!tracksJson) {
    return [];
  }
  try {
    return JSON.parse(tracksJson);
  } catch (e) {
    console.error(`Error parsing ${AUDIO_TRACKS_KEY} from localStorage:`, e);
    return [];
  }
};

export const findAudioTrackById = (id: string): AudioTrack | undefined => {
  const tracks = getAudioTracks();
  return tracks.find(t => t.id === id);
};

export const saveCurrentUser = (userId: string | null) => {
  if (userId) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem(CURRENT_USER_KEY);
};

export const findUserById = (userId: string): User | undefined => {
  const users = getUsers();
  return users.find(u => u.id === userId);
};

export const updateUser = (updatedUser: User) => {
  let users = getUsers();
  users = users.map(user => user.id === updatedUser.id ? updatedUser : user);
  saveUsers(users);
};

// Update user balance - now handles negative for withdrawals.
export const updateUserBalance = (userId: string, amount: number) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.balance = (user.balance || 0) + amount;
    saveUsers(users);
    return true;
  }
  return false;
};

// --- Product Rating System ---

export const addProductRating = (saleId: string, rating: number, comment: string) => {
  const sales = getAffiliateSales();
  const products = getProducts();
  
  const sale = sales.find(s => s.id === saleId);
  if (!sale || sale.isRated) {
    console.error("Sale not found or already rated.");
    return false;
  }

  const product = products.find(p => p.id === sale.productId);
  if (!product) {
    console.error("Product not found for rating.");
    return false;
  }
  
  // 1. Mark sale as rated
  sale.isRated = true;

  // 2. Create and add new rating to product
  const newRating: ProductRating = {
    id: `rating-${Date.now()}`,
    saleId: sale.id,
    userId: sale.buyerId,
    rating,
    comment,
    timestamp: Date.now(),
  };
  product.ratings.push(newRating);

  // 3. Recalculate average rating and count
  product.ratingCount = product.ratings.length;
  const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
  product.averageRating = totalRating / product.ratingCount;

  // 4. Save updated data
  saveAffiliateSales(sales);
  saveProducts(products);
  return true;
};

// New: Processes a product purchase with affiliate commission
export const processProductPurchase = (
  cartItems: CartItem[],
  buyerId: string,
  affiliateUserId: string | null, // Null if no affiliate
  shippingAddress?: ShippingAddress, // NEW: Shipping address for the purchase (now optional)
) => {
  let users = getUsers();
  const allSales = getAffiliateSales();

  for (const item of cartItems) {
    const product = findProductById(item.productId);
    if (!product) continue;
    const store = findStoreById(product.storeId);
    if (!store) continue;

    const productOwner = users.find(u => u.id === store.professorId);
    if (!productOwner) continue;

    const itemTotal = product.price * item.quantity;
    const netRevenue = itemTotal * (1 - product.affiliateCommissionRate);
    productOwner.balance = (productOwner.balance || 0) + netRevenue;

    let commissionEarned = 0;
    if (affiliateUserId) {
      const affiliate = users.find(u => u.id === affiliateUserId);
      if (affiliate) {
        commissionEarned = itemTotal * product.affiliateCommissionRate;
        affiliate.balance = (affiliate.balance || 0) + commissionEarned;
        createNotification({
          type: NotificationType.AFFILIATE_SALE,
          recipientId: affiliate.id,
          actorId: buyerId,
          timestamp: Date.now(),
          saleId: `sale-${Date.now()}`
        });
      }
    }
    
    const newSale: AffiliateSale = {
      id: `sale-${Date.now()}-${item.productId}`,
      productId: item.productId,
      buyerId,
      affiliateUserId: affiliateUserId || '',
      storeId: product.storeId,
      commissionEarned,
      saleAmount: itemTotal,
      timestamp: Date.now(),
      isRated: false, // NEW: Initialize as not rated
      ...(product.type === ProductType.PHYSICAL && { shippingAddress }),
      ...(product.type !== ProductType.PHYSICAL && {
        digitalContentUrl: product.digitalContentUrl,
        digitalDownloadInstructions: product.digitalDownloadInstructions,
      }),
    };
    allSales.push(newSale);
  }

  saveUsers(users);
  saveAffiliateSales(allSales);
  clearCart();
  return true;
};

// New: Post interaction functions
export const updatePost = (updatedPost: Post) => {
  let posts = getPosts();
  posts = posts.map(post => post.id === updatedPost.id ? updatedPost : post);
  savePosts(posts);
};

export const updatePostLikes = (postId: string, userId: string) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    const hasLiked = post.likes.includes(userId);
    if (hasLiked) {
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      post.likes.push(userId);
      createNotification({
        type: NotificationType.LIKE,
        recipientId: post.userId,
        actorId: userId,
        postId: post.id,
        timestamp: Date.now(),
      });
    }
    updatePost(post);
    return post.likes;
  }
  return [];
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
      postId: post.id,
      timestamp: Date.now(),
    });
    updatePost(post);
    return post.comments;
  }
  return [];
};

export const updatePostShares = (postId: string, userId: string) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    const hasShared = post.shares.includes(userId);
    if (!hasShared) { // Only add if not already shared by this user
      post.shares.push(userId);
    }
    updatePost(post);
    return post.shares.length;
  }
  return 0;
};

export const updatePostSaves = (postId: string, userId: string) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    const hasSaved = post.saves.includes(userId);
    if (hasSaved) {
      post.saves = post.saves.filter(id => id !== userId);
    } else {
      post.saves.push(userId);
    }
    updatePost(post);
    return post.saves;
  }
  return [];
};

// NEW: Function to update post reactions
export const updatePostReactions = (postId: string, userId: string, emoji: string) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);

  if (post) {
    // Ensure reactions object exists
    if (!post.reactions) {
      post.reactions = {};
    }

    const currentEmojiUsers = post.reactions[emoji] || [];
    let newEmojiUsers: string[];

    if (currentEmojiUsers.includes(userId)) {
      // User already reacted with this emoji, remove reaction
      newEmojiUsers = currentEmojiUsers.filter(id => id !== userId);
    } else {
      // User wants to react, add reaction
      newEmojiUsers = [...currentEmojiUsers, userId];
      createNotification({
        type: NotificationType.REACTION,
        recipientId: post.userId,
        actorId: userId,
        postId: post.id,
        timestamp: Date.now(),
      });
    }

    if (newEmojiUsers.length === 0) {
      // If no one is reacting with this emoji anymore, remove the emoji entry
      delete post.reactions[emoji];
    } else {
      post.reactions[emoji] = newEmojiUsers;
    }

    updatePost(post); // Save the updated post
  }
};

// NEW: Toggle follow user
export const toggleFollowUser = (currentUserId: string, userIdToFollow: string) => {
  let allUsers = getUsers();
  const currentUser = allUsers.find(u => u.id === currentUserId);
  const userToFollow = allUsers.find(u => u.id === userIdToFollow);

  if (currentUser && userToFollow) {
    const isFollowing = currentUser.followedUsers.includes(userIdToFollow);
    if (isFollowing) {
      currentUser.followedUsers = currentUser.followedUsers.filter(id => id !== userIdToFollow);
    } else {
      currentUser.followedUsers.push(userIdToFollow);
      createNotification({
        type: NotificationType.NEW_FOLLOWER,
        recipientId: userIdToFollow,
        actorId: currentUserId,
        timestamp: Date.now(),
      });
    }
    saveUsers(allUsers);
  }
};
