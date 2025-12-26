
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, UserType, Product, Store, ProductType } from '../types';
import {
  getStores,
  saveProducts,
  findStoreById,
  findUserById,
  updateStore,
  getProducts,
  toggleFollowUser,
  saveAffiliateLink,
} from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { 
  ShoppingCartIcon, 
  PencilIcon, 
  CheckIcon, 
  PlusIcon, 
  TrashIcon, 
  StarIcon, 
  UserPlusIcon, 
  UserMinusIcon, 
  ShoppingBagIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  BookOpenIcon,
  VideoCameraIcon,
  AcademicCapIcon,
  TruckIcon,
  LinkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import ProductDetailModal from './ProductDetailModal';

interface StorePageProps {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  refreshUser: () => void;
  storeId?: string;
  onAddToCart: (productId: string) => void;
}

const ProductCard: React.FC<{ 
  product: Product; 
  currentUser: User;
  onSelect: (p: Product) => void; 
  onAddToCart: (id: string) => void 
}> = ({ product, currentUser, onSelect, onAddToCart }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [isLinkGenerated, setIsLinkGenerated] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product.id);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleGenerateAffiliateLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const affiliateLink = `${window.location.origin}?page=store&storeId=${product.storeId}&productId=${product.id}&affiliateId=${currentUser.id}`;
    saveAffiliateLink(currentUser.id, product.id, affiliateLink);
    navigator.clipboard.writeText(affiliateLink);
    setIsLinkGenerated(true);
    setTimeout(() => setIsLinkGenerated(false), 3000);
  };

  return (
    <div 
      onClick={() => onSelect(product)}
      className="bg-white dark:bg-darkcard rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col h-full w-full max-w-[450px] md:max-w-none mx-auto"
    >
      <div className="relative h-56 md:h-60 overflow-hidden">
        <img src={product.imageUrls[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={product.name} />
        <div className="absolute top-4 left-4">
           <span className="bg-white/90 dark:bg-darkcard/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-gray-900 dark:text-white uppercase shadow-sm border border-black/5 dark:border-white/5">
             {product.type === ProductType.PHYSICAL ? 'Físico' : 'Digital'}
           </span>
        </div>
      </div>
      
      <div className="p-5 md:p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-1 mb-2">
          <StarIconSolid className="h-3 w-3 text-yellow-400" />
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500">{product.averageRating.toFixed(1)}</span>
        </div>
        
        <h4 className="text-base md:text-lg font-black text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors mb-3">
          {product.name}
        </h4>
        
        <div className="mt-auto pt-4 space-y-3 border-t border-gray-50 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">Preço</span>
              <span className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">${product.price.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleAdd}
              className={`p-3 md:p-4 rounded-2xl transition-all shadow-md active:scale-90 ${isAdded ? 'bg-green-500 text-white' : 'bg-gray-900 dark:bg-white dark:text-black text-white hover:bg-blue-600'}`}
            >
              {isAdded ? <CheckIcon className="h-5 w-5 md:h-6 md:w-6" /> : <PlusIcon className="h-5 w-5 md:h-6 md:w-6" />}
            </button>
          </div>

          <button 
            onClick={handleGenerateAffiliateLink}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${
              isLinkGenerated 
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200' 
              : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30'
            }`}
          >
            {isLinkGenerated ? 'Copiado!' : 'Indicar Produto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const StorePage: React.FC<StorePageProps> = ({ currentUser, onNavigate, storeId: propStoreId, onAddToCart, refreshUser }) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<ProductType | 'ALL'>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const products = getProducts();
    if (propStoreId) {
      const store = findStoreById(propStoreId);
      setCurrentStore(store || null);
      setAllProducts(products.filter(p => p.storeId === propStoreId));
    } else {
      setCurrentStore(null);
      setAllProducts(products);
    }
    setLoading(false);
  }, [propStoreId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'ALL' || p.type === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, searchTerm, activeCategory]);

  const categories = [
    { id: 'ALL', label: 'Tudo', icon: Squares2X2Icon },
    { id: ProductType.DIGITAL_COURSE, label: 'Cursos', icon: VideoCameraIcon },
    { id: ProductType.DIGITAL_EBOOK, label: 'E-books', icon: BookOpenIcon },
    { id: ProductType.PHYSICAL, label: 'Físico', icon: TruckIcon },
    { id: ProductType.DIGITAL_OTHER, label: 'Mentoria', icon: AcademicCapIcon },
  ];

  const currentCategoryLabel = categories.find(c => c.id === activeCategory)?.label || 'Categorias';

  if (loading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center dark:bg-darkbg">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-xs uppercase tracking-[0.3em] text-gray-400">Marketplace Pro</p>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-transparent overflow-x-hidden pb-32 md:pb-24">
      
      <div className="container mx-auto pt-6 md:pt-10">
        {currentStore ? (
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-10 bg-gray-900 rounded-[2.5rem] md:rounded-[4rem] text-white shadow-2xl relative overflow-hidden group mx-4">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
             <img src={findUserById(currentStore.professorId)?.profilePicture || DEFAULT_PROFILE_PIC} className="w-20 h-20 md:w-32 md:h-32 rounded-2xl md:rounded-[2.5rem] object-cover shadow-2xl border-4 border-white/10 relative z-10" />
             <div className="text-center md:text-left flex-grow relative z-10">
                <h2 className="text-xl md:text-5xl font-black tracking-tighter mb-1 md:mb-2">{currentStore.name}</h2>
                <p className="text-[10px] md:text-lg text-gray-400 font-medium max-w-xl line-clamp-2 md:line-clamp-none">{currentStore.description}</p>
             </div>
             <button onClick={() => onNavigate('store')} className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase backdrop-blur-xl border border-white/10 transition-all relative z-10">Sair da Loja</button>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-10 px-4">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="text-left">
                  <h2 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter mb-1 md:mb-2">Marketplace<span className="text-blue-600"></span></h2>
                  <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[9px] md:text-xs">Produtos exclusivos da comunidade CyBerPhone</p>
                </div>
                
                <div className="relative w-full md:w-[400px]">
                   <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                   <input 
                    type="text" 
                    placeholder="Buscar conteúdo..." 
                    className="w-full pl-12 pr-6 py-4 bg-white dark:bg-darkcard rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 focus:border-blue-500 outline-none font-bold transition-all dark:text-white text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>

             <div className="relative">
               <div className="hidden md:flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id as any)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all shadow-sm border ${
                        activeCategory === cat.id 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white dark:bg-darkcard text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/10 hover:border-blue-200'
                      }`}
                    >
                      <cat.icon className="h-5 w-5" />
                      {cat.label}
                    </button>
                  ))}
               </div>

               <div className="md:hidden relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-darkcard rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                       <FunnelIcon className="h-5 w-5 text-blue-600" />
                       <span className="font-black text-xs uppercase tracking-widest dark:text-white">{currentCategoryLabel}</span>
                    </div>
                    <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-white/95 dark:bg-darkcard/95 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                       {categories.map(cat => (
                         <button
                           key={cat.id}
                           onClick={() => { setActiveCategory(cat.id as any); setIsCategoryDropdownOpen(false); }}
                           className={`w-full flex items-center gap-4 px-6 py-4 transition-colors text-left ${
                             activeCategory === cat.id 
                               ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600' 
                               : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                           }`}
                         >
                            <cat.icon className={`h-5 w-5 ${activeCategory === cat.id ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className="font-black text-[10px] uppercase tracking-widest">{cat.label}</span>
                            {activeCategory === cat.id && <CheckIcon className="h-4 w-4 ml-auto" />}
                         </button>
                       ))}
                    </div>
                  )}
               </div>
             </div>
          </div>
        )}
      </div>

      <div className="container mx-auto py-6 md:py-14">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-white/5 mx-4">
             <ShoppingBagIcon className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
             <h3 className="text-base font-black text-gray-400 uppercase tracking-widest">Nenhum item encontrado</h3>
             <button onClick={() => {setSearchTerm(''); setActiveCategory('ALL');}} className="text-blue-600 font-bold mt-4 hover:underline text-[10px] uppercase tracking-widest">Limpar filtros</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 md:gap-8 animate-fade-in px-4">
             {filteredProducts.map(product => (
               <ProductCard 
                 key={product.id} 
                 product={product} 
                 currentUser={currentUser}
                 onSelect={setSelectedProduct} 
                 onAddToCart={onAddToCart} 
               />
             ))}
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="p-6 md:p-16 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2.5rem] md:rounded-[4.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden max-w-[450px] md:max-w-none mx-auto">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
           <div className="max-w-md text-center md:text-left relative z-10">
              <h3 className="text-2xl md:text-5xl font-black mb-2 md:mb-4 tracking-tighter leading-tight">Venda seu Conhecimento</h3>
              <p className="text-[11px] md:text-xl text-blue-100 font-medium leading-relaxed">Transforme seu saber em faturamento real na plataforma.</p>
           </div>
           <button 
             onClick={() => onNavigate('manage-store')}
             className="w-full md:w-auto bg-white text-blue-900 px-8 py-4 md:px-10 md:py-5 rounded-2xl md:rounded-[2.2rem] font-black text-xs md:text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl relative z-10"
           >
             Criar Minha Loja
           </button>
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={onAddToCart}
          onNavigate={onNavigate}
        />
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
