
import React, { useState, useEffect, useMemo } from 'react';
import { User, AffiliateSale, Product, UserType, Store } from '../types';
import { getSalesByAffiliateId, getProducts, getUsers, getSalesByStoreId, getStores, findUserById, findProductById } from '../services/storageService';
import { ChartBarIcon, ClipboardDocumentCheckIcon, LinkIcon, PresentationChartLineIcon, ShoppingBagIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { DEFAULT_PROFILE_PIC } from '../constants';

interface AffiliatesPageProps {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-darkcard p-5 rounded-2xl shadow-sm border border-gray-50 dark:border-white/5 flex items-center space-x-4">
    <div className="bg-blue-50 dark:bg-blue-600/10 text-blue-600 p-3 rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const AffiliatesPage: React.FC<AffiliatesPageProps> = ({ currentUser, onNavigate }) => {
  const [myAffiliateSales, setMyAffiliateSales] = useState<AffiliateSale[]>([]);
  const [storeAffiliateSales, setStoreAffiliateSales] = useState<AffiliateSale[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setMyAffiliateSales(getSalesByAffiliateId(currentUser.id));
    setAllProducts(getProducts());
    if (currentUser.userType === UserType.CREATOR && currentUser.storeId) {
      setStoreAffiliateSales(getSalesByStoreId(currentUser.storeId));
    }
    setLoading(false);
  }, [currentUser]);

  const myStats = useMemo(() => {
    const totalSalesValue = myAffiliateSales.reduce((sum, sale) => sum + sale.saleAmount, 0);
    const totalCommission = myAffiliateSales.reduce((sum, sale) => sum + sale.commissionEarned, 0);
    return {
      salesCount: myAffiliateSales.length,
      totalSalesValue: totalSalesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' }),
      totalCommission: totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' }),
    };
  }, [myAffiliateSales]);

  const handleGetLink = (productId: string) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    const link = `${window.location.origin}?page=store&storeId=${product.storeId}&productId=${productId}&affiliateId=${currentUser.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(productId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading) return <div className="p-10 text-center font-black text-gray-400 uppercase tracking-widest text-[10px]">Carregando Painel...</div>;

  return (
    <div className="container mx-auto px-4 py-4 md:p-8 animate-fade-in space-y-10">
      
      {/* Stats Area */}
      <section>
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Seu Desempenho</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Comissão" value={myStats.totalCommission} icon={<ChartBarIcon className="h-6 w-6" />} />
          <StatCard title="Indicações" value={myStats.salesCount.toString()} icon={<ShoppingBagIcon className="h-6 w-6" />} />
          <StatCard title="Vendas" value={myStats.totalSalesValue} icon={<PresentationChartLineIcon className="h-6 w-6" />} />
        </div>
      </section>

      {/* Promotion Area */}
      <section>
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Produtos Recomendados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allProducts.slice(0, 6).map(product => (
            <div key={product.id} className="bg-white dark:bg-darkcard rounded-3xl shadow-sm border border-gray-50 dark:border-white/10 p-5 flex flex-col group">
              <div className="flex gap-4 mb-4">
                 <img src={product.imageUrls[0]} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                 <div className="overflow-hidden">
                    <h4 className="font-black text-gray-900 dark:text-white text-sm truncate">{product.name}</h4>
                    <p className="text-blue-600 font-black text-base mt-0.5">${product.price.toFixed(2)}</p>
                    <span className="text-[8px] font-black text-green-600 uppercase bg-green-50 dark:bg-white/5 px-2 py-0.5 rounded-lg">Ganhe {(product.affiliateCommissionRate * 100).toFixed(0)}% de Comissão</span>
                 </div>
              </div>
              <button
                onClick={() => handleGetLink(product.id)}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  copiedLink === product.id ? 'bg-green-500 text-white' : 'bg-gray-900 dark:bg-white dark:text-black text-white'
                }`}
              >
                {copiedLink === product.id ? <ClipboardDocumentCheckIcon className="h-4 w-4"/> : <LinkIcon className="h-4 w-4"/>}
                {copiedLink === product.id ? 'Copiado' : 'Link de Afiliado'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* History Area - Responsive Table/List */}
      <section className="pb-10">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Últimas Comissões</h3>
        <div className="bg-white dark:bg-darkcard rounded-[2.5rem] border border-gray-50 dark:border-white/10 overflow-hidden shadow-sm">
          {myAffiliateSales.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {myAffiliateSales.map(sale => {
                const product = findProductById(sale.productId);
                return (
                  <div key={sale.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <div>
                       <p className="font-black text-gray-900 dark:text-white text-xs truncate max-w-[150px]">{product?.name || 'Item'}</p>
                       <p className="text-[9px] font-bold text-gray-400 uppercase">{new Date(sale.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-green-600">+${sale.commissionEarned.toFixed(2)}</p>
                       <p className="text-[8px] font-black text-gray-400 uppercase">Comissão</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center text-gray-300 font-black uppercase text-[10px]">Sem vendas ainda</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AffiliatesPage;
