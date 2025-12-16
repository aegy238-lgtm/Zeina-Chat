import { Gift, Room, User, UserLevel, VIPPackage } from './types';

// Mock frames using frame-like borders or transparent PNGs
const BASE_FRAME_URL = "https://cdn-icons-png.flaticon.com/512";

export const VIP_LEVELS: VIPPackage[] = [
  { level: 1, name: 'فارس', cost: 1000, color: 'text-slate-300', frameUrl: 'https://cdn-icons-png.flaticon.com/512/763/763328.png' },
  { level: 2, name: 'بارون', cost: 2500, color: 'text-emerald-400', frameUrl: 'https://cdn-icons-png.flaticon.com/512/2503/2503728.png' },
  { level: 3, name: 'فيكونت', cost: 5000, color: 'text-blue-400', frameUrl: 'https://cdn-icons-png.flaticon.com/512/3014/3014238.png' },
  { level: 4, name: 'كونت', cost: 10000, color: 'text-indigo-400', frameUrl: 'https://cdn-icons-png.flaticon.com/512/1170/1170667.png' },
  { level: 5, name: 'ماركيز', cost: 20000, color: 'text-purple-400', frameUrl: 'https://cdn-icons-png.flaticon.com/512/5407/5407986.png' },
  { level: 6, name: 'دوق', cost: 40000, color: 'text-pink-400', frameUrl: 'https://cdn-icons-png.flaticon.com/512/2545/2545603.png' },
  { level: 7, name: 'أمير', cost: 75000, color: 'text-rose-500', frameUrl: 'https://cdn-icons-png.flaticon.com/512/2622/2622080.png' },
  { level: 8, name: 'ملك', cost: 150000, color: 'text-red-600', frameUrl: 'https://cdn-icons-png.flaticon.com/512/2043/2043132.png' },
  { level: 9, name: 'إمبراطور', cost: 300000, color: 'text-orange-500', frameUrl: 'https://cdn-icons-png.flaticon.com/512/5778/5778432.png' },
  { level: 10, name: 'أسطورة', cost: 600000, color: 'text-amber-400', frameUrl: 'https://cdn-icons-png.flaticon.com/512/2618/2618413.png' },
  { level: 11, name: 'خرافي', cost: 1000000, color: 'text-yellow-300', frameUrl: 'https://cdn-icons-png.flaticon.com/512/4021/4021693.png' },
  { level: 12, name: 'إلهي', cost: 2500000, color: 'text-white', frameUrl: 'https://cdn-icons-png.flaticon.com/512/2165/2165039.png' },
];

export const CURRENT_USER: User = {
  id: 'me',
  name: 'ضيف كريم',
  avatar: 'https://picsum.photos/200/200?random=99',
  level: UserLevel.SILVER,
  coins: 50000, // Increased default coins to allow testing VIP
  isVip: false,
  vipLevel: 0,
  bio: 'أحب الشعر والسهر 🌙 | مصمم جرافيك',
  gender: 'male',
  stats: {
    likes: 1250,
    visitors: 4300,
    following: 120,
    followers: 850
  },
  isFollowing: false,
  isMuted: false
};

export const GIFTS: Gift[] = [
  { id: '1', name: 'وردة', icon: '🌹', cost: 10, animationType: 'pop' },
  { id: '2', name: 'قلب', icon: '❤️', cost: 50, animationType: 'pop' },
  { id: '3', name: 'خاتم', icon: '💍', cost: 200, animationType: 'pop' },
  { id: '4', name: 'سيارة رياضية', icon: '🏎️', cost: 1000, animationType: 'fly' },
  { id: '5', name: 'تنين', icon: '🐉', cost: 5000, animationType: 'full-screen' },
  { id: '6', name: 'يخت', icon: '🛥️', cost: 3000, animationType: 'fly' },
];

export const MOCK_ROOMS: Room[] = [
  {
    id: 'r1',
    title: 'سهرة طرب خليجي 🎵',
    category: 'ترفيه',
    hostId: 'u1',
    listeners: 1420,
    thumbnail: 'https://picsum.photos/400/300?random=1',
    background: 'linear-gradient(to bottom, #1e1b4b, #312e81)',
    speakers: [
      { id: 'u1', name: 'الملك', avatar: 'https://picsum.photos/200?random=1', level: UserLevel.DIAMOND, coins: 0, isVip: true, vipLevel: 10, frame: VIP_LEVELS[9].frameUrl, bio: 'المدير العام', stats: { likes: 9999, visitors: 50000, followers: 12000, following: 10 }, isFollowing: true, isMuted: false },
      { id: 'u2', name: 'سارة', avatar: 'https://picsum.photos/200?random=2', level: UserLevel.GOLD, coins: 0, isVip: false, bio: 'أجواء رايقة فقط ✨', stats: { likes: 300, visitors: 1200, followers: 500, following: 200 }, isFollowing: false, isMuted: false },
      { id: 'u3', name: 'أحمد', avatar: 'https://picsum.photos/200?random=3', level: UserLevel.SILVER, coins: 0, isVip: false, bio: 'محب للتقنية', stats: { likes: 50, visitors: 100, followers: 20, following: 50 }, isFollowing: false, isMuted: false },
    ]
  },
  {
    id: 'r2',
    title: 'بطولة ببجي سكوادات 🎮',
    category: 'ألعاب',
    hostId: 'u4',
    listeners: 850,
    thumbnail: 'https://picsum.photos/400/300?random=2',
    background: 'linear-gradient(to bottom, #111827, #0f766e)',
    speakers: [
      { id: 'u4', name: 'GamerPro', avatar: 'https://picsum.photos/200?random=4', level: UserLevel.BRONZE, coins: 0, isVip: false, bio: 'Rank #1 Pubg', stats: { likes: 500, visitors: 2000, followers: 800, following: 50 }, isFollowing: false, isMuted: false },
      { id: 'u5', name: 'NoobMaster', avatar: 'https://picsum.photos/200?random=5', level: UserLevel.NEW, coins: 0, isVip: false, bio: 'New player', stats: { likes: 10, visitors: 50, followers: 5, following: 5 }, isFollowing: false, isMuted: false },
    ]
  },
  {
    id: 'r3',
    title: 'شعر وقصائد 📜',
    category: 'شعر',
    hostId: 'u6',
    listeners: 320,
    thumbnail: 'https://picsum.photos/400/300?random=6',
    background: 'linear-gradient(to bottom, #450a0a, #7f1d1d)',
    speakers: [
      { id: 'u6', name: 'الشاعر', avatar: 'https://picsum.photos/200?random=6', level: UserLevel.VIP, coins: 0, isVip: true, vipLevel: 5, frame: VIP_LEVELS[4].frameUrl, bio: 'كلمات من القلب', stats: { likes: 2000, visitors: 6000, followers: 3000, following: 100 }, isFollowing: true, isMuted: false },
    ]
  }
];