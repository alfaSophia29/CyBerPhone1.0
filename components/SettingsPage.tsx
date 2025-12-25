
import React, { useState } from 'react';
import { User, UserType, PaymentCard } from '../types';
import { updateUser, requestDebitCard } from '../services/storageService';
import { 
  ShieldCheckIcon, 
  BellIcon, 
  UserIcon, 
  GlobeAltIcon, 
  PaintBrushIcon, 
  ArrowLeftIcon, 
  CreditCardIcon,
  CheckIcon,
  PhotoIcon,
  IdentificationIcon,
  XMarkIcon,
  CreditCardIcon as CreditCardIconSolid
} from '@heroicons/react/24/outline';

interface SettingsPageProps {
  currentUser: User;
  onNavigate: (page: any) => void;
  darkMode: boolean;
  toggleTheme: () => void;
  refreshUser: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, onNavigate, darkMode, toggleTheme, refreshUser }) => {
  const [view, setView] = useState<'main' | 'edit-profile' | 'payments' | 'security'>('main');
  const [notifications, setNotifications] = useState(true);

  // States para edição de perfil
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [credentials, setCredentials] = useState(currentUser.credentials || '');
  const [profilePicture, setProfilePicture] = useState(currentUser.profilePicture || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // States para pagamento
  const [cardData, setCardData] = useState<PaymentCard>(currentUser.card || { cardNumber: '', holderName: '', expiryDate: '', cvv: '', type: 'CREDIT' });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const updatedUser: User = {
      ...currentUser,
      firstName,
      lastName,
      bio,
      credentials,
      profilePicture
    };

    setTimeout(() => {
      updateUser(updatedUser);
      refreshUser();
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    requestDebitCard(currentUser.id, cardData);
    refreshUser();
    alert('Informações de pagamento atualizadas!');
    setView('main');
  };

  const sections = [
    { title: 'Conta', items: [
        { label: 'Informações Pessoais', icon: UserIcon, desc: 'Nome, bio e foto', onClick: () => setView('edit-profile') },
        { label: 'Segurança e Senha', icon: ShieldCheckIcon, desc: 'Mude sua senha de acesso', onClick: () => setView('security') },
        { label: 'Métodos de Pagamento', icon: CreditCardIcon, desc: 'Gerencie seus cartões salvos', onClick: () => setView('payments') }
    ]},
    { title: 'Preferências', items: [
        { label: 'Notificações Push', icon: BellIcon, desc: 'Avisos de novos posts e vendas', toggle: notifications, onToggle: () => setNotifications(!notifications) },
        { label: 'Tema Escuro', icon: PaintBrushIcon, desc: 'Alternar entre claro e escuro', toggle: darkMode, onToggle: toggleTheme }
    ]}
  ];

  if (view === 'edit-profile') {
    return (
      <div className="container mx-auto p-4 md:p-8 pt-24 pb-20 max-w-2xl animate-fade-in">
        <div className="flex items-center gap-6 mb-10">
          <button onClick={() => setView('main')} className="p-3 bg-white dark:bg-darkcard rounded-2xl shadow-md text-gray-400 hover:text-blue-600 transition-all">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Editar Perfil</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Sua identidade digital</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-8 bg-white dark:bg-darkcard p-8 rounded-[3rem] shadow-xl border border-gray-50 dark:border-white/10">
          <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-50 dark:border-white/10">
            <img src={profilePicture || 'https://picsum.photos/200'} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-blue-50 shadow-xl" />
            <input 
              type="text" 
              value={profilePicture} 
              onChange={(e) => setProfilePicture(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-white/5 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
              placeholder="URL da imagem..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="p-4 bg-gray-50 dark:bg-white/5 dark:text-white rounded-2xl outline-none font-bold" placeholder="Nome" />
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="p-4 bg-gray-50 dark:bg-white/5 dark:text-white rounded-2xl outline-none font-bold" placeholder="Sobrenome" />
          </div>

          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full p-4 bg-gray-50 dark:bg-white/5 dark:text-white rounded-2xl outline-none font-medium" placeholder="Biografia" />

          <button 
            type="submit" 
            disabled={isSaving}
            className={`w-full py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${saveSuccess ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}
          >
            {isSaving ? <div className="w-6 h-6 border-4 border-white border-t-transparent animate-spin rounded-full" /> : saveSuccess ? 'Salvo!' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    );
  }

  if (view === 'payments') {
    return (
        <div className="container mx-auto p-4 md:p-8 pt-24 pb-20 max-w-2xl animate-fade-in">
          <div className="flex items-center gap-6 mb-10">
            <button onClick={() => setView('main')} className="p-3 bg-white dark:bg-darkcard rounded-2xl shadow-md text-gray-400 hover:text-blue-600 transition-all"><ArrowLeftIcon className="h-6 w-6" /></button>
            <h2 className="text-4xl font-black dark:text-white tracking-tighter">Pagamentos</h2>
          </div>
          <form onSubmit={handleSaveCard} className="bg-white dark:bg-darkcard p-8 rounded-[3rem] shadow-xl border dark:border-white/10 space-y-6">
             <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden mb-8">
                <CreditCardIconSolid className="h-10 w-10 mb-8" />
                <p className="text-xl font-mono tracking-[0.3em] mb-4">{cardData.cardNumber || '**** **** **** ****'}</p>
                <div className="flex justify-between">
                   <p className="uppercase text-xs font-black">{cardData.holderName || 'NOME NO CARTÃO'}</p>
                   <p className="font-mono text-sm">{cardData.expiryDate || 'MM/AA'}</p>
                </div>
             </div>
             <input type="text" placeholder="Número do Cartão" className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none" value={cardData.cardNumber} onChange={e => setCardData({...cardData, cardNumber: e.target.value})} />
             <input type="text" placeholder="Nome Impresso" className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none uppercase" value={cardData.holderName} onChange={e => setCardData({...cardData, holderName: e.target.value})} />
             <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Validade" className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none" value={cardData.expiryDate} onChange={e => setCardData({...cardData, expiryDate: e.target.value})} />
                <input type="password" placeholder="CVV" className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none" value={cardData.cvv} onChange={e => setCardData({...cardData, cvv: e.target.value})} />
             </div>
             <button type="submit" className="w-full py-5 bg-black dark:bg-white dark:text-black text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all">Vincular Cartão</button>
          </form>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 pb-20 max-w-4xl animate-fade-in">
      <div className="flex items-center gap-6 mb-10">
        <button onClick={() => onNavigate('profile')} className="p-3 bg-white dark:bg-darkcard rounded-2xl shadow-md text-gray-400 hover:text-blue-600 transition-all">
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Configurações</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Personalize sua experiência</p>
        </div>
      </div>

      <div className="space-y-10">
        {sections.map(section => (
          <div key={section.title}>
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 ml-4">{section.title}</h3>
            <div className="bg-white dark:bg-darkcard rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-white/10 overflow-hidden">
              {section.items.map((item, idx) => (
                <div 
                  key={item.label} 
                  onClick={item.onClick}
                  className={`p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${idx !== section.items.length - 1 ? 'border-b border-gray-50 dark:border-white/10' : ''}`}
                >
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 dark:text-white text-sm">{item.label}</p>
                      <p className="text-xs text-gray-400 font-bold">{item.desc}</p>
                    </div>
                  </div>
                  
                  {item.onToggle ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); item.onToggle?.(); }}
                      className={`w-12 h-6 rounded-full transition-all relative ${item.toggle ? 'bg-blue-600' : 'bg-gray-200 dark:bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.toggle ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  ) : (
                    <button className="text-gray-300 font-black text-xl">&rarr;</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 bg-red-50 dark:bg-red-500/5 rounded-[2.5rem] border border-red-100 dark:border-red-500/20 flex items-center justify-between">
        <div>
          <p className="font-black text-red-900 dark:text-red-400 text-sm uppercase">Zona de Perigo</p>
          <p className="text-xs text-red-600 dark:text-red-300 font-bold mt-1">Ações permanentes na conta.</p>
        </div>
        <button className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-red-700 transition-all">Excluir Conta</button>
      </div>
    </div>
  );
};

export default SettingsPage;
