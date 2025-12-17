
import { User, Post, ChatConversation, AdCampaign, UserType, Store, Product, AffiliateSale, Comment, ShippingAddress, ProductType, Notification, NotificationType, AudioTrack, CartItem, ProductRating, Transaction, TransactionType, PaymentCard } from '../types';
import { DEFAULT_USERS, DEFAULT_POSTS, DEFAULT_ADS, DEFAULT_STORES, DEFAULT_PRODUCTS, DEFAULT_AFFILIATE_SALES, DEFAULT_AUDIO_TRACKS } from '../constants';

const USERS_KEY = 'cyberphone_users';
const POSTS_KEY = 'cyberphone_posts';
const CHATS_KEY = 'cyberphone_chats';
const ADS_KEY = 'cyberphone_ads';
const CURRENT_USER_KEY = 'cyberphone_current_user_id';
const STORES_KEY = 'cyberphone_stores';
const PRODUCTS_KEY = 'cyberphone_products';
const AFFILIATE_SALES_KEY = 'cyberphone_affiliate_sales';
const NOTIFICATIONS_KEY = 'cyberphone_notifications';
const AUDIO_TRACKS_KEY = 'cyberphone_audio_tracks';
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
  if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(AUDIO_TRACKS_KEY)) {
    localStorage.setItem(AUDIO_TRACKS_KEY, JSON.stringify(DEFAULT_AUDIO_TRACKS));
  }
  if (!localStorage.getItem(CART_KEY)) {
    localStorage.setItem(CART_KEY, JSON.stringify([]));
  }
};

initializeData();

// --- Auth Mock ---
export const loginUser = async (email: string, password: string): Promise<User> => {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (user && password === 'password') return user;
  throw new Error('Credenciais inválidas.');
};

// --- Cart ---
export const getCart = (): CartItem[] => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
export const saveCart = (cart: CartItem[]) => localStorage.setItem(CART_KEY, JSON.stringify(cart));
export const addToCart = (productId: string, quantity: number = 1) => {
  const cart = getCart();
  const existing = cart.find(i => i.productId === productId);
  if (existing) existing.quantity += quantity;
  else cart.push({ productId, quantity });
  saveCart(cart);
};
export const updateCartItemQuantity = (productId: string, quantity: number) => {
  let cart = getCart();
  if (quantity <= 0) cart = cart.filter(i => i.productId !== productId);
  else {
    const item = cart.find(i => i.productId === productId);
    if (item) item.quantity = quantity;
  }
  saveCart(cart);
};
export const removeFromCart = (productId: string) => {
  const cart = getCart().filter(i => i.productId !== productId);
  saveCart(cart);
};
export const clearCart = () => saveCart([]);

// --- Users ---
export const getUsers = (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
export const saveUsers = (users: User[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
export const findUserById = (id: string) => getUsers().find(u => u.id === id);
export const saveCurrentUser = (id: string | null) => id ? localStorage.setItem(CURRENT_USER_KEY, id) : localStorage.removeItem(CURRENT_USER_KEY);
export const getCurrentUserId = () => localStorage.getItem(CURRENT_USER_KEY);

export const updateUser = (updated: User) => {
  const users = getUsers();
  saveUsers(users.map(u => u.id === updated.id ? updated : u));
};

export const updateUserBalance = (userId: string, amount: number, description: string = 'Movimentação de saldo') => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.balance = (user.balance || 0) + amount;
    const transaction: Transaction = {
      id: `trx-${Date.now()}`,
      amount: Math.abs(amount),
      description,
      type: amount >= 0 ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL,
      timestamp: Date.now()
    };
    user.transactions = [transaction, ...(user.transactions || [])];
    saveUsers(users);
    return true;
  }
  return false;
};

export const requestDebitCard = (userId: string, card: PaymentCard) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.card = card;
    saveUsers(users);
    return true;
  }
  return false;
};

