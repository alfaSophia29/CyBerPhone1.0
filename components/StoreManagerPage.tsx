
import React, { useState, useEffect } from 'react';
import { User, UserType, Store, Product, ProductType } from '../types';
import { 
  getStores, 
  saveStores, 
  updateUser, 
  getProducts, 
  saveProducts,
  findStoreById
} from '../services/storageService';
import { 
  PlusIcon, 
  BuildingStorefrontIcon, 
  PhotoIcon, 
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BanknotesIcon,
  MegaphoneIcon,
  RocketLaunchIcon
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

  // Form de Produto
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pType, setPType] = useState<ProductType>(ProductType.DIGITAL_COURSE);
  const [pImage, setPImage] = useState('');
  const [pCommission, setPCommission] = useState('0.10');

  // Form de Loja
  const [sName, setSName] = useState('');
  const [sDesc, setSDesc] = useState('');

  useEffect(() => {
    const stores = getStores();
    const myStore = stores.find(s => s.professorId === currentUser.id);
    if (myStore) {
      setUserStore(myStore);
      const allProducts = getProducts();
      setStoreProducts(allProducts.filter(p => p.storeId === myStore.id));
    }
  }, [currentUser.id]);

  const handleBeCreator = () => {
    setLoading(true);
    setTimeout(() => {
      const updatedUser = { ...currentUser, userType: UserType.CREATOR };
      updateUser(updatedUser);
      refreshUser();
      setLoading(false);
    }, 1500);
  };

  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    const newStore: Store = {
      id: `store-${Date.now()}`,
      professorId: currentUser.id,
      name: sName,
      description: sDesc,
      productIds: []
    };
    const all = getStores();
    saveStores([...all, newStore]);
    setUserStore(newStore);
    
    // Atualizar o usuário com o ID da loja
    updateUser({ ...currentUser, storeId: newStore.id });
    refreshUser();
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userStore) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      storeId: userStore.id,
      name: pName,
      description: pDesc,
      price: parseFloat(pPrice),
      type: pType,
      imageUrls: [pImage || 'https://picsum.photos/400/300'],
      affiliateCommissionRate: parseFloat(pCommission),
      ratings: [],
      averageRating: 0,
      ratingCount: 0
    };

    const all = getProducts();
    saveProducts([...all, newProduct]);
    setStoreProducts([newProduct, ...storeProducts]);
    
    // Reset form
    setPName(''); setPDesc(''); setPPrice(''); setPImage('');
    setShowAddProduct(false);
  };

  // 1. Se o usuário ainda é STANDARD, convida para virar CREATOR
  if (currentUser.userType === UserType.STANDARD) {
    return (
      <div className="container mx-auto p-4 md:p-10 pt-24 pb-20 max-w-4xl animate-fade-in">
        <div className="bg-white dark:bg-darkcard rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5 relative">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
           <div className="p-10 md:p-16 text-center">
              <div className="w-24 h-24 bg-blue-50 dark:bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <AcademicCapIcon className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">Seja um Professor Autor</h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-12 max-w-xl mx-auto">Desbloqueie o poder de vender cursos, mentorias e e-books. Transforme sua audiência em um negócio sustentável.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                 <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl text-center">
                    <BanknotesIcon className="h-8 w-8 text-green-500 mx-auto mb-3" />
                    <p className="text-xs font-black uppercase text-gray-400">Receba Pagamentos</p>
                 </div>
                 <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl text-center">
                    <ShieldCheckIcon className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                    <p className="text-xs font-black uppercase text-gray-400">Garantia CyBer</p>
                 </div>
                 <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl text-center">
                    <ArchiveBoxIcon className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                    <p className="text-xs font-black uppercase text-gray-400">Sua Loja Própria</p>
                 </div>
              </div>

              <button 
                onClick={handleBeCreator}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-200 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent animate-spin rounded-full" /> : 'Começar Agora'}
              </button>
           </div>
        </div>
      </div>
    );
  }

  // 2. Se é CREATOR mas não tem LOJA
  if (!userStore) {
    return (
      <div className="container mx-auto p-4 md:p-10 pt-24 pb-20 max-w-2xl animate-fade-in">
        <header className="mb-10 text-center">
           <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Criar Minha Loja</h2>
           <p className="text-gray-500 dark:text-gray-400">Escolha um nome e descrição para sua vitrine oficial.</p>
        </header>

        <form onSubmit={handleCreateStore} className="bg-white dark:bg-darkcard p-8 rounded-[3rem] shadow-xl border dark:border-white/10 space-y-6">
           <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">Nome Comercial</label>
              <input 
                type="text" 
                value={sName} 
                onChange={e => setSName(e.target.value)} 
                className="w-full p-5 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none font-bold text-lg dark:text-white focus:border-blue-500 border-2 border-transparent transition-all" 
                placeholder="Ex: Física com a Ana Silva" 
                required
              />
           </div>
           <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">Sobre a Loja</label>
              <textarea 
                value={sDesc} 
                onChange={e => setSDesc(e.target.value)} 
                className="w-full p-5 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none font-medium text-sm dark:text-white h-32" 
                placeholder="O que os alunos podem esperar dos seus produtos?" 
                required
              />
           </div>
           <button type="submit" className="w-full bg-black dark:bg-white dark:text-black text-white py-6 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all">Abrir Minha Vitrine</button>
        </form>
      </div>
    );
  }

  // 3. Dashboard da Loja
  return (
    <div className="container mx-auto p-4 md:p-10 pt-24 pb-20 animate-fade-in">
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar de Gestão */}
        <aside className="lg:w-1/3 space-y-6">
           <div className="bg-white dark:bg-darkcard rounded-[3rem] p-8 shadow-xl border dark:border-white/5 text-center">
              <div className="relative mb-6">
                 <img src={currentUser.profilePicture} className="w-24 h-24 rounded-[2rem] object-cover mx-auto border-4 border-blue-50" />
                 <div className="absolute -bottom-2 -right-1/2 translate-x-[-150%] bg-green-500 text-white p-1.5 rounded-full border-4 border-white"><CheckCircleIcon className="h-4 w-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-2">{userStore.name}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase mb-8">Loja Ativa no Marketplace</p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-gray-50 dark:border-white/5 pt-8">
                 <div>
                    <p className="text-xl font-black text-blue-600">{storeProducts.length}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase">Produtos</p>
                 </div>
                 <div>
                    <p className="text-xl font-black text-green-600">${(currentUser.balance || 0).toFixed(2)}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase">Saldo</p>
                 </div>
              </div>
           </div>

           <div className="space-y-3">
             <button 
               onClick={() => onNavigate('store', { storeId: userStore.id })} 
               className="w-full p-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl"
             >
               <BuildingStorefrontIcon className="h-5 w-5" /> Ver Minha Vitrine
             </button>
             
             <button 
               onClick={() => onNavigate('ads')} 
               className="w-full p-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
             >
               <MegaphoneIcon className="h-5 w-5" /> Criar Anúncio (Meta Ads)
             </button>
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
              <RocketLaunchIcon className="absolute -bottom-4 -right-4 h-24 w-24 text-white/10 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black uppercase opacity-70 mb-1">Dica de Crescimento</p>
              <h4 className="font-black text-lg mb-3">Aumente seu Alcance</h4>
              <p className="text-xs opacity-80 leading-relaxed mb-4">Campanhas de Tráfego ajudam seus produtos a aparecerem no topo do feed dos alunos interessados.</p>
              <button onClick={() => onNavigate('ads')} className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Começar</button>
           </div>
        </aside>

        {/* Lista de Produtos / Gerenciamento */}
        <main className="lg:w-2/3 space-y-6">
           <div className="flex items-center justify-between px-4">
              <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Meus Produtos</h4>
              <button 
                onClick={() => setShowAddProduct(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 flex items-center gap-2 hover:scale-105 transition-all"
              >
                <PlusIcon className="h-5 w-5" /> Adicionar
              </button>
           </div>

           {storeProducts.length === 0 ? (
             <div className="bg-white dark:bg-darkcard rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100 dark:border-white/5">
                <ArchiveBoxIcon className="h-16 w-16 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase text-xs">Sua prateleira está vazia</p>
             </div>
           ) : (
             <div className="space-y-4">
                {storeProducts.map(p => (
                  <div key={p.id} className="bg-white dark:bg-darkcard p-5 rounded-[2.5rem] shadow-sm border dark:border-white/5 flex items-center justify-between group hover:shadow-xl transition-all">
                     <div className="flex items-center gap-5">
                        <img src={p.imageUrls[0]} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                        <div>
                           <p className="font-black text-gray-900 dark:text-white">{p.name}</p>
                           <p className="text-blue-600 font-black text-sm">${p.price.toFixed(2)} • <span className="text-gray-400 text-[10px] uppercase">{p.type}</span></p>
                        </div>
                     </div>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400 hover:text-blue-600 transition-colors"><PencilSquareIcon className="h-5 w-5" /></button>
                        <button className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400 hover:text-red-600 transition-colors"><TrashIcon className="h-5 w-5" /></button>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </main>
      </div>

      {/* Modal de Novo Produto */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAddProduct(false)}>
           <div className="bg-white dark:bg-darkcard w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter">Cadastrar Produto</h3>
              
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Título</label>
                    <input type="text" value={pName} onChange={e => setPName(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none font-bold" placeholder="Ex: Curso Completo de Figma" required />
                 </div>
                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Descrição Detalhada</label>
                    <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none font-medium h-24" placeholder="O que o aluno aprenderá?" required />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Preço (USD)</label>
                    <input type="number" step="0.01" value={pPrice} onChange={e => setPPrice(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none font-bold" placeholder="99.00" required />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Tipo</label>
                    <select value={pType} onChange={e => setPType(e.target.value as any)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none font-black appearance-none">
                       <option value={ProductType.DIGITAL_COURSE}>Curso Digital</option>
                       <option value={ProductType.DIGITAL_EBOOK}>E-Book / PDF</option>
                       <option value={ProductType.PHYSICAL}>Produto Físico</option>
                       <option value={ProductType.DIGITAL_OTHER}>Mentoria</option>
                    </select>
                 </div>
                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">URL da Imagem</label>
                    <input type="text" value={pImage} onChange={e => setPImage(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none font-bold" placeholder="https://..." />
                 </div>
                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-purple-600 uppercase ml-2 mb-1 block">Comissão p/ Afiliados (%)</label>
                    <input type="number" step="0.01" value={pCommission} onChange={e => setPCommission(e.target.value)} className="w-full p-4 bg-purple-50 dark:bg-purple-500/5 rounded-2xl outline-none font-black text-purple-600" />
                    <p className="text-[9px] text-gray-400 mt-2 ml-2 italic">Valor que outros usuários ganham ao vender seu produto.</p>
                 </div>

                 <div className="md:col-span-2 flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 py-5 rounded-2xl font-black uppercase text-xs text-gray-400">Cancelar</button>
                    <button type="submit" className="flex-[2] bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">Publicar Produto</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default StoreManagerPage;
