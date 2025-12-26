
import React, { useState, useEffect } from 'react';
import { User, UserType, Store, Product, ProductType } from '../types';
import { 
  getStores, 
  saveStores, 
  updateUser, 
  getProducts, 
  saveProducts,
  updateUserBalance
} from '../services/storageService';
import { CREATOR_UPGRADE_FOLLOWERS_GOAL, CREATOR_UPGRADE_COST_USD } from '../constants';
import { 
  PlusIcon, 
  BuildingStorefrontIcon, 
  ArchiveBoxIcon,
  TrashIcon,
  PencilSquareIcon,
  AcademicCapIcon,
  MegaphoneIcon,
  RocketLaunchIcon,
  LockClosedIcon,
  UsersIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid';

interface StoreManagerPageProps {
  currentUser: User;
  refreshUser: () => void;
  onNavigate: (page: any, params?: any) => void;
}

const StoreManagerPage: React.FC<StoreManagerPageProps> = ({ currentUser, refreshUser, onNavigate }) => {
  const [userStore, setUserStore] = useState<Store | null>(null);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pType, setPType] = useState<ProductType>(ProductType.DIGITAL_COURSE);
  const [pImage, setPImage] = useState('');
  const [pCommission, setPCommission] = useState('0.10');
  const [sName, setSName] = useState('');
  const [sDesc, setSDesc] = useState('');

  useEffect(() => {
    const stores = getStores();
    const myStore = stores.find(s => s.professorId === currentUser.id);
    if (myStore) {
      setUserStore(myStore);
      setStoreProducts(getProducts().filter(p => p.storeId === myStore.id));
    }
  }, [currentUser.id]);

  const followerCount = currentUser.followers?.length || 0;
  const followerProgress = Math.min((followerCount / CREATOR_UPGRADE_FOLLOWERS_GOAL) * 100, 100);
  const canUnlockOrgannically = followerCount >= CREATOR_UPGRADE_FOLLOWERS_GOAL;

  const handleUpgrade = (isPaid: boolean) => {
    if (isPaid && (currentUser.balance || 0) < CREATOR_UPGRADE_COST_USD) {
      alert("Saldo insuficiente.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (isPaid) updateUserBalance(currentUser.id, -CREATOR_UPGRADE_COST_USD);
      updateUser({ ...currentUser, userType: UserType.CREATOR });
      refreshUser();
      setLoading(false);
    }, 1500);
  };

  if (currentUser.userType === UserType.STANDARD) {
    return (
      <div className="container mx-auto px-4 pt-20 pb-20 max-w-4xl animate-fade-in text-center">
        <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter dark:text-white">Torne-se <span className="text-blue-600">Profissional.</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-darkcard p-10 rounded-[3rem] text-left border border-gray-100 dark:border-white/5">
                <UsersIcon className="h-10 w-10 text-blue-600 mb-6" />
                <h4 className="text-2xl font-black mb-2 dark:text-white uppercase tracking-tighter">Pelo Talento</h4>
                <p className="text-gray-500 text-sm mb-8 font-medium">Atinja a meta de seguidores e ganhe o selo profissional gratuitamente.</p>
                <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full mb-8 relative">
                   <div className="h-full bg-blue-600 rounded-full shadow-lg" style={{ width: `${followerProgress}%` }}></div>
                </div>
                <button onClick={() => handleUpgrade(false)} disabled={!canUnlockOrgannically} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl disabled:opacity-30">DESBLOQUEAR SELO</button>
            </div>
            <div className="bg-gray-900 p-10 rounded-[3rem] text-left text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 rounded-full blur-[60px]"></div>
                <SparklesIcon className="h-10 w-10 text-yellow-400 mb-6" />
                <h4 className="text-2xl font-black mb-2 uppercase tracking-tighter">Modo Instantâneo</h4>
                <p className="text-gray-400 text-sm mb-8 font-medium">Libere ferramentas de venda e lives hoje mesmo por um valor único.</p>
                <p className="text-5xl font-black mb-8 tracking-tighter">${CREATOR_UPGRADE_COST_USD.toFixed(2)}</p>
                <button onClick={() => handleUpgrade(true)} className="w-full py-5 bg-white text-black rounded-2xl font-black shadow-xl active:scale-95 transition-all">UPGRADE AGORA</button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-24">
       <div className="flex flex-col items-center mb-12">
          <CheckBadgeIcon className="h-12 w-12 text-blue-600 mb-4" />
          <h2 className="text-4xl font-black dark:text-white tracking-tighter">Painel do Profissional</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Gerencie sua vitrine e rendimentos</p>
       </div>
       <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          <div className="bg-white dark:bg-darkcard p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5 w-full max-w-sm">
             <img src={currentUser.profilePicture} className="w-24 h-24 rounded-[2rem] object-cover mb-6 border-4 border-blue-50 shadow-md mx-auto" />
             <h3 className="font-black text-2xl dark:text-white text-center">{userStore?.name || 'Sua Loja'}</h3>
             <button onClick={() => setShowAddProduct(true)} className="w-full mt-8 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3">
               <PlusIcon className="h-6 w-6" /> Publicar Item
             </button>
          </div>
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
             {storeProducts.length === 0 ? (
               <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-white/10">
                  <ArchiveBoxIcon className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-black uppercase text-[10px]">Sua vitrine está vazia</p>
               </div>
             ) : (
               storeProducts.map(p => (
                <div key={p.id} className="bg-white dark:bg-darkcard p-5 rounded-[2.5rem] border border-gray-50 dark:border-white/5 flex items-center justify-between group transition-all hover:shadow-lg">
                   <div className="flex items-center gap-4">
                      <img src={p.imageUrls[0]} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                      <div>
                         <p className="font-black text-gray-900 dark:text-white text-xs uppercase truncate max-w-[120px]">{p.name}</p>
                         <p className="text-blue-600 font-black text-lg">${p.price.toFixed(2)}</p>
                      </div>
                   </div>
                   <button className="p-3 text-gray-300 hover:text-red-500 transition-colors"><TrashIcon className="h-5 w-5" /></button>
                </div>
               ))
             )}
          </div>
       </div>
    </div>
  );
};

export default StoreManagerPage;
