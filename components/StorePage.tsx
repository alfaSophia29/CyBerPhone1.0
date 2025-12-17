

import React, { useState, useEffect, useCallback } from 'react';
import { User, UserType, Product, Store, ProductType } from '../types';
import {
  getStores,
  saveProducts,
  findStoreById,
  findUserById,
  updateStore,
  getProducts,
} from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { ShoppingCartIcon, PencilIcon, CheckIcon, PlusIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';


interface StorePageProps {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  refreshUser: () => void;
  storeId?: string;
  onAddToCart: (productId: string) => void;
}

const StarRating: React.FC<{ rating: number; count: number }> = ({ rating, count }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => {
        const ratingValue = i + 1;
        return (
          <StarIconSolid
            key={i}
            className={`h-4 w-4 ${
              ratingValue <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        );
      })}
      {count > 0 && <span className="text-xs text-gray-500 ml-1.5">({count})</span>}
    </div>
  );
};


export const StorePage: React.FC<StorePageProps> = ({ currentUser, onNavigate, storeId: propStoreId, onAddToCart }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  
  // Form state
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number | ''>('');
  const [newProductImageUrls, setNewProductImageUrls] = useState<string[]>(['']); // Array for multiple images
  const [newProductCommissionRate, setNewProductCommissionRate] = useState<number | ''>(10);
  const [newProductType, setNewProductType] = useState<ProductType>(ProductType.PHYSICAL);
  const [newDigitalContentUrl, setNewDigitalContentUrl] = useState('');
  const [newDigitalDownloadInstructions, setNewDigitalDownloadInstructions] = useState('');
  const [newAffiliateLink, setNewAffiliateLink] = useState('');
  
  const storeToDisplayId = propStoreId || (currentUser.userType === UserType.CREATOR ? currentUser.storeId : undefined);
  const isOwner = store?.professorId === currentUser.id;

  const fetchStoreData = useCallback(() => {
    setLoading(true);
    if (storeToDisplayId) {
      const foundStore = findStoreById(storeToDisplayId);
      if (foundStore) {
        setStore(foundStore);
        const allProducts = getProducts();
        const storeProducts = allProducts.filter(p => foundStore.productIds.includes(p.id));
        setProducts(storeProducts);
      } else {
        setStore(null);
        setAllStores(getStores());
      }
    } else {
      setStore(null);
      setAllStores(getStores());
    }
    setLoading(false);
  }, [storeToDisplayId]);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  const handleAddToCartClick = (productId: string) => {
    onAddToCart(productId);
    setAddedProductId(productId);
    setTimeout(() => setAddedProductId(null), 2000);
  };
  
  const resetProductForm = () => {
    setEditingProduct(null);
    setNewProductName('');
    setNewProductDescription('');
    setNewProductPrice('');
    setNewProductImageUrls(['']);
    setNewProductCommissionRate(10);
    setNewProductType(ProductType.PHYSICAL);
    setNewDigitalContentUrl('');
    setNewDigitalDownloadInstructions('');
    setNewAffiliateLink('');
    setFormMessage(null);
  };
  
  const handleOpenProductModal = (product: Product | null) => {
    resetProductForm();
    if (product) {
      setEditingProduct(product);
      setNewProductName(product.name);
      setNewProductDescription(product.description);
      setNewProductPrice(product.price);
      setNewProductImageUrls(product.imageUrls.length > 0 ? product.imageUrls : ['']);
      setNewProductCommissionRate(product.affiliateCommissionRate * 100);
      setNewProductType(product.type);
      setNewDigitalContentUrl(product.digitalContentUrl || '');
      setNewDigitalDownloadInstructions(product.digitalDownloadInstructions || '');
      setNewAffiliateLink(product.affiliateLink || '');
    }
    setIsProductModalOpen(true);
  };
  
  const handleImageUrlChange = (index: number, value: string) => {
    const updatedUrls = [...newProductImageUrls];
    updatedUrls[index] = value;
    setNewProductImageUrls(updatedUrls);
  };

  const addImageUrlField = () => {
    setNewProductImageUrls([...newProductImageUrls, '']);
  };

  const removeImageUrlField = (index: number) => {
    const updatedUrls = newProductImageUrls.filter((_, i) => i !== index);
    setNewProductImageUrls(updatedUrls.length > 0 ? updatedUrls : ['']);
  };

  const handleAddOrUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || newProductPrice === '' || newProductCommissionRate === '') return;
  
    const allProducts = getProducts();
    let updatedStoreProductIds = [...store.productIds];
    
    const finalImageUrls = newProductImageUrls.filter(url => url.trim() !== '');
  
    const productData = {
      name: newProductName,
      description: newProductDescription,
      price: newProductPrice,
      imageUrls: finalImageUrls.length > 0 ? finalImageUrls : [`https://picsum.photos/300/200?random=${Date.now()}`],
      affiliateCommissionRate: newProductCommissionRate / 100,
      type: newProductType,
      digitalContentUrl: newProductType !== ProductType.PHYSICAL ? newDigitalContentUrl : undefined,
      digitalDownloadInstructions: newProductType !== ProductType.PHYSICAL ? newDigitalDownloadInstructions : undefined,
      affiliateLink: newAffiliateLink,
    };
  
    if (editingProduct) {
      const updatedProduct: Product = { ...editingProduct, ...productData };
      const updatedAllProducts = allProducts.map(p => (p.id === editingProduct.id ? updatedProduct : p));
      saveProducts(updatedAllProducts);
    } else {
      const newProduct: Product = { 
        ...productData, 
        id: `prod-${Date.now()}`, 
        storeId: store.id,
        ratings: [],
        averageRating: 0,
        ratingCount: 0,
      };
      saveProducts([...allProducts, newProduct]);
      updatedStoreProductIds.push(newProduct.id);
    }
  
    const updatedStore: Store = { ...store, productIds: updatedStoreProductIds };
    updateStore(updatedStore);
    fetchStoreData();
    setIsProductModalOpen(false);
  };
  
  if (loading) {
    return <div className="container mx-auto p-4 pt-24 pb-20 text-center">Carregando loja...</div>;
  }
  
  if (!store) {
    return (
      <div className="container mx-auto p-4 md:p-8 pt-24 pb-20 md:pb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3 border-gray-200">Lojas de Criadores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allStores.map(s => {
            const owner = findUserById(s.professorId);
            return (
              <div key={s.id} onClick={() => onNavigate('store', { storeId: s.id })} className="bg-white rounded-xl shadow-md p-5 border border-gray-100 cursor-pointer transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <img src={owner?.profilePicture || DEFAULT_PROFILE_PIC} alt={owner?.firstName} className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-indigo-300" />
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 leading-tight">{s.name}</h3>
                    <p className="text-sm text-gray-600">por {owner?.firstName}</p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm line-clamp-3 h-[60px]">{s.description}</p>
                <span className="text-indigo-600 font-semibold text-sm mt-3 inline-block">Ver Loja &rarr;</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const storeOwner = findUserById(store.professorId);

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 pb-20 md:pb-8">
      <header className="relative bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
        <div className="h-40 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-t-xl -m-6 mb-6"></div>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8 -mt-20">
            <img src={storeOwner?.profilePicture || DEFAULT_PROFILE_PIC} alt={storeOwner?.firstName} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
            <div className="flex-grow text-center md:text-left pt-16">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-1">{store.name}</h2>
              <p className="text-lg text-gray-600 mb-2">Por {storeOwner?.firstName} {storeOwner?.lastName}</p>
              <p className="text-gray-700">{store.description}</p>
            </div>
            {isOwner && (
                <button onClick={() => handleOpenProductModal(null)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold transition-colors shadow-md mt-4 md:mt-16">
                    Adicionar Produto
                </button>
            )}
        </div>
      </header>
      
      <div className="mt-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Produtos</h3>
        {products.length === 0 ? (
          <p className="text-gray-600 text-center p-4">Nenhum produto ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md border border-gray-100 flex flex-col overflow-hidden group transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="relative">
                    <img src={product.imageUrls[0] || 'https://picsum.photos/300/200?random'} alt={product.name} className="w-full h-48 object-cover" />
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full">{product.type === ProductType.PHYSICAL ? 'Físico' : 'Digital'}</div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                    <h4 className="text-lg font-bold text-gray-900 mb-1 flex-grow line-clamp-2">{product.name}</h4>
                    <div className="my-2"><StarRating rating={product.averageRating} count={product.ratingCount} /></div>
                    <p className="text-2xl font-extrabold text-indigo-600 mb-3">${product.price.toFixed(2)}</p>
                    <div className="mt-auto space-y-2">
                        <button
                          onClick={() => handleAddToCartClick(product.id)}
                          disabled={addedProductId === product.id}
                          className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 ${
                            addedProductId === product.id 
                            ? 'bg-green-500 text-white cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {addedProductId === product.id ? <><CheckIcon className="h-4 w-4"/> Adicionado</> : <><ShoppingCartIcon className="h-4 w-4"/> Adicionar ao Carrinho</>}
                        </button>
                         {isOwner && (
                            <button onClick={() => handleOpenProductModal(product)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                                <PencilIcon className="h-4 w-4" /> Editar
                            </button>
                        )}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isProductModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setIsProductModalOpen(false)}>
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <form onSubmit={handleAddOrUpdateProduct} className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-800">{editingProduct ? 'Editar Produto' : 'Adicionar Produto'}</h3>
                      {formMessage && <div className={`p-3 rounded-lg text-sm ${formMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{formMessage.text}</div>}
                      
                      <div>
                          <label className="block text-gray-700 text-sm font-bold mb-1">Nome:</label>
                          <input type="text" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" required />
                      </div>
                      
                      <div>
                          <label className="block text-gray-700 text-sm font-bold mb-1">Descrição:</label>
                          <textarea value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} rows={3} className="w-full p-2 border border-gray-300 rounded-lg" required />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Imagens do Produto (URLs):</label>
                        {newProductImageUrls.map((url, index) => (
                          <div key={index} className="flex items-center gap-2 mb-2">
                            <input type="url" value={url} onChange={(e) => handleImageUrlChange(index, e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="https://exemplo.com/imagem.png" />
                            <button type="button" onClick={() => removeImageUrlField(index)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"><TrashIcon className="h-4 w-4"/></button>
                          </div>
                        ))}
                        <button type="button" onClick={addImageUrlField} className="text-sm text-blue-600 font-semibold flex items-center gap-1"><PlusIcon className="h-4 w-4"/> Adicionar outra imagem</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">Preço (USD):</label>
                            <input type="number" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} min="0.01" step="0.01" className="w-full p-2 border border-gray-300 rounded-lg" required />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-1">Comissão (%):</label>
                          <input type="number" value={newProductCommissionRate} onChange={(e) => setNewProductCommissionRate(e.target.value === '' ? '' : parseInt(e.target.value))} min="1" max="50" className="w-full p-2 border border-gray-300 rounded-lg" required />
                        </div>
                      </div>
                      <div>
                          <label className="block text-gray-700 text-sm font-bold mb-1">Tipo:</label>
                          <select value={newProductType} onChange={(e) => setNewProductType(e.target.value as ProductType)} className="w-full p-2 border border-gray-300 rounded-lg" required>
                            <option value={ProductType.PHYSICAL}>Físico</option>
                            <option value={ProductType.DIGITAL_COURSE}>Digital (Curso)</option>
                            <option value={ProductType.DIGITAL_EBOOK}>Digital (E-book)</option>
                            <option value={ProductType.DIGITAL_OTHER}>Digital (Outro)</option>
                          </select>
                      </div>
                      {newProductType !== ProductType.PHYSICAL && (
                        <>
                          <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">URL do Conteúdo Digital:</label>
                            <input type="url" value={newDigitalContentUrl} onChange={e => setNewDigitalContentUrl(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Link para download ou acesso" />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">Instruções de Acesso:</label>
                            <textarea value={newDigitalDownloadInstructions} onChange={e => setNewDigitalDownloadInstructions(e.target.value)} rows={2} className="w-full p-2 border border-gray-300 rounded-lg" />
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-1">Link de Afiliação Externo (Opcional):</label>
                        <input type="url" value={newAffiliateLink} onChange={e => setNewAffiliateLink(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="https://loja.com/produto?ref=123" />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                          <button type="button" onClick={() => setIsProductModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-bold">Cancelar</button>
                          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold">{editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};