
import React, { useState } from 'react';
import { Product, User, UserType, ProductType } from '../types';
import { findUserById, findStoreById } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { 
  XMarkIcon, 
  ShoppingCartIcon, 
  StarIcon, 
  ShareIcon, 
  MinusIcon, 
  PlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number, selectedColor?: string) => void;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, onAddToCart, onNavigate }) => {
  const store = findStoreById(product.storeId);
  const owner = store ? findUserById(store.professorId) : null;
  
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product.colors && product.colors.length > 0 ? product.colors[0] : undefined
  );
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCartClick = () => {
    onAddToCart(product.id, quantity, selectedColor);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-0 md:p-10 animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative" onClick={e => e.stopPropagation()}>
        
        {/* Galeria de Imagens */}
        <div className="w-full md:w-1/2 bg-gray-50 relative h-64 md:h-auto group">
          <button onClick={onClose} className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg md:hidden">
            <XMarkIcon className="h-6 w-6 text-gray-900" />
          </button>
          <img src={product.imageUrls[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={product.name} />
          
          <div className="absolute bottom-4 left-4 flex gap-2">
             {product.imageUrls.map((_, i) => (
               <div key={i} className={`h-1.5 rounded-full transition-all ${i === 0 ? 'w-8 bg-blue-600' : 'w-2 bg-white/50'}`}></div>
             ))}
          </div>
        </div>

        {/* Informações e Opções */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto custom-scrollbar bg-white">
          <div className="hidden md:flex justify-end mb-4">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <XMarkIcon className="h-7 w-7 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg shadow-sm">
                {product.type === ProductType.PHYSICAL ? 'Físico' : 'Digital'}
              </span>
              <div className="flex items-center text-yellow-400">
                <StarIconSolid className="h-4 w-4" />
                <span className="text-gray-900 font-black ml-1 text-xs">{product.averageRating.toFixed(1)}</span>
              </div>
            </div>

            <h2 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight tracking-tighter">{product.name}</h2>
            
            <div className="py-4 border-y border-gray-100">
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Preço unitário</p>
               <span className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">${product.price.toFixed(2)}</span>
            </div>

            <p className="text-gray-500 font-medium text-sm leading-relaxed">{product.description}</p>

            {/* SELEÇÃO DE CORES (Apenas se houver cores) */}
            {product.type === ProductType.PHYSICAL && product.colors && product.colors.length > 0 && (
              <div className="space-y-3 pt-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escolha a Cor</label>
                <div className="flex flex-wrap gap-2">
                   {product.colors.map(color => (
                     <button
                       key={color}
                       onClick={() => setSelectedColor(color)}
                       className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                         selectedColor === color 
                          ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md' 
                          : 'border-gray-100 text-gray-400 hover:border-gray-200'
                       }`}
                     >
                       {color}
                     </button>
                   ))}
                </div>
              </div>
            )}

            {/* SELEÇÃO DE QUANTIDADE */}
            <div className="space-y-3 pt-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantidade</label>
              <div className="flex items-center w-fit bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
                 <button 
                   onClick={() => setQuantity(Math.max(1, quantity - 1))}
                   className="p-3 bg-white rounded-xl shadow-sm hover:text-blue-600 active:scale-90 transition-all"
                 >
                   <MinusIcon className="h-5 w-5" />
                 </button>
                 <span className="w-14 text-center font-black text-lg text-gray-900">{quantity}</span>
                 <button 
                   onClick={() => setQuantity(quantity + 1)}
                   className="p-3 bg-white rounded-xl shadow-sm hover:text-blue-600 active:scale-90 transition-all"
                 >
                   <PlusIcon className="h-5 w-5" />
                 </button>
              </div>
            </div>

            {/* INFO DO VENDEDOR */}
            {owner && (
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <img src={owner.profilePicture || DEFAULT_PROFILE_PIC} className="w-12 h-12 rounded-2xl object-cover shadow-sm border" />
                   <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Enviado por</p>
                      <p className="font-black text-sm text-gray-900">{owner.firstName} {owner.lastName}</p>
                   </div>
                </div>
                <button onClick={() => {onClose(); onNavigate('profile', { userId: owner.id });}} className="bg-gray-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-gray-600 hover:bg-blue-600 hover:text-white transition-all">Perfil</button>
              </div>
            )}
          </div>

          <div className="mt-10 flex gap-3 sticky bottom-0 bg-white py-4 md:py-2">
             <button 
               onClick={handleAddToCartClick}
               className={`flex-[3] py-4 md:py-5 rounded-2xl font-black text-base md:text-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                 isAdded ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-blue-600'
               }`}
             >
               {isAdded ? (
                 <>
                   <CheckIcon className="h-6 w-6 md:h-8 md:w-8" /> Adicionado
                 </>
               ) : (
                 <>
                   <ShoppingCartIcon className="h-6 w-6 md:h-8 md:w-8" /> {quantity > 1 ? `Comprar ${quantity} itens` : 'Adicionar ao Carrinho'}
                 </>
               )}
             </button>
             <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 md:py-5 rounded-2xl font-black flex items-center justify-center transition-all active:scale-95">
               <ShareIcon className="h-6 w-6" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
