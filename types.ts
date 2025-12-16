export enum UserLevel {
  NEW = 'جديد',
  BRONZE = 'برونزي',
  SILVER = 'فضي',
  GOLD = 'ذهبي',
  DIAMOND = 'ماسي',
  VIP = 'VIP'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  level: UserLevel;
  frame?: string; // URL to frame image
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
  isFollowing?: boolean;
  isMuted?: boolean;
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
  cost: number;
  animationType: 'pop' | 'fly' | 'full-screen';
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