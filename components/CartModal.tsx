
import React, { useState, useMemo, useEffect } from 'react';
import { CartItem, Product, User, ShippingAddress, ProductType } from '../types';
import { getCart, updateCartItemQuantity, removeFromCart, processProductPurchase, updateUserBalance } from '../services/storageService';
import { XMarkIcon, PlusIcon, MinusIcon, TrashIcon, CreditCardIcon, QrCodeIcon, BanknotesIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { CheckIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onCartUpdate: () => void;
  refreshUser: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, currentUser, onCartUpdate, refreshUser }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<'cart' | 'shipping' | 'payment' | 'processing' | 'success'>('cart');
  const [shippingDetails, setShippingDetails] = useState<ShippingAddress>({ address: '', city: '', state: '', zipCode: '' });
  const [selectedPayment, setSelectedPayment] = useState<'balance' | 'pix' | 'card' | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const cart = getCart();
      const allProducts = JSON.parse(localStorage.getItem('cyber_products') || '[]') as Product[];
      setCartItems(cart);
      setProducts(allProducts);
      setView('cart');
      setFormError('');
    }
  }, [isOpen]);

  const detailedCartItems = useMemo(() => {
    return cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return product ? { ...item, product } : null;
    }).filter((item): item is (CartItem & { product: Product }) => item !== null);
  }, [cartItems, products]);

  const subtotal = useMemo(() => detailedCartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [detailedCartItems]);

  const handleConfirmPurchase = () => {
    if (selectedPayment === 'balance' && (currentUser.balance || 0) < subtotal) {
      setFormError('Saldo insuficiente em sua conta.');
      return;
    }

    setView('processing');
    setTimeout(() => {
      // Pass null as affiliateId for now
      const success = processProductPurchase(cartItems, currentUser.id, null, shippingDetails);
      if (success) {
        refreshUser();
        onCartUpdate();
        setView('success');
      } else {
        setFormError('Erro ao processar compra.');
        setView('payment');
      }
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end overflow-hidden" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-left" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
             <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
             <h2 className="text-xl font-black text-gray-900">Meu Carrinho</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {view === 'cart' && (
            <>
              {detailedCartItems.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBagIcon className="h-16 w-16 text-gray-100 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Sua sacola está vazia</p>
                  <button onClick={onClose} className="text-blue-600 font-black mt-4 uppercase text-sm">Explorar Marketplace</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {detailedCartItems.map(item => (
                    <div key={`${item.productId}-${item.selectedColor}`} className="flex gap-4 p-4 bg-gray-50 rounded-3xl group border border-transparent hover:border-gray-100 transition-all">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm shrink-0">
                        <img src={item.product.imageUrls[0]} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-gray-900 line-clamp-1 leading-tight">{item.product.name}</p>
                        {item.selectedColor && (
                          <p className="text-[10px] font-black text-blue-600 uppercase mt-1">Cor: {item.selectedColor}</p>
                        )}
                        <p className="text-gray-900 font-black text-lg mt-1">${item.product.price.toFixed(2)}</p>
                        <div className="flex items-center justify-between mt-2">
                           <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                              <button onClick={() => { updateCartItemQuantity(item.productId, item.quantity - 1, item.selectedColor); onCartUpdate(); }} className="p-1.5 hover:text-blue-600 transition-colors"><MinusIcon className="h-4 w-4"/></button>
                              <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                              <button onClick={() => { updateCartItemQuantity(item.productId, item.quantity + 1, item.selectedColor); onCartUpdate(); }} className="p-1.5 hover:text-blue-600 transition-colors"><PlusIcon className="h-4 w-4"/></button>
                           </div>
                           <button onClick={() => { removeFromCart(item.productId, item.selectedColor); onCartUpdate(); }} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                              <TrashIcon className="h-5 w-5" />
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {view === 'shipping' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                 <h3 className="font-black text-lg text-gray-900 mb-1">Dados de Entrega</h3>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Para produtos físicos</p>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Endereço Completo" value={shippingDetails.address} onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold transition-all" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Cidade" value={shippingDetails.city} onChange={e => setShippingDetails({...shippingDetails, city: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold transition-all" />
                  <input type="text" placeholder="CEP" value={shippingDetails.zipCode} onChange={e => setShippingDetails({...shippingDetails, zipCode: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold transition-all" />
                </div>
              </div>
            </div>
          )}

          {view === 'payment' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="font-black text-lg text-gray-900 mb-4">Como deseja pagar?</h3>
              <div className="space-y-3">
                <button onClick={() => setSelectedPayment('balance')} className={`w-full flex items-center justify-between p-5 border-2 rounded-2xl transition-all ${selectedPayment === 'balance' ? 'border-blue-600 bg-blue-50 shadow-inner' : 'border-gray-50 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-blue-600 text-white rounded-xl"><BanknotesIcon className="h-6 w-6" /></div>
                     <div className="text-left"><p className="font-black text-gray-900">Carteira CyBerPhone</p><p className="text-[10px] text-gray-400 font-black uppercase">Saldo: ${(currentUser.balance || 0).toFixed(2)}</p></div>
                  </div>
                  {selectedPayment === 'balance' && <CheckIcon className="h-6 w-6 text-blue-600" />}
                </button>
                <button onClick={() => setSelectedPayment('pix')} className={`w-full flex items-center justify-between p-5 border-2 rounded-2xl transition-all ${selectedPayment === 'pix' ? 'border-blue-600 bg-blue-50 shadow-inner' : 'border-gray-50 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-green-500 text-white rounded-xl"><QrCodeIcon className="h-6 w-6" /></div>
                     <div className="text-left"><p className="font-black text-gray-900">Pix Instantâneo</p><p className="text-[10px] text-gray-400 font-black uppercase">Aprovação imediata</p></div>
                  </div>
                  {selectedPayment === 'pix' && <CheckIcon className="h-6 w-6 text-green-600" />}
                </button>
              </div>
              {formError && <p className="text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100">{formError}</p>}
            </div>
          )}

          {view === 'processing' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="relative">
                 <div className="w-24 h-24 border-8 border-blue-50 rounded-full"></div>
                 <div className="absolute inset-0 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-2xl font-black text-gray-900">Validando Pedido</h3>
            </div>
          )}

          {view === 'success' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckIcon className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Pedido Confirmado!</h3>
              <button onClick={onClose} className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black text-lg active:scale-95 transition-all">Continuar Navegando</button>
            </div>
          )}
        </div>

        {/* Footer */}
        {view !== 'success' && view !== 'processing' && detailedCartItems.length > 0 && (
          <div className="p-8 border-t border-gray-100 bg-gray-50">
            <div className="space-y-1 mb-6">
               <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Total</span>
                  <span className="text-4xl font-black text-gray-900">${subtotal.toFixed(2)}</span>
               </div>
            </div>

            <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-4 justify-center">
               <ShieldCheckIcon className="h-4 w-4 text-green-500" /> Checkout Seguro CyBer
            </div>

            {view === 'cart' && (
              <button 
                onClick={() => setView(detailedCartItems.some(i => i.product.type === ProductType.PHYSICAL) ? 'shipping' : 'payment')} 
                className="w-full bg-blue-600 text-white py-5 rounded-[2.2rem] font-black text-xl shadow-xl active:scale-95 transition-all"
              >
                Prosseguir
              </button>
            )}
            {view === 'shipping' && (
              <button onClick={() => setView('payment')} className="w-full bg-blue-600 text-white py-5 rounded-[2.2rem] font-black text-xl active:scale-95 transition-all">Pagamento</button>
            )}
            {view === 'payment' && (
              <button onClick={handleConfirmPurchase} disabled={!selectedPayment} className="w-full bg-black text-white py-5 rounded-[2.2rem] font-black text-xl active:scale-95 transition-all disabled:opacity-30">Finalizar</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
