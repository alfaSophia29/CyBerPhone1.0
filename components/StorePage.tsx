
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  LinkIcon
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
      className="bg-white dark:bg-darkcard rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden group flex flex-col h-full w-full"
    >
      <div className="relative h-48 md:h-60 overflow-hidden">
        <img src={product.imageUrls[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={product.name} />
        <div className="absolute top-3 left-3 md:top-4 md:left-4 flex flex-col gap-2">
           <span className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] md:text-[10px] font-black text-gray-900 uppercase shadow-sm">
             {product.type === ProductType.PHYSICAL ? 'Físico' : 'Digital'}
           </span>
           {product.ratingCount > 10 && (
             <span className="bg-orange-500 px-2.5 py-1 rounded-lg text-[9px] md:text-[10px] font-black text-white uppercase shadow-sm">
               Best Seller
             </span>
           )}
        </div>
      </div>
      <div className="p-5 md:p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-1 mb-2">
          <StarIconSolid className="h-3 w-3 text-yellow-400" />
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500">{product.averageRating.toFixed(1)} ({product.ratingCount})</span>
        </div>
        <h4 className="text-base md:text-lg font-black text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors mb-4">{product.name}</h4>
        
        <div className="mt-auto pt-4 space-y-4 border-t border-gray-50 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-tighter">Investimento</span>
              <span className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">${product.price.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleAdd}
              className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all shadow-lg active:scale-90 ${isAdded ? 'bg-green-500 text-white' : 'bg-gray-900 dark:bg-white dark:text-black text-white hover:bg-blue-600'}`}
              title="Adicionar ao Carrinho"
            >
              {isAdded ? <CheckIcon className="h-5 w-5 md:h-6 md:w-6" /> : <PlusIcon className="h-5 w-5 md:h-6 md:w-6" />}
            </button>
          </div>

          <button 
            onClick={handleGenerateAffiliateLink}
            className={`w-full flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${
              isLinkGenerated 
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' 
              : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/30'
            }`}
          >
            {isLinkGenerated ? (
              <><CheckIcon className="h-3.5 w-3.5" /> Copiado!</>
            ) : (
              <><LinkIcon className="h-3.5 w-3.5" /> Afiliar-se</>
            )}
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

  if (loading) return <div className="pt-32 text-center font-black text-gray-400 uppercase tracking-widest animate-pulse dark:text-white">Conectando ao Marketplace...</div>;

  return (
    <div className="w-full max-w-full overflow-x-hidden container mx-auto p-4 md:p-8 pt-24 pb-20">
      
      {/* Header do Marketplace / Loja */}
      <div className="mb-8 md:mb-12">
        {currentStore ? (
          <div className="flex flex-col md:flex-row items-center gap-5 p-6 md:p-8 bg-white dark:bg-darkcard rounded-[2rem] md:rounded-[3rem] shadow-xl border border-gray-100 dark:border-white/10">
             <img src={findUserById(currentStore.professorId)?.profilePicture || DEFAULT_PROFILE_PIC} className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] object-cover shadow-2xl" />
             <div className="text-center md:text-left flex-grow">
                <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white">{currentStore.name}</h2>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium max-w-xl">{currentStore.description}</p>
             </div>
             <button onClick={() => onNavigate('store')} className="w-full md:w-auto bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 px-6 py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase transition-all">Sair da Loja</button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 md:gap-8">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
                <div className="text-center md:text-left">
                  <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">Marketplace <span className="text-blue-600">Pro</span></h2>
                  <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[9px] md:text-xs">Produtos exclusivos da nossa comunidade</p>
                </div>
                <div className="relative w-full md:w-96">
                   <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                   <input 
                    type="text" 
                    placeholder="Buscar conteúdo..." 
                    className="w-full pl-12 pr-6 py-3.5 md:py-4 bg-white dark:bg-darkcard rounded-xl md:rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 focus:border-blue-500 outline-none font-bold transition-all dark:text-white text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>

             {/* Filtros de Categorias - Scrollable on mobile */}
             <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm whitespace-nowrap transition-all ${
                      activeCategory === cat.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                        : 'bg-white dark:bg-darkcard text-gray-500 border border-gray-100 dark:border-white/10 hover:border-blue-200'
                    }`}
                  >
                    <cat.icon className="h-4 w-4 md:h-5 md:w-5" />
                    {cat.label}
                  </button>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Grid de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 md:py-32 bg-white dark:bg-darkcard rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-white/10 mx-auto w-full">
           <ShoppingBagIcon className="h-12 w-12 md:h-16 md:w-16 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
           <h3 className="text-lg md:text-xl font-black text-gray-400">Nenhum item encontrado</h3>
           <button onClick={() => {setSearchTerm(''); setActiveCategory('ALL');}} className="text-blue-600 font-bold mt-4 hover:underline text-sm uppercase tracking-widest">Limpar filtros</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 animate-fade-in">
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

      {/* Footer CTA - Responsive */}
      <div className="mt-16 md:mt-20 p-8 md:p-12 bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] md:rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10">
         <div className="max-w-md text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-black mb-3 md:mb-4">Seja um Autor</h3>
            <p className="text-sm md:text-base text-gray-400 font-medium">Transforme seu conhecimento em produtos digitais e monetize sua audiência na CyBerPhone.</p>
         </div>
         <button 
           onClick={() => onNavigate('manage-store')}
           className="w-full md:w-auto bg-white text-black px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-[2rem] font-black text-base md:text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
         >
           Começar Agora
         </button>
      </div>

      {/* Modal de Detalhes */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={onAddToCart}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
