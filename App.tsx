
import React, { useState, useEffect } from 'react';
import { Home, User as UserIcon, Plus, Bell, Crown, Gem, Settings, ChevronRight, Edit3, Share2, LogOut, Shield, Database, ShoppingBag, Camera, Trophy, Flame, Sparkles, UserX, Star } from 'lucide-react';
import RoomCard from './components/RoomCard';
import VoiceRoom from './components/VoiceRoom';
import AuthScreen from './components/AuthScreen';
import Toast, { ToastMessage } from './components/Toast';
import VIPModal from './components/VIPModal';
import AdminPanel from './components/AdminPanel';
import EditProfileModal from './components/EditProfileModal';
import BagModal from './components/BagModal';
import CreateRoomModal from './components/CreateRoomModal';
import MiniPlayer from './components/MiniPlayer';
import GlobalBanner from './components/GlobalBanner';
import { MOCK_ROOMS, VIP_LEVELS, GIFTS as INITIAL_GIFTS, STORE_ITEMS, MOCK_CONTRIBUTORS } from './constants';
import { Room, User, VIPPackage, UserLevel, Gift, StoreItem, GameSettings, GlobalAnnouncement } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { db, auth } from './services/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, getDoc, getDocs, writeBatch, deleteDoc, increment, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';