// --- Posts ---
export const getPosts = (): Post[] => JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
export const savePosts = (posts: Post[]) => localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
export const deletePost = (id: string) => savePosts(getPosts().filter(p => p.id !== id));
export const updatePost = (updated: Post) => savePosts(getPosts().map(p => p.id === updated.id ? updated : p));

export const reportPost = (postId: string, userId: string) => {
  console.log(`Post ${postId} denunciado pelo usuário ${userId}`);
  // Lógica de moderação simulada
  return true;
};

// --- Outros ---
export const getStores = (): Store[] => JSON.parse(localStorage.getItem(STORES_KEY) || '[]');
export const saveStores = (stores: Store[]) => localStorage.setItem(STORES_KEY, JSON.stringify(stores));
export const findStoreById = (id: string) => getStores().find(s => s.id === id);
export const updateStore = (updated: Store) => {
  const stores = getStores();
  saveStores(stores.map(s => s.id === updated.id ? updated : s));
};

export const getProducts = (): Product[] => JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
export const saveProducts = (products: Product[]) => localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
export const findProductById = (id: string) => getProducts().find(p => p.id === id);

export const addProductRating = (saleId: string, rating: number, comment: string) => {
  const sales = getAffiliateSales();
  const products = getProducts();
  const sale = sales.find(s => s.id === saleId);
  if (!sale || sale.isRated) return false;
  const product = products.find(p => p.id === sale.productId);
  if (!product) return false;
  sale.isRated = true;
  const newRating: ProductRating = { id: `rating-${Date.now()}`, saleId, userId: sale.buyerId, rating, comment, timestamp: Date.now() };
  product.ratings.push(newRating);
  product.ratingCount = product.ratings.length;
  product.averageRating = product.ratings.reduce((s, r) => s + r.rating, 0) / product.ratingCount;
  saveAffiliateSales(sales);
  saveProducts(products);
  return true;
};

export const getAffiliateSales = (): AffiliateSale[] => JSON.parse(localStorage.getItem(AFFILIATE_SALES_KEY) || '[]');
export const saveAffiliateSales = (sales: AffiliateSale[]) => localStorage.setItem(AFFILIATE_SALES_KEY, JSON.stringify(sales));
export const getSalesByAffiliateId = (id: string) => getAffiliateSales().filter(s => s.affiliateUserId === id);
export const getSalesByStoreId = (id: string) => getAffiliateSales().filter(s => s.storeId === id);

export const getAds = (): AdCampaign[] => JSON.parse(localStorage.getItem(ADS_KEY) || '[]');
export const saveAds = (ads: AdCampaign[]) => localStorage.setItem(ADS_KEY, JSON.stringify(ads));

export const getNotificationsForUser = (userId: string): Notification[] => JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]').filter((n: any) => n.recipientId === userId);
export const markNotificationsAsRead = (userId: string) => {
  const all = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  all.forEach((n: any) => { if(n.recipientId === userId) n.isRead = true; });
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
};
export const createNotification = (data: Omit<Notification, 'id' | 'isRead'>) => {
  if (data.recipientId === data.actorId) return;
  const all = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  all.push({ ...data, id: `notif-${Date.now()}`, isRead: false });
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
};

export const getAudioTracks = (): AudioTrack[] => JSON.parse(localStorage.getItem(AUDIO_TRACKS_KEY) || '[]');
export const findAudioTrackById = (id: string) => getAudioTracks().find(t => t.id === id);
export const getChats = (): ChatConversation[] => JSON.parse(localStorage.getItem(CHATS_KEY) || '[]');
export const saveChats = (chats: ChatConversation[]) => localStorage.setItem(CHATS_KEY, JSON.stringify(chats));

export const pinPost = (postId: string, userId: string) => {
  const posts = getPosts();
  posts.forEach(p => { if(p.userId === userId) p.isPinned = (p.id === postId); });
  savePosts(posts);
};

// Fix: Add optional userId to unpinPost to fix type error in components that pass two arguments
export const unpinPost = (postId: string, userId?: string) => {
  const posts = getPosts();
  const p = posts.find(x => x.id === postId && (!userId || x.userId === userId));
  if(p) p.isPinned = false;
  savePosts(posts);
};

