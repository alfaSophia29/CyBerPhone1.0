
import { UserType, PostType, Store, Product, AffiliateSale, ProductType, AudioTrack, Post, Story } from './types';

export const GEMINI_MODEL = 'gemini-3-pro-preview';
export const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

// REGRAS DE UPGRADE
export const CREATOR_UPGRADE_FOLLOWERS_GOAL = 2000;
export const CREATOR_UPGRADE_COST_USD = 50.00;

export const MIN_WITHDRAWAL_USD = 100;
export const KZT_TO_USD_RATE = 500;
export const MIN_WITHDRAWAL_KZT = 50000;

export const MIN_AI_FILTER_KZT_COST = 50; 
export const MIN_AI_FILTER_USD_COST = MIN_AI_FILTER_KZT_COST / KZT_TO_USD_RATE;

export const MIN_AD_CAMPAIGN_KZT_COST = 100; 
export const MIN_AD_CAMPAIGN_USD_COST = MIN_AD_CAMPAIGN_KZT_COST / KZT_TO_USD_RATE;


export const DEFAULT_PROFILE_PIC = 'https://picsum.photos/100/100?grayscale';

export const DEFAULT_AUDIO_TRACKS: AudioTrack[] = [
  { id: 'audio1', title: 'Upbeat Funk', artist: 'GrooveMaster', url: 'https://cdn.pixabay.com/audio/2023/04/23/audio_87b3225287.mp3' },
  { id: 'audio2', title: 'Chill Lo-fi', artist: 'BeatScaper', url: 'https://cdn.pixabay.com/audio/2024/05/08/audio_291071a938.mp3' },
  { id: 'audio3', title: 'Epic Cinematic', artist: 'OrchestraX', url: 'https://cdn.pixabay.com/audio/2023/09/25/audio_2894a4c0a5.mp3' },
  { id: 'audio4', title: 'Acoustic Guitar', artist: 'Strummer', url: 'https://cdn.pixabay.com/audio/2022/08/03/audio_54b383134e.mp3' },
  { id: 'audio5', title: 'Tropical House', artist: 'DJ Sunny', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_14c81d3222.mp3' },
];


export const DEFAULT_USERS = [
  {
    id: 'creator1',
    userType: UserType.CREATOR,
    firstName: 'Ana',
    lastName: 'Silva',
    email: 'ana.silva@cyberphone.com',
    phone: '11987654321',
    documentId: '12345678901',
    profilePicture: 'https://picsum.photos/100/100?random=1',
    followedUsers: [],
    followers: ['standard1', 'standard2'],
    balance: 150.75,
    credentials: 'Doutora em Física, Criadora de Conteúdo Educacional.',
    bio: 'Sou apaixonada por desvendar os mistérios do universo e tornar a física acessível a todos, criando conteúdo inspirador.',
    storeId: 'store1',
  },
  {
    id: 'standard1',
    userType: UserType.STANDARD,
    firstName: 'Carlos',
    lastName: 'Gomes',
    email: 'carlos.gomes@cyberphone.com',
    phone: '21912345678',
    documentId: '98765432109',
    profilePicture: 'https://picsum.photos/100/100?random=2',
    followedUsers: ['creator1'],
    followers: [],
    balance: 100.50,
  },
  {
    id: 'creator2',
    userType: UserType.CREATOR,
    firstName: 'João',
    lastName: 'Costa',
    email: 'joao.costa@cyberphone.com',
    phone: '31923456789',
    documentId: '10987654321',
    profilePicture: 'https://picsum.photos/100/100?random=3',
    followedUsers: [],
    followers: [],
    balance: 75.00,
    credentials: 'Mestre em Matemática, Especialista em Cálculo Avançado.',
    bio: 'Ajudo estudantes a superar desafios em matemática com métodos práticos e divertidos através de conteúdo online.',
    storeId: 'store2',
  },
  {
    id: 'standard2',
    userType: UserType.STANDARD,
    firstName: 'Beatriz',
    lastName: 'Lima',
    email: 'beatriz.lima@cyberphone.com',
    phone: '41934567890',
    documentId: '54321098765',
    profilePicture: 'https://picsum.photos/100/100?random=4',
    followedUsers: ['creator1'],
    followers: [],
    balance: 25.00,
  },
];

export const DEFAULT_STORIES: Story[] = [
  {
    userId: 'creator1',
    userName: 'Ana Silva',
    userProfilePic: 'https://picsum.photos/100/100?random=1',
    items: [
      { id: 's1', imageUrl: 'https://picsum.photos/400/800?random=10', timestamp: Date.now() },
      { id: 's2', imageUrl: 'https://picsum.photos/400/800?random=11', timestamp: Date.now() },
    ]
  },
  {
    userId: 'creator2',
    userName: 'João Costa',
    userProfilePic: 'https://picsum.photos/100/100?random=3',
    items: [
      { id: 's3', imageUrl: 'https://picsum.photos/400/800?random=12', timestamp: Date.now() },
    ]
  },
  {
    userId: 'standard1',
    userName: 'Carlos Gomes',
    userProfilePic: 'https://picsum.photos/100/100?random=2',
    items: [
      { id: 's4', imageUrl: 'https://picsum.photos/400/800?random=13', timestamp: Date.now() },
    ]
  }
];

export const DEFAULT_POSTS: Post[] = [
  {
    id: 'post1',
    userId: 'creator1',
    authorName: 'Ana Silva',
    authorProfilePic: 'https://picsum.photos/100/100?random=1',
    type: PostType.TEXT,
    timestamp: Date.now() - 3600000,
    content: 'Olá a todos! Animada para compartilhar novas descobertas sobre buracos negros esta semana. Fiquem ligados!',
    likes: [], comments: [], shares: [], saves: [],
    indicatedUserIds: [],
  },
  {
    id: 'post-live-1',
    userId: 'creator1',
    authorName: 'Ana Silva',
    authorProfilePic: 'https://picsum.photos/100/100?random=1',
    type: PostType.LIVE,
    timestamp: Date.now() - 100000,
    liveStream: {
      title: 'Workshop de Astrofísica',
      description: 'Falando sobre as leis de Newton ao vivo!',
      isPaid: false
    },
    likes: [], comments: [], shares: [], saves: [],
    indicatedUserIds: [],
  },
  {
    id: 'post2',
    userId: 'creator2',
    authorName: 'João Costa',
    authorProfilePic: 'https://picsum.photos/100/100?random=3',
    type: PostType.IMAGE,
    timestamp: Date.now() - 7200000,
    content: 'Um gráfico interessante sobre a distribuição de números primos. Desafiador, não?',
    imageUrl: 'https://picsum.photos/600/400?random=5',
    likes: ['standard1'],
    comments: [{
      id: 'comment1-post2',
      userId: 'standard1',
      userName: 'Carlos Gomes',
      profilePic: 'https://picsum.photos/100/100?random=2',
      text: 'Muito bom! Adorei a explicação.',
      timestamp: Date.now() - 7100000,
    }],
    shares: [], saves: [],
    indicatedUserIds: [],
  },
  {
    id: 'reel-1',
    userId: 'creator1',
    authorName: 'Ana Silva',
    authorProfilePic: 'https://picsum.photos/100/100?random=1',
    type: PostType.REEL,
    timestamp: Date.now() - 500000,
    likes: ['standard1', 'standard2', 'creator2'],
    comments: [],
    shares: ['standard1'],
    saves: ['standard2'],
    reel: {
      title: 'A Física do Café',
      description: 'Você já parou para pensar por que o café esfria mais rápido se você mexer com a colher? ☕ #física #curiosidades #educação',
      videoUrl: 'https://player.vimeo.com/external/370331493.sd.mp4?s=7b0cd5fa36780c05877f6b951478f7e27142b9c7&profile_id=139&oauth2_token_id=57447761',
      audioTrackId: 'audio1'
    },
    indicatedUserIds: [],
  },
];

export const DEFAULT_ADS = [
  {
    id: 'ad1',
    professorId: 'creator1',
    title: 'Workshop Intensivo de Astrofísica',
    description: 'Aprenda sobre buracos negros, galáxias e a origem do universo em nosso workshop exclusivo!',
    targetAudience: 'Estudantes de ensino médio e superior, entusiastas de ciência.',
    budget: 500,
    isActive: true,
    imageUrl: 'https://picsum.photos/600/300?random=6',
    linkUrl: 'https://exemplo.com/workshop-astrofisica',
    timestamp: Date.now() - 20000000,
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod1',
    storeId: 'store1',
    name: 'E-book: Fundamentos da Relatividade',
    description: 'Um guia completo para entender a teoria da relatividade de Einstein, com exercícios e explicações detalhadas.',
    price: 29.99,
    imageUrls: ['https://picsum.photos/300/200?random=ebook1'],
    affiliateCommissionRate: 0.15,
    type: ProductType.DIGITAL_EBOOK,
    ratings: [],
    averageRating: 0,
    ratingCount: 0,
  },
];

export const DEFAULT_STORES: Store[] = [
  {
    id: 'store1',
    professorId: 'creator1',
    name: 'Física Descomplicada por Ana',
    description: 'Sua loja de materiais didáticos e kits de física para um aprendizado divertido e eficaz.',
    productIds: ['prod1', 'prod2'],
  },
];

export const DEFAULT_AFFILIATE_SALES: AffiliateSale[] = [];
