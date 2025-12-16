import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Radio, Settings, X, Search, 
  MoreVertical, Ban, Trash2, ShieldAlert, CheckCircle, 
  Coins, Crown, BarChart3, Bell, Power, Edit2, Save, Image as ImageIcon, Upload, Gift as GiftIcon, Plus, Wallet, ArrowRight, ShoppingBag
} from 'lucide-react';
import { Room, User, UserLevel, VIPPackage, Gift, StoreItem } from '../types';

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
}

// Mock data for the user table (since we only have one real user in state)
const MOCK_ALL_USERS = [
  { id: 'u1', name: 'الملك', level: UserLevel.DIAMOND, coins: 500000, status: 'active', ip: '192.168.1.1' },
  { id: 'u2', name: 'سارة', level: UserLevel.GOLD, coins: 12000, status: 'active', ip: '192.168.1.2' },
  { id: 'u3', name: 'GamerPro', level: UserLevel.BRONZE, coins: 500, status: 'banned', ip: '192.168.1.55' },
  { id: 'u4', name: 'ضيف 102', level: UserLevel.NEW, coins: 0, status: 'active', ip: '192.168.1.9' },
  { id: '829102', name: 'ضيف كريم', level: UserLevel.SILVER, coins: 50000, status: 'active', ip: '127.0.0.1' }, // Added numeric ID for testing
];

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, onClose, rooms, setRooms, currentUser, onUpdateUser, vipLevels, setVipLevels, gifts, setGifts, storeItems, setStoreItems
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'rooms' | 'vip' | 'gifts' | 'store' | 'settings'>('dashboard');
  const [editingVip, setEditingVip] = useState<VIPPackage | null>(null);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [editingStoreItem, setEditingStoreItem] = useState<StoreItem | null>(null);
  
  // State for Charging Logic
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [selectedUserForCharge, setSelectedUserForCharge] = useState<any | null>(null);
  const [chargeAmount, setChargeAmount] = useState<string>('');

  // State for ID Search Logic
  const [idSearchModalOpen, setIdSearchModalOpen] = useState(false);
  const [searchIdInput, setSearchIdInput] = useState('');

  const [localUsers, setLocalUsers] = useState([...MOCK_ALL_USERS, { 
    id: currentUser.id === 'me' ? '829102' : currentUser.id, // Ensure current user matches mock ID for searching
    name: currentUser.name, 
    level: currentUser.level, 
    coins: currentUser.coins, 
    status: 'active',
    ip: '127.0.0.1' 
  }]);

  if (!isOpen) return null;

  const handleDeleteRoom = (roomId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الغرفة وإغلاقها نهائياً؟')) {
      setRooms(prev => prev.filter(r => r.id !== roomId));
    }
  };

  const handleBanUser = (userId: string) => {
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'banned' ? 'active' : 'banned' } : u));
  };

  // Open Charge Modal directly (from list)
  const openChargeModal = (user: any) => {
     setSelectedUserForCharge(user);
     setChargeAmount('');
     setChargeModalOpen(true);
  };

  // Search User By ID logic
  const handleSearchAndOpenCharge = () => {
    if (!searchIdInput.trim()) return;

    // Find user (exact match or match with 'u' prefix for mock data)
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

  // Execute Charge
  const handleConfirmCharge = () => {
    const amount = Number(chargeAmount);
    if (selectedUserForCharge && !isNaN(amount) && amount > 0) {
       // Update global current user if matches
       if (selectedUserForCharge.id === currentUser.id || selectedUserForCharge.id === '829102') {
          onUpdateUser({ ...currentUser, coins: currentUser.coins + amount });
       }
       // Update local table
       setLocalUsers(prev => prev.map(u => u.id === selectedUserForCharge.id ? { ...u, coins: u.coins + amount } : u));
       
       alert(`تم شحن ${amount} كوينز للمستخدم ${selectedUserForCharge.name} بنجاح!`);
       setChargeModalOpen(false);
       setSelectedUserForCharge(null);
    }
  };

  const handleSaveVip = () => {
    if (!editingVip) return;
    setVipLevels(prev => prev.map(v => v.level === editingVip.level ? editingVip : v));
    setEditingVip(null);
  };

  const handleSaveGift = () => {
     if (!editingGift) return;
     const exists = gifts.find(g => g.id === editingGift.id);
     if (exists) {
        setGifts(prev => prev.map(g => g.id === editingGift.id ? editingGift : g));
     } else {
        setGifts(prev => [...prev, editingGift]);
     }
     setEditingGift(null);
  };

  const handleSaveStoreItem = () => {
    if (!editingStoreItem) return;
    const exists = storeItems.find(i => i.id === editingStoreItem.id);
    if (exists) {
       setStoreItems(prev => prev.map(i => i.id === editingStoreItem.id ? editingStoreItem : i));
    } else {
       setStoreItems(prev => [...prev, editingStoreItem]);
    }
    setEditingStoreItem(null);
  };

  const handleVipImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingVip) {
      const reader = new FileReader();
      reader.onload = (event) => {
         if (event.target?.result) {
            setEditingVip({...editingVip, frameUrl: event.target.result as string});
         }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGiftImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file && editingGift) {
       const reader = new FileReader();
       reader.onload = (event) => {
          if (event.target?.result) {
             setEditingGift({...editingGift, icon: event.target.result as string});
          }
       };
       reader.readAsDataURL(file);
     }
  };

  const handleStoreItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingStoreItem) {
      const reader = new FileReader();
      reader.onload = (event) => {
         if (event.target?.result) {
            setEditingStoreItem({...editingStoreItem, url: event.target.result as string});
         }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateNewGift = () => {
     const newId = (Math.max(...gifts.map(g => parseInt(g.id))) + 1).toString();
     setEditingGift({
        id: newId,
        name: 'هدية جديدة',
        cost: 100,
        icon: '🎁',
        animationType: 'pop'
     });
  };

  const handleCreateNewStoreItem = () => {
     const newId = 'item_' + Date.now();
     setEditingStoreItem({
        id: newId,
        name: 'عنصر جديد',
        type: 'frame',
        price: 500,
        url: ''
     });
  };

  const handleDeleteGift = (id: string) => {
     if(confirm('هل أنت متأكد من حذف هذه الهدية؟')) {
        setGifts(prev => prev.filter(g => g.id !== id));
        if(editingGift?.id === id) setEditingGift(null);
     }
  };

  const handleDeleteStoreItem = (id: string) => {
     if(confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
        setStoreItems(prev => prev.filter(i => i.id !== id));
        if(editingStoreItem?.id === id) setEditingStoreItem(null);
     }
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
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 col-span-2 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><Coins size={64} /></div>
                       <h3 className="text-slate-400 text-xs font-bold">إجمالي المبيعات (اليوم)</h3>
                       <p className="text-3xl font-black mt-1 text-green-400">$4,250.00</p>
                    </div>
                 </div>
              </motion.div>
            )}

            {/* Store Tab (Keeping it from previous turn) */}
            {activeTab === 'store' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-center">
                     <h3 className="font-bold text-white flex items-center gap-2">
                        <ShoppingBag size={20} className="text-blue-500" /> إدارة الحقيبة والمتجر
                     </h3>
                     <button onClick={handleCreateNewStoreItem} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                        <Plus size={16} /> إضافة عنصر جديد
                     </button>
                  </div>

                  {/* Store Item Editor */}
                  {editingStoreItem && (
                     <div className="bg-slate-800 p-6 rounded-2xl border border-blue-500/30 mb-6">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="font-bold text-lg text-blue-400 flex items-center gap-2">
                              <Edit2 size={18} /> {editingStoreItem.id.startsWith('item_') ? 'إضافة عنصر' : 'تعديل عنصر'}
                           </h3>
                           <button onClick={() => setEditingStoreItem(null)} className="p-1 hover:bg-white/10 rounded-full"><X size={20} /></button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <div>
                                 <label className="text-xs text-slate-400 mb-1 block">اسم العنصر</label>
                                 <input 
                                    type="text" 
                                    value={editingStoreItem.name}
                                    onChange={e => setEditingStoreItem({...editingStoreItem, name: e.target.value})}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                 />
                              </div>
                              <div>
                                 <label className="text-xs text-slate-400 mb-1 block">السعر (عملة)</label>
                                 <input 
                                    type="number" 
                                    value={editingStoreItem.price}
                                    onChange={e => setEditingStoreItem({...editingStoreItem, price: Number(e.target.value)})}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                 />
                              </div>
                              <div>
                                 <label className="text-xs text-slate-400 mb-1 block">النوع</label>
                                 <select 
                                    value={editingStoreItem.type}
                                    onChange={e => setEditingStoreItem({...editingStoreItem, type: e.target.value as any})}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                 >
                                    <option value="frame">إطار (Frame)</option>
                                    <option value="bubble">فقاعة دردشة (Chat Bubble)</option>
                                 </select>
                              </div>
                              
                              <div>
                                 <label className="text-xs text-slate-400 mb-1 block">صورة العنصر</label>
                                 <div className="flex gap-2">
                                    <label className="flex-1 cursor-pointer relative group">
                                       <div className="w-full bg-slate-900 border-2 border-dashed border-white/10 rounded-lg p-4 flex flex-col items-center justify-center gap-2 group-hover:border-blue-500/50 transition-colors">
                                          <div className="p-3 bg-white/5 rounded-full group-hover:bg-blue-500/10 transition-colors">
                                             <Upload size={20} className="text-slate-400 group-hover:text-blue-500" />
                                          </div>
                                          <span className="text-xs text-slate-400 group-hover:text-white transition-colors">
                                             رفع الصورة
                                          </span>
                                       </div>
                                       <input 
                                          type="file" 
                                          accept="image/png, image/jpeg, image/gif, image/webp"
                                          onChange={handleStoreItemImageUpload}
                                          className="hidden"
                                       />
                                    </label>
                                 </div>
                              </div>
                           </div>

                           {/* Preview */}
                           <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded-xl border border-white/5 p-6">
                              <p className="text-xs text-slate-400 mb-4">معاينة</p>
                              
                              {editingStoreItem.type === 'frame' ? (
                                 <div className="relative w-24 h-24 mb-4">
                                    <div className="w-full h-full rounded-full bg-slate-800 border border-white/10"></div>
                                    {editingStoreItem.url && (
                                       <img src={editingStoreItem.url} className="absolute inset-0 w-full h-full object-contain scale-150 drop-shadow-sm" alt="Preview" />
                                    )}
                                 </div>
                              ) : (
                                 <div className="w-full max-w-[200px] h-16 rounded-xl mb-4 flex items-center justify-center text-white" 
                                    style={{ 
                                       backgroundImage: `url(${editingStoreItem.url})`, 
                                       backgroundSize: 'cover',
                                       backgroundPosition: 'center',
                                       backgroundColor: '#334155' 
                                    }}
                                 >
                                    نص تجريبي
                                 </div>
                              )}

                              <div className="text-center">
                                 <span className="font-bold text-white">{editingStoreItem.name}</span>
                                 <div className="text-[10px] text-yellow-500 font-mono mt-1">{editingStoreItem.price} 🪙</div>
                              </div>
                           </div>
                        </div>
                        
                        <div className="mt-6 flex justify-end gap-3">
                           <button 
                              onClick={() => handleDeleteStoreItem(editingStoreItem.id)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                           >
                              <Trash2 size={16} /> حذف
                           </button>
                           <button 
                              onClick={handleSaveStoreItem}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-900/20"
                           >
                              <Save size={16} /> حفظ
                           </button>
                        </div>
                     </div>
                  )}

                  {/* List */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {storeItems.map(item => (
                        <div 
                           key={item.id}
                           onClick={() => setEditingStoreItem(item)}
                           className={`bg-slate-900 p-4 rounded-xl border border-white/5 cursor-pointer hover:border-blue-500/50 transition-all group relative overflow-hidden flex flex-col items-center ${editingStoreItem?.id === item.id ? 'ring-2 ring-blue-500' : ''}`}
                        >
                           <div className="w-16 h-16 mb-2 flex items-center justify-center relative">
                              {item.type === 'frame' ? (
                                 <>
                                    <div className="w-12 h-12 rounded-full bg-slate-800"></div>
                                    <img src={item.url} className="absolute inset-0 w-full h-full object-contain scale-125" />
                                 </>
                              ) : (
                                 <div className="w-16 h-10 rounded bg-slate-800" style={{backgroundImage: `url(${item.url})`, backgroundSize: 'cover'}}></div>
                              )}
                           </div>
                           <h4 className="font-bold text-xs text-white">{item.name}</h4>
                           <p className="text-[10px] text-yellow-500 font-mono mt-1">{item.price} 🪙</p>
                           <span className="absolute top-2 right-2 text-[8px] bg-slate-800 px-1 rounded text-slate-400">
                              {item.type === 'frame' ? 'إطار' : 'فقاعة'}
                           </span>
                        </div>
                     ))}
                  </div>
               </motion.div>
            )}

            {/* Users Tab */}
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
                                 <td className="p-3 font-mono text-slate-500">{u.id}</td>
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
                                       <Coins size={14} /> شحن
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </motion.div>
            )}

            {/* VIP Tab */}
            {activeTab === 'vip' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                     <Crown size={20} className="text-amber-500" /> إدارة مستويات VIP
                  </h3>
                  
                  {editingVip && (
                     <div className="bg-slate-800 p-4 rounded-2xl mb-4 border border-amber-500/30">
                        <div className="flex justify-between mb-4">
                           <h4 className="font-bold text-amber-400">تعديل المستوى {editingVip.level}</h4>
                           <button onClick={() => setEditingVip(null)}><X size={16}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-xs text-slate-400">اسم اللقب</label>
                              <input 
                                 className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm mt-1"
                                 value={editingVip.name}
                                 onChange={(e) => setEditingVip({...editingVip, name: e.target.value})}
                              />
                           </div>
                           <div>
                              <label className="text-xs text-slate-400">التكلفة</label>
                              <input 
                                 type="number"
                                 className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm mt-1"
                                 value={editingVip.cost}
                                 onChange={(e) => setEditingVip({...editingVip, cost: Number(e.target.value)})}
                              />
                           </div>
                           <div className="col-span-2">
                              <label className="text-xs text-slate-400">رفع صورة الإطار</label>
                              <input type="file" onChange={handleVipImageUpload} className="block w-full text-xs text-slate-400 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-slate-700 file:text-white hover:file:bg-slate-600"/>
                           </div>
                        </div>
                        <button onClick={handleSaveVip} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold w-full">حفظ التغييرات</button>
                     </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                     {vipLevels.map(vip => (
                        <div key={vip.level} className="bg-slate-900 p-3 rounded-xl border border-white/5 relative group cursor-pointer hover:border-amber-500/50" onClick={() => setEditingVip(vip)}>
                           <div className="absolute top-2 left-2 text-[10px] text-slate-500">Lv.{vip.level}</div>
                           <div className="flex justify-center mb-2 mt-2">
                              <div className="w-16 h-16 relative">
                                 <div className="w-12 h-12 bg-slate-800 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                 <img src={vip.frameUrl} className="w-full h-full object-contain relative z-10" />
                              </div>
                           </div>
                           <div className="text-center">
                              <h4 className={`font-bold text-sm ${vip.color}`}>{vip.name}</h4>
                              <p className="text-xs text-yellow-500 font-mono">{vip.cost.toLocaleString()}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </motion.div>
            )}

            {/* Gifts Tab */}
            {activeTab === 'gifts' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-white flex items-center gap-2">
                        <GiftIcon size={20} className="text-pink-500" /> إدارة الهدايا
                     </h3>
                     <button onClick={handleCreateNewGift} className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Plus size={14} /> إضافة هدية
                     </button>
                  </div>

                  {editingGift && (
                     <div className="bg-slate-800 p-4 rounded-2xl mb-4 border border-pink-500/30">
                        <div className="flex justify-between mb-4">
                           <h4 className="font-bold text-pink-400">تعديل الهدية</h4>
                           <button onClick={() => setEditingGift(null)}><X size={16}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-xs text-slate-400">اسم الهدية</label>
                              <input 
                                 className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm mt-1"
                                 value={editingGift.name}
                                 onChange={(e) => setEditingGift({...editingGift, name: e.target.value})}
                              />
                           </div>
                           <div>
                              <label className="text-xs text-slate-400">السعر</label>
                              <input 
                                 type="number"
                                 className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm mt-1"
                                 value={editingGift.cost}
                                 onChange={(e) => setEditingGift({...editingGift, cost: Number(e.target.value)})}
                              />
                           </div>
                           <div>
                              <label className="text-xs text-slate-400">نوع الحركة</label>
                              <select 
                                 className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm mt-1"
                                 value={editingGift.animationType}
                                 onChange={(e) => setEditingGift({...editingGift, animationType: e.target.value as any})}
                              >
                                 <option value="pop">عادي (Pop)</option>
                                 <option value="fly">طيران (Fly)</option>
                                 <option value="full-screen">شاشة كاملة (Full)</option>
                              </select>
                           </div>
                           <div>
                              <label className="text-xs text-slate-400">رفع أيقونة</label>
                              <input type="file" onChange={handleGiftImageUpload} className="block w-full text-xs text-slate-400 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-slate-700 file:text-white hover:file:bg-slate-600"/>
                           </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                           <button onClick={() => handleDeleteGift(editingGift.id)} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-xs font-bold">حذف</button>
                           <button onClick={handleSaveGift} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold">حفظ</button>
                        </div>
                     </div>
                  )}

                  <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                     {gifts.map(gift => (
                        <div key={gift.id} className="bg-slate-900 p-3 rounded-xl border border-white/5 flex flex-col items-center cursor-pointer hover:border-pink-500/50" onClick={() => setEditingGift(gift)}>
                           <div className="text-3xl mb-2">
                              {gift.icon.startsWith('http') || gift.icon.startsWith('data:') ? <img src={gift.icon} className="w-8 h-8 object-contain"/> : gift.icon}
                           </div>
                           <h4 className="font-bold text-xs text-white">{gift.name}</h4>
                           <p className="text-[10px] text-yellow-500 font-mono">{gift.cost}</p>
                        </div>
                     ))}
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

            {/* Settings Tab */}
            {activeTab === 'settings' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                     <Settings size={20} className="text-slate-400" /> إعدادات النظام
                  </h3>
                  <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 space-y-6">
                     <div className="flex justify-between items-center">
                        <div>
                           <h4 className="font-bold text-sm">حالة السيرفر</h4>
                           <p className="text-xs text-slate-400">إيقاف/تشغيل الصيانة</p>
                        </div>
                        <div className="w-12 h-6 bg-green-500/20 rounded-full border border-green-500/50 relative cursor-pointer">
                           <div className="absolute right-1 top-1 w-4 h-4 bg-green-500 rounded-full"></div>
                        </div>
                     </div>
                     <div className="flex justify-between items-center">
                        <div>
                           <h4 className="font-bold text-sm">تسجيل الدخول للزوار</h4>
                           <p className="text-xs text-slate-400">السماح للزوار بدخول الغرف</p>
                        </div>
                        <div className="w-12 h-6 bg-green-500/20 rounded-full border border-green-500/50 relative cursor-pointer">
                           <div className="absolute right-1 top-1 w-4 h-4 bg-green-500 rounded-full"></div>
                        </div>
                     </div>
                     <div className="border-t border-white/5 pt-4">
                        <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                           <Power size={18} /> إغلاق الطوارئ
                        </button>
                     </div>
                  </div>
               </motion.div>
            )}

         </div>
      </div>

      {/* Charge By ID Search Modal */}
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
                 className="bg-slate-900 w-full max-w-sm rounded-2xl border border-yellow-500/30 shadow-2xl overflow-hidden"
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
    </div>
  );
};

export default AdminPanel;