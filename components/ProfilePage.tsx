
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserType, Post, Store, AffiliateSale, Product, TransactionType, PaymentCard } from '../types';
import {
  findUserById,
  updateUser,
  getPosts,
  updateUserBalance,
  saveStores,
  pinPost,
  unpinPost,
  toggleFollowUser,
  getAffiliateSales,
  findProductById,
  addProductRating,
  requestDebitCard,
} from '../services/storageService';
import { generateProfileDescription, generateImageFromPrompt } from '../services/geminiService';
import { MIN_WITHDRAWAL_USD, DEFAULT_PROFILE_PIC, MIN_AI_FILTER_USD_COST } from '../constants';
import PostCard from './PostCard';
import { StarIcon, CreditCardIcon, QrCodeIcon, DocumentTextIcon, BanknotesIcon, ArrowPathIcon, WalletIcon, IdentificationIcon, ShoppingBagIcon, CalendarIcon, ChevronRightIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/solid';

interface ProfilePageProps {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  refreshUser: () => void;
  userId?: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onNavigate, refreshUser, userId }) => {
  const profileOwnerId = userId || currentUser.id;
  const isCurrentUserProfile = profileOwnerId === currentUser.id;
  const [profileOwner, setProfileOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [tempBio, setTempBio] = useState('');
  const [tempProfilePicture, setTempProfilePicture] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [depositAmount, setDepositAmount] = useState<number | ''>('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [depositStep, setDepositStep] = useState<'amount' | 'method' | 'processing' | 'success'>('amount');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto' | null>(null);
  const [ownerPosts, setOwnerPosts] = useState<Post[]>([]);

  // Form para solicitar cartão
  const [cardHolder, setCardHolder] = useState(`${currentUser.firstName} ${currentUser.lastName}`);

  const fetchProfileData = useCallback(() => {
    setLoading(true);
    const owner = findUserById(profileOwnerId);
    if (owner) {
      setProfileOwner(owner);
      setTempBio(owner.bio || '');
      setTempProfilePicture(owner.profilePicture || '');
      const posts = getPosts().filter((p) => p.userId === owner.id).sort((a, b) => (a.isPinned ? -1 : 1));
      setOwnerPosts(posts);
    }
    setLoading(false);
  }, [profileOwnerId]);

  useEffect(() => { fetchProfileData(); }, [fetchProfileData]);

  const handleDeposit = () => {
    if (depositAmount === '' || depositAmount <= 0) return;
    setDepositStep('processing');
    setTimeout(() => {
      updateUserBalance(currentUser.id, Number(depositAmount), 'Depósito via plataforma');
      refreshUser();
      fetchProfileData();
      setDepositStep('success');
    }, 1500);
  };

  const handleWithdrawal = () => {
    if (!profileOwner || withdrawAmount === '' || withdrawAmount < MIN_WITHDRAWAL_USD) return;
    if ((profileOwner.balance || 0) < Number(withdrawAmount)) {
      alert("Saldo insuficiente.");
      return;
    }
    updateUserBalance(profileOwner.id, -Number(withdrawAmount), 'Resgate de saldo');
    refreshUser();
    fetchProfileData();
    setWithdrawAmount('');
    alert("Saque solicitado com sucesso!");
  };

  const handleRequestCard = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard: PaymentCard = {
      cardNumber: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
      holderName: cardHolder.toUpperCase(),
      expiryDate: '12/29',
      cvv: '***',
      type: 'DEBIT'
    };
    requestDebitCard(currentUser.id, newCard);
    setShowCardForm(false);
    refreshUser();
    fetchProfileData();
    alert('Seu cartão de débito digital foi gerado e o físico será enviado para seu endereço!');
  };

  if (loading || !profileOwner) return <div className="pt-24 text-center">Carregando perfil...</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 pb-20">
      {/* Cabeçalho do Perfil */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8">
        <div className="h-48 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <img src={tempProfilePicture || DEFAULT_PROFILE_PIC} className="absolute -bottom-16 left-8 w-32 h-32 rounded-3xl border-4 border-white shadow-2xl object-cover transform transition-transform hover:scale-105" />
        </div>
        <div className="pt-20 px-8 pb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-4xl font-black text-gray-900">{profileOwner.firstName} {profileOwner.lastName}</h2>
              <span className={`inline-flex items-center mt-2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${profileOwner.userType === UserType.CREATOR ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {profileOwner.userType === UserType.CREATOR ? 'CONTA CREATOR' : 'CONTA STANDARD'}
              </span>
            </div>
            {isCurrentUserProfile && (
              <button onClick={() => setIsEditing(!isEditing)} className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                {isEditing ? 'Salvar Perfil' : 'Editar Perfil'}
              </button>
            )}
          </div>
          <div className="mt-8">
            <h3 className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em] mb-3">Sobre</h3>
            {isEditing ? (
              <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all" rows={3} />
            ) : (
              <p className="text-gray-700 text-lg leading-relaxed max-w-2xl">{profileOwner.bio || 'Este usuário ainda não definiu uma biografia.'}</p>
            )}
          </div>
        </div>
      </div>

      {isCurrentUserProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Sessão Carteira Bancária */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-50">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                  <WalletIcon className="h-8 w-8 text-blue-600" /> Minha Carteira
                </h3>
                <div className="text-right">
                  <p className="text-gray-400 text-xs font-bold uppercase">Saldo Disponível</p>
                  <p className="text-4xl font-black text-gray-900">${(profileOwner.balance || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <button onClick={() => { setDepositStep('amount'); setShowDepositModal(true); }} className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-lg shadow-blue-200 shadow-lg transition-all active:scale-95">
                  <BanknotesIcon className="h-6 w-6" /> Adicionar Saldo
                </button>
                <button onClick={() => {}} className="flex items-center justify-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-800 py-4 rounded-2xl font-black text-lg transition-all active:scale-95">
                  <ArrowPathIcon className="h-6 w-6" /> Transferir
                </button>
              </div>

              {/* Histórico de Transações */}
              <div className="mt-10">
                <h4 className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-4 flex justify-between">
                  <span>Últimas Movimentações</span>
                  <button className="text-blue-600 normal-case hover:underline">Ver tudo</button>
                </h4>
                <div className="space-y-3">
                  {(!profileOwner.transactions || profileOwner.transactions.length === 0) ? (
                    <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                      <p className="text-gray-400 font-medium">Nenhuma transação registrada.</p>
                    </div>
                  ) : (
                    profileOwner.transactions.slice(0, 5).map(trx => (
                      <div key={trx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-white hover:border-gray-100 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${trx.type === TransactionType.DEPOSIT ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {trx.type === TransactionType.DEPOSIT ? <PlusIcon className="h-5 w-5" /> : <MinusIcon className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{trx.description}</p>
                            <p className="text-xs text-gray-400">{new Date(trx.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <p className={`font-black text-lg ${trx.type === TransactionType.DEPOSIT ? 'text-green-600' : 'text-red-600'}`}>
                          {trx.type === TransactionType.DEPOSIT ? '+' : '-'}${trx.amount.toFixed(2)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cartão de Pagamento */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-50 flex flex-col items-center">
              <h3 className="text-xl font-black text-gray-800 mb-6 self-start">Cartão CyBerPhone</h3>
              
              {profileOwner.card ? (
                <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-gray-800 to-black p-6 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-125"></div>
                  <div className="flex justify-between items-start mb-10">
                    <div className="w-12 h-10 bg-yellow-400/80 rounded-lg flex items-center justify-center"><BanknotesIcon className="h-8 w-8 text-yellow-900/30" /></div>
                    <p className="font-black italic text-xl">CyBer<span className="text-blue-500">Bank</span></p>
                  </div>
                  <div className="mb-4">
                    <p className="text-xl font-mono tracking-widest drop-shadow-md">{profileOwner.card.cardNumber}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Titular</p>
                      <p className="text-sm font-bold uppercase">{profileOwner.card.holderName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold text-right">Validade</p>
                      <p className="text-sm font-bold">{profileOwner.card.expiryDate}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full text-center space-y-6">
                  <div className="w-full h-48 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                    <CreditCardIcon className="h-12 w-12 mb-2" />
                    <p className="font-bold">Nenhum cartão ativo</p>
                  </div>
                  <button onClick={() => setShowCardForm(true)} className="w-full bg-black text-white py-4 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                    Solicitar Cartão Digital
                  </button>
                </div>
              )}

              {profileOwner.userType === UserType.CREATOR && (
                <div className="w-full mt-8 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                  <h4 className="text-purple-800 font-black mb-4 flex items-center gap-2">
                    <StarIcon className="h-5 w-5" /> Área do Criador
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-purple-400 font-bold uppercase mb-1">Solicitar Resgate</p>
                      <div className="flex gap-2">
                        <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="$100 min." className="flex-1 p-3 rounded-xl border border-purple-200 outline-none text-sm font-bold" />
                        <button onClick={handleWithdrawal} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Sacar</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Depósito */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-fade-in border border-white">
            {depositStep === 'amount' && (
              <>
                <h3 className="text-3xl font-black mb-2 text-gray-900">Quanto adicionar?</h3>
                <p className="text-gray-500 mb-8">O saldo será creditado imediatamente após a confirmação.</p>
                <div className="relative mb-8">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-blue-600">$</span>
                    <input type="number" value={depositAmount} onChange={e => setDepositAmount(Number(e.target.value))} className="w-full text-5xl font-black p-6 pl-12 border-b-4 border-blue-100 focus:border-blue-600 outline-none text-left bg-transparent" placeholder="0.00" autoFocus />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[20, 50, 100].map(v => (
                    <button key={v} onClick={() => setDepositAmount(v)} className="bg-gray-50 p-4 rounded-2xl font-black hover:bg-blue-600 hover:text-white transition-all text-gray-600">${v}</button>
                  ))}
                </div>
                <button onClick={() => setDepositStep('method')} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-blue-200 shadow-xl active:scale-95 transition-all">Próximo</button>
                <button onClick={() => setShowDepositModal(false)} className="w-full mt-4 text-gray-400 font-bold py-2">Cancelar</button>
              </>
            )}

            {depositStep === 'method' && (
              <>
                <h3 className="text-2xl font-black mb-6">Forma de Pagamento</h3>
                <div className="space-y-3 mb-8">
                  <button onClick={() => setPaymentMethod('pix')} className={`w-full flex items-center gap-4 p-5 border-2 rounded-2xl transition-all ${paymentMethod === 'pix' ? 'border-blue-600 bg-blue-50 shadow-inner' : 'border-gray-50 hover:border-gray-200'}`}>
                    <div className="p-3 bg-blue-600 text-white rounded-xl"><QrCodeIcon className="h-6 w-6" /></div>
                    <div className="text-left"><p className="font-black text-gray-800">Pix</p><p className="text-xs text-gray-500 font-bold">Aprovação em segundos</p></div>
                  </button>
                  <button onClick={() => setPaymentMethod('card')} className={`w-full flex items-center gap-4 p-5 border-2 rounded-2xl transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50 shadow-inner' : 'border-gray-50 hover:border-gray-200'}`}>
                    <div className="p-3 bg-indigo-600 text-white rounded-xl"><CreditCardIcon className="h-6 w-6" /></div>
                    <div className="text-left"><p className="font-black text-gray-800">Cartão Salvo</p><p className="text-xs text-gray-500 font-bold">Crédito ou Débito</p></div>
                  </button>
                </div>
                <button onClick={handleDeposit} disabled={!paymentMethod} className="w-full bg-blue-600 disabled:bg-gray-200 text-white py-5 rounded-2xl font-black text-xl shadow-xl transition-all">Confirmar Pagamento</button>
                <button onClick={() => setDepositStep('amount')} className="w-full mt-4 text-gray-400 font-bold py-2">Voltar</button>
              </>
            )}

            {depositStep === 'processing' && (
              <div className="text-center py-16 flex flex-col items-center">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-blue-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-2xl font-black mt-8">Garantindo segurança...</h3>
                <p className="text-gray-400 font-bold mt-2">Estamos processando sua transação.</p>
              </div>
            )}

            {depositStep === 'success' && (
              <div className="text-center py-8">
                <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 scale-up animate-bounce">
                  <StarIcon className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-2">Tudo certo!</h3>
                <p className="text-gray-500 font-bold mb-8">Seu saldo de <span className="text-green-600">${depositAmount}</span> já está disponível na sua conta CyBerPhone.</p>
                <button onClick={() => setShowDepositModal(false)} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xl shadow-2xl transition-all active:scale-95">Incrível!</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Solicitação de Cartão */}
      {showCardForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border border-white">
            <h3 className="text-3xl font-black mb-2 text-gray-900">Solicitar Cartão CyBerPhone</h3>
            <p className="text-gray-500 mb-10">Receba benefícios exclusivos em nossa rede.</p>
            <form onSubmit={handleRequestCard} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nome no Cartão</label>
                <input type="text" value={cardHolder} onChange={e => setCardHolder(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none font-black text-lg transition-all" placeholder="NOME COMO NO DOCUMENTO" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Modalidade</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 border-2 border-blue-600 rounded-2xl">
                    <p className="font-black text-blue-900">Digital + Físico</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase">Liberação imediata</p>
                  </div>
                  <div className="p-4 bg-gray-50 border-2 border-transparent rounded-2xl opacity-50 grayscale cursor-not-allowed">
                    <p className="font-black text-gray-400">Somente Físico</p>
                    <p className="text-[10px] font-bold text-gray-300 uppercase">Indisponível</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-start gap-4">
                <IdentificationIcon className="h-6 w-6 text-yellow-600 shrink-0" />
                <p className="text-sm text-yellow-800 font-bold leading-tight">Ao solicitar, você concorda com nossos termos de conta digital e uso de dados para análise de crédito.</p>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowCardForm(false)} className="flex-1 text-gray-400 font-black py-4">Voltar</button>
                <button type="submit" className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">Emitir Meu Cartão</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feed de Publicações do Usuário */}
      <div className="mt-16">
        <h3 className="text-2xl font-black text-gray-800 mb-8 border-b pb-4 border-gray-100">Publicações</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ownerPosts.map(post => (
            <PostCard key={post.id} post={post} currentUser={currentUser} onNavigate={onNavigate} onFollowToggle={() => {}} refreshUser={refreshUser} onPostUpdatedOrDeleted={fetchProfileData} onPinToggle={() => {}} />
          ))}
          {ownerPosts.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold text-xl italic">Este usuário ainda não publicou nada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
