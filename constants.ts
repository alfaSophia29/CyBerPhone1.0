

import { UserType, PostType, Store, Product, AffiliateSale, ProductType, AudioTrack } from './types';

export const GEMINI_MODEL = 'gemini-3-pro-preview';
export const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

export const MIN_WITHDRAWAL_USD = 100;
export const KZT_TO_USD_RATE = 500; // 1 USD = 500 KZT
export const MIN_WITHDRAWAL_KZT = 50000; // 50,000 KZT = 100 USD

export const MIN_AI_FILTER_KZT_COST = 50; // Minimum cost for AI filter in KZT
export const MIN_AI_FILTER_USD_COST = MIN_AI_FILTER_KZT_COST / KZT_TO_USD_RATE; // Convert to USD

export const MIN_AD_CAMPAIGN_KZT_COST = 100; // Minimum cost for Ad Campaign in KZT
export const MIN_AD_CAMPAIGN_USD_COST = MIN_AD_CAMPAIGN_KZT_COST / KZT_TO_USD_RATE; // Convert to USD


export const DEFAULT_PROFILE_PIC = 'https://picsum.photos/100/100?grayscale';

// NEW: Default audio tracks for Reels
export const DEFAULT_AUDIO_TRACKS: AudioTrack[] = [
  { id: 'audio1', title: 'Upbeat Funk', artist: 'GrooveMaster', url: 'https://cdn.pixabay.com/audio/2023/04/23/audio_87b3225287.mp3' },
  { id: 'audio2', title: 'Chill Lo-fi', artist: 'BeatScaper', url: 'https://cdn.pixabay.com/audio/2024/05/08/audio_291071a938.mp3' },
  { id: 'audio3', title: 'Epic Cinematic', artist: 'OrchestraX', url: 'https://cdn.pixabay.com/audio/2023/09/25/audio_2894a4c0a5.mp3' },
  { id: 'audio4', title: 'Acoustic Guitar', artist: 'Strummer', url: 'https://cdn.pixabay.com/audio/2022/08/03/audio_54b383134e.mp3' },
  { id: 'audio5', title: 'Tropical House', artist: 'DJ Sunny', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_14c81d3222.mp3' },
];


export const DEFAULT_USERS = [
  {
    id: 'creator1', // Renamed from teacher1
    userType: UserType.CREATOR,
    firstName: 'Ana',
    lastName: 'Silva',
    email: 'ana.silva@cyberphone.com',
    phone: '11987654321',
    documentId: '12345678901',
    profilePicture: 'https://picsum.photos/100/100?random=1',
    followedUsers: [],
    balance: 150.75,
    credentials: 'Doutora em Física, Criadora de Conteúdo Educacional.',
    bio: 'Sou apaixonada por desvendar os mistérios do universo e tornar a física acessível a todos, criando conteúdo inspirador.',
    storeId: 'store1', // Ana owns store1
  },
  {
    id: 'standard1', // Renamed from student1
    userType: UserType.STANDARD,
    firstName: 'Carlos',
    lastName: 'Gomes',
    email: 'carlos.gomes@cyberphone.com',
    phone: '21912345678',
    documentId: '98765432109',
    profilePicture: 'https://picsum.photos/100/100?random=2',
    followedUsers: [],
    balance: 10.50, // Standard users can also have balance now
  },
  {
    id: 'creator2', // Renamed from teacher2
    userType: UserType.CREATOR,
    firstName: 'João',
    lastName: 'Costa',
    email: 'joao.costa@cyberphone.com',
    phone: '31923456789',
    documentId: '10987654321',
    profilePicture: 'https://picsum.photos/100/100?random=3',
    followedUsers: [],
    balance: 75.00,
    credentials: 'Mestre em Matemática, Especialista em Cálculo Avançado.',
    bio: 'Ajudo estudantes a superar desafios em matemática com métodos práticos e divertidos através de conteúdo online.',
    storeId: 'store2', // João owns store2
  },
  {
    id: 'standard2', // Renamed from student2
    userType: UserType.STANDARD,
    firstName: 'Beatriz',
    lastName: 'Lima',
    email: 'beatriz.lima@cyberphone.com',
    phone: '41934567890',
    documentId: '54321098765',
    profilePicture: 'https://picsum.photos/100/100?random=4',
    followedUsers: [],
    balance: 25.00, // Standard users can also have balance now
  },
];

export const DEFAULT_POSTS = [
  {
    id: 'post1',
    userId: 'creator1',
    authorName: 'Ana Silva',
    authorProfilePic: 'https://picsum.photos/100/100?random=1',
    type: PostType.TEXT,
    timestamp: Date.now() - 3600000, // 1 hour ago
    content: 'Olá a todos! Animada para compartilhar novas descobertas sobre buracos negros esta semana. Fiquem ligados!',
    likes: [], comments: [], shares: [], saves: [], // New social interaction fields
  },
  {
    id: 'post2',
    userId: 'creator2',
    authorName: 'João Costa',
    authorProfilePic: 'https://picsum.photos/100/100?random=3',
    type: PostType.IMAGE,
    timestamp: Date.now() - 7200000, // 2 hours ago
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
    shares: [], saves: [], // New social interaction fields
  },
  {
    id: 'post3',
    userId: 'creator1',
    authorName: 'Ana Silva',
    authorProfilePic: 'https://picsum.photos/100/100?random=1',
    type: PostType.LIVE,
    timestamp: Date.now() - 10800000, // 3 hours ago
    liveStream: {
      title: 'Desvendando a Teoria da Relatividade',
      description: 'Uma aula introdutória sobre os conceitos fundamentais da teoria da relatividade de Einstein.',
      isPaid: true,
      price: 15.00,
      paymentLink: 'https://exemplo.com/pagamento-relatividade',
      paymentQRCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://exemplo.com/pagamento-relatividade',
      streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1'
    },
    likes: [], comments: [], shares: [], saves: [], // New social interaction fields
  },
  {
    id: 'post4',
    userId: 'standard1',
    authorName: 'Carlos Gomes',
    authorProfilePic: 'https://picsum.photos/100/100?random=2',
    type: PostType.TEXT,
    timestamp: Date.now() - 14400000, // 4 hours ago
    content: 'Assistindo à live da Ana Silva, estou adorando a explicação sobre física quântica!',
    likes: ['creator1'], comments: [], shares: [], saves: [], // New social interaction fields
  },
  {
    id: 'post5',
    userId: 'creator2',
    authorName: 'João Costa',
    authorProfilePic: 'https://picsum.photos/100/100?random=3',
    type: PostType.LIVE,
    timestamp: Date.now() - 18000000, // 5 hours ago
    liveStream: {
      title: 'Geometria Euclidiana para Iniciantes',
      description: 'Fundamentos da geometria plana e espacial. Live gratuita para todos!',
      isPaid: false,
      streamUrl: 'https://www.youtube.com/embed/M7QvP6oG_jM?autoplay=1&mute=1'
    },
    likes: ['standard2'], comments: [], shares: [], saves: [], // New social interaction fields
  },
  {
    id: 'post6',
    userId: 'creator1',
    authorName: 'Ana Silva',
    authorProfilePic: 'https://picsum.photos/100/100?random=1',
    type: PostType.REEL,
    timestamp: Date.now() - 20000000, // ~5.5 hours ago
    reel: {
      title: 'Dica Rápida de Física: Lei de Newton',
      description: 'Um vídeo curto explicando a primeira lei de Newton de forma divertida!',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-little-girl-playing-with-toy-kitchen-38555-large.mp4', // Example short video
      audioTrackId: 'audio1', // NEW: Added audio track
    },
    likes: [], comments: [], shares: [], saves: [], // New social interaction fields
  },
  {
    id: 'post7',
    userId: 'standard2', // Renamed from student2
    authorName: 'Beatriz Lima',
    authorProfilePic: 'https://picsum.photos/100/100?random=4',
    type: PostType.REEL,
    timestamp: Date.now() - 22000000, // ~6 hours ago
    reel: {
      title: 'Minha Resolução de um Problema de Cálculo',
      description: 'Compartilhando uma forma diferente de resolver integrais complexas!',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-curious-cat-looking-at-the-camera-42171-large.mp4', // Another example short video
      // price and purchaseLink removed
    },
    likes: [], comments: [], shares: [], saves: [], // New social interaction fields
  },
];

export const DEFAULT_ADS = [
  {
    id: 'ad1',
    professorId: 'creator1', // Conceptually creatorId
    title: 'Workshop Intensivo de Astrofísica',
    description: 'Aprenda sobre buracos negros, galáxias e a origem do universo em nosso workshop exclusivo!',
    targetAudience: 'Estudantes de ensino médio e superior, entusiastas de ciência.',
    budget: 500,
    isActive: true,
    imageUrl: 'https://picsum.photos/600/300?random=6',
    linkUrl: 'https://exemplo.com/workshop-astrofisica',
    timestamp: Date.now() - 20000000, // Example timestamp
  },
  {
    id: 'ad2',
    professorId: 'creator2', // Conceptually creatorId
    title: 'Reforço Escolar em Cálculo',
    description: 'Tenha aulas particulares de cálculo para melhorar suas notas e entender a matéria de uma vez por todas.',
    targetAudience: 'Estudantes universitários com dificuldades em cálculo.',
    budget: 300,
    isActive: true,
    imageUrl: 'https://picsum.photos/600/300?random=7',
    linkUrl: 'https://exemplo.com/reforco-calculo',
    timestamp: Date.now() - 22000000, // Example timestamp
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod1',
    storeId: 'store1',
    name: 'E-book: Fundamentos da Relatividade',
    description: 'Um guia completo para entender a teoria da relatividade de Einstein, com exercícios e explicações detalhadas.',
    price: 29.99,
    imageUrls: ['https://picsum.photos/300/200?random=ebook1', 'https://picsum.photos/300/200?random=ebook2'],
    affiliateCommissionRate: 0.15,
    type: ProductType.DIGITAL_EBOOK,
    ratings: [],
    averageRating: 0,
    ratingCount: 0,
  },
  {
    id: 'prod2',
    storeId: 'store1',
    name: 'Kit de Experiências de Física (DIY)',
    description: 'Materiais e instruções para montar 5 experimentos de física em casa. Ideal para estudantes!',
    price: 79.90,
    imageUrls: ['https://picsum.photos/300/200?random=kit'],
    affiliateCommissionRate: 0.10,
    type: ProductType.PHYSICAL,
    ratings: [],
    averageRating: 0,
    ratingCount: 0,
  },
  {
    id: 'prod3',
    storeId: 'store2',
    name: 'Curso Online: Cálculo Multivariado',
    description: 'Aulas em vídeo aprofundadas sobre cálculo multivariado, derivadas parciais e integrais de linha.',
    price: 199.00,
    imageUrls: ['https://picsum.photos/300/200?random=course'],
    affiliateCommissionRate: 0.20,
    type: ProductType.DIGITAL_COURSE,
    ratings: [],
    averageRating: 0,
    ratingCount: 0,
  },
];

export const DEFAULT_STORES: Store[] = [
  {
    id: 'store1',
    professorId: 'creator1', // Conceptually creatorId
    name: 'Física Descomplicada por Ana',
    description: 'Sua loja de materiais didáticos e kits de física para um aprendizado divertido e eficaz.',
    productIds: ['prod1', 'prod2'],
  },
  {
    id: 'store2',
    professorId: 'creator2', // Conceptually creatorId
    name: 'Matemática com João',
    description: 'Recursos e cursos para dominar a matemática de forma clara e objetiva.',
    productIds: ['prod3'],
  },
];

export const DEFAULT_AFFILIATE_SALES: AffiliateSale[] = [];