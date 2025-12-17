import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Radio, Settings, X, Search, 
  MoreVertical, Ban, Trash2, ShieldAlert, CheckCircle, 
  Coins, Crown, BarChart3, Bell, Power, Edit2, Save, Image as ImageIcon, Upload, Gift as GiftIcon, Plus, Wallet, ArrowRight, ShoppingBag, FileText, Gamepad2, Hash, Sparkles
} from 'lucide-react';
import { Room, User, UserLevel, VIPPackage, Gift, StoreItem, GameSettings, ItemType } from '../types';

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

// Mock data for the user table (since we only have one real user in state)
const MOCK_ALL_USERS = [
  { id: 'u1', name: 'الملك', level: UserLevel.DIAMOND, coins: 500000, status: 'active', ip: '192.168.1.1', isSpecialId: true },
  { id: 'u2', name: 'سارة', level: UserLevel.GOLD, coins: 12000, status: 'active', ip: '192.168.1.2', isSpecialId: false },
  { id: 'u3', name: 'GamerPro', level: UserLevel.BRONZE, coins: 500, status: 'banned', ip: '192.168.1.55', isSpecialId: false },
  { id: 'u4', name: 'ضيف 102', level: UserLevel.NEW, coins: 0, status: 'active', ip: '192.168.1.9', isSpecialId: false },
  { id: '829102', name: 'ضيف كريم', level: UserLevel.SILVER, coins: 50000, status: 'active', ip: '127.0.0.1', isSpecialId: false }, 
];

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, onClose, rooms, setRooms, currentUser, onUpdateUser, vipLevels, setVipLevels, gifts, setGifts, storeItems, setStoreItems, gameSettings, setGameSettings, bannerImage, setBannerImage
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
  const [chargeProof, setChargeProof] = useState<string>(''); // For the receipt image

  // State for ID Change Logic
  const [idChangeModalOpen, setIdChangeModalOpen] = useState(false);
  const [selectedUserForIdChange, setSelectedUserForIdChange] = useState<any | null>(null);
  const [newIdValue, setNewIdValue] = useState('');
  const [isNewIdSpecial, setIsNewIdSpecial] = useState(false);

  // State for ID Search Logic
  const [idSearchModalOpen, setIdSearchModalOpen] = useState(false);
  const [searchIdInput, setSearchIdInput] = useState('');

  const [localUsers, setLocalUsers] = useState([...MOCK_ALL_USERS, { 
    id: currentUser.id === 'me' ? '829102' : currentUser.id, // Ensure current user matches mock ID for searching
    name: currentUser.name, 
    level: currentUser.level, 
    coins: currentUser.coins, 
    status: 'active',
    ip: '127.0.0.1',
    isSpecialId: currentUser.isSpecialId || false
  }]);

  if (!isOpen) return null;

  // --- Handlers ---

  const handleDeleteRoom = (roomId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الغرفة وإغلاقها نهائياً؟')) {
      setRooms(prev => prev.filter(r => r.id !== roomId));
    }
  };

  const handleBanUser = (userId: string) => {
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'banned' ? 'active' : 'banned' } : u));
  };

  // Charge Logic
  const openChargeModal = (user: any) => {
     setSelectedUserForCharge(user);
     setChargeAmount('');
     setChargeProof(''); // Reset proof image
     setChargeModalOpen(true);
  };

  // ID Change Logic
  const openIdChangeModal = (user: any) => {
    setSelectedUserForIdChange(user);
    setNewIdValue(user.id);
    setIsNewIdSpecial(user.isSpecialId || false);
    setIdChangeModalOpen(true);
  };

  const handleConfirmIdChange = () => {
    if (!selectedUserForIdChange || !newIdValue.trim()) return;

    // Update Local Users List
    setLocalUsers(prev => prev.map(u => u.id === selectedUserForIdChange.id ? { ...u, id: newIdValue, isSpecialId: isNewIdSpecial } : u));
    
    // Check if it's the current user to update Global State
    if (selectedUserForIdChange.id === currentUser.id || selectedUserForIdChange.id === '829102' || selectedUserForIdChange.name === currentUser.name) {
       onUpdateUser({ ...currentUser, id: newIdValue, isSpecialId: isNewIdSpecial });
    }

    alert(`تم تغيير معرف المستخدم إلى ${newIdValue} ${isNewIdSpecial ? '(مميز)' : ''}`);
    setIdChangeModalOpen(false);
  };

  const handleSearchAndOpenCharge = () => {
    if (!searchIdInput.trim()) return;
    const foundUser = localUsers.find(
       u => u.id === searchIdInput || u.id === `u${searchIdInput}` || u.id === searchIdInput.replace('u', '')
    );
    if (foundUser) {
       setIdSearchModalOpen(false);
       setSearchIdInput('');
       openChargeModal(foundUser);
    } else {
       alert('لم يتم العثور على مستخدم بهذا المعرف (ID)');
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
      reader.onload = (event) => {
         if (event.target?.result) {
            setBannerImage(event.target.result as string);
            alert("تم تحديث البانر الرئيسي بنجاح");
         }
      };
      reader.readAsDataURL(file);
    }
  };

  // GENERIC IMAGE UPLOAD HANDLER FOR MODALS
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
                  setter((prev: any) => ({ ...prev, [field]: event.target.result }));
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleConfirmCharge = () => {
    const amount = Number(chargeAmount);
    if (selectedUserForCharge && !isNaN(amount) && amount > 0) {
       if (selectedUserForCharge.id === currentUser.id || selectedUserForCharge.id === '829102') {
          onUpdateUser({ ...currentUser, coins: currentUser.coins + amount });
       }
       setLocalUsers(prev => prev.map(u => u.id === selectedUserForCharge.id ? { ...u, coins: u.coins + amount } : u));
       alert(`تم شحن ${amount} كوينز للمستخدم ${selectedUserForCharge.name} بنجاح!`);
       setChargeModalOpen(false);
       setSelectedUserForCharge(null);
       setChargeProof('');
    }
  };

  // --- VIP Handlers ---
  const handleSaveVip = () => {
    if (!editingVip) return;
    setVipLevels(prev => prev.map(lvl => lvl.level === editingVip.level ? editingVip : lvl));
    setEditingVip(null);
  };

  // --- Gift Handlers ---
  const handleSaveGift = () => {
    if (!editingGift || !editingGift.name || !editingGift.cost) return;
    
    if (editingGift.id) {
       // Update existing
       setGifts(prev => prev.map(g => g.id === editingGift.id ? editingGift as Gift : g));
    } else {
       // Create new
       const newGift: Gift = {
          id: Date.now().toString(),
          name: editingGift.name!,
          cost: Number(editingGift.cost),
          icon: editingGift.icon || '🎁',
          animationType: editingGift.animationType || 'pop'
       };
       setGifts(prev => [...prev, newGift]);
    }
    setEditingGift(null);
  };

  const handleDeleteGift = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الهدية نهائياً؟')) setGifts(prev => prev.filter(g => g.id !== id));
  };

  // --- Store Handlers ---
  const handleSaveStoreItem = () => {
    if (!editingStoreItem || !editingStoreItem.name || !editingStoreItem.price) return;

    if (editingStoreItem.id) {
       // Update
       setStoreItems(prev => prev.map(i => i.id === editingStoreItem.id ? editingStoreItem as StoreItem : i));
    } else {
       // Create
       const newItem: StoreItem = {
          id: Date.now().toString(),
          name: editingStoreItem.name!,
          price: Number(editingStoreItem.price),
          type: editingStoreItem.type || 'frame',
          url: editingStoreItem.url || ''
       };
       setStoreItems(prev => [...prev, newItem]);
    }
    setEditingStoreItem(null);
  };

  const handleDeleteStoreItem = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العنصر من المتجر؟')) setStoreItems(prev => prev.filter(i => i.id !== id));
  };

  const SidebarItem = ({ id, icon: Icon, label }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 p-3 w-full rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-900/20' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col font-cairo overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur">
         <div className="flex items-center gap-3">
            <div className="bg-red-600 p-1.5 rounded-lg">
               <ShieldAlert size={20} className="text-white" />
            </div>
            <div>
               <h1 className="font-bold text-lg leading-none">لوحة القيادة</h1>
               <span className="text-[10px] text-slate-400">Admin Control Panel v2.2</span>
            </div>
         </div>
         <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition">
            <X size={20} className="text-slate-400" />
         </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
         {/* Sidebar */}
         <div className="w-20 lg:w-64 border-l border-white/5 p-4 flex flex-col gap-2 bg-slate-900/20">
            <SidebarItem id="dashboard" icon={LayoutDashboard} label="الرئيسية" />
            <SidebarItem id="users" icon={Users} label="المستخدمين" />
            <SidebarItem id="rooms" icon={Radio} label="الغرف" />
            <SidebarItem id="vip" icon={Crown} label="إعدادات VIP" />
            <SidebarItem id="gifts" icon={GiftIcon} label="الهدايا" />
            <SidebarItem id="store" icon={ShoppingBag} label="الحقيبة والمتجر" />
            <SidebarItem id="games" icon={Gamepad2} label="إعدادات الألعاب" />
            <SidebarItem id="settings" icon={Settings} label="النظام" />
         </div>

         {/* Content Area */}
         <div className="flex-1 overflow-y-auto p-6 bg-slate-950 relative">
            
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 {/* Stats Cards */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={64} /></div>
                       <h3 className="text-slate-400 text-xs font-bold">إجمالي المستخدمين</h3>
                       <p className="text-2xl font-black mt-1 text-white">{localUsers.length + 1420}</p>
                       <span className="text-[10px] text-green-400 flex items-center gap-1 mt-2">
                          <BarChart3 size={10} /> +12% هذا الأسبوع
                       </span>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><Radio size={64} /></div>
                       <h3 className="text-slate-400 text-xs font-bold">الغرف النشطة</h3>
                       <p className="text-2xl font-black mt-1 text-amber-400">{rooms.length}</p>
                       <span className="text-[10px] text-slate-500 mt-2">
                          سعة السيرفر: مستقرة
                       </span>
                    </div>
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
                        <div key={vip.level} className="bg-slate-900 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                           <img src={vip.frameUrl} className="w-16 h-16 object-contain" alt={vip.name} />
                           <div className="flex-1">
                              <h4 className="font-bold text-lg text-white">{vip.name} (Lv.{vip.level})</h4>
                              <p className="text-yellow-400 font-bold text-sm">{vip.cost.toLocaleString()} 🪙</p>
                           </div>
                           <button 
                              onClick={() => setEditingVip(vip)}
                              className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                           >
                              <Edit2 size={16} className="text-slate-400" />
                           </button>
                        </div>
                     ))}
                  </div>

                  {/* VIP Edit Modal */}
                  {editingVip && (
                     <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-amber-500/50 p-6 space-y-4">
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
                           <div>
                              <label className="text-xs text-slate-400">رابط الإطار</label>
                              <input 
                                 value={editingVip.frameUrl} 
                                 onChange={e => setEditingVip({...editingVip, frameUrl: e.target.value})}
                                 className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white text-xs"
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
                        <Plus size={14} /> إضافة هدية
                     </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {gifts.map((gift) => (
                        <div key={gift.id} className="bg-slate-900 p-4 rounded-xl border border-white/5 flex flex-col items-center gap-2 relative group">
                           <button 
                              onClick={() => handleDeleteGift(gift.id)}
                              className="absolute top-2 left-2 p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 opacity-100 transition-opacity z-10"
                              title="حذف الهدية"
                           >
                              <Trash2 size={14} />
                           </button>
                           <button 
                              onClick={() => setEditingGift(gift)}
                              className="absolute top-2 right-2 p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 opacity-100 transition-opacity"
                           >
                              <Edit2 size={14} />
                           </button>
                           
                           <div className="w-12 h-12 flex items-center justify-center text-3xl my-2">
                              {gift.icon.startsWith('http') || gift.icon.startsWith('data:') ? <img src={gift.icon} className="w-full h-full object-contain" /> : gift.icon}
                           </div>
                           <div className="text-center">
                              <h4 className="font-bold text-sm text-white">{gift.name}</h4>
                              <p className="text-yellow-400 font-bold text-xs">{gift.cost} 🪙</p>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Gift Edit Modal */}
                  {editingGift && (
                     <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-pink-500/50 p-6 space-y-4">
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
                                     <p className="text-[9px] text-slate-500 mt-1">اضغط لرفع صورة من جهازك</p>
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
                        <ShoppingBag size={20} className="text-blue-500" /> المتجر (إطارات وفقاعات)
                     </h3>
                     <button 
                        onClick={() => setEditingStoreItem({ type: 'frame' })} 
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                     >
                        <Plus size={14} /> إضافة عنصر
                     </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {storeItems.map((item) => (
                        <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-white/5 flex flex-col items-center gap-3 relative group">
                           <div className="absolute top-2 right-2 flex gap-1 opacity-100">
                              <button onClick={() => setEditingStoreItem(item)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"><Edit2 size={14} /></button>
                              <button onClick={() => handleDeleteStoreItem(item.id)} className="p-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-600" title="حذف"><Trash2 size={14} /></button>
                           </div>

                           <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center overflow-hidden border border-white/5 mt-4">
                              {item.type === 'frame' ? (
                                 <img src={item.url} className="w-full h-full object-contain" />
                              ) : (
                                 <div className="w-12 h-8 rounded text-[8px] flex items-center justify-center text-white" style={{ background: `url(${item.url}) center/cover` }}>تجربة</div>
                              )}
                           </div>
                           <div className="text-center">
                              <h4 className="font-bold text-sm text-white">{item.name}</h4>
                              <p className="text-xs text-slate-400">{item.type === 'frame' ? 'إطار' : 'فقاعة'}</p>
                              <p className="text-yellow-400 font-bold text-xs mt-1">{item.price} 🪙</p>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Store Edit Modal */}
                  {editingStoreItem && (
                     <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-blue-500/50 p-6 space-y-4">
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
                                     <p className="text-[9px] text-slate-500 mt-1">لأفضل نتيجة، استخدم صور PNG بخلفية شفافة</p>
                                 </div>
                              </div>
                           </div>

                           <div className="flex gap-2 pt-2">
                              <button onClick={() => setEditingStoreItem(null)} className="flex-1 bg-slate-700 py-2 rounded-lg text-sm">إلغاء</button>
                              <button onClick={handleSaveStoreItem} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold">حفظ</button>
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
                   
                   <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              onChange={(e) => setGameSettings({...gameSettings, slotsWinRate: Number(e.target.value)})}
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
                              onChange={(e) => setGameSettings({...gameSettings, wheelWinRate: Number(e.target.value)})}
                              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                           />
                        </div>
                     </div>
                   </div>
               </motion.div>
            )}
            
            {/* Rooms Tab */}
             {activeTab === 'rooms' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                   <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                     <Radio size={20} className="text-cyan-500" /> إدارة الغرف
                  </h3>
                  <div className="space-y-3">
                     {rooms.map(room => (
                        <div key={room.id} className="bg-slate-900 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <img src={room.thumbnail} className="w-12 h-12 rounded-lg object-cover" />
                              <div>
                                 <h4 className="font-bold text-sm text-white">{room.title}</h4>
                                 <p className="text-[10px] text-slate-400">ID: {room.id} | المالك: {room.speakers[0]?.name}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{room.category}</div>
                              <button onClick={() => handleDeleteRoom(room.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
                </motion.div>
            )}

            {activeTab === 'users' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex gap-2 mb-2">
                     <div className="flex-1 flex gap-2 bg-slate-900 p-2 rounded-xl border border-white/5">
                        <Search className="text-slate-500 ml-2" />
                        <input type="text" placeholder="بحث عن مستخدم..." className="bg-transparent w-full outline-none text-sm" />
                     </div>
                     <button 
                        onClick={() => setIdSearchModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-xl flex items-center gap-2 font-bold text-sm"
                     >
                        <Wallet size={16} /> شحن عبر ID
                     </button>
                  </div>
                  
                  <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
                     <table className="w-full text-right text-xs">
                        <thead className="bg-white/5 text-slate-400 font-bold">
                           <tr>
                              <th className="p-3">المستخدم</th>
                              <th className="p-3">ID</th>
                              <th className="p-3">المستوى</th>
                              <th className="p-3">الرصيد</th>
                              <th className="p-3">الحالة</th>
                              <th className="p-3">تحكم</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {localUsers.map(u => (
                              <tr key={u.id}>
                                 <td className="p-3 font-bold flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-700"></div>
                                    {u.name}
                                 </td>
                                 <td className="p-3 font-mono text-slate-500 flex items-center gap-1">
                                    {u.isSpecialId && <Sparkles size={10} className="text-amber-400" />}
                                    <span className={u.isSpecialId ? "text-amber-400 font-bold italic" : ""}>{u.id}</span>
                                 </td>
                                 <td className="p-3">{u.level}</td>
                                 <td className="p-3 text-yellow-400 font-mono">{u.coins.toLocaleString()}</td>
                                 <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                       {u.status === 'active' ? 'نشط' : 'محظور'}
                                    </span>
                                 </td>
                                 <td className="p-3 flex gap-2">
                                    <button onClick={() => handleBanUser(u.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20">
                                       <Ban size={14} />
                                    </button>
                                    <button 
                                       onClick={() => openChargeModal(u)} 
                                       className="p-1.5 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 flex items-center gap-1 font-bold"
                                    >
                                       <Coins size={14} />
                                    </button>
                                    <button 
                                       onClick={() => openIdChangeModal(u)} 
                                       className="p-1.5 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 flex items-center gap-1 font-bold"
                                       title="تغيير المعرف"
                                    >
                                       <Hash size={14} />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </motion.div>
            )}

            {activeTab === 'settings' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                   <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                     <Settings size={20} className="text-slate-400" /> إعدادات النظام والتطبيق
                  </h3>
                   
                    <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 space-y-6">
                     <div className="border-b border-white/5 pb-6">
                        <h4 className="font-bold text-sm mb-4 text-white flex items-center gap-2">
                            <ImageIcon size={16} className="text-blue-500"/> إدارة البنر الرئيسي
                        </h4>
                        <div className="flex flex-col gap-4">
                             <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 group">
                                <img src={bannerImage} className="w-full h-full object-cover" alt="Current Banner" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-white font-bold">المعاينة الحالية</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                 <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-xs font-bold transition-colors">
                                    <Upload size={14} /> رفع بنر جديد
                                    <input type="file" accept="image/*" onChange={handleAdminBannerUpload} className="hidden" />
                                 </label>
                             </div>
                        </div>
                     </div>
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
                     <h3 className="font-bold text-lg text-white flex items-center gap-2"><Wallet size={20} className="text-green-500"/> شحن عبر المعرف</h3>
                     <button onClick={() => setIdSearchModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <label className="text-xs text-slate-400 mb-1 block">أدخل معرف المستخدم (ID)</label>
                        <input 
                           type="text" 
                           value={searchIdInput}
                           onChange={(e) => setSearchIdInput(e.target.value)}
                           placeholder="مثال: 829102"
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
                          <p className="text-[10px] text-slate-500 font-mono">ID: {selectedUserForCharge.id}</p>
                       </div>
                       <button onClick={() => setChargeModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                    </div>
                    <div className="bg-slate-950 rounded-xl p-4 border border-white/5 mb-4 text-center">
                       <p className="text-xs text-slate-500 mb-1">الرصيد الحالي</p>
                       <p className="text-2xl font-mono font-bold text-white">{selectedUserForCharge.coins.toLocaleString()}</p>
                    </div>
                    <div className="space-y-4">
                       <div>
                          <label className="text-xs text-slate-400 mb-1 block">أدخل المبلغ</label>
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
                       <div>
                          <label className="text-xs text-slate-400 mb-1 block">إرفاق إيصال الشحن (اختياري)</label>
                          <label className="block w-full cursor-pointer relative group">
                              <div className="w-full bg-slate-800 border-2 border-dashed border-white/10 rounded-xl p-3 flex flex-col items-center justify-center gap-2 group-hover:border-yellow-500/50 transition-colors">
                                 {chargeProof ? (
                                    <div className="relative w-full h-24">
                                       <img src={chargeProof} className="w-full h-full object-contain rounded-lg" alt="Receipt" />
                                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <span className="text-xs text-white">تغيير الصورة</span>
                                       </div>
                                    </div>
                                 ) : (
                                    <>
                                       <div className="p-2 bg-white/5 rounded-full group-hover:bg-yellow-500/10 transition-colors">
                                          <FileText size={18} className="text-slate-400 group-hover:text-yellow-500" />
                                       </div>
                                       <span className="text-xs text-slate-500 group-hover:text-slate-300">
                                          اضغط لرفع صورة الإيصال
                                       </span>
                                    </>
                                 )}
                              </div>
                              <input 
                                 type="file" 
                                 accept="image/*"
                                 onChange={handleChargeProofUpload}
                                 className="hidden"
                              />
                          </label>
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
                            <Hash className="text-purple-500" /> تغيير المعرف (ID)
                        </h3>
                        <button onClick={() => setIdChangeModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                    </div>

                    <div>
                        <p className="text-sm text-slate-400 mb-4">
                            تغيير المعرف للمستخدم: <span className="text-white font-bold">{selectedUserForIdChange.name}</span>
                        </p>
                        
                        <label className="text-xs text-slate-400 mb-1 block">المعرف الجديد</label>
                        <input 
                            type="text" 
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