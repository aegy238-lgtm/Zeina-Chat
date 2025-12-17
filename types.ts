
export enum UserLevel {
  NEW = 'جديد',
  BRONZE = 'برونزي',
  SILVER = 'فضي',
  GOLD = 'ذهبي',
  DIAMOND = 'ماسي',
  VIP = 'VIP'
}

export type ItemType = 'frame' | 'bubble';

export interface StoreItem {
  id: string;
  name: string;
  type: ItemType;
  price: number;
  url: string; // Image URL
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  level: UserLevel;
  frame?: string; // URL to frame image
  activeBubble?: string; // URL to active chat bubble image
  cover?: string; // Cover/Header image URL
  coins: number;
  isVip: boolean;
  vipLevel?: number; // 1 to 12
  bio?: string;
  gender?: 'male' | 'female';
  stats?: {
    likes: number;
    visitors: number;
    following: number;
    followers: number;
  };
  ownedItems?: string[]; // IDs of owned items
  isFollowing?: boolean;
  isMuted?: boolean;
  isSpecialId?: boolean; // New property for Special IDs
}

export interface Contributor {
  id: string;
  name: string;
  avatar: string;
  amount: number; // Contribution amount
  rank: number;
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
  cost: number;
  animationType: 'pop' | 'fly' | 'full-screen';
  isLucky?: boolean; // New Flag for Lucky Gifts
}

export interface VIPPackage {
  level: number;
  name: string;
  cost: number;
  frameUrl: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userLevel: UserLevel;
  content: string;
  type: 'text' | 'gift' | 'system';
  giftData?: Gift;
  bubbleUrl?: string; // Custom bubble style
  isLuckyWin?: boolean; // Did this message trigger a lucky win?
  winAmount?: number;
}

export interface Room {
  id: string;
  title: string;
  category: 'ترفيه' | 'ألعاب' | 'شعر' | 'تعارف';
  hostId: string;
  listeners: number;
  thumbnail: string;
  speakers: User[]; // Initial list of speakers
  background: string;
}

export interface GameSettings {
  slotsWinRate: number; // For Slots Game
  wheelWinRate: number; // For Wheel Game
  luckyGiftWinRate: number; // Chance to trigger lucky return (0-100%)
  luckyGiftRefundPercent: number; // Multiplier of cost returned (e.g., 500% for x5 win)
}

export interface WheelItem {
  id: string;
  label: string;
  color: string;
  icon: string;
  multiplier: number;
  probability: number; // Relative weight
}

export interface SlotItem {
  id: string;
  icon: string;
  multiplier: number;
}
