
import React, { useState, useEffect, useMemo } from 'react';
import { AdCampaign, User, AdLocation } from '../types';
import { saveAds, getAds, updateUserBalance } from '../services/storageService';
import { generateAdCopy } from '../services/geminiService';
import { MIN_AD_CAMPAIGN_USD_COST, DEFAULT_PROFILE_PIC } from '../constants';
import { 
  RocketLaunchIcon, 
  MegaphoneIcon, 
  EyeIcon, 
  CursorArrowRaysIcon, 
  PhotoIcon, 
  CurrencyDollarIcon,
  ChevronRightIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  SparklesIcon,
  CheckCircleIcon,
  MapPinIcon,
  GlobeAltIcon,
  XMarkIcon,
  PlusIcon,
  InformationCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  UsersIcon
} from '@heroicons/react/24/solid';

interface AdCampaignPageProps {
  currentUser: User;
  refreshUser: () => void;
  onNavigate?: (page: string) => void;
}

const AdCampaignPage: React.FC<AdCampaignPageProps> = ({ currentUser, refreshUser }) => {
  const [loading, setLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);

  // Form State
  const [campaignName, setCampaignName] = useState('');
  const [objective, setObjective] = useState<'traffic' | 'awareness' | 'engagement'>('traffic');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [ctaText, setCtaText] = useState('Saiba Mais');
  const [targetAudience, setTargetAudience] = useState('');
  const [placements, setPlacements] = useState<string[]>(['feed']);
  
  // Dynamic Budget State
  const [durationDays, setDurationDays] = useState<number>(7);
  const [dailyReachGoal, setDailyReachGoal] = useState<number>(5000);
  
  // Location Targeting State
  const [targetedLocations, setTargetedLocations] = useState<AdLocation[]>([]);
  const [locCountry, setLocCountry] = useState('');
  const [locProvince, setLocProvince] = useState('');
  const [locCity, setLocCity] = useState('');

  const [myAds, setMyAds] = useState<AdCampaign[]>([]);
  const [previewPlacement, setPreviewPlacement] = useState<'feed' | 'sidebar'>('feed');

  // CONSTANTES DE CÁLCULO (Simulação de CPM/CPC)
  // $0.50 a cada 1000 pessoas (Educação é mais barato)
  const COST_PER_1K_REACH = 0.50; 
  
  const calculatedTotalBudget = useMemo(() => {
    const costPerDay = (dailyReachGoal / 1000) * COST_PER_1K_REACH;
    const total = costPerDay * durationDays;
    return Math.max(total, MIN_AD_CAMPAIGN_USD_COST);
  }, [dailyReachGoal, durationDays]);

  useEffect(() => {
    setMyAds(getAds().filter(ad => ad.professorId === currentUser.id));
  }, [currentUser.id]);

  const addLocation = () => {
    if (!locCountry) return;
    const newLoc: AdLocation = {
      country: locCountry,
      province: locProvince || undefined,
      city: locCity || undefined
    };
    setTargetedLocations([...targetedLocations, newLoc]);
    setLocCountry('');
    setLocProvince('');
    setLocCity('');
  };

  const removeLocation = (index: number) => {
    setTargetedLocations(targetedLocations.filter((_, i) => i !== index));
  };

  const handleGeminiGen = async () => {
    setGeminiLoading(true);
    try {
      const prompt = `Crie um anúncio para: ${title || 'meu novo curso'}. Público: ${targetAudience || 'estudantes'}.`;
      const copy = await generateAdCopy(prompt);
      setDescription(copy);
    } finally {
      setGeminiLoading(false);
    }
  }

  const handlePublish = () => {
    if (!title || !description || targetedLocations.length === 0 || placements.length === 0) {
      alert("Por favor, preencha o título, descrição, pelo menos uma localização e uma posição de exibição.");
      return;
    }

    if ((currentUser.balance || 0) < calculatedTotalBudget) {
      alert("Saldo insuficiente na carteira para esta configuração de alcance/duração.");
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
        locations: targetedLocations,
        budget: calculatedTotalBudget,
        isActive: true,
        imageUrl: imageUrl || 'https://picsum.photos/800/450?random=${Date.now()}',
        linkUrl: linkUrl || '#',
        ctaText,
        placements,
        timestamp: Date.now()
      };

      updateUserBalance(currentUser.id, -calculatedTotalBudget);
      const all = getAds();
      saveAds([...all, newAd]);
      setMyAds([newAd, ...myAds]);
      
      alert(`Campanha publicada! Orçamento total de $${calculatedTotalBudget.toFixed(2)} por ${durationDays} dias.`);
      resetForm();
      setLoading(false);
      refreshUser();
    }, 2000);
  };

  const resetForm = () => {
    setCampaignName('');
    setTitle('');
    setDescription('');
    setImageUrl('');
    setLinkUrl('');
    setTargetAudience('');
    setPlacements(['feed']);
    setTargetedLocations([]);
    setDurationDays(7);
    setDailyReachGoal(5000);
  };

  const togglePlacement = (id: string) => {
    setPlacements(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const objectives = [
    { id: 'traffic', label: 'Tráfego', icon: CursorArrowRaysIcon },
    { id: 'awareness', label: 'Reconhecimento', icon: EyeIcon },
    { id: 'engagement', label: 'Engajamento', icon: MegaphoneIcon },
  ];

  const placementOptions = [
    { id: 'feed', label: 'Feed Principal', icon: DevicePhoneMobileIcon },
    { id: 'reels', label: 'CyBer Reels', icon: ComputerDesktopIcon },
    { id: 'sidebar', label: 'Barra Lateral', icon: ComputerDesktopIcon },
  ];

  const inputStyle = "w-full p-4 bg-gray-50 dark:bg-darkbg rounded-xl border border-gray-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm transition-all dark:text-white";
  const labelStyle = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1";

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#0b0e14] pt-20 pb-24 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white dark:bg-darkcard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5">
           <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-2">
                <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
                Gerenciador de Anúncios CyBer
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Crie anúncios que geram resultados reais</p>
           </div>
           <div className="flex items-center gap-4 bg-gray-50 dark:bg-darkbg p-3 rounded-2xl border border-gray-100 dark:border-white/10">
              <div className="text-right">
                 <p className="text-[9px] font-black text-gray-400 uppercase">Saldo Disponível</p>
                 <p className="text-lg font-black text-blue-600">${(currentUser.balance || 0).toFixed(2)}</p>
              </div>
              <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-100 dark:shadow-none hover:bg-blue-700 active:scale-95 transition-all">Recarregar</button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Ad Creation Form */}
          <main className="lg:col-span-8 space-y-6">
             
             {/* Campaign Section */}
             <div className="bg-white dark:bg-darkcard rounded-[2rem] p-8 shadow-xl border border-gray-100 dark:border-white/5 animate-fade-in">
                <div className="flex items-center gap-3 mb-8 border-b border-gray-50 dark:border-white/5 pb-6">
                   <div className="bg-blue-600 text-white p-2 rounded-lg"><InformationCircleIcon className="h-5 w-5"/></div>
                   <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">1. Detalhes da Campanha</h2>
                </div>

                <div className="space-y-6">
                   <div>
                      <label className={labelStyle}>Nome da Campanha (Interno)</label>
                      <input 
                        type="text" 
                        value={campaignName} 
                        onChange={e => setCampaignName(e.target.value)} 
                        className={inputStyle} 
                        placeholder="Ex: Campanha de Lançamento - Curso Python 2024" 
                      />
                   </div>

                   <div>
                      <label className={labelStyle}>Objetivo de Marketing</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                         {objectives.map(obj => (
                           <button 
                             key={obj.id}
                             onClick={() => setObjective(obj.id as any)}
                             className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${objective === obj.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10 text-blue-600' : 'border-gray-100 dark:border-white/5 text-gray-400'}`}
                           >
                              <obj.icon className="h-5 w-5" />
                              <span className="font-black text-[10px] uppercase">{obj.label}</span>
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             {/* Creative Section */}
             <div className="bg-white dark:bg-darkcard rounded-[2rem] p-8 shadow-xl border border-gray-100 dark:border-white/5 animate-fade-in">
                <div className="flex items-center gap-3 mb-8 border-b border-gray-50 dark:border-white/5 pb-6">
                   <div className="bg-purple-600 text-white p-2 rounded-lg"><PhotoIcon className="h-5 w-5"/></div>
                   <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">2. Criativo do Anúncio</h2>
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                         <label className={labelStyle}>Título do Anúncio</label>
                         <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputStyle} placeholder="Título curto e impactante" />
                      </div>
                      <div>
                         <label className={labelStyle}>Link de Destino</label>
                         <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className={inputStyle} placeholder="https://seu-curso.com" />
                      </div>
                   </div>

                   <div className="relative">
                      <div className="flex justify-between items-center mb-2 px-1">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Texto Principal</label>
                         <button onClick={handleGeminiGen} disabled={geminiLoading} className="text-[9px] font-black uppercase text-purple-600 flex items-center gap-1 hover:underline disabled:opacity-50">
                            <SparklesIcon className="h-3 w-3" /> {geminiLoading ? 'Gerando...' : 'Melhorar com IA'}
                         </button>
                      </div>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputStyle} resize-none`} placeholder="O que o público verá acima da imagem..." />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                         <label className={labelStyle}>URL da Imagem (Upload)</label>
                         <div className="flex gap-2">
                           <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={inputStyle} placeholder="Cole o link da imagem aqui" />
                           <button onClick={() => setImageUrl(`https://picsum.photos/800/450?random=${Date.now()}`)} className="bg-gray-100 dark:bg-darkbg p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-200 transition-all">
                              <PhotoIcon className="h-5 w-5 text-gray-400" />
                           </button>
                         </div>
                      </div>
                      <div>
                         <label className={labelStyle}>Botão de Chamada (CTA)</label>
                         <select value={ctaText} onChange={e => setCtaText(e.target.value)} className={inputStyle}>
                            <option>Saiba Mais</option>
                            <option>Comprar Agora</option>
                            <option>Inscrever-se</option>
                            <option>Acessar Aula</option>
                         </select>
                      </div>
                   </div>
                </div>
             </div>

             {/* Dynamic Budget Section */}
             <div className="bg-white dark:bg-darkcard rounded-[2rem] p-8 shadow-xl border border-gray-100 dark:border-white/5 animate-fade-in">
                <div className="flex items-center gap-3 mb-8 border-b border-gray-50 dark:border-white/5 pb-6">
                   <div className="bg-yellow-500 text-white p-2 rounded-lg"><CurrencyDollarIcon className="h-5 w-5"/></div>
                   <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">3. Orçamento e Planejamento</h2>
                </div>

                <div className="space-y-12">
                   {/* Duração */}
                   <div className="space-y-4">
                      <div className="flex justify-between items-end px-1">
                         <div>
                            <label className={labelStyle}>Duração da Campanha</label>
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                               <CalendarIcon className="h-5 w-5 text-blue-600" />
                               <span className="text-xl font-black">{durationDays} dias</span>
                            </div>
                         </div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase">Término: {new Date(Date.now() + durationDays * 86400000).toLocaleDateString()}</p>
                      </div>
                      <input 
                        type="range" min={1} max={30} step={1} 
                        value={durationDays} 
                        onChange={e => setDurationDays(parseInt(e.target.value))} 
                        className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                   </div>

                   {/* Alcance Diário */}
                   <div className="space-y-4">
                      <div className="flex justify-between items-end px-1">
                         <div>
                            <label className={labelStyle}>Pessoas a Alcançar (Por Dia)</label>
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                               <UsersIcon className="h-5 w-5 text-purple-600" />
                               <span className="text-xl font-black">{dailyReachGoal.toLocaleString()} pessoas</span>
                            </div>
                         </div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase">Frequência: ~1.5x</p>
                      </div>
                      <input 
                        type="range" min={1000} max={100000} step={500} 
                        value={dailyReachGoal} 
                        onChange={e => setDailyReachGoal(parseInt(e.target.value))} 
                        className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                   </div>

                   {/* Resumo Financeiro */}
                   <div className="bg-gray-50 dark:bg-darkbg p-8 rounded-3xl border border-gray-100 dark:border-white/5 text-center">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Investimento Total Estimado</p>
                      <p className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter mb-4">${calculatedTotalBudget.toFixed(2)}</p>
                      <div className="flex justify-center gap-6 text-[10px] font-black text-gray-400 uppercase border-t border-gray-200 dark:border-white/5 pt-6 mt-6">
                         <div className="text-center">
                            <p className="text-gray-900 dark:text-white text-sm">${((dailyReachGoal / 1000) * COST_PER_1K_REACH).toFixed(2)}</p>
                            <p>Custo Diário</p>
                         </div>
                         <div className="w-px h-8 bg-gray-200 dark:bg-white/10"></div>
                         <div className="text-center">
                            <p className="text-gray-900 dark:text-white text-sm">{(dailyReachGoal * durationDays).toLocaleString()}</p>
                            <p>Alcance Total</p>
                         </div>
                      </div>
                   </div>

                   <button 
                     onClick={handlePublish}
                     disabled={loading || !title || targetedLocations.length === 0}
                     className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                     {loading ? <div className="w-8 h-8 border-4 border-white border-t-transparent animate-spin rounded-full" /> : <><RocketLaunchIcon className="h-8 w-8"/> PUBLICAR AGORA</>}
                   </button>
                </div>
             </div>

             {/* Targeting Section */}
             <div className="bg-white dark:bg-darkcard rounded-[2rem] p-8 shadow-xl border border-gray-100 dark:border-white/5 animate-fade-in">
                <div className="flex items-center gap-3 mb-8 border-b border-gray-50 dark:border-white/5 pb-6">
                   <div className="bg-green-600 text-white p-2 rounded-lg"><UserGroupIcon className="h-5 w-5"/></div>
                   <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">4. Localização do Público</h2>
                </div>

                <div className="space-y-8">
                   <div>
                      <label className={labelStyle}>Descrição do Público-Alvo</label>
                      <input 
                        type="text" 
                        value={targetAudience} 
                        onChange={e => setTargetAudience(e.target.value)} 
                        className={inputStyle} 
                        placeholder="Ex: Estudantes de engenharia interessados em física quântica" 
                      />
                   </div>

                   <div className="space-y-4">
                      <label className={labelStyle}>Localização do Rastreio</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                         <input type="text" placeholder="País" value={locCountry} onChange={e => setLocCountry(e.target.value)} className={inputStyle} />
                         <input type="text" placeholder="Província" value={locProvince} onChange={e => setLocProvince(e.target.value)} className={inputStyle} />
                         <input type="text" placeholder="Cidade" value={locCity} onChange={e => setLocCity(e.target.value)} className={inputStyle} />
                      </div>
                      <button 
                        onClick={addLocation}
                        disabled={!locCountry}
                        className="w-full py-4 bg-gray-900 dark:bg-white dark:text-black text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01]"
                      >
                        <PlusIcon className="h-5 w-5" /> Adicionar Filtro de Localização
                      </button>
                   </div>

                   {targetedLocations.length > 0 && (
                     <div className="flex flex-wrap gap-2 pt-2">
                        {targetedLocations.map((loc, idx) => (
                          <div key={idx} className="bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-300 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-900/30 flex items-center gap-2 text-[10px] font-black">
                             <MapPinIcon className="h-3 w-3" />
                             {loc.country}{loc.city ? ` (${loc.city})` : ''}
                             <button onClick={() => removeLocation(idx)}><XMarkIcon className="h-4 w-4"/></button>
                          </div>
                        ))}
                     </div>
                   )}

                   <div>
                      <label className={labelStyle}>Plataformas de Exibição</label>
                      <div className="flex flex-wrap gap-3">
                         {placementOptions.map(opt => (
                           <button 
                             key={opt.id}
                             onClick={() => togglePlacement(opt.id)}
                             className={`flex-1 min-w-[120px] flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${placements.includes(opt.id) ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10 text-blue-600' : 'border-gray-50 dark:border-darkbg text-gray-400'}`}
                           >
                              <opt.icon className="h-6 w-6" />
                              <span className="font-black text-[9px] uppercase">{opt.label}</span>
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </main>

          {/* Sidebar Preview */}
          <aside className="lg:col-span-4 space-y-6">
             <div className="sticky top-24">
                <div className="bg-white dark:bg-darkcard rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-darkcard overflow-hidden">
                   <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-white/5">
                      <div className="flex items-center gap-3">
                         <img src={currentUser.profilePicture || DEFAULT_PROFILE_PIC} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                         <div>
                            <p className="font-black text-xs text-gray-900 dark:text-white leading-none">{currentUser.firstName} {currentUser.lastName}</p>
                            <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-1">Patrocinado</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setPreviewPlacement('feed')} className={`p-1.5 rounded-lg ${previewPlacement === 'feed' ? 'bg-blue-50 text-blue-600' : 'text-gray-300'}`}><DevicePhoneMobileIcon className="h-4 w-4"/></button>
                        <button onClick={() => setPreviewPlacement('sidebar')} className={`p-1.5 rounded-lg ${previewPlacement === 'sidebar' ? 'bg-blue-50 text-blue-600' : 'text-gray-300'}`}><ComputerDesktopIcon className="h-4 w-4"/></button>
                      </div>
                   </div>

                   <div className="p-4">
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic line-clamp-3">
                        {description || 'O texto do seu anúncio aparecerá aqui para seus alunos em potencial...'}
                      </p>
                   </div>

                   <div className="relative aspect-video bg-gray-100 dark:bg-darkbg overflow-hidden group">
                      {imageUrl ? (
                        <img src={imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Preview" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                           <PhotoIcon className="h-12 w-12 opacity-20" />
                           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sua arte aqui</p>
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[7px] font-black text-white uppercase border border-white/10">
                         {previewPlacement === 'feed' ? 'No Feed' : 'Lateral'}
                      </div>
                   </div>

                   <div className="p-5 bg-gray-50 dark:bg-darkbg/50 flex items-center justify-between border-t border-gray-100 dark:border-white/5">
                      <div className="flex-1 pr-3 overflow-hidden">
                         <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter truncate">{linkUrl || 'cyberphone.app'}</p>
                         <p className="text-sm font-black text-gray-900 dark:text-white truncate">{title || 'Título Irresistível'}</p>
                      </div>
                      <button className="bg-gray-900 dark:bg-white dark:text-black text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap shadow-lg active:scale-95 transition-all">
                         {ctaText}
                      </button>
                   </div>
                </div>

                {/* Estimate Reach Card */}
                <div className="mt-8 bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-[40px]"></div>
                   <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                      <GlobeAltIcon className="h-5 w-5 text-blue-200" /> Estimativa de Alcance
                   </h3>
                   <div className="space-y-6 relative z-10">
                      <div>
                         <p className="text-3xl font-black tracking-tighter">{(dailyReachGoal * 0.9).toLocaleString()} - {(dailyReachGoal * 1.1).toLocaleString()}</p>
                         <p className="text-[10px] font-black text-blue-200 uppercase mt-1">Pessoas alcançadas / dia</p>
                      </div>
                      <div>
                         <p className="text-2xl font-black tracking-tighter">{Math.round(dailyReachGoal * 0.02).toLocaleString()} - {Math.round(dailyReachGoal * 0.05).toLocaleString()}</p>
                         <p className="text-[10px] font-black text-blue-200 uppercase mt-1">Cliques no link / dia</p>
                      </div>
                      <div className="pt-4 border-t border-white/10">
                         <p className="text-[9px] font-bold opacity-70 leading-relaxed italic">
                           *Estimativa para {durationDays} dias com público de "{targetAudience || 'Interesse Geral'}".
                         </p>
                      </div>
                   </div>
                </div>
             </div>
          </aside>
        </div>

        {/* Existing Campaigns Section */}
        {myAds.length > 0 && (
          <section className="mt-20 border-t border-gray-200 dark:border-white/5 pt-16">
             <div className="flex items-center gap-3 mb-10">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Campanhas Ativas</h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAds.map(ad => (
                   <div key={ad.id} className="bg-white dark:bg-darkcard rounded-[2rem] p-6 border border-gray-100 dark:border-white/5 shadow-sm group hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-black">
                               <RocketLaunchIcon className="h-6 w-6"/>
                            </div>
                            <div>
                               <p className="font-black text-xs text-gray-900 dark:text-white truncate max-w-[120px]">{ad.title}</p>
                               <span className="text-[9px] font-black text-green-600 uppercase">Ativo</span>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black text-gray-900 dark:text-white">${ad.budget.toFixed(2)}</p>
                            <p className="text-[8px] font-black text-gray-400 uppercase">Investido</p>
                         </div>
                      </div>
                      <button className="w-full py-3 bg-gray-50 dark:bg-darkbg rounded-xl text-[10px] font-black uppercase text-gray-500 hover:text-blue-600 transition-colors">Visualizar Resultados</button>
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
