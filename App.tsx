
import React, { useState, useEffect } from 'react';
import { Home, User as UserIcon, Plus, Bell, Crown, Gem, Settings, ChevronRight, Edit3, Share2, LogOut, Shield, Database, ShoppingBag, Camera, Trophy, Flame, Sparkles } from 'lucide-react';
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
import { MOCK_ROOMS, VIP_LEVELS, GIFTS as INITIAL_GIFTS, STORE_ITEMS, MOCK_CONTRIBUTORS } from './constants';
import { Room, User, VIPPackage, UserLevel, Gift, StoreItem, GameSettings } from './types';
import { AnimatePresence } from 'framer-motion';
import { db, auth } from './services/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// --- CONFIGURATION ---
// تم تحديث بريد المدير الجديد
const ADMIN_EMAILS = ["admin@voicechat.com"]; 

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [currentUserAuth, setCurrentUserAuth] = useState<any>(null); // Firebase Auth User
  
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'rank'>('home');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isRoomMinimized, setIsRoomMinimized] = useState(false);
  const [isUserMuted, setIsUserMuted] = useState(true);

  // Initialize user state as null initially
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]); 
  const [vipLevels, setVipLevels] = useState<VIPPackage[]>(VIP_LEVELS);
  const [gifts, setGifts] = useState<Gift[]>(INITIAL_GIFTS);
  const [storeItems, setStoreItems] = useState<StoreItem[]>(STORE_ITEMS);
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

  // --- AUTH LISTENER & ADMIN PROMOTION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setCurrentUserAuth(authUser);
      if (authUser) {
         const userRef = doc(db, "users", authUser.uid);
         const userSnap = await getDoc(userRef);
         
         // Check if this email should be an admin
         const shouldBeAdmin = authUser.email && ADMIN_EMAILS.includes(authUser.email);

         if (!userSnap.exists()) {
            // New User Creation (Ideally handled in AuthScreen now, but keeping fallback)
            const newUserDoc: User = {
                id: authUser.uid,
                customId: Math.floor(10000 + Math.random() * 90000), // Random fallback if created here
                name: authUser.displayName || 'مستخدم جديد',
                avatar: authUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.uid}`,
                level: UserLevel.NEW,
                coins: 500, // Sign up bonus
                isVip: false,
                vipLevel: 0,
                bio: 'مستخدم جديد',
                stats: { likes: 0, visitors: 0, following: 0, followers: 0 },
                ownedItems: [],
                isFollowing: false,
                isMuted: false,
                isAdmin: shouldBeAdmin // Set admin status on creation
            };
            await setDoc(userRef, newUserDoc);
            setUser(newUserDoc);
         } else {
            // Existing User: Update Admin status if needed
            const userData = userSnap.data() as User;
            if (shouldBeAdmin && !userData.isAdmin) {
                await updateDoc(userRef, { isAdmin: true });
                setUser({ ...userData, isAdmin: true });
                console.log("User promoted to Admin automatically");
            } else {
                setUser(userData);
            }
         }
      } else {
         setUser(null);
      }
      setInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  // --- DATA SEEDING (System Data) ---
  useEffect(() => {
     const seedDatabase = async () => {
        // 1. Check/Seed Gifts
        const giftsSnapshot = await getDocs(collection(db, "gifts"));
        if (giftsSnapshot.empty) {
           const batch = writeBatch(db);
           INITIAL_GIFTS.forEach(g => batch.set(doc(db, "gifts", g.id), g));
           await batch.commit();
        }

        // 2. Check/Seed Store
        const storeSnapshot = await getDocs(collection(db, "store_items"));
        if (storeSnapshot.empty) {
           const batch = writeBatch(db);
           STORE_ITEMS.forEach(i => batch.set(doc(db, "store_items", i.id), i));
           await batch.commit();
        }
        
        // 3. Check/Seed VIP
        const vipSnapshot = await getDocs(collection(db, "vip_levels"));
        if (vipSnapshot.empty) {
           const batch = writeBatch(db);
           VIP_LEVELS.forEach(v => batch.set(doc(db, "vip_levels", v.level.toString()), v));
           await batch.commit();
        }

        // 4. Check/Seed Settings
        const settingsDoc = await getDoc(doc(db, "settings", "global"));
        if (!settingsDoc.exists()) {
           await setDoc(doc(db, "settings", "global"), {
              gameSettings: gameSettings,
              bannerImage: bannerImage
           });
        }
     };
     seedDatabase();
  }, []);

  // --- REAL-TIME LISTENERS ---
  
  // 1. Listen to Rooms
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "rooms"), (snapshot) => {
      const fetchedRooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];
      setRooms(fetchedRooms);
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen to Current User (if logged in)
  useEffect(() => {
     if (!currentUserAuth) return;
     const unsubscribe = onSnapshot(doc(db, "users", currentUserAuth.uid), (doc) => {
        if (doc.exists()) {
           setUser({ id: doc.id, ...doc.data() } as User);
        }
     });
     return () => unsubscribe();
  }, [currentUserAuth]);

  // 3. Listen to System Collections (Gifts, Store, VIP, Settings)
  useEffect(() => {
     // Explicit mapping ensures IDs are correct even if not stored in the document body properly
     const unsubGifts = onSnapshot(collection(db, "gifts"), (snap) => {
         const fetchedGifts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gift));
         setGifts(fetchedGifts);
     });

     const unsubStore = onSnapshot(collection(db, "store_items"), (snap) => {
         const fetchedItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreItem));
         setStoreItems(fetchedItems);
     });

     const unsubVip = onSnapshot(collection(db, "vip_levels"), (snap) => {
        const vips = snap.docs.map(doc => ({ ...doc.data() } as VIPPackage));
        setVipLevels(vips.sort((a,b) => a.level - b.level));
     });

     const unsubSettings = onSnapshot(doc(db, "settings", "global"), (doc) => {
        if (doc.exists()) {
           const data = doc.data();
           if (data.gameSettings) setGameSettings(data.gameSettings);
           if (data.bannerImage) setBannerImage(data.bannerImage);
        }
     });

     return () => {
        unsubGifts(); unsubStore(); unsubVip(); unsubSettings();
     };
  }, []);


  // --- ACTIONS ---

  const handleLogout = async () => {
      if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
          await signOut(auth);
          setUser(null);
          setCurrentRoom(null);
          addToast("تم تسجيل الخروج", 'success');
      }
  };

  const handleRoomJoin = async (room: Room) => {
    if(!user) return;
    setCurrentRoom(room);
    setIsRoomMinimized(false);
    setIsUserMuted(true); 
    
    try {
       await updateDoc(doc(db, "rooms", room.id), {
          listeners: (room.listeners || 0) + 1
       });
    } catch (e) { console.error(e); }
  };

  const handleRoomLeave = async () => {
    if (currentRoom && user) {
       try {
           await updateDoc(doc(db, "rooms", currentRoom.id), {
               listeners: Math.max(0, (currentRoom.listeners || 1) - 1)
           });
           
           const updatedSpeakers = currentRoom.speakers.filter(s => s.id !== user.id);
           if (updatedSpeakers.length !== currentRoom.speakers.length) {
              await updateDoc(doc(db, "rooms", currentRoom.id), { speakers: updatedSpeakers });
           }
       } catch (e) { console.error(e); }
    }
    setCurrentRoom(null);
    setIsRoomMinimized(false);
  };
  
  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
     const id = Date.now().toString();
     setToasts(prev => [...prev, { id, message, type }]);
     setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
     }, 3000);
  };

  const handleUpdateProfile = async (updatedData: Partial<User>) => {
     if(!user) return;
     try {
        await updateDoc(doc(db, "users", user.id), updatedData);
        addToast("تم تحديث الملف الشخصي بنجاح", 'success');
     } catch(e) {
        addToast("فشل التحديث", 'error');
     }
  };

  const handleCreateRoom = async (roomData: Pick<Room, 'title' | 'category' | 'thumbnail' | 'background'>) => {
     if(!user) return;
     const newRoomData: Omit<Room, 'id'> = {
        ...roomData,
        hostId: user.id,
        listeners: 0,
        speakers: [user] 
     };
     
     try {
        const docRef = await addDoc(collection(db, "rooms"), newRoomData);
        const newRoomWithId = { id: docRef.id, ...newRoomData } as Room;
        setCurrentRoom(newRoomWithId);
        setIsRoomMinimized(false);
        addToast('تم إنشاء الغرفة بنجاح!', 'success');
     } catch (e) {
        console.error("Error adding room: ", e);
        addToast('حدث خطأ أثناء إنشاء الغرفة', 'error');
     }
  };
  
  const handleUpdateRoom = async (roomId: string, updatedData: Partial<Room>) => {
     try {
        await updateDoc(doc(db, "rooms", roomId), updatedData);
        addToast("تم تحديث إعدادات الغرفة", "success");
     } catch (e) {
        addToast("فشل تحديث الغرفة", "error");
     }
  };

  const handleBuyVIP = async (pkg: VIPPackage) => {
     if (!user) return;
     if (user.coins >= pkg.cost) {
        try {
           await updateDoc(doc(db, "users", user.id), {
              coins: user.coins - pkg.cost,
              isVip: true,
              vipLevel: pkg.level,
              frame: pkg.frameUrl,
              level: UserLevel.VIP 
           });
           addToast(`مبروك! تم تفعيل عضوية ${pkg.name} بنجاح`, 'success');
        } catch(e) {
           addToast("حدث خطأ أثناء الشراء", 'error');
        }
     } else {
        addToast("رصيدك غير كافي لإتمام العملية", 'error');
     }
  };

  const handleBuyStoreItem = async (item: StoreItem) => {
     if (!user) return;
     if (user.coins >= item.price) {
        try {
           const ownedItems = user.ownedItems || [];
           if (ownedItems.includes(item.id)) return;
           
           await updateDoc(doc(db, "users", user.id), {
               coins: user.coins - item.price,
               ownedItems: [...ownedItems, item.id]
           });
           addToast(`تم شراء ${item.name} بنجاح`, 'success');
        } catch(e) {
           addToast("حدث خطأ", 'error');
        }
     } else {
        addToast("رصيدك غير كافي", 'error');
     }
  };

  const handleEquipStoreItem = async (item: StoreItem) => {
     if (!user) return;
     try {
        if (item.type === 'frame') {
           await updateDoc(doc(db, "users", user.id), { frame: item.url });
           addToast(`تم تجهيز الإطار ${item.name}`, 'success');
        } else {
           await updateDoc(doc(db, "users", user.id), { activeBubble: item.url });
           addToast(`تم تفعيل الفقاعة ${item.name}`, 'success');
        }
     } catch(e) {
        addToast("حدث خطأ", 'error');
     }
  };

  // --- RENDER ---

  if (initializing) {
      return (
          <div className="h-[100dvh] w-full bg-[#0f172a] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  // If not logged in, show Auth Screen
  if (!user) {
      return <AuthScreen />;
  }

  return (
    <div className="h-[100dvh] w-full bg-[#0f172a] text-white relative md:max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col font-cairo">
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      {/* Admin Panel (Only for Admins) */}
      <AnimatePresence>
         {showAdminPanel && user.isAdmin && (
            <AdminPanel 
               isOpen={showAdminPanel} 
               onClose={() => setShowAdminPanel(false)}
               rooms={rooms}
               setRooms={setRooms}
               currentUser={user}
               onUpdateUser={() => {}} 
               vipLevels={vipLevels}
               setVipLevels={() => {}}
               gifts={gifts}
               setGifts={() => {}} 
               storeItems={storeItems}
               setStoreItems={() => {}} 
               gameSettings={gameSettings}
               setGameSettings={() => {}} 
               bannerImage={bannerImage}
               setBannerImage={() => {}} 
            />
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showVIPModal && (
            <VIPModal 
               user={user} 
               vipLevels={vipLevels}
               onClose={() => setShowVIPModal(false)} 
               onBuy={handleBuyVIP}
            />
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showBagModal && (
            <BagModal 
               isOpen={showBagModal}
               onClose={() => setShowBagModal(false)}
               items={storeItems}
               user={user}
               onBuy={handleBuyStoreItem}
               onEquip={handleEquipStoreItem}
            />
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showEditProfileModal && (
            <EditProfileModal 
               isOpen={showEditProfileModal}
               onClose={() => setShowEditProfileModal(false)}
               currentUser={user}
               onSave={handleUpdateProfile}
            />
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showCreateRoomModal && (
            <CreateRoomModal 
               isOpen={showCreateRoomModal}
               onClose={() => setShowCreateRoomModal(false)}
               onCreate={handleCreateRoom}
            />
         )}
      </AnimatePresence>

      {/* Active Room Overlay */}
      {currentRoom && (
        <div className={isRoomMinimized ? 'invisible pointer-events-none absolute' : 'visible pointer-events-auto'}>
           <VoiceRoom 
              room={currentRoom} 
              currentUser={user}
              onUpdateUser={() => {}} 
              onLeave={handleRoomLeave} 
              onMinimize={() => setIsRoomMinimized(true)}
              gifts={gifts}
              onEditProfile={() => setShowEditProfileModal(true)}
              gameSettings={gameSettings}
              onUpdateRoom={handleUpdateRoom}
              isMuted={isUserMuted}
              onToggleMute={() => setIsUserMuted(!isUserMuted)}
           />
        </div>
      )}

      {/* Mini Player */}
      <AnimatePresence>
        {currentRoom && isRoomMinimized && (
           <MiniPlayer 
              room={currentRoom}
              onExpand={() => setIsRoomMinimized(false)}
              onLeave={handleRoomLeave}
              isMuted={isUserMuted}
              onToggleMute={() => setIsUserMuted(!isUserMuted)}
           />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        
        {/* Top Bar (Only show on Home/Rank) */}
        {activeTab !== 'profile' && (
           <div className="p-4 flex justify-between items-center bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-30 border-b border-white/5 h-16">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500 rounded-lg p-1">
                  <Crown size={16} className="text-white" />
                </div>
                <h1 className="text-lg font-black text-white">صوت العرب</h1>
              </div>
              <div className="flex gap-3">
                 <button className="relative p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition" onClick={() => addToast('لا توجد إشعارات جديدة', 'info')}>
                    <Bell size={18} className="text-slate-300" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
                 </button>
              </div>
           </div>
        )}

        {/* Tabs Content */}
        <div className="space-y-4">
           {activeTab === 'home' && (
              <div className="mt-2 space-y-3">
                 
                 {/* Banner Section */}
                 <div className="px-4 relative group">
                    <div className="relative w-full h-28 rounded-2xl overflow-hidden shadow-lg border border-white/10">
                       <img src={bannerImage} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" alt="Event Banner" />
                    </div>
                 </div>

                 {/* Top Contributors */}
                 <div className="px-4">
                    <div className="flex justify-between items-center mb-2">
                       <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Trophy size={14} className="text-yellow-500" /> 
                          كبار الداعمين
                       </h2>
                       <ChevronRight size={12} className="text-slate-500" />
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-xl border border-white/5 backdrop-blur-sm overflow-x-auto">
                       <div className="flex gap-3 min-w-max">
                          {MOCK_CONTRIBUTORS.map((contributor, idx) => (
                             <div key={contributor.id} className="flex flex-col items-center gap-1 min-w-[60px]">
                                <div className="relative">
                                   <div className={`w-12 h-12 rounded-full p-[2px] ${
                                      idx === 0 ? 'bg-gradient-to-tr from-yellow-300 via-amber-500 to-yellow-600 shadow-lg shadow-amber-500/20' :
                                      idx === 1 ? 'bg-gradient-to-tr from-slate-300 to-slate-500' :
                                      idx === 2 ? 'bg-gradient-to-tr from-orange-300 to-orange-700' :
                                      'bg-slate-700'
                                   }`}>
                                      <img src={contributor.avatar} className="w-full h-full rounded-full object-cover border-2 border-slate-900" alt={contributor.name} />
                                   </div>
                                   <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-slate-900 text-white ${
                                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-600' : 'bg-slate-700'
                                   }`}>
                                      {contributor.rank}
                                   </div>
                                </div>
                                <span className="text-[9px] font-bold text-white max-w-[60px] truncate">{contributor.name}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Active Rooms */}
                 <div className="px-4">
                    <div className="flex justify-between items-center mb-2">
                       <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Flame size={14} className="text-orange-500" />
                          الغرف النشطة
                       </h2>
                       <span className="text-[10px] text-slate-500">الكل</span>
                    </div>
                    
                    <div className="grid gap-2.5">
                       {rooms.map(room => (
                          <RoomCard key={room.id} room={room} onClick={handleRoomJoin} />
                       ))}
                       {rooms.length === 0 && (
                          <div className="text-center py-8 text-slate-500 border border-dashed border-white/10 rounded-xl text-xs">
                             جاري تحميل الغرف أو لا توجد غرف نشطة...
                          </div>
                       )}
                    </div>
                 </div>

                 <div className="h-4"></div>
              </div>
           )}

           {activeTab === 'rank' && (
             <div className="px-4 mt-6 space-y-4">
                <div className="bg-gradient-to-r from-amber-600 to-amber-800 p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl shadow-amber-900/40">
                   <Crown className="absolute -top-4 -right-4 text-white/10 w-40 h-40 rotate-12" />
                   <h2 className="text-2xl font-black mb-1">قائمة المتصدرين</h2>
                   <p className="text-amber-100/80 text-xs font-medium uppercase tracking-wider">أساطير هذا الأسبوع</p>
                </div>
                <div className="text-center text-slate-500 p-4">قريباً.. يتم ربط البيانات الحقيقية</div>
             </div>
           )}

           {/* Profile Tab */}
           {activeTab === 'profile' && (
             <div className="relative">
                {/* Header Image (Cover) */}
                <div className="h-40 bg-slate-900 relative overflow-hidden">
                   {user.cover ? (
                      <img src={user.cover} className="w-full h-full object-cover animate-fade-in" alt="Cover" />
                   ) : (
                      <div className="w-full h-full bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 relative">
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                      </div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                   
                   <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={() => addToast('تم نسخ رابط المشاركة', 'success')} className="p-2 bg-black/30 backdrop-blur rounded-full hover:bg-black/40 text-white">
                         <Share2 size={18} />
                      </button>
                      <button onClick={() => addToast('صفحة الإعدادات', 'info')} className="p-2 bg-black/30 backdrop-blur rounded-full hover:bg-black/40 text-white">
                         <Settings size={18} />
                      </button>
                   </div>
                </div>

                <div className="px-5 pb-10">
                   {/* Avatar & Basic Info */}
                   <div className="relative -mt-10 mb-4 flex justify-between items-end">
                      <div className="relative">
                         {/* Adjusted container: no border/padding if frame exists */}
                         <div className={`w-16 h-16 rounded-full bg-slate-950 relative flex items-center justify-center ${!user.frame ? 'p-1 border-4 border-slate-800' : ''}`}>
                            <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="Me" />
                            {user.frame && (
                               <img src={user.frame} className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-lg z-20 scale-[1.3]" alt="Frame" />
                            )}
                         </div>
                         <div className="absolute bottom-1 right-1 bg-slate-950 p-1 rounded-full cursor-pointer z-30" onClick={() => setShowEditProfileModal(true)}>
                            <div className="bg-amber-500 rounded-full p-0.5">
                               <Edit3 size={12} className="text-slate-900" />
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-4 text-center mb-1">
                         <div>
                            <div className="font-bold text-lg">{user.stats?.following || 0}</div>
                            <div className="text-[10px] text-slate-400">متابعة</div>
                         </div>
                         <div>
                            <div className="font-bold text-lg">{user.stats?.followers || 0}</div>
                            <div className="text-[10px] text-slate-400">متابعين</div>
                         </div>
                         <div>
                            <div className="font-bold text-lg">{user.stats?.visitors || 0}</div>
                            <div className="text-[10px] text-slate-400">زوار</div>
                         </div>
                      </div>
                   </div>

                   <div className="mb-6">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                         {user.name}
                         <span className="bg-amber-500 text-black text-[10px] px-2 py-0.5 rounded-full font-black">Lv.{user.level}</span>
                         {user.isAdmin && (
                            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                               <Shield size={10} /> ADMIN
                            </span>
                         )}
                      </h2>
                      <div className="mt-1 flex items-center gap-1">
                        <span className={`font-mono text-xs ${user.isSpecialId ? "font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 drop-shadow-sm italic tracking-wider" : "text-slate-400"}`}>
                           ID: {user.customId || user.id}
                        </span>
                        {user.isSpecialId && <Sparkles size={12} className="text-yellow-400 animate-pulse" />}
                      </div>
                      <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                         {user.bio}
                      </p>
                   </div>

                   {/* Wallet Card */}
                   <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-2xl border border-white/5 mb-6 flex justify-between items-center shadow-lg">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl">🪙</div>
                         <div>
                            <div className="text-xs text-slate-400">رصيد العملات</div>
                            <div className="font-bold text-lg text-yellow-400">{user.coins.toLocaleString()}</div>
                         </div>
                      </div>
                      <button onClick={() => addToast('جاري فتح بوابة الدفع...', 'info')} className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                         شحن رصيد
                      </button>
                   </div>

                   {/* Menu Items */}
                   <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
                      {/* Admin Panel Link (Only for Admins) */}
                      {user.isAdmin && (
                         <div 
                            onClick={() => setShowAdminPanel(true)} 
                            className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors bg-gradient-to-r from-slate-900 to-slate-800"
                         >
                            <div className="flex items-center gap-3">
                               <Database size={18} className="text-red-500" />
                               <span className="text-sm font-bold text-red-400">لوحة التحكم (الإدارة)</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-600" />
                         </div>
                      )}

                      {[
                         { icon: <Crown size={18} className="text-amber-500" />, label: 'متجر الإطارات VIP', badge: 'جديد', action: () => setShowVIPModal(true) },
                         { icon: <ShoppingBag size={18} className="text-blue-500" />, label: 'الحقيبة (المتجر)', badge: 'خاص', action: () => setShowBagModal(true) },
                         { icon: <Gem size={18} className="text-purple-500" />, label: 'إنجازاتي', badge: '' },
                         { icon: <Shield size={18} className="text-blue-500" />, label: 'مركز المساعدة', badge: '' },
                      ].map((item, idx) => (
                         <div key={idx} onClick={item.action || (() => addToast(`تم النقر على ${item.label}`, 'info'))} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                               {item.icon}
                               <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               {item.badge && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">{item.badge}</span>}
                               <ChevronRight size={16} className="text-slate-600" />
                            </div>
                         </div>
                      ))}
                      <div onClick={handleLogout} className="flex items-center justify-between p-4 hover:bg-red-900/10 cursor-pointer transition-colors group">
                            <div className="flex items-center gap-3">
                                <LogOut size={18} className="text-red-500" />
                               <span className="text-sm font-medium text-red-500">تسجيل الخروج</span>
                            </div>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-lg border-t border-white/5 flex justify-around items-center h-20 pb-2 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
         <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'home' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
         >
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">الرئيسية</span>
         </button>

         <button 
            onClick={() => setShowCreateRoomModal(true)}
            className="flex flex-col items-center gap-1 p-2 -mt-8 group cursor-pointer"
         >
            <div className="bg-gradient-to-br from-amber-400 to-orange-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-orange-900/50 border-4 border-slate-900 group-hover:scale-105 transition-transform">
               <Plus size={28} className="text-white" />
            </div>
         </button>

         <button 
            onClick={() => setActiveTab('rank')}
            className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'rank' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
         >
            <Crown size={24} strokeWidth={activeTab === 'rank' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">المتصدرين</span>
         </button>

         <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'profile' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
         >
            <UserIcon size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">حسابي</span>
         </button>
      </div>
    </div>
  );
}
