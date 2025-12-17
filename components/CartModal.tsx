
import React, { useState, useMemo, useEffect } from 'react';
import { CartItem, Product, User, ShippingAddress, ProductType } from '../types';
import { findProductById, updateCartItemQuantity, removeFromCart, processProductPurchase, updateUserBalance } from '../services/storageService';
import { XMarkIcon, PlusIcon, MinusIcon, TrashIcon, CreditCardIcon, QrCodeIcon, BanknotesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

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
      const cart = JSON.parse(localStorage.getItem('cyberphone_cart') || '[]') as CartItem[];
      const allProducts = JSON.parse(localStorage.getItem('cyberphone_products') || '[]') as Product[];
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
      if (selectedPayment === 'balance') {
        updateUserBalance(currentUser.id, -subtotal);
      }
      processProductPurchase(cartItems, currentUser.id, null, shippingDetails);
      refreshUser();
      onCartUpdate();
      setView('success');
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><XMarkIcon className="h-6 w-6" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {view === 'cart' && (
            <div className="space-y-4">
              {detailedCartItems.map(item => (
                <div key={item.productId} className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl">
                  <img src={item.product.imageUrls[0]} className="w-16 h-16 object-cover rounded-xl" />
                  <div className="flex-1"><p className="font-bold text-sm">{item.product.name}</p><p className="text-blue-600 font-bold">${item.product.price}</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { updateCartItemQuantity(item.productId, item.quantity - 1); onCartUpdate(); }} className="p-1 bg-white rounded-md border"><MinusIcon className="h-4 w-4"/></button>
                    <span className="font-bold">{item.quantity}</span>
                    <button onClick={() => { updateCartItemQuantity(item.productId, item.quantity + 1); onCartUpdate(); }} className="p-1 bg-white rounded-md border"><PlusIcon className="h-4 w-4"/></button>
                  </div>
                </div>
              ))}
              {detailedCartItems.length === 0 && <p className="text-center py-10 text-gray-500">Carrinho vazio.</p>}
            </div>
          )}

          {view === 'shipping' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Onde devemos entregar?</h3>
              <input type="text" placeholder="Endereço Completo" value={shippingDetails.address} onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})} className="w-full p-3 border rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Cidade" value={shippingDetails.city} onChange={e => setShippingDetails({...shippingDetails, city: e.target.value})} className="w-full p-3 border rounded-xl" />
                <input type="text" placeholder="CEP" value={shippingDetails.zipCode} onChange={e => setShippingDetails({...shippingDetails, zipCode: e.target.value})} className="w-full p-3 border rounded-xl" />
              </div>
            </div>
          )}

          {view === 'payment' && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg mb-4">Escolha como pagar</h3>
              <button onClick={() => setSelectedPayment('balance')} className={`w-full flex items-center justify-between p-4 border-2 rounded-2xl transition-all ${selectedPayment === 'balance' ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3"><BanknotesIcon className="h-6 w-6 text-blue-600"/><div className="text-left"><p className="font-bold">Saldo CyBerPhone</p><p className="text-xs text-gray-500">Disponível: ${(currentUser.balance || 0).toFixed(2)}</p></div></div>
                {selectedPayment === 'balance' && <CheckIcon className="h-5 w-5 text-blue-600" />}
              </button>
              <button onClick={() => setSelectedPayment('pix')} className={`w-full flex items-center justify-between p-4 border-2 rounded-2xl transition-all ${selectedPayment === 'pix' ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3"><QrCodeIcon className="h-6 w-6 text-green-600"/><p className="font-bold">Pix</p></div>
                {selectedPayment === 'pix' && <CheckIcon className="h-5 w-5 text-green-600" />}
              </button>
              <button onClick={() => setSelectedPayment('card')} className={`w-full flex items-center justify-between p-4 border-2 rounded-2xl transition-all ${selectedPayment === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3"><CreditCardIcon className="h-6 w-6 text-purple-600"/><p className="font-bold">Cartão de Crédito</p></div>
                {selectedPayment === 'card' && <CheckIcon className="h-5 w-5 text-purple-600" />}
              </button>
              {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
            </div>
          )}

          {view === 'processing' && (
            <div className="text-center py-12">
              <ArrowPathIcon className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold">Finalizando pedido...</h3>
            </div>
          )}

          {view === 'success' && (
            <div className="text-center py-8">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold">Pedido Confirmado!</h3>
              <p className="text-gray-500 mt-2">Você receberá um e-mail com os detalhes.</p>
              <button onClick={onClose} className="mt-8 w-full bg-black text-white py-4 rounded-2xl font-bold">Voltar para a Loja</button>
            </div>
          )}
        </div>

        {view !== 'success' && view !== 'processing' && detailedCartItems.length > 0 && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Total a Pagar</span>
              <span className="text-3xl font-black">${subtotal.toFixed(2)}</span>
            </div>
            {view === 'cart' && <button onClick={() => setView(detailedCartItems.some(i => i.product.type === ProductType.PHYSICAL) ? 'shipping' : 'payment')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg">Continuar</button>}
            {view === 'shipping' && <button onClick={() => setView('payment')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg">Ir para o Pagamento</button>}
            {view === 'payment' && <button onClick={handleConfirmPurchase} disabled={!selectedPayment} className="w-full bg-green-600 disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold text-lg shadow-lg">Finalizar Compra</button>}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
