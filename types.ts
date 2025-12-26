
export enum UserType {
  STANDARD = 'STANDARD',
  CREATOR = 'CREATOR',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  UPGRADE = 'UPGRADE'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  timestamp: number;
}

export interface PaymentCard {
  cardNumber: string;
  holderName: string;
  expiryDate: string;
  cvv: string;
  type: 'DEBIT' | 'CREDIT';
}

export interface User {
  id: string;
  userType: UserType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentId: string;
  profilePicture?: string;
  followedUsers: string[]; 
  followers: string[];     
  profileIndicatedTo?: string[];
  balance?: number;
  credentials?: string;
  bio?: string;
  verificationFileUrl?: string; // Novo campo para comprovante PDF
  storeId?: string;
  transactions?: Transaction[];
  card?: PaymentCard;
}

export enum PostType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  LIVE = 'LIVE',
  REEL = 'REEL',
}

export interface LiveStreamDetails {
  title: string;
  description: string;
  isPaid: boolean;
  price?: number;
  paymentLink?: string;
  paymentQRCode?: string;
  streamUrl?: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
}

export interface ReelDetails {
  title: string;
  description: string;
  videoUrl: string;
  audioTrackId?: string;
  aiEffectPrompt?: string;
}

export interface StoryItem {
  id: string;
  imageUrl: string;
  timestamp: number;
}

export interface Story {
  userId: string;
  userName: string;
  userProfilePic: string;
  items: StoryItem[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  profilePic?: string;
  text: string;
  timestamp: number;
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorProfilePic?: string;
  type: PostType;
  timestamp: number;
  scheduledAt?: number;
  content?: string;
  imageUrl?: string;
  liveStream?: LiveStreamDetails;
  reel?: ReelDetails;
  likes: string[];
  comments: Comment[];
  shares: string[];
  saves: string[];
  indicatedUserIds: string[]; 
  isPinned?: boolean;
  reactions?: Record<string, string[]>;
}

export interface CyberEvent {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  dateTime: number;
  endDateTime?: number;
  location: string;
  type: 'ONLINE' | 'PRESENTIAL';
  isPublic: boolean;
  attendees: string[];
  imageUrl?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  timestamp: number;
  text: string;
  imageUrl?: string;
  reactions?: Record<string, string[]>;
}

export interface ChatConversation {
  id: string;
  participants: [string, string];
  messages: Message[];
}

export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL_COURSE = 'DIGITAL_COURSE',
  DIGITAL_EBOOK = 'DIGITAL_EBOOK',
  DIGITAL_OTHER = 'DIGITAL_OTHER',
}

export enum OrderStatus {
  WAITLIST = 'WAITLIST',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
}

export interface ProductRating {
  id: string;
  saleId: string;
  userId: string;
  rating: number;
  comment?: string;
  timestamp: number;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  affiliateCommissionRate: number;
  type: ProductType;
  digitalContentUrl?: string;
  digitalDownloadInstructions?: string;
  ratings: ProductRating[];
  averageRating: number;
  ratingCount: number;
  affiliateLink?: string;
  colors?: string[];
}

export interface Store {
  id: string;
  professorId: string;
  name: string;
  description: string;
  productIds: string[];
}

export interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface AffiliateSale {
  id: string;
  productId: string;
  buyerId: string;
  affiliateUserId: string;
  storeId: string;
  commissionEarned: number;
  saleAmount: number;
  timestamp: number;
  shippingAddress?: ShippingAddress;
  digitalContentUrl?: string;
  digitalDownloadInstructions?: string;
  isRated?: boolean;
  status: OrderStatus;
  selectedColor?: string;
}

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  AFFILIATE_SALE = 'AFFILIATE_SALE',
  REACTION = 'REACTION',
  POST_INDICATION = 'POST_INDICATION',
  PROFILE_RECOMMENDATION = 'PROFILE_RECOMMENDATION'
}

export interface AdLocation {
  country: string;
  province?: string;
  city?: string;
}

export interface AdCampaign {
  id: string;
  professorId: string;
  title: string;
  description: string;
  targetAudience: string;
  locations?: AdLocation[];
  budget: number;
  isActive: boolean;
  imageUrl?: string;
  linkUrl?: string;
  ctaText?: string;
  placements?: string[];
  timestamp: number;
}

export interface Notification {
  id: string;
  type: NotificationType | string;
  recipientId: string;
  actorId: string;
  postId?: string;
  saleId?: string;
  timestamp: number;
  isRead: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedColor?: string;
}
