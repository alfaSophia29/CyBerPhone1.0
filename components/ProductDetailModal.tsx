
import React from 'react';
import { Product, User, UserType, ProductType } from '../types';
import { findUserById, findStoreById } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { XMarkIcon, ShoppingCartIcon, StarIcon, CheckBadgeIcon, ShareIcon, GlobeAltIcon, BookOpenIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (productId: string) => void;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, onAddToCart, onNavigate }) => {
  const store = findStoreById(product.storeId);
  const owner = store ? findUserById(store.professorId) : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* Lado Esquerdo: Galeria de Imagens */}
        <div className="w-full md:w-1/2 bg-gray-100 relative group">
          <button onClick={onClose} className="absolute top-4 left-4 z-10 md:hidden bg-white/80 p-2 rounded-full shadow-lg">
            <XMarkIcon className="h-6 w-6 text-gray-900" />
          </button>
          <img src={product.imageUrls[0]} className="w-full h-full object-cover" alt={product.name} />
          {product.imageUrls.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {product.imageUrls.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              ))}
            </div>
          )}
        </div>

        {/* Lado Direito: Info e Checkout */}
        <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              {product.type === ProductType.PHYSICAL ? 'Produto Físico' : 'Conteúdo Digital'}
            </span>
            <button onClick={onClose} className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors">
              <XMarkIcon className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          <h2 className="text-3xl font-black text-gray-900 mb-2 leading-tight">{product.name}</h2>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center text-yellow-400">
               <StarIconSolid className="h-5 w-5" />
               <span className="text-gray-900 font-bold ml-1">{product.averageRating.toFixed(1)}</span>
               <span className="text-gray-400 text-sm ml-1">({product.ratingCount} avaliações)</span>
            </div>
            <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
            <span className="text-green-600 font-bold text-sm">Vendido por CyBerPhone</span>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl mb-8">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Preço Promocional</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black text-gray-900">${product.price.toFixed(2)}</span>
              <span className="text-gray-400 line-through font-bold mb-1">${(product.price * 1.25).toFixed(2)}</span>
            </div>
            <p className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1">
               <CheckBadgeIcon className="h-4 w-4" /> Pagamento 100% Seguro
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-3">O que você vai receber:</h4>
              <ul className="space-y-3">
                 <li className="flex items-start gap-3 text-gray-600 text-sm">
                   <div className="p-1 bg-green-50 rounded-full mt-0.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div></div>
                   <span>Acesso vitalício ao material através da plataforma CyBerPhone.</span>
                 </li>
                 {product.type !== ProductType.PHYSICAL && (
                   <li className="flex items-start gap-3 text-gray-600 text-sm">
                     <div className="p-1 bg-green-50 rounded-full mt-0.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div></div>
                     <span>Certificado de conclusão emitido pelo autor.</span>
                   </li>
                 )}
              </ul>
            </div>

            <div>
              <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">Sobre o Produto</h4>
              <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
            </div>
          </div>

          {/* Vendedor Info */}
          {owner && (
            <div className="border-t border-b border-gray-100 py-6 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <img src={owner.profilePicture || DEFAULT_PROFILE_PIC} className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Professor Autor</p>
                    <p className="font-black text-gray-900 hover:text-blue-600 cursor-pointer" onClick={() => onNavigate('profile', { userId: owner.id })}>{owner.firstName} {owner.lastName}</p>
                 </div>
              </div>
              <button onClick={() => onNavigate('profile', { userId: owner.id })} className="text-xs font-black text-blue-600 uppercase hover:underline">Ver Perfil &rarr;</button>
            </div>
          )}

          <div className="mt-auto flex gap-4">
             <button 
               onClick={() => onAddToCart(product.id)}
               className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-3"
             >
               <ShoppingCartIcon className="h-7 w-7" /> Comprar Agora
             </button>
             <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-5 rounded-2xl font-black flex items-center justify-center transition-all active:scale-95">
               <ShareIcon className="h-6 w-6" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