const ADMIN_EMAILS = ["admin@voicechat.com"]; 

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'rank'>('home');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isRoomMinimized, setIsRoomMinimized] = useState(false);
  const [isUserMuted, setIsUserMuted] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]); 
  const [gameSettings, setGameSettings] = useState<GameSettings>({
     slotsWinRate: 35,
     wheelWinRate: 45,
     luckyGiftWinRate: 30,
     luckyGiftRefundPercent: 200
  });
  const [bannerImage, setBannerImage] = useState('https://img.freepik.com/free-vector/gradient-music-festival-twitch-banner_23-2149051838.jpg');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showBagModal, setShowBagModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [vipLevels, setVipLevels] = useState<VIPPackage[]>(VIP_LEVELS);
  const [gifts, setGifts] = useState<Gift[]>(INITIAL_GIFTS);
  const [storeItems, setStoreItems] = useState<StoreItem[]>(STORE_ITEMS);
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);

  // Sync Global Settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "global"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.gameSettings) setGameSettings(data.gameSettings);
        if (data.bannerImage) setBannerImage(data.bannerImage);
      }
    });
    return () => unsub();
  }, []);

  // Listen for Global Announcements
  useEffect(() => {
    const q = query(collection(db, "global_announcements"), orderBy("timestamp", "desc"), limit(1));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as GlobalAnnouncement;
        const announcementTime = data.timestamp?.toMillis() || Date.now();
        if (Date.now() - announcementTime < 15000) {
          setAnnouncement(data);
          setTimeout(() => setAnnouncement(null), 8000);
        }
      }
    });
    return () => unsub();
  }, []);

  // Sync Database Collections & Active Room Synchronization
  useEffect(() => {
    const unsubRooms = onSnapshot(collection(db, "rooms"), (snap) => {
      const fetchedRooms = snap.docs.map(d => ({ id: d.id, ...d.data() } as Room));
      setRooms(fetchedRooms);

      // CRITICAL: Synchronize currentRoom state with external changes (like background updates)
      setCurrentRoom(prevRoom => {
        if (!prevRoom) return null;
        const updatedRoom = fetchedRooms.find(r => r.id === prevRoom.id);
        // If the room still exists, update its state to trigger re-renders everywhere
        return updatedRoom || null;
      });
    });

    const unsubGifts = onSnapshot(collection(db, "gifts"), (snap) => {
      if (!snap.empty) {
        const fetchedGifts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Gift));
        setGifts(fetchedGifts.length > 0 ? fetchedGifts : INITIAL_GIFTS);
      }
    });

    const unsubVIP = onSnapshot(collection(db, "vip_levels"), (snap) => {
      if (!snap.empty) setVipLevels(snap.docs.map(d => ({ ...d.data() } as VIPPackage)).sort((a,b) => a.level - b.level));
    });

    const unsubStore = onSnapshot(collection(db, "store_items"), (snap) => {
      if (!snap.empty) setStoreItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as StoreItem)));
    });

    return () => { unsubRooms(); unsubGifts(); unsubVIP(); unsubStore(); };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
         const userRef = doc(db, "users", authUser.uid);
         const userSnap = await getDoc(userRef);
         const shouldBeAdmin = authUser.email && ADMIN_EMAILS.includes(authUser.email);
         if (!userSnap.exists()) {
            const newUserDoc: User = {
                id: authUser.uid,
                customId: Math.floor(10000 + Math.random() * 90000),
                name: authUser.displayName || 'مستخدم جديد',
                avatar: authUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.uid}`,
                level: UserLevel.NEW,
                coins: 500,
                wealth: 0, charm: 0, isVip: false, vipLevel: 0,
                bio: 'مستخدم جديد في صوت العرب',
                stats: { likes: 0, visitors: 0, following: 0, followers: 0 },
                ownedItems: [], isFollowing: false, isMuted: false, isAdmin: !!shouldBeAdmin
            };
            await setDoc(userRef, newUserDoc);
            setUser(newUserDoc);
         } else {
            setUser(userSnap.data() as User);
         }
      } else {
         setUser(null);
      }
      setInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
      if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
          await signOut(auth);
          setUser(null);
          setCurrentRoom(null);
      }
  };

  const handleCreateRoom = async (roomData: any) => {
      if (!user) return;
      try {
          await addDoc(collection(db, "rooms"), {
              ...roomData,
              hostId: user.id,
              listeners: 1,
              speakers: [{
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                level: user.level,
                frame: user.frame || '',
                nameStyle: user.nameStyle || '',
                charm: user.charm || 0,
                isMuted: false,
                seatIndex: 0
              }]
          });
          addToast("تم إنشاء الغرفة بنجاح! 🎙️", "success");
          setShowCreateRoomModal(false);
      } catch (e) {
          addToast("فشل إنشاء الغرفة", "error");
      }
  };

  const handleUpdateRoom = async (roomId: string, data: Partial<Room>) => {
      try {
          await updateDoc(doc(db, "rooms", roomId), data);
      } catch (e) { console.error(e); }
  };

  const handleRoomJoin = async (room: Room) => {
    if(!user) return;
    setCurrentRoom(room);
    setIsRoomMinimized(false);
    setIsUserMuted(true); 
    await updateDoc(doc(db, "rooms", room.id), { listeners: increment(1) }).catch(console.error);
  };

  const handleRoomLeave = async () => {
    if (currentRoom && user) {
       await updateDoc(doc(db, "rooms", currentRoom.id), { listeners: increment(-1) }).catch(console.error);
    }
    setCurrentRoom(null);
    setIsRoomMinimized(false);
  };
  
  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
     const id = Date.now().toString();
     setToasts(prev => [...prev, { id, message, type }]);
     setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  if (initializing) {
      return (
          <div className="h-[100dvh] w-full bg-[#0f172a] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="h-[100dvh] w-full bg-[#0f172a] text-white relative md:max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col font-cairo">
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <AnimatePresence>
        {announcement && <GlobalBanner announcement={announcement} />}
      </AnimatePresence>

      <AnimatePresence>
         {showAdminPanel && user.isAdmin && (
            <AdminPanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} rooms={rooms} setRooms={() => {}} currentUser={user} onUpdateUser={() => {}} vipLevels={vipLevels} setVipLevels={() => {}} gifts={gifts} setGifts={() => {}} storeItems={storeItems} setStoreItems={() => {}} gameSettings={gameSettings} setGameSettings={setGameSettings} bannerImage={bannerImage} setBannerImage={setBannerImage} />
         )}
      </AnimatePresence>
      <AnimatePresence>{showVIPModal && <VIPModal user={user} vipLevels={vipLevels} onClose={() => setShowVIPModal(false)} onBuy={() => {}} />}</AnimatePresence>
      <AnimatePresence>{showBagModal && <BagModal isOpen={showBagModal} onClose={() => setShowBagModal(false)} items={storeItems} user={user} onBuy={() => {}} onEquip={() => {}} />}</AnimatePresence>
      <AnimatePresence>{showEditProfileModal && <EditProfileModal isOpen={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} currentUser={user} onSave={() => {}} />}</AnimatePresence>
      <AnimatePresence>{showCreateRoomModal && <CreateRoomModal isOpen={showCreateRoomModal} onClose={() => setShowCreateRoomModal(false)} onCreate={handleCreateRoom} />}</AnimatePresence>

      {currentRoom && (
        <div className={isRoomMinimized ? 'invisible pointer-events-none absolute' : 'visible pointer-events-auto'}>
           <VoiceRoom room={currentRoom} currentUser={user} onUpdateUser={() => {}} onLeave={handleRoomLeave} onMinimize={() => setIsRoomMinimized(true)} gifts={gifts} onEditProfile={() => setShowEditProfileModal(true)} gameSettings={gameSettings} onUpdateRoom={handleUpdateRoom} isMuted={isUserMuted} onToggleMute={() => setIsUserMuted(!isUserMuted)} />
        </div>
      )}

      <AnimatePresence>{currentRoom && isRoomMinimized && <MiniPlayer room={currentRoom} onExpand={() => setIsRoomMinimized(false)} onLeave={handleRoomLeave} isMuted={isUserMuted} onToggleMute={() => setIsUserMuted(!isUserMuted)} />}</AnimatePresence>

      <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        {activeTab !== 'profile' && (
           <div className="p-4 flex justify-between items-center bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-30 border-b border-white/5 h-16">
              <div className="flex items-center gap-2"><div className="bg-amber-500 rounded-lg p-1"><Crown size={16} className="text-white" /></div><h1 className="text-lg font-black text-white">صوت العرب</h1></div>
              <div className="flex gap-3"><button className="relative p-2 bg-slate-800 rounded-full" onClick={() => addToast('لا توجد إشعارات', 'info')}><Bell size={18} className="text-slate-300" /><span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span></button></div>
           </div>
        )}

        <div className="space-y-4">
           {activeTab === 'home' && (
              <div className="mt-2 space-y-3">
                 <div className="px-4"><div className="relative w-full h-28 rounded-2xl overflow-hidden shadow-lg border border-white/10"><img src={bannerImage} className="w-full h-full object-cover" alt="Banner" /></div></div>
                 <div className="px-4"><div className="flex justify-between items-center mb-2"><h2 className="text-xs font-bold text-white flex items-center gap-1.5"><Trophy size={14} className="text-yellow-500" /> كبار الداعمين</h2><ChevronRight size={12} className="text-slate-500" /></div><div className="bg-slate-900/50 p-2 rounded-xl border border-white/5 backdrop-blur-sm overflow-x-auto"><div className="flex gap-3 min-w-max">{MOCK_CONTRIBUTORS.map((contributor, idx) => (<div key={contributor.id} className="flex flex-col items-center gap-1 min-w-[60px]"><div className="relative"><div className={`w-12 h-12 rounded-full p-[2px] ${idx === 0 ? 'bg-gradient-to-tr from-yellow-300 via-amber-500 to-yellow-600 shadow-lg shadow-amber-500/20' : idx === 1 ? 'bg-gradient-to-tr from-slate-300 to-slate-500' : 'bg-slate-700'}`}><img src={contributor.avatar} className="w-full h-full rounded-full object-cover border-2 border-slate-900" alt={contributor.name} /></div><div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-slate-900 text-white ${idx === 0 ? 'bg-yellow-500' : 'bg-slate-400'}`}>{contributor.rank}</div></div><span className="text-[9px] font-bold text-white max-w-[60px] truncate">{contributor.name}</span></div>))}</div></div></div>
                 <div className="px-4"><div className="flex justify-between items-center mb-2"><h2 className="text-xs font-bold text-white flex items-center gap-1.5"><Flame size={14} className="text-orange-500" /> الغرف النشطة</h2><span className="text-[10px] text-slate-500">الكل</span></div><div className="grid gap-2.5">{rooms.map(room => (<RoomCard key={room.id} room={room} onClick={handleRoomJoin} />))}</div></div>
              </div>
           )}
           {activeTab === 'profile' && user && (
             <div className="relative">
                <div className="h-40 bg-slate-900 relative overflow-hidden">{user.cover ? <img src={user.cover} className="w-full h-full object-cover" alt="Cover" /> : <div className="w-full h-full bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900"></div>}<div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div></div>
                <div className="px-5 pb-10">
                   <div className="relative -mt-10 mb-4 flex justify-between items-end"><div className="relative"><div className={`w-16 h-16 rounded-full bg-slate-950 relative flex items-center justify-center ${!user.frame ? 'p-1 border-4 border-slate-800' : ''}`}><img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="Me" />{user.frame && <img src={user.frame} className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-[1.3]" alt="Frame" />}</div></div><div className="flex gap-4 text-center mb-1"><div><div className="font-bold text-lg">{user.stats?.followers || 0}</div><div className="text-[10px] text-slate-400">متابعين</div></div><div><div className="font-bold text-lg">{user.stats?.visitors || 0}</div><div className="text-[10px] text-slate-400">زوار</div></div></div></div>
                   <div className="mb-6"><h2 className={`text-2xl flex items-center gap-2 ${user.nameStyle ? user.nameStyle : 'font-bold'}`}>{user.name}<span className="bg-amber-500 text-black text-[10px] px-2 py-0.5 rounded-full font-black">Lv.{user.level}</span></h2><div className="mt-1 flex items-center gap-1"><span className={`font-mono text-xs text-slate-400`}>ID: {user.customId || user.id}</span></div><p className="text-slate-300 text-sm mt-3">{user.bio}</p></div>
                   <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-2xl border border-white/5 mb-6 flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl">🪙</div><div><div className="text-xs text-slate-400">رصيد العملات</div><div className="font-bold text-lg text-yellow-400">{user.coins.toLocaleString()}</div></div></div></div>
                   <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">{user.isAdmin && (<div onClick={() => setShowAdminPanel(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer bg-gradient-to-r from-slate-900 to-slate-800"><div className="flex items-center gap-3"><Database size={18} className="text-red-500" /><span className="text-sm font-bold text-red-400">لوحة التحكم</span></div><ChevronRight size={16} className="text-slate-600" /></div>)}<div onClick={() => setShowVIPModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer"><div className="flex items-center gap-3"><Crown size={18} className="text-amber-500" /><span className="text-sm font-medium">متجر VIP</span></div><ChevronRight size={16} className="text-slate-600" /></div><div onClick={() => setShowBagModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer"><div className="flex items-center gap-3"><ShoppingBag size={18} className="text-blue-500" /><span className="text-sm font-medium">الحقيبة</span></div><ChevronRight size={16} className="text-slate-600" /></div><div onClick={handleLogout} className="flex items-center justify-between p-4 hover:bg-red-900/10 cursor-pointer"><div className="flex items-center gap-3"><LogOut size={18} className="text-red-500" /><span className="text-sm font-medium text-red-500">تسجيل الخروج</span></div></div></div>
                </div>
             </div>
           )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-lg border-t border-white/5 flex justify-around items-center h-20 pb-2 z-20">
         <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'home' ? 'text-amber-400' : 'text-slate-500'}`}><Home size={24} /><span className="text-[10px] font-medium">الرئيسية</span></button>
         <button onClick={() => setShowCreateRoomModal(true)} className="flex flex-col items-center gap-1 p-2 -mt-8 group"><div className="bg-gradient-to-br from-amber-400 to-orange-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-slate-900"><Plus size={28} className="text-white" /></div></button>
         <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'profile' ? 'text-amber-400' : 'text-slate-500'}`}><UserIcon size={24} /><span className="text-[10px] font-medium">حسابي</span></button>
      </div>
    </div>
  );
}
