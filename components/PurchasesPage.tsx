
import React, { useState, useEffect, useMemo } from 'react';
import { User, AffiliateSale, Product, OrderStatus, ProductType } from '../types';
import { getPurchasesByBuyerId, findProductById, addProductRating } from '../services/storageService';
import { ShoppingBagIcon, TruckIcon, CheckCircleIcon, ClockIcon, StarIcon, ArrowDownTrayIcon, ArchiveBoxIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface PurchasesPageProps {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const PurchasesPage: React.FC<PurchasesPageProps> = ({ currentUser, onNavigate }) => {
  const [purchases, setPurchases] = useState<AffiliateSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');
  const [ratingModal, setRatingModal] = useState<{saleId: string, productId: string} | null>(null);
  const [tempRating, setTempRating] = useState(5);
  const [tempComment, setTempComment] = useState('');

  useEffect(() => {
    setLoading(true);
    const data = getPurchasesByBuyerId(currentUser.id);
    setPurchases(data);
    setLoading(false);
  }, [currentUser.id]);

  const filteredPurchases = useMemo(() => {
    if (activeTab === 'ALL') return purchases;
    return purchases.filter(p => p.status === activeTab);
  }, [purchases, activeTab]);

  const handleRateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModal) return;
    addProductRating(ratingModal.saleId, tempRating, tempComment);
    setRatingModal(null);
    setTempComment('');
    setPurchases(getPurchasesByBuyerId(currentUser.id));
    alert('Avaliação enviada!');
  };

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.WAITLIST:
        return { label: 'Pendente', color: 'text-orange-600', bg: 'bg-orange-50', icon: ClockIcon, progress: 'w-1/3' };
      case OrderStatus.SHIPPING:
        return { label: 'A Caminho', color: 'text-blue-600', bg: 'bg-blue-50', icon: TruckIcon, progress: 'w-2/3' };
      case OrderStatus.DELIVERED:
        return { label: 'Entregue', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircleIcon, progress: 'w-full' };
    }
  };

  if (loading) return <div className="p-10 text-center font-black text-gray-400 uppercase tracking-widest text-xs">Aguarde...</div>;

  return (
    <div className="container mx-auto px-1 py-4 md:p-8 animate-fade-in">
      <header className="mb-6 px-4">
        <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white mb-1">Pedidos</h2>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Seus investimentos educacionais</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar px-4 pb-2">
         {[
           { id: 'ALL', label: 'Tudo', icon: ArchiveBoxIcon },
           { id: OrderStatus.WAITLIST, label: 'Espera', icon: ClockIcon },
           { id: OrderStatus.SHIPPING, label: 'Envio', icon: TruckIcon },
           { id: OrderStatus.DELIVERED, label: 'Acesso', icon: CheckCircleIcon }
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${
               activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-white/5 text-gray-500 border border-gray-100 dark:border-white/10'
             }`}
           >
             <tab.icon className="h-4 w-4" />
             {tab.label}
           </button>
         ))}
      </div>

      {filteredPurchases.length === 0 ? (
        <div className="bg-white dark:bg-darkcard rounded-[2.5rem] p-16 text-center border-2 border-dashed border-gray-100 dark:border-white/10 mx-4">
           <ShoppingBagIcon className="h-12 w-12 text-gray-200 mx-auto mb-4" />
           <p className="text-gray-400 font-black uppercase text-[10px]">Nada por aqui</p>
        </div>
      ) : (
        <div className="space-y-4 px-4">
          {filteredPurchases.map(sale => {
            const product = findProductById(sale.productId);
            if (!product) return null;
            const config = getStatusConfig(sale.status);

            return (
              <div key={sale.id} className="bg-white dark:bg-darkcard rounded-3xl shadow-sm border border-gray-50 dark:border-white/10 p-5 group transition-all hover:shadow-md">
                 <div className="flex gap-4 mb-4">
                    <img src={product.imageUrls[0]} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                    <div className="flex-1 overflow-hidden">
                       <h4 className="font-black text-gray-900 dark:text-white text-sm leading-tight truncate">{product.name}</h4>
                       <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter mt-1">ID: #{sale.id.split('-')[1]}</p>
                       <p className="text-lg font-black text-gray-900 dark:text-white mt-1">${sale.saleAmount.toFixed(2)}</p>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                       <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${config.bg} ${config.color} dark:bg-white/5`}>{config.label}</span>
                       <span className="text-[9px] font-bold text-gray-400">{new Date(sale.timestamp).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                       <div className={`h-full ${config.color.replace('text', 'bg')} ${config.progress} transition-all`}></div>
                    </div>

                    <div className="flex gap-2 pt-2">
                       {product.type !== ProductType.PHYSICAL && sale.status === OrderStatus.DELIVERED ? (
                          <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Acessar</button>
                       ) : null}
                       {sale.status === OrderStatus.DELIVERED && !sale.isRated && (
                          <button onClick={() => setRatingModal({saleId: sale.id, productId: product.id})} className="flex-1 bg-gray-50 dark:bg-white/5 text-gray-500 py-3 rounded-xl text-[10px] font-black uppercase">Avaliar</button>
                       )}
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Rating */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setRatingModal(null)}>
           <div className="bg-white dark:bg-darkcard w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 text-center">Avaliação do Produto</h3>
              <form onSubmit={handleRateProduct} className="space-y-6">
                 <div className="flex justify-center gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} type="button" onClick={() => setTempRating(star)} className="p-1">
                         {star <= tempRating ? <StarIconSolid className="h-8 w-8 text-yellow-400" /> : <StarIcon className="h-8 w-8 text-gray-200" />}
                      </button>
                    ))}
                 </div>
                 <textarea value={tempComment} onChange={e => setTempComment(e.target.value)} placeholder="Sua opinião..." className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none text-sm dark:text-white h-24" required />
                 <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Enviar</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default PurchasesPage;
