
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Radio, Settings, X, Search, 
  MoreVertical, Ban, Trash2, ShieldAlert, CheckCircle, 
  Coins, Crown, BarChart3, Bell, Power, Edit2, Save, Image as ImageIcon, Upload, Gift as GiftIcon, Plus, Wallet, ArrowRight, ShoppingBag, FileText, Gamepad2, Hash, Sparkles, Clover, Shield, Mic, RotateCcw, UserX
} from 'lucide-react';
import { Room, User, UserLevel, VIPPackage, Gift, StoreItem, GameSettings, ItemType } from '../types';
import { db } from '../services/firebase';
import { collection, doc, updateDoc, deleteDoc, setDoc, getDocs, onSnapshot, increment } from 'firebase/firestore';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  currentUser: User;
  onUpdateUser: (user: User) => void;
  vipLevels: VIPPackage[];
  setVipLevels: React.Dispatch<React.SetStateAction<VIPPackage[]>>;
  gifts: Gift[];
  setGifts: React.Dispatch<React.SetStateAction<Gift[]>>;
  storeItems: StoreItem[];
  setStoreItems: React.Dispatch<React.SetStateAction<StoreItem[]>>;
  gameSettings: GameSettings;
  setGameSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  bannerImage: string;
  setBannerImage: React.Dispatch<React.SetStateAction<string>>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, onClose, rooms, currentUser, vipLevels, gifts, storeItems, gameSettings, bannerImage
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'rooms' | 'vip' | 'gifts' | 'store' | 'games' | 'settings'>('dashboard');
  
  // Edit States
  const [editingVip, setEditingVip] = useState<VIPPackage | null>(null);
  const [editingGift, setEditingGift] = useState<Partial<Gift> | null>(null);
  const [editingStoreItem, setEditingStoreItem] = useState<Partial<StoreItem> | null>(null);
  
  // State for Charging Logic
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [selectedUserForCharge, setSelectedUserForCharge] = useState<any | null>(null);
  const [chargeAmount, setChargeAmount] = useState<string>('');
  const [chargeProof, setChargeProof] = useState<string>(''); 

  // State for ID Change Logic
  const [idChangeModalOpen, setIdChangeModalOpen] = useState(false);
  const [selectedUserForIdChange, setSelectedUserForIdChange] = useState<any | null>(null);
  const [newIdValue, setNewIdValue] = useState('');
  const [isNewIdSpecial, setIsNewIdSpecial] = useState(false);

  // State for ID Search Logic
  const [idSearchModalOpen, setIdSearchModalOpen] = useState(false);
  const [searchIdInput, setSearchIdInput] = useState('');

  const [localUsers, setLocalUsers] = useState<User[]>([]);

  // Fetch Users from Firestore for the table
  useEffect(() => {
     if(isOpen) {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setLocalUsers(users);
        });
        return () => unsubscribe();
     }
  }, [isOpen]);

  if (!isOpen) return null;
  
  // Security Check: If user is not admin, do not render
  if (!currentUser.isAdmin) return null;

  // --- Handlers ---

  const handleDeleteRoom = async (roomId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الغرفة وإغلاقها نهائياً؟')) {
       try {
          await deleteDoc(doc(db, "rooms", roomId));
       } catch(e) { console.error(e); }
    }
  };

  const handleBanUser = async (userId: string, currentStatus: string) => {
     // --- ADMIN PROTECTION ---
     const targetUser = localUsers.find(u => u.id === userId);
     
     // STRICT CHECK: Cannot ban admins
     if (targetUser?.isAdmin) {
         alert("❌ خطأ: هذا الحساب محصن! لا يمكن حظر مدير النظام.");
         return;
     }

     const action = currentStatus === 'active' || !currentStatus ? 'حظر (Ban)' : 'فك الحظر (Unban)';
     if (!confirm(`هل أنت متأكد من ${action} لهذا المستخدم؟\nسيتم منع المستخدم من الدخول إذا تم حظره.`)) {
         return;
     }

     try {
        await updateDoc(doc(db, "users", userId), {
           status: currentStatus === 'active' || !currentStatus ? 'banned' : 'active'
        });
        alert(`تم ${action} المستخدم بنجاح`);
     } catch(e) { alert("حدث خطأ"); }
  };

  const handleDeleteUserAccount = async (targetUser: User) => {
      // Prevent deleting self
      if (targetUser.id === currentUser.id) {
          alert("لا يمكنك حذف حسابك من لوحة التحكم.");
          return;
      }
      
      // Prevent deleting other admins
      if (targetUser.isAdmin) {
          alert("❌ خطأ: لا يمكن حذف حساب مسؤول آخر.");
          return;
      }

      if (confirm(`⚠️ تحذير نهائي!\nهل أنت متأكد من حذف حساب المستخدم: "${targetUser.name}" نهائياً؟\n\n- سيتم حذف جميع بياناته (الكوينز، المستوى، ID).\n- لا يمكن التراجع عن هذا الإجراء.`)) {
          // Double Confirm
          if(confirm("تأكيد أخير: هل أنت متأكد؟")) {
            try {
                await deleteDoc(doc(db, "users", targetUser.id));
                alert("تم حذف حساب المستخدم وبياناته بنجاح.");
            } catch(e) {
                console.error(e);
                alert("حدث خطأ أثناء الحذف.");
            }
          }
      }
  };

  const handleZeroCoins = async (targetUser: User) => {
      // Admin Check
      if (targetUser.isAdmin && targetUser.id !== currentUser.id) {
          alert("لا يمكن تصفير كوينز مشرف آخر.");
          return;
      }

      if (confirm(`⚠️ تحذير!\nهل أنت متأكد من تصفير جميع الكوينزات للمستخدم: ${targetUser.name}؟\nالرصيد الحالي: ${targetUser.coins}\n\nسيصبح الرصيد 0. لا يمكن التراجع عن هذا الإجراء.`)) {
          try {
              await updateDoc(doc(db, "users", targetUser.id), { coins: 0 });
              alert("تم تصفير الكوينز بنجاح.");
          } catch(e) {
              console.error(e);
              alert("فشل تصفير الكوينز.");
          }
      }
  };

  // Charge Logic
  const openChargeModal = (user: any) => {
     setSelectedUserForCharge(user);
     setChargeAmount('');
     setChargeProof(''); 
     setChargeModalOpen(true);
  };

  // ID Change Logic
  const openIdChangeModal = (user: any) => {
    setSelectedUserForIdChange(user);
    setNewIdValue(user.customId ? user.customId.toString() : '');
    setIsNewIdSpecial(user.isSpecialId || false);
    setIdChangeModalOpen(true);
  };

  const handleConfirmIdChange = async () => {
    if (!selectedUserForIdChange || !newIdValue.trim()) return;
    
    // Convert to number for customId
    const numId = parseInt(newIdValue);
    if(isNaN(numId)) {
        alert("يجب أن يكون المعرف أرقام فقط");
        return;
    }

    try {
        await updateDoc(doc(db, "users", selectedUserForIdChange.id), {
            customId: numId,
            isSpecialId: isNewIdSpecial
        });
        alert(`تم تغيير المعرف المميز إلى ${numId}`);
        setIdChangeModalOpen(false);
    } catch(e) {
        alert("فشل تغيير المعرف");
    }
  };

  const handleSearchAndOpenCharge = () => {
    if (!searchIdInput.trim()) return;
    
    // Search by CUSTOM ID (the sequential number) string comparison
    let foundUser = localUsers.find(
       u => (u.customId && u.customId.toString() === searchIdInput) || u.id === searchIdInput
    );

    if (!foundUser) {
        alert("المستخدم غير موجود (تأكد من كتابة ID بشكل صحيح)");
        return;
    }

    if (foundUser) {
       setIdSearchModalOpen(false);
       setSearchIdInput('');
       openChargeModal(foundUser);
    }
  };

  const handleChargeProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
         if (event.target?.result) setChargeProof(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAdminBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            if (event.target?.result) {
                const result = event.target.result as string;
                await updateDoc(doc(db, "settings", "global"), { bannerImage: result });
                alert("تم تحديث البانر الرئيسي بنجاح");
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleItemImageUpload = (
      e: React.ChangeEvent<HTMLInputElement>, 
      setter: React.Dispatch<React.SetStateAction<any>>, 
      field: string
  ) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  // No compression - direct upload
                  setter((prev: any) => ({ ...prev, [field]: event.target.result }));
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleConfirmCharge = async () => {
    const amount = Number(chargeAmount);
    if (selectedUserForCharge && !isNaN(amount) && amount > 0) {
       try {
           await updateDoc(doc(db, "users", selectedUserForCharge.id), {
               coins: increment(amount)
           });
           alert(`تم شحن ${amount.toLocaleString()} كوينز للمستخدم ${selectedUserForCharge.name} بنجاح!`);
           setChargeModalOpen(false);
           setSelectedUserForCharge(null);
       } catch(e) {
           alert("حدث خطأ أثناء الشحن");
       }
    } else {
        alert("الرجاء إدخال مبلغ صحيح");
    }
  };

  // --- VIP Handlers ---
  const handleSaveVip = async () => {
    if (!editingVip) return;
    try {
        await setDoc(doc(db, "vip_levels", editingVip.level.toString()), editingVip);
        setEditingVip(null);
        alert("تم حفظ مستوى VIP");
    } catch(e) { alert("فشل الحفظ. الصورة قد تكون كبيرة جداً."); }
  };

  // --- Gift Handlers ---
  const handleSaveGift = async () => {
    if (!editingGift || !editingGift.name || !editingGift.cost) return;
    
    const giftId = editingGift.id || Date.now().toString();
    const newGift: Gift = {
        id: giftId,
        name: editingGift.name!,
        cost: Number(editingGift.cost),
        icon: editingGift.icon || '🎁',
        animationType: editingGift.animationType || 'pop',
        isLucky: editingGift.isLucky || false
    };

    try {
        await setDoc(doc(db, "gifts", giftId), newGift);
        setEditingGift(null);
        alert("تم حفظ الهدية ونشرها");
    } catch(e) { alert("فشل الحفظ. الصورة كبيرة جداً."); }
  };

  const handleDeleteGift = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الهدية نهائياً؟')) {
        await deleteDoc(doc(db, "gifts", id));
    }
  };

  // --- Store Handlers ---
  const handleSaveStoreItem = async () => {
    if (!editingStoreItem || !editingStoreItem.name || !editingStoreItem.price) return;
    
    const itemId = editingStoreItem.id || `item_${Date.now()}`;
    
    // Explicitly defining type to ensure it saves correctly for filters
    const newItem: StoreItem = {
        id: itemId,
        name: editingStoreItem.name!,
        price: Number(editingStoreItem.price),
        type: editingStoreItem.type || 'frame', // Default to frame if missing
        url: editingStoreItem.url || ''
    };

    try {
        await setDoc(doc(db, "store_items", itemId), newItem);
        setEditingStoreItem(null);
        alert("تم حفظ العنصر في المتجر بنجاح! سيظهر لجميع المستخدمين.");
    } catch(e) { 
        console.error(e);
        alert("فشل الحفظ. الصورة كبيرة جداً لقاعدة البيانات المباشرة (الحد الأقصى 1MB). حاول رفع صورة أصغر."); 
    }
  };

  const handleDeleteStoreItem = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العنصر من المتجر؟')) {
        await deleteDoc(doc(db, "store_items", id));
    }
  };

  // --- Game Settings Handler ---
  const handleUpdateGameSettings = async (newSettings: GameSettings) => {
     try {
         await updateDoc(doc(db, "settings", "global"), { gameSettings: newSettings });
     } catch(e) { console.error(e); }
  };

  // --- Sidebar Component ---
  const SidebarItem = ({ id, icon: Icon, label }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all whitespace-nowrap ${
        activeTab === id 
          ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-900/20' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      } md:w-full w-auto`}
    >
      <Icon size={20} className="flex-shrink-0" />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col font-cairo overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-slate-900/50 backdrop-blur shrink-0">
         <div className="flex items-center gap-3">
            <div className="bg-red-600 p-1.5 rounded-lg">
               <ShieldAlert size={20} className="text-white" />
            </div>
            <div>
               <h1 className="font-bold text-lg leading-none">لوحة القيادة</h1>
               <span className="text-[10px] text-slate-400">Admin Control Panel v2.5</span>
            </div>
         </div>
         <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition">
            <X size={20} className="text-slate-400" />
         </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
         {/* Sidebar */}
         <div className="w-full md:w-64 border-b md:border-b-0 md:border-l border-white/5 p-2 md:p-4 flex flex-row md:flex-col gap-2 bg-slate-900/20 overflow-x-auto scrollbar-hide flex-shrink-0">
            <SidebarItem id="dashboard" icon={LayoutDashboard} label="الرئيسية" />
            <SidebarItem id="users" icon={Users} label="المستخدمين" />
            <SidebarItem id="rooms" icon={Radio} label="الغرف" />
            
            {/* Added Missing Items */}
            <SidebarItem id="vip" icon={Crown} label="VIP" />
            <SidebarItem id="gifts" icon={GiftIcon} label="الهدايا" />
            <SidebarItem id="store" icon={ShoppingBag} label="المتجر" />
            <SidebarItem id="games" icon={Gamepad2} label="الألعاب" />
            
            <SidebarItem id="settings" icon={Settings} label="النظام" />
         </div>

         {/* Content Area */}
         <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950 relative">
            
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 {/* Stats Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={64} /></div>
                       <h3 className="text-slate-400 text-xs font-bold">إجمالي المستخدمين (DB)</h3>
                       <p className="text-2xl font-black mt-1 text-white">{localUsers.length}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><Radio size={64} /></div>
                       <h3 className="text-slate-400 text-xs font-bold">الغرف النشطة</h3>
                       <p className="text-2xl font-black mt-1 text-amber-400">{rooms.length}</p>
                    </div>
                 </div>
              </motion.div>
            )}

            {/* ROOMS MANAGEMENT TAB - ADDED HERE */}
            {activeTab === 'rooms' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-white flex items-center gap-2">
                        <Radio size={20} className="text-orange-500" /> إدارة الغرف النشطة
                     </h3>
                     <div className="bg-slate-900 px-3 py-1 rounded-lg text-xs text-slate-400 border border-white/5">
                        {rooms.length} غرفة نشطة
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {rooms.map((room) => (
                        <div key={room.id} className="bg-slate-900 p-3 rounded-xl border border-white/5 flex gap-3 items-center group relative overflow-hidden">
                           {/* Background Blur */}
                           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent z-0"></div>
                           <img src={room.thumbnail} className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-10 z-0" />

                           {/* Content */}
                           <div className="w-16 h-16 rounded-lg bg-black overflow-hidden flex-shrink-0 relative z-10 border border-white/10">
                              <img src={room.thumbnail} className="w-full h-full object-cover" />
                           </div>

                           <div className="flex-1 min-w-0 z-10">
                              <h4 className="font-bold text-white text-sm truncate">{room.title}</h4>
                              <p className="text-xs text-slate-400 font-mono">ID: {room.id}</p>
                              <div className="flex items-center gap-3 mt-1">
                                 <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                                    {room.category}
                                 </span>
                                 <span className="text-[10px] flex items-center gap-1 text-slate-400">
                                    <Users size={10} /> {room.listeners}
                                 </span>
                                 <span className="text-[10px] flex items-center gap-1 text-green-400">
                                    <Mic size={10} /> {room.speakers.length}
                                 </span>
                              </div>
                           </div>

                           {/* Delete Action */}
                           <button 
                              onClick={() => handleDeleteRoom(room.id)}
                              className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition z-10 border border-red-500/20"
                              title="حذف الغرفة وإغلاقها"
                           >
                              <Trash2 size={18} />
                           </button>
                        </div>
                     ))}
                     
                     {rooms.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
                           <Radio size={40} className="mb-2 opacity-50" />
                           <p className="text-sm">لا توجد غرف نشطة حالياً</p>
                        </div>
                     )}
                  </div>
               </motion.div>
            )}

            {/* VIP Tab */}
            {activeTab === 'vip' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                   <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                     <Crown size={20} className="text-amber-500" /> مستويات VIP
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {vipLevels.map((vip) => (
                        <div key={vip.level} className="bg-slate-900 p-4 rounded-xl border border-white/5 flex items-center gap-3 md:gap-4">
                           <img src={vip.frameUrl} className="w-12 h-12 md:w-16 md:h-16 object-contain flex-shrink-0" alt={vip.name} />
                           <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-base md:text-lg text-white truncate">{vip.name} (Lv.{vip.level})</h4>
                              <p className="text-yellow-400 font-bold text-xs md:text-sm">{vip.cost.toLocaleString()} 🪙</p>
                           </div>
                           <button 
                              onClick={() => setEditingVip(vip)}
                              className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition flex-shrink-0"
                           >
                              <Edit2 size={16} className="text-slate-400" />
                           </button>
                        </div>
                     ))}
                  </div>

                  {/* VIP Edit Modal */}
                  {editingVip && (
                     <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-amber-500/50 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                           <h3 className="font-bold text-lg text-white">تعديل {editingVip.name}</h3>
                           <div>
                              <label className="text-xs text-slate-400">الاسم</label>
                              <input 
                                 value={editingVip.name} 
                                 onChange={e => setEditingVip({...editingVip, name: e.target.value})}
                                 className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white"
                              />
                           </div>
                           <div>
                              <label className="text-xs text-slate-400">السعر</label>
                              <input 
                                 type="number"
                                 value={editingVip.cost} 
                                 onChange={e => setEditingVip({...editingVip, cost: Number(e.target.value)})}
                                 className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white"
                              />
                           </div>
                           
                           {/* Upload VIP Image Section */}
                           <div>
                              <label className="text-xs text-slate-400 mb-2 block">صورة الإطار</label>
                              <div className="flex gap-4 items-start">
                                 {/* Preview */}
                                 <div className="w-16 h-16 bg-slate-800 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                     {editingVip.frameUrl ? (
                                        <img src={editingVip.frameUrl} className="w-full h-full object-contain" alt="Preview" />
                                     ) : (
                                        <Crown className="text-slate-600" />
                                     )}
                                 </div>

                                 {/* Upload Control */}
                                 <div className="flex-1">
                                     <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-white/10 rounded-xl hover:border-amber-500/50 hover:bg-amber-500/10 transition-colors cursor-pointer bg-slate-800">
                                         <div className="flex items-center gap-2 text-slate-400">
                                            <Upload size={14} />
                                            <span className="text-xs font-bold">رفع صورة</span>
                                         </div>
                                         <input 
                                            type="file" 
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleItemImageUpload(e, setEditingVip, 'frameUrl')}
                                         />
                                     </label>
                                     <p className="text-[9px] text-slate-500 mt-1">يتم رفع الصورة بجودتها الأصلية</p>
                                 </div>
                              </div>
                           </div>

                           <div>
                              <label className="text-xs text-slate-400">رابط الإطار (أو تم الرفع)</label>
                              <input 
                                 value={editingVip.frameUrl} 
                                 onChange={e => setEditingVip({...editingVip, frameUrl: e.target.value})}
                                 className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white text-xs truncate"
                                 placeholder="https://..."
                              />
                           </div>

                           <div className="flex gap-2 pt-2">
                              <button onClick={() => setEditingVip(null)} className="flex-1 bg-slate-700 py-2 rounded-lg text-sm">إلغاء</button>
                              <button onClick={handleSaveVip} className="flex-1 bg-amber-500 text-black py-2 rounded-lg text-sm font-bold">حفظ</button>
                           </div>
                        </div>
                     </div>
                  )}
               </motion.div>
            )}

            {/* Gifts Tab */}
            {activeTab === 'gifts' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-white flex items-center gap-2">
                        <GiftIcon size={20} className="text-pink-500" /> إدارة الهدايا
                     </h3>
                     <button 
                        onClick={() => setEditingGift({})} 
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                     >
                        <Plus size={14} /> إضافة
                     </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                     {gifts.map((gift) => (
                        <div key={gift.id} className="bg-slate-900 p-3 md:p-4 rounded-xl border border-white/5 flex flex-col items-center gap-2 relative group">
                           {gift.isLucky && (
                              <div className="absolute top-0 right-0 z-0 text-white/10 -rotate-12">
                                 <Clover size={60} />
                              </div>
                           )}
                           
                           <button 
                              onClick={() => handleDeleteGift(gift.id)}
                              className="absolute top-2 left-2 p-1.5 md:p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 opacity-100 z-10"
                              title="حذف الهدية"
                           >
                              <Trash2 size={12} />
                           </button>
                           <button 
                              onClick={() => setEditingGift(gift)}
                              className="absolute top-2 right-2 p-1.5 md:p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 opacity-100 z-10"
                           >
                              <Edit2 size={12} />
                           </button>
                           
                           <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-3xl my-2 relative z-0">
                              {gift.icon.startsWith('http') || gift.icon.startsWith('data:') ? <img src={gift.icon} className="w-full h-full object-contain" /> : gift.icon}
                           </div>
                           <div className="text-center relative z-0 w-full">
                              <h4 className="font-bold text-xs md:text-sm text-white flex items-center justify-center gap-1 truncate w-full">
                                 {gift.name}
                                 {gift.isLucky && <Clover size={10} className="text-green-500 flex-shrink-0" fill="currentColor" />}
                              </h4>
                              <p className="text-yellow-400 font-bold text-xs">{gift.cost} 🪙</p>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Gift Edit Modal */}
                  {editingGift && (
                     <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-pink-500/50 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                           <h3 className="font-bold text-lg text-white">{editingGift.id ? 'تعديل الهدية' : 'إضافة هدية جديدة'}</h3>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-xs text-slate-400">الاسم</label>
                                 <input 
                                    value={editingGift.name || ''} 
                                    onChange={e => setEditingGift({...editingGift, name: e.target.value})}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white"
                                 />
                              </div>
                              <div>
                                 <label className="text-xs text-slate-400">السعر</label>
                                 <input 
                                    type="number"
                                    value={editingGift.cost || ''} 
                                    onChange={e => setEditingGift({...editingGift, cost: Number(e.target.value)})}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white"
                                 />
                              </div>
                           </div>
                           
                           <div>
                              <label className="text-xs text-slate-400 mb-2 block">صورة الهدية</label>
                              <div className="flex gap-4 items-start">
                                 {/* Preview */}
                                 <div className="w-16 h-16 bg-slate-800 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                     {editingGift.icon ? (
                                        (editingGift.icon.startsWith('http') || editingGift.icon.startsWith('data:')) ? 
                                          <img src={editingGift.icon} className="w-full h-full object-contain" /> : 
                                          <span className="text-3xl">{editingGift.icon}</span>
                                     ) : (
                                        <GiftIcon className="text-slate-600" />
                                     )}
                                 </div>

                                 {/* Upload Control */}
                                 <div className="flex-1">
                                     <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-white/10 rounded-xl hover:border-pink-500/50 hover:bg-pink-500/10 transition-colors cursor-pointer bg-slate-800">
                                         <div className="flex items-center gap-2 text-slate-400">
                                            <Upload size={14} />
                                            <span className="text-xs font-bold">رفع صورة</span>
                                         </div>
                                         <input 
                                            type="file" 
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleItemImageUpload(e, setEditingGift, 'icon')}
                                         />
                                     </label>
                                     <p className="text-[9px] text-slate-500 mt-1">يتم رفع الصورة بجودتها الأصلية</p>
                                 </div>
                              </div>
                           </div>

                           <div>
                              <label className="text-xs text-slate-400">نوع الحركة</label>
                              <select 
                                 value={editingGift.animationType || 'pop'}
                                 onChange={e => setEditingGift({...editingGift, animationType: e.target.value as any})}
                                 className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white text-xs"
                              >
                                 <option value="pop">بسيط (Pop)</option>
                                 <option value="fly">طيران (Fly)</option>
                                 <option value="full-screen">شاشة كاملة (Full Screen)</option>
                              </select>
                           </div>

                           {/* Lucky Gift Toggle */}
                           <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-white/5">
                              <div 
                                 onClick={() => setEditingGift({...editingGift, isLucky: !editingGift.isLucky})}
                                 className={`w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors flex-shrink-0 ${editingGift.isLucky ? 'bg-green-500 justify-end' : 'bg-slate-600 justify-start'}`}
                              >
                                 <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                              </div>
                              <div className="flex-1">
                                 <span className="text-sm font-bold text-white block flex items-center gap-1">هدية حظ <Clover size={14} className="text-green-500" /></span>
                                 <span className="text-[10px] text-slate-400 block">قد يربح المرسل كوينز</span>
                              </div>
                           </div>

                           <div className="flex gap-2 pt-2">
                              <button onClick={() => setEditingGift(null)} className="flex-1 bg-slate-700 py-2 rounded-lg text-sm">إلغاء</button>
                              <button onClick={handleSaveGift} className="flex-1 bg-pink-500 text-white py-2 rounded-lg text-sm font-bold">حفظ</button>
                           </div>
                        </div>
                     </div>
                  )}
               </motion.div>
            )}

            {/* Store Tab */}
            {activeTab === 'store' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-white flex items-center gap-2">
                        <ShoppingBag size={20} className="text-blue-500" /> المتجر
                     </h3>
                     <button 
                        onClick={() => setEditingStoreItem({ type: 'frame' })} 
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                     >
                        <Plus size={14} /> إضافة عنصر
                     </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                     {storeItems.map((item) => (
                        <div key={item.id} className="bg-slate-900 p-3 md:p-4 rounded-xl border border-white/5 flex flex-col items-center gap-3 relative group">
                           <div className="absolute top-2 right-2 flex gap-1 opacity-100 z-10">
                              <button onClick={() => setEditingStoreItem(item)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"><Edit2 size={12} /></button>
                              <button onClick={() => handleDeleteStoreItem(item.id)} className="p-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-600" title="حذف"><Trash2 size={12} /></button>
                           </div>

                           <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center overflow-hidden border border-white/5 mt-4">
                              {item.type === 'frame' ? (
                                 <img src={item.url} className="w-full h-full object-contain" />
                              ) : (
                                 <div className="w-12 h-8 rounded text-[8px] flex items-center justify-center text-white" style={{ background: `url(${item.url}) center/cover` }}>تجربة</div>
                              )}
                           </div>
                           <div className="text-center w-full">
                              <h4 className="font-bold text-xs md:text-sm text-white truncate w-full">{item.name}</h4>
                              <p className="text-[10px] text-slate-400">{item.type === 'frame' ? 'إطار' : 'فقاعة'}</p>
                              <p className="text-yellow-400 font-bold text-xs mt-1">{item.price} 🪙</p>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Store Edit Modal */}
                  {editingStoreItem && (
                     <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-blue-500/50 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                           <h3 className="font-bold text-lg text-white">{editingStoreItem.id ? 'تعديل العنصر' : 'إضافة عنصر جديد'}</h3>
                           
                           <div>
                              <label className="text-xs text-slate-400">الاسم</label>
                              <input 
                                 value={editingStoreItem.name || ''} 
                                 onChange={e => setEditingStoreItem({...editingStoreItem, name: e.target.value})}
                                 className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white"
                              />
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-xs text-slate-400">النوع</label>
                                 <select 
                                    value={editingStoreItem.type || 'frame'}
                                    onChange={e => setEditingStoreItem({...editingStoreItem, type: e.target.value as ItemType})}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white text-xs"
                                 >
                                    <option value="frame">إطار (Frame)</option>
                                    <option value="bubble">فقاعة (Bubble)</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="text-xs text-slate-400">السعر</label>
                                 <input 
                                    type="number"
                                    value={editingStoreItem.price || ''} 
                                    onChange={e => setEditingStoreItem({...editingStoreItem, price: Number(e.target.value)})}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white"
                                 />
                              </div>
                           </div>

                           <div>
                              <label className="text-xs text-slate-400 mb-2 block">صورة العنصر</label>
                              <div className="flex gap-4 items-start">
                                 {/* Preview */}
                                 <div className="w-16 h-16 bg-slate-800 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                     {editingStoreItem.url ? (
                                        <img src={editingStoreItem.url} className="w-full h-full object-contain" />
                                     ) : (
                                        <ImageIcon className="text-slate-600" />
                                     )}
                                 </div>

                                 {/* Upload Control */}
                                 <div className="flex-1">
                                     <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-white/10 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors cursor-pointer bg-slate-800">
                                         <div className="flex items-center gap-2 text-slate-400">
                                            <Upload size={14} />
                                            <span className="text-xs font-bold">رفع صورة</span>
                                         </div>
                                         <input 
                                            type="file" 
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleItemImageUpload(e, setEditingStoreItem, 'url')}
                                         />
                                     </label>
                                     <p className="text-[9px] text-slate-500 mt-1">يتم رفع الصورة بجودتها الأصلية</p>
                                 </div>
                              </div>
                           </div>

                           <div className="flex gap-2 pt-2">
                              <button onClick={() => setEditingStoreItem(null)} className="flex-1 bg-slate-700 py-2 rounded-lg text-sm">إلغاء</button>
                              <button onClick={handleSaveStoreItem} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold">حفظ ونشر</button>
                           </div>
                        </div>
                     </div>
                  )}
               </motion.div>
            )}

            {/* Games Tab */}
             {activeTab === 'games' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                     <Gamepad2 size={20} className="text-green-500" /> إعدادات ألعاب الكازينو
                  </h3>
                   
                   <div className="bg-slate-900 p-4 md:p-6 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-4 bg-slate-950 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                           <span className="text-2xl">🎰</span>
                           <div>
                              <h4 className="font-bold text-white">ماكينة الخضار</h4>
                              <p className="text-[10px] text-slate-400">نسبة الربح (Slots)</p>
                           </div>
                        </div>
                        <div>
                           <div className="flex justify-between items-center mb-2">
                              <label className="text-xs font-bold text-slate-300">نسبة الفوز</label>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${gameSettings.slotsWinRate > 40 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                 {gameSettings.slotsWinRate}%
                              </span>
                           </div>
                           <input 
                              type="range" min="0" max="100" step="5"
                              value={gameSettings.slotsWinRate}
                              onChange={(e) => handleUpdateGameSettings({...gameSettings, slotsWinRate: Number(e.target.value)})}
                              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                           />
                        </div>
                     </div>
                     <div className="p-4 bg-slate-950 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                           <span className="text-2xl">🎡</span>
                           <div>
                              <h4 className="font-bold text-white">عجلة الحظ</h4>
                              <p className="text-[10px] text-slate-400">نسبة الربح (Wheel)</p>
                           </div>
                        </div>
                        <div>
                           <div className="flex justify-between items-center mb-2">
                              <label className="text-xs font-bold text-slate-300">نسبة الفوز</label>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${gameSettings.wheelWinRate > 40 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                 {gameSettings.wheelWinRate}%
                              </span>
                           </div>
                           <input 
                              type="range" min="0" max="100" step="5"
                              value={gameSettings.wheelWinRate}
                              onChange={(e) => handleUpdateGameSettings({...gameSettings, wheelWinRate: Number(e.target.value)})}
                              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                           />
                        </div>
                     </div>
                     
                     {/* Lucky Gift Settings */}
                     <div className="p-4 bg-slate-950 rounded-xl border border-white/5 md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                           <span className="text-2xl text-green-500"><Clover size={32} /></span>
                           <div>
                              <h4 className="font-bold text-white">إعدادات هدايا الحظ (Lucky Gifts)</h4>
                              <p className="text-[10px] text-slate-400">التحكم في نسب الفوز والمردود عند إرسال هدايا الحظ</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <div className="flex justify-between items-center mb-2">
                                 <label className="text-xs font-bold text-slate-300">نسبة فوز المستخدم (Win Rate)</label>
                                 <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400">
                                    {gameSettings.luckyGiftWinRate}%
                                 </span>
                              </div>
                              <input 
                                 type="range" min="0" max="100" step="5"
                                 value={gameSettings.luckyGiftWinRate}
                                 onChange={(e) => handleUpdateGameSettings({...gameSettings, luckyGiftWinRate: Number(e.target.value)})}
                                 className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                              />
                           </div>
                           <div>
                              <div className="flex justify-between items-center mb-2">
                                 <label className="text-xs font-bold text-slate-300">نسبة المردود (Return Multiplier)</label>
                                 <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400">
                                    {gameSettings.luckyGiftRefundPercent}% (x{gameSettings.luckyGiftRefundPercent / 100})
                                 </span>
                              </div>
                              <input 
                                 type="range" min="0" max="1000" step="10"
                                 value={gameSettings.luckyGiftRefundPercent}
                                 onChange={(e) => handleUpdateGameSettings({...gameSettings, luckyGiftRefundPercent: Number(e.target.value)})}
                                 className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                              />
                           </div>
                        </div>
                     </div>
                   </div>
               </motion.div>
            )}

            {activeTab === 'users' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-2 mb-2">
                     <div className="flex-1 flex gap-2 bg-slate-900 p-2 rounded-xl border border-white/5">
                        <Search className="text-slate-500 ml-2" />
                        <input type="text" placeholder="بحث عن مستخدم..." className="bg-transparent w-full outline-none text-sm" />
                     </div>
                     <button 
                        onClick={() => setIdSearchModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-sm whitespace-nowrap"
                     >
                        <Wallet size={16} /> شحن عبر ID
                     </button>
                  </div>
                  
                  <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden overflow-x-auto">
                     <table className="w-full text-right text-xs min-w-[600px]">
                        <thead className="bg-white/5 text-slate-400 font-bold">
                           <tr>
                              <th className="p-3">المستخدم</th>
                              <th className="p-3">ID / المميز</th>
                              <th className="p-3">الرصيد</th>
                              <th className="p-3">الحالة</th>
                              <th className="p-3">تحكم</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {localUsers.map(u => (
                              <tr key={u.id}>
                                 <td className="p-3 font-bold flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-700 flex-shrink-0"></div>
                                    <span className="truncate max-w-[100px]">{u.name}</span>
                                    {u.isAdmin && <span className="bg-red-500 text-white text-[8px] px-1 rounded">ADMIN</span>}
                                 </td>
                                 <td className="p-3 font-mono text-slate-500">
                                    <div className="flex flex-col">
                                       {u.customId && (
                                          <div className="flex items-center gap-1 text-amber-400 font-bold">
                                             <Sparkles size={10} />
                                             <span>{u.customId}</span>
                                          </div>
                                       )}
                                       <span className="text-[8px] opacity-50">{u.id}</span>
                                    </div>
                                 </td>
                                 <td className="p-3 text-yellow-400 font-mono">{u.coins.toLocaleString()}</td>
                                 <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                       {u.status === 'active' ? 'نشط' : 'محظور'}
                                    </span>
                                 </td>
                                 <td className="p-3">
                                    <div className="flex gap-2">
                                       {/* Ban Button Logic: Hide if user is Admin */}
                                       {u.isAdmin ? (
                                           <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded cursor-not-allowed" title="حساب محصن (Admin)">
                                              <Shield size={14} />
                                           </div>
                                       ) : (
                                           <button 
                                              onClick={() => handleBanUser(u.id, u.status as string)} 
                                              className={`p-1.5 rounded hover:opacity-80 ${u.status === 'active' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}
                                              title={u.status === 'active' ? 'حظر المستخدم' : 'فك الحظر'}
                                           >
                                              <Ban size={14} />
                                           </button>
                                       )}
                                       
                                       <button 
                                          onClick={() => openChargeModal(u)} 
                                          className="p-1.5 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 flex items-center gap-1 font-bold"
                                          title="شحن رصيد"
                                       >
                                          <Coins size={14} />
                                       </button>

                                       {/* Reset Coins Button */}
                                       <button 
                                          onClick={() => handleZeroCoins(u)}
                                          className="p-1.5 bg-orange-500/10 text-orange-400 rounded hover:bg-orange-500/20 flex items-center gap-1 font-bold"
                                          title="تصفير الكوينز (Reset Coins)"
                                       >
                                          <RotateCcw size={14} />
                                       </button>

                                       <button 
                                          onClick={() => openIdChangeModal(u)} 
                                          className="p-1.5 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 flex items-center gap-1 font-bold"
                                          title="تغيير المعرف"
                                       >
                                          <Hash size={14} />
                                       </button>

                                       {/* Delete Account Button */}
                                       {!u.isAdmin && (
                                          <button 
                                             onClick={() => handleDeleteUserAccount(u)}
                                             className="p-1.5 bg-red-900/20 text-red-500 rounded hover:bg-red-900/40 flex items-center gap-1 font-bold border border-red-500/20"
                                             title="حذف الحساب نهائياً"
                                          >
                                             <UserX size={14} />
                                          </button>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </motion.div>
            )}

         </div>
      </div>
      
      {/* Search ID Modal */}
       <AnimatePresence>
         {idSearchModalOpen && (
             <div className="absolute inset-0 z-[105] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIdSearchModalOpen(false)}>
                 <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="bg-slate-900 w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-6"
                 onClick={e => e.stopPropagation()}
               >
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-lg text-white flex items-center gap-2"><Wallet size={20} className="text-green-500"/> شحن عبر المعرف (ID)</h3>
                     <button onClick={() => setIdSearchModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <label className="text-xs text-slate-400 mb-1 block">أدخل رقم المعرف المميز</label>
                        <input 
                           type="number" 
                           value={searchIdInput}
                           onChange={(e) => setSearchIdInput(e.target.value)}
                           placeholder="مثال: 10001"
                           className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-sm focus:border-green-500 outline-none font-mono"
                           autoFocus
                        />
                     </div>
                     <button 
                        onClick={handleSearchAndOpenCharge}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                     >
                        بحث ومتابعة <ArrowRight size={16} />
                     </button>
                  </div>
               </motion.div>
             </div>
         )}
      </AnimatePresence>
      
      {/* Charge Modal */}
      <AnimatePresence>
        {chargeModalOpen && selectedUserForCharge && (
           <div className="absolute inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setChargeModalOpen(false)}>
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="bg-slate-900 w-full max-w-sm rounded-2xl border border-yellow-500/30 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                 onClick={e => e.stopPropagation()}
              >
                 <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                             <Coins size={24} /> شحن رصيد
                          </h3>
                          <p className="text-sm text-slate-400 mt-1">
                             للمستخدم: <span className="text-white font-bold">{selectedUserForCharge.name}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                             ID: {selectedUserForCharge.customId || selectedUserForCharge.id}
                          </p>
                       </div>
                       <button onClick={() => setChargeModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                    </div>
                    <div className="bg-slate-950 rounded-xl p-4 border border-white/5 mb-4 text-center">
                       <p className="text-xs text-slate-500 mb-1">الرصيد الحالي</p>
                       <p className="text-2xl font-mono font-bold text-white">{selectedUserForCharge.coins.toLocaleString()}</p>
                    </div>
                    <div className="space-y-4">
                       <div>
                          <label className="text-xs text-slate-400 mb-1 block">أدخل مبلغ الشحن</label>
                          <input 
                             type="number" 
                             value={chargeAmount}
                             onChange={(e) => setChargeAmount(e.target.value)}
                             placeholder="0.00"
                             className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-lg font-bold text-white focus:border-yellow-500 outline-none text-center"
                             autoFocus
                          />
                       </div>
                       <div className="grid grid-cols-3 gap-2">
                          {[1000, 5000, 10000, 50000, 100000, 500000].map(amt => (
                             <button 
                                key={amt}
                                onClick={() => setChargeAmount(amt.toString())}
                                className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-xs font-bold text-yellow-500/80 border border-white/5"
                             >
                                +{amt.toLocaleString()}
                             </button>
                          ))}
                       </div>
                       <button 
                          onClick={handleConfirmCharge}
                          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl mt-2 flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/20"
                       >
                          <CheckCircle size={18} /> تأكيد الشحن
                       </button>
                    </div>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* ID Change Modal */}
      <AnimatePresence>
        {idChangeModalOpen && selectedUserForIdChange && (
            <div className="absolute inset-0 z-[115] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIdChangeModalOpen(false)}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-900 w-full max-w-sm rounded-2xl border border-purple-500/30 shadow-2xl p-6 space-y-5"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Hash className="text-purple-500" /> تغيير المعرف المميز
                        </h3>
                        <button onClick={() => setIdChangeModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                    </div>

                    <div>
                        <p className="text-sm text-slate-400 mb-4">
                            تغيير المعرف للمستخدم: <span className="text-white font-bold">{selectedUserForIdChange.name}</span>
                        </p>
                        
                        <label className="text-xs text-slate-400 mb-1 block">المعرف الجديد (أرقام فقط)</label>
                        <input 
                            type="number" 
                            value={newIdValue}
                            onChange={(e) => setNewIdValue(e.target.value)}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-purple-500 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-white/5">
                        <div 
                            onClick={() => setIsNewIdSpecial(!isNewIdSpecial)}
                            className={`w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${isNewIdSpecial ? 'bg-amber-500 justify-end' : 'bg-slate-600 justify-start'}`}
                        >
                            <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                        </div>
                        <div className="flex-1">
                            <span className="text-sm font-bold text-white block">ID مميز (ذهبي)</span>
                            <span className="text-[10px] text-slate-400 block">سيظهر المعرف بلون وشكل مميز</span>
                        </div>
                        {isNewIdSpecial && <Sparkles className="text-amber-400 animate-pulse" size={16} />}
                    </div>

                    <button 
                        onClick={handleConfirmIdChange}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-900/30"
                    >
                        حفظ التغييرات
                    </button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
