
import React, { useState, useEffect, useMemo } from 'react';
import { AdCampaign, User } from '../types';
import { saveAds, getAds, updateUserBalance, findUserById } from '../services/storageService';
import { generateAdCopy } from '../services/geminiService';
import { MIN_AD_CAMPAIGN_USD_COST, KZT_TO_USD_RATE, DEFAULT_PROFILE_PIC } from '../constants';
import { 
  RocketLaunchIcon, 
  MegaphoneIcon, 
  EyeIcon, 
  CursorArrowRaysIcon, 
  PhotoIcon, 
  CurrencyDollarIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/solid';

interface AdCampaignPageProps {
  currentUser: User;
  refreshUser: () => void;
  onNavigate?: (page: string) => void;
}

type Step = 'objective' | 'creative' | 'budget';

const AdCampaignPage: React.FC<AdCampaignPageProps> = ({ currentUser, refreshUser }) => {
  const [activeStep, setActiveStep] = useState<Step>('objective');
  const [loading, setLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);

  // Form State
  const [objective, setObjective] = useState<'traffic' | 'awareness' | 'engagement'>('traffic');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [ctaText, setCtaText] = useState('Saiba Mais');
  const [targetAudience, setTargetAudience] = useState('');
  const [budget, setBudget] = useState<number>(MIN_AD_CAMPAIGN_USD_COST);

  const [myAds, setMyAds] = useState<AdCampaign[]>([]);

  useEffect(() => {
    setMyAds(getAds().filter(ad => ad.professorId === currentUser.id));
  }, [currentUser.id]);

  const handleGeminiGen = async () => {
    setGeminiLoading(true);
    try {
      const prompt = `Crie um anúncio para: ${title || 'meu novo curso'}. Público: ${targetAudience || 'estudantes'}.`;
      const copy = await generateAdCopy(prompt);
      setDescription(copy);
    } finally {
      setGeminiLoading(false);
    }
  };

  const handlePublish = () => {
    if (!title || !description || !targetAudience) {
      alert("Por favor, preencha as informações obrigatórias.");
      return;
    }

    if ((currentUser.balance || 0) < budget) {
      alert("Saldo insuficiente na carteira.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newAd: AdCampaign = {
        id: `ad-${Date.now()}`,
        professorId: currentUser.id,
        title,
        description,
        targetAudience,
        budget,
        isActive: true,
        imageUrl: imageUrl || 'https://picsum.photos/600/300',
        linkUrl: linkUrl || '#',
        timestamp: Date.now()
      };

      updateUserBalance(currentUser.id, -budget, `Criação de Anúncio: ${title}`);
      const all = getAds();
      saveAds([...all, newAd]);
      setMyAds([newAd, ...myAds]);
      
      alert("Campanha publicada com sucesso!");
      resetForm();
      setLoading(false);
      refreshUser();
    }, 2000);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setLinkUrl('');
    setActiveStep('objective');
  };

  const objectives = [
    { id: 'traffic', label: 'Tráfego', icon: CursorArrowRaysIcon, desc: 'Envie alunos para seu site ou curso.' },
    { id: 'awareness', label: 'Reconhecimento', icon: EyeIcon, desc: 'Alcance o máximo de pessoas possíveis.' },
    { id: 'engagement', label: 'Engajamento', icon: MegaphoneIcon, desc: 'Obtenha mais curtidas e comentários.' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#0b0e14] pt-20 pb-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header - FB Style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
           <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Central de Anúncios CyBer</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">Gerencie seu alcance e vendas</p>
           </div>
           <div className="flex items-center gap-4 bg-white dark:bg-darkcard p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
              <div className="text-right">
                 <p className="text-[10px] font-black text-gray-400 uppercase">Saldo Disponível</p>
                 <p className="text-lg font-black text-blue-600">${(currentUser.balance || 0).toFixed(2)}</p>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all">+ Fundos</button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar de Passos - Desktop */}
          <aside className="hidden lg:block lg:col-span-3 space-y-2">
             <div className="bg-white dark:bg-darkcard rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 sticky top-24">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Configuração da Campanha</p>
                <div className="space-y-4">
                   {[
                     { id: 'objective', label: '1. Objetivo', icon: RocketLaunchIcon },
                     { id: 'creative', label: '2. Criativo', icon: PhotoIcon },
                     { id: 'budget', label: '3. Orçamento', icon: CurrencyDollarIcon },
                   ].map(step => (
                     <button 
                       key={step.id}
                       disabled={loading}
                       onClick={() => setActiveStep(step.id as Step)}
                       className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-sm transition-all ${activeStep === step.id ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                     >
                       <step.icon className="h-5 w-5" />
                       {step.label}
                     </button>
                   ))}
                </div>
             </div>
          </aside>

          {/* Área de Formulário Principal */}
          <main className="lg:col-span-5 space-y-6">
             
             {/* Progress Bar Mobile */}
             <div className="lg:hidden flex justify-between mb-4 px-2">
                {['objective', 'creative', 'budget'].map((s, i) => (
                   <div key={s} className={`h-2 flex-1 mx-1 rounded-full ${activeStep === s ? 'bg-blue-600' : 'bg-gray-200 dark:bg-white/10'}`}></div>
                ))}
             </div>

             <div className="bg-white dark:bg-darkcard rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-white/5">
                
                {/* Passo 1: Objetivo */}
                {activeStep === 'objective' && (
                  <div className="animate-fade-in">
                    <h3 className="text-xl font-black mb-2 text-gray-900 dark:text-white">Qual seu objetivo hoje?</h3>
                    <p className="text-gray-500 text-sm mb-8">Escolha a meta que melhor descreve o que você deseja alcançar.</p>
                    <div className="space-y-4">
                       {objectives.map(obj => (
                         <button 
                           key={obj.id}
                           onClick={() => setObjective(obj.id as any)}
                           className={`w-full flex items-center gap-5 p-5 rounded-[2rem] border-4 transition-all text-left group ${objective === obj.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10' : 'border-gray-50 dark:border-white/5 hover:border-gray-200'}`}
                         >
                            <div className={`p-4 rounded-2xl ${objective === obj.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'} transition-colors`}>
                               <obj.icon className="h-7 w-7" />
                            </div>
                            <div>
                               <p className="font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{obj.label}</p>
                               <p className="text-xs text-gray-500">{obj.desc}</p>
                            </div>
                         </button>
                       ))}
                    </div>
                    <button onClick={() => setActiveStep('creative')} className="w-full mt-10 bg-gray-900 dark:bg-white dark:text-black text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all">Continuar <ChevronRightIcon className="h-6 w-6"/></button>
                  </div>
                )}

                {/* Passo 2: Criativo */}
                {activeStep === 'creative' && (
                  <div className="animate-fade-in space-y-6">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Design do Anúncio</h3>
                    <div className="space-y-4">
                       <div className="relative">
                          <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-2">Título do Anúncio</label>
                          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold" placeholder="Ex: Masterclass de Física Quântica" />
                       </div>
                       
                       <div className="relative">
                          <div className="flex justify-between items-center mb-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase block ml-2">Texto Principal</label>
                             <button onClick={handleGeminiGen} disabled={geminiLoading} className="text-[9px] font-black uppercase text-purple-600 flex items-center gap-1 hover:underline">
                                <SparklesIcon className="h-3 w-3" /> {geminiLoading ? 'Gerando...' : 'Gerar com IA'}
                             </button>
                          </div>
                          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-medium text-sm" placeholder="Escreva o que as pessoas verão primeiro..." />
                       </div>

                       <div className="relative">
                          <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-2">URL da Imagem / Criativo</label>
                          <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold" placeholder="Link da imagem (Unsplash, Picsum...)" />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-2">Link de Destino</label>
                             <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none font-bold text-xs" placeholder="https://..." />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-2">Texto do Botão</label>
                             <select value={ctaText} onChange={e => setCtaText(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none font-bold text-xs appearance-none">
                                <option>Saiba Mais</option>
                                <option>Comprar Agora</option>
                                <option>Inscrever-se</option>
                                <option>Ver Perfil</option>
                             </select>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                       <button onClick={() => setActiveStep('objective')} className="flex-1 bg-gray-100 dark:bg-white/5 py-4 rounded-2xl font-black text-sm uppercase text-gray-500">Voltar</button>
                       <button onClick={() => setActiveStep('budget')} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl">Próximo Passo</button>
                    </div>
                  </div>
                )}

                {/* Passo 3: Orçamento */}
                {activeStep === 'budget' && (
                  <div className="animate-fade-in space-y-8">
                     <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Público e Orçamento</h3>
                        <p className="text-gray-500 text-sm">Defina para quem você quer aparecer e quanto quer investir.</p>
                     </div>

                     <div className="space-y-6">
                        <div className="relative">
                           <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-2">Público Alvo</label>
                           <textarea value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm" placeholder="Ex: Estudantes de engenharia, interessados em cálculo, 18-35 anos..." />
                        </div>

                        <div className="p-6 bg-blue-50 dark:bg-blue-600/10 rounded-[2rem] border-2 border-blue-100 dark:border-blue-900/20">
                           <div className="flex justify-between items-end mb-4">
                              <label className="text-[10px] font-black text-blue-600 uppercase">Investimento Total (USD)</label>
                              <p className="text-3xl font-black text-blue-600">${budget.toFixed(2)}</p>
                           </div>
                           <input 
                             type="range" 
                             min={MIN_AD_CAMPAIGN_USD_COST} 
                             max={500} 
                             step={5} 
                             value={budget} 
                             onChange={e => setBudget(parseFloat(e.target.value))} 
                             className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                           />
                           <div className="flex justify-between mt-2 text-[9px] font-black text-blue-300 uppercase">
                              <span>Min: ${MIN_AD_CAMPAIGN_USD_COST}</span>
                              <span>Max: $500</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                           <CheckCircleIcon className="h-5 w-5 text-green-500" />
                           <p className="text-xs font-bold text-gray-600 dark:text-gray-400">Alcance estimado: <span className="text-blue-600 font-black">{Math.floor(budget * 250).toLocaleString()} pessoas</span></p>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                           <ClockIcon className="h-5 w-5 text-blue-500" />
                           <p className="text-xs font-bold text-gray-600 dark:text-gray-400">Duração: <span className="text-blue-600 font-black">7 dias úteis</span></p>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <button onClick={() => setActiveStep('creative')} className="flex-1 bg-gray-100 dark:bg-white/5 py-4 rounded-2xl font-black text-sm uppercase text-gray-500">Voltar</button>
                        <button 
                          onClick={handlePublish}
                          disabled={loading}
                          className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl shadow-green-100 dark:shadow-none hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <><RocketLaunchIcon className="h-5 w-5"/> PUBLICAR ANÚNCIO</>}
                        </button>
                     </div>
                  </div>
                )}
             </div>
          </main>

          {/* PRÉVIA EM TEMPO REAL - Idêntica ao Feed */}
          <aside className="lg:col-span-4 space-y-6">
             <div className="sticky top-24">
                <div className="flex items-center justify-between mb-4 px-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prévia do Feed</p>
                   <div className="flex gap-2">
                      <DevicePhoneMobileIcon className="h-4 w-4 text-blue-600" />
                      <ComputerDesktopIcon className="h-4 w-4 text-gray-300" />
                   </div>
                </div>

                <div className="bg-white dark:bg-darkcard rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-darkcard overflow-hidden">
                   {/* Header do Card Simulado */}
                   <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <img src={currentUser.profilePicture || DEFAULT_PROFILE_PIC} className="w-10 h-10 rounded-xl object-cover" />
                         <div>
                            <p className="font-black text-xs text-gray-900 dark:text-white leading-none">{currentUser.firstName} {currentUser.lastName}</p>
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">Anúncio Patrocinado</p>
                         </div>
                      </div>
                      <div className="flex gap-1">
                         <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                         <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                         <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      </div>
                   </div>

                   {/* Conteúdo Simulado */}
                   <div className="px-5 pb-3">
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed line-clamp-3">
                         {description || 'O texto principal do seu anúncio aparecerá aqui. Use gatilhos mentais e benefícios para o aluno.'}
                      </p>
                   </div>

                   {/* Mídia Simulada */}
                   <div className="bg-gray-100 dark:bg-[#1a1c24] h-52 relative overflow-hidden group">
                      {imageUrl ? (
                        <img src={imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                           <PhotoIcon className="h-12 w-12 mb-2 opacity-20" />
                           <p className="text-[9px] font-black uppercase tracking-widest">Seu criativo aqui</p>
                        </div>
                      )}
                      
                      {/* Banner de CTA no Card */}
                      <div className="absolute bottom-0 left-0 w-full bg-white/95 dark:bg-darkcard/95 backdrop-blur-md p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                         <div className="flex-1 pr-4">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter truncate">{linkUrl || 'cyberphone.io/sua-oferta'}</p>
                            <p className="text-xs font-black text-gray-900 dark:text-white truncate">{title || 'Título Chamativo'}</p>
                         </div>
                         <button className="bg-gray-900 dark:bg-white dark:text-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap shadow-lg">
                            {ctaText}
                         </button>
                      </div>
                   </div>

                   {/* Footer Simulado */}
                   <div className="p-4 flex items-center gap-4 border-t border-gray-50 dark:border-white/5 opacity-40 grayscale">
                      <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-gray-200 rounded-full" /><div className="w-8 h-2 bg-gray-200 rounded-full" /></div>
                      <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-gray-200 rounded-full" /><div className="w-8 h-2 bg-gray-200 rounded-full" /></div>
                   </div>
                </div>

                {/* Dicas FB Style */}
                <div className="mt-8 bg-purple-50 dark:bg-purple-600/5 p-6 rounded-3xl border border-purple-100 dark:border-purple-900/20">
                   <div className="flex items-center gap-2 mb-3">
                      <SparklesIcon className="h-5 w-5 text-purple-600" />
                      <p className="text-[10px] font-black text-purple-600 uppercase">Dica de Performance</p>
                   </div>
                   <p className="text-xs text-purple-800 dark:text-purple-300 font-medium leading-relaxed">
                      "Imagens com pouco texto costumam ter 40% mais alcance no feed dos alunos. Deixe o texto denso para a descrição!"
                   </p>
                </div>
             </div>
          </aside>
        </div>

        {/* Lista de Anúncios Existentes */}
        {myAds.length > 0 && (
          <section className="mt-20">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Suas Campanhas Ativas</h2>
                <div className="h-px flex-1 mx-8 bg-gray-200 dark:bg-white/5" />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAds.map(ad => (
                   <div key={ad.id} className="bg-white dark:bg-darkcard rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-black">
                               {ad.title[0]}
                            </div>
                            <div>
                               <p className="font-black text-sm text-gray-900 dark:text-white line-clamp-1">{ad.title}</p>
                               <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Veiculando Agora</p>
                            </div>
                         </div>
                         <button className="text-gray-300 hover:text-red-500 transition-colors">
                            <div className="w-1 h-1 bg-current rounded-full mb-0.5" /><div className="w-1 h-1 bg-current rounded-full mb-0.5" /><div className="w-1 h-1 bg-current rounded-full" />
                         </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 my-6 py-4 border-y border-gray-50 dark:border-white/5">
                         <div className="text-center">
                            <p className="text-lg font-black text-gray-900 dark:text-white">{(Math.random() * 5000).toFixed(0)}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Impressões</p>
                         </div>
                         <div className="text-center">
                            <p className="text-lg font-black text-blue-600">${ad.budget.toFixed(2)}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Investido</p>
                         </div>
                      </div>

                      <button className="w-full py-3 bg-gray-50 dark:bg-white/5 rounded-xl text-xs font-black uppercase text-gray-500 hover:text-blue-600 transition-all">Ver Detalhes do Público</button>
                   </div>
                ))}
             </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdCampaignPage;