export const toggleFollowUser = (currentId: string, targetId: string) => {
  const users = getUsers();
  const curr = users.find(u => u.id === currentId);
  if (curr) {
    const idx = curr.followedUsers.indexOf(targetId);
    if (idx > -1) curr.followedUsers.splice(idx, 1);
    else {
      curr.followedUsers.push(targetId);
      createNotification({ type: NotificationType.NEW_FOLLOWER, recipientId: targetId, actorId: currentId, timestamp: Date.now() });
    }
    saveUsers(users);
  }
};

export const updatePostLikes = (postId: string, userId: string) => {
  const posts = getPosts();
  const p = posts.find(x => x.id === postId);
  if (p) {
    const idx = p.likes.indexOf(userId);
    if (idx > -1) p.likes.splice(idx, 1);
    else {
      p.likes.push(userId);
      createNotification({ type: NotificationType.LIKE, recipientId: p.userId, actorId: userId, postId, timestamp: Date.now() });
    }
    updatePost(p);
  }
};

export const updatePostReactions = (postId: string, userId: string, emoji: string) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    if (!post.reactions) post.reactions = {};
    const users = post.reactions[emoji] || [];
    if (users.includes(userId)) {
      post.reactions[emoji] = users.filter(id => id !== userId);
      if (post.reactions[emoji].length === 0) delete post.reactions[emoji];
    } else {
      post.reactions[emoji] = [...users, userId];
      createNotification({ type: NotificationType.REACTION, recipientId: post.userId, actorId: userId, postId, timestamp: Date.now() });
    }
    updatePost(post);
  }
};

export const addPostComment = (postId: string, comment: Comment) => {
  const posts = getPosts();
  const p = posts.find(x => x.id === postId);
  if (p) {
    p.comments.push(comment);
    createNotification({ type: NotificationType.COMMENT, recipientId: p.userId, actorId: comment.userId, postId, timestamp: Date.now() });
    updatePost(p);
  }
};

export const updatePostShares = (postId: string, userId: string) => {
  const posts = getPosts();
  const p = posts.find(x => x.id === postId);
  if (p && !p.shares.includes(userId)) {
    p.shares.push(userId);
    updatePost(p);
  }
};

export const updatePostSaves = (postId: string, userId: string) => {
  const posts = getPosts();
  const p = posts.find(x => x.id === postId);
  if (p) {
    const idx = p.saves.indexOf(userId);
    if (idx > -1) p.saves.splice(idx, 1);
    else p.saves.push(userId);
    updatePost(p);
  }
};

export const processProductPurchase = (items: CartItem[], buyerId: string, affId: string | null, addr?: ShippingAddress) => {
  const users = getUsers();
  const buyer = users.find(u => u.id === buyerId);
  if(!buyer) return false;

  const prods = getProducts();
  const sales = getAffiliateSales();

  items.forEach(item => {
    const p = prods.find(x => x.id === item.productId);
    if(!p) return;
    const total = p.price * item.quantity;
    
    // Simulação básica de fluxo financeiro
    updateUserBalance(buyerId, -total, `Compra de ${p.name}`);
    
    const sale: AffiliateSale = {
      id: `sale-${Date.now()}`,
      productId: p.id,
      buyerId,
      affiliateUserId: affId || '',
      storeId: p.storeId,
      saleAmount: total,
      commissionEarned: total * p.affiliateCommissionRate,
      timestamp: Date.now(),
      isRated: false,
      shippingAddress: addr
    };
    sales.push(sale);

    if (affId) {
      updateUserBalance(affId, sale.commissionEarned, `Comissão de venda: ${p.name}`);
      createNotification({ type: NotificationType.AFFILIATE_SALE, recipientId: affId, actorId: buyerId, saleId: sale.id, timestamp: Date.now() });
    }
  });

  saveAffiliateSales(sales);
  return true;
};
