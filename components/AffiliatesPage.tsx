import React, { useState, useEffect, useMemo } from 'react';
import { User, AffiliateSale, Product, UserType, Store } from '../types';
// FIX: Imported `findProductById` which was missing and causing a reference error.
import { getSalesByAffiliateId, getProducts, getUsers, getSalesByStoreId, getStores, findUserById, findProductById } from '../services/storageService';
import { ChartBarIcon, ClipboardDocumentCheckIcon, LinkIcon, PresentationChartLineIcon, ShoppingBagIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { DEFAULT_PROFILE_PIC } from '../constants';

interface AffiliatesPageProps {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-4">
    <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
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

  const storeStats = useMemo(() => {
    if (currentUser.userType !== UserType.CREATOR) return null;
    const totalSalesValue = storeAffiliateSales.reduce((sum, sale) => sum + sale.saleAmount, 0);
    const totalCommissionPaid = storeAffiliateSales.reduce((sum, sale) => sum + sale.commissionEarned, 0);
    return {
      salesCount: storeAffiliateSales.length,
      totalSalesValue: totalSalesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' }),
      totalCommissionPaid: totalCommissionPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' }),
    };
  }, [storeAffiliateSales, currentUser.userType]);

  const topAffiliates = useMemo(() => {
    if (currentUser.userType !== UserType.CREATOR) return [];
    const affiliatePerformance: { [key: string]: { sales: number; commission: number } } = {};
    storeAffiliateSales.forEach(sale => {
      if (!affiliatePerformance[sale.affiliateUserId]) {
        affiliatePerformance[sale.affiliateUserId] = { sales: 0, commission: 0 };
      }
      affiliatePerformance[sale.affiliateUserId].sales += sale.saleAmount;
      affiliatePerformance[sale.affiliateUserId].commission += sale.commissionEarned;
    });
    const allUsers = getUsers();
    return Object.entries(affiliatePerformance)
      .map(([userId, data]) => ({
        user: allUsers.find(u => u.id === userId),
        ...data,
      }))
      .filter(item => item.user)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [storeAffiliateSales, currentUser.userType]);

  const handleGetLink = (productId: string) => {
    const link = `${window.location.origin}?page=store&storeId=${allProducts.find(p=>p.id === productId)?.storeId}&productId=${productId}&affiliateId=${currentUser.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(productId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando dados de afiliação...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 pb-20 md:pb-8 space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 border-b pb-3 border-gray-200">Painel de Afiliados</h2>
      
      {/* My Affiliate Dashboard */}
      <section>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Meu Desempenho como Afiliado</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Comissão Total" value={myStats.totalCommission} icon={<ChartBarIcon className="h-6 w-6" />} />
          <StatCard title="Vendas Geradas" value={myStats.salesCount.toString()} icon={<ShoppingBagIcon className="h-6 w-6" />} />
          <StatCard title="Valor Total Vendido" value={myStats.totalSalesValue} icon={<PresentationChartLineIcon className="h-6 w-6" />} />
        </div>
      </section>

      {/* Creator's Store Affiliate Performance */}
      {currentUser.userType === UserType.CREATOR && storeStats && (
        <section className="p-6 bg-purple-50 rounded-2xl border border-purple-200">
          <h3 className="text-xl font-bold text-purple-800 mb-4">Desempenho da Minha Loja</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Comissão Paga" value={storeStats.totalCommissionPaid} icon={<ChartBarIcon className="h-6 w-6" />} />
            <StatCard title="Vendas por Afiliados" value={storeStats.salesCount.toString()} icon={<SparklesIcon className="h-6 w-6" />} />
            <StatCard title="Valor Vendido por Afiliados" value={storeStats.totalSalesValue} icon={<TrophyIcon className="h-6 w-6" />} />
          </div>
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-purple-800 mb-2">Top Afiliados</h4>
            <div className="bg-white rounded-lg p-3">
              {topAffiliates.length > 0 ? (
                <ul className="space-y-2">
                  {topAffiliates.map((aff, index) => (
                    <li key={aff.user?.id} className="flex items-center justify-between p-2 rounded hover:bg-purple-50">
                      <div className="flex items-center">
                        <span className="font-bold text-gray-600 mr-3">{index + 1}.</span>
                        <img src={aff.user?.profilePicture || DEFAULT_PROFILE_PIC} className="w-8 h-8 rounded-full mr-3" alt={aff.user?.firstName} />
                        <span className="font-semibold text-gray-800">{aff.user?.firstName} {aff.user?.lastName}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-700">${aff.sales.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">em vendas</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-center text-gray-500 py-4">Nenhuma venda por afiliados ainda.</p>}
            </div>
          </div>
        </section>
      )}

      {/* Products to Promote */}
      <section>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Produtos para Promover</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-4 flex flex-col">
              <img src={product.imageUrls[0]} alt={product.name} className="w-full h-40 object-cover rounded-lg mb-3" />
              <h4 className="font-bold text-gray-900">{product.name}</h4>
              <p className="text-lg font-extrabold text-indigo-600 my-2">${product.price.toFixed(2)}</p>
              <div className="text-sm bg-green-100 text-green-800 font-semibold px-2 py-1 rounded-full self-start">
                Comissão: {(product.affiliateCommissionRate * 100).toFixed(0)}% (~${(product.price * product.affiliateCommissionRate).toFixed(2)})
              </div>
              <button
                onClick={() => handleGetLink(product.id)}
                className={`mt-4 w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 ${
                  copiedLink === product.id ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiedLink === product.id ? <ClipboardDocumentCheckIcon className="h-5 w-5"/> : <LinkIcon className="h-5 w-5"/>}
                {copiedLink === product.id ? 'Copiado!' : 'Obter Link'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* My Affiliate Sales History */}
      <section>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Meu Histórico de Vendas</h3>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          {myAffiliateSales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Produto</th>
                    <th className="px-4 py-2">Valor da Venda</th>
                    <th className="px-4 py-2">Sua Comissão</th>
                    <th className="px-4 py-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {myAffiliateSales.map(sale => {
                    const product = findProductById(sale.productId);
                    return (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{product?.name || 'Produto Removido'}</td>
                        <td className="px-4 py-2">${sale.saleAmount.toFixed(2)}</td>
                        <td className="px-4 py-2 font-semibold text-green-600">${sale.commissionEarned.toFixed(2)}</td>
                        <td className="px-4 py-2 text-gray-500">{new Date(sale.timestamp).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <p className="text-center text-gray-500 py-4">Você ainda não realizou nenhuma venda como afiliado.</p>}
        </div>
      </section>
    </div>
  );
};

export default AffiliatesPage;
