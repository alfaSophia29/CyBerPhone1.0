
import React, { useState, useEffect } from 'react';
import { User, CyberEvent, UserType } from '../types';
import { getEvents, createEvent, toggleJoinEvent, findUserById } from '../services/storageService';
// Import DEFAULT_PROFILE_PIC from constants to fix the "Cannot find name 'DEFAULT_PROFILE_PIC'" errors
import { DEFAULT_PROFILE_PIC } from '../constants';
import { 
  CalendarIcon, 
  MapPinIcon, 
  VideoCameraIcon, 
  UserGroupIcon, 
  PlusIcon, 
  XMarkIcon, 
  GlobeAltIcon, 
  SparklesIcon,
  PhotoIcon,
  ClockIcon,
  GlobeAmericasIcon,
  LockClosedIcon,
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon, CameraIcon } from '@heroicons/react/24/solid';

interface EventsPageProps {
  currentUser: User;
}

const EventsPage: React.FC<EventsPageProps> = ({ currentUser }) => {
  const [events, setEvents] = useState<CyberEvent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'MY_EVENTS'>('ALL');

  // Event Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<'ONLINE' | 'PRESENTIAL'>('ONLINE');
  const [isPublic, setIsPublic] = useState(true);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    setEvents(getEvents().sort((a, b) => a.dateTime - b.dateTime));
  }, []);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !startTime) return;

    const newEvent: CyberEvent = {
      id: `evt-${Date.now()}`,
      creatorId: currentUser.id,
      creatorName: `${currentUser.firstName} ${currentUser.lastName}`,
      title,
      description,
      dateTime: new Date(`${startDate}T${startTime}`).getTime(),
      endDateTime: endDate && endTime ? new Date(`${endDate}T${endTime}`).getTime() : undefined,
      location,
      type,
      isPublic,
      attendees: [currentUser.id],
      imageUrl: imageUrl || `https://picsum.photos/800/400?random=${Date.now()}`
    };
    createEvent(newEvent);
    setEvents([...getEvents()].sort((a, b) => a.dateTime - b.dateTime));
    setShowCreateModal(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setStartDate(''); setStartTime(''); 
    setEndDate(''); setEndTime(''); setLocation(''); setType('ONLINE');
    setIsPublic(true); setImageUrl('');
  };

  const handleJoin = (eventId: string) => {
    toggleJoinEvent(eventId, currentUser.id);
    setEvents(getEvents().sort((a, b) => a.dateTime - b.dateTime));
  };

  const filteredEvents = filter === 'ALL' 
    ? events 
    : events.filter(e => e.attendees.includes(currentUser.id));

  return (
    <div className="container mx-auto px-2 py-4 md:p-8 animate-fade-in max-w-7xl">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 px-2">
        <div className="space-y-1">
           <h2 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter">Eventos</h2>
           <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] md:text-xs">Descubra novas experiências educacionais na CyBerPhone</p>
        </div>
        
        <div className="flex gap-3">
           <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl">
              <button 
                onClick={() => setFilter('ALL')}
                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${filter === 'ALL' ? 'bg-white dark:bg-darkcard text-blue-600 shadow-md' : 'text-gray-500'}`}
              >
                Explorar
              </button>
              <button 
                onClick={() => setFilter('MY_EVENTS')}
                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${filter === 'MY_EVENTS' ? 'bg-white dark:bg-darkcard text-blue-600 shadow-md' : 'text-gray-500'}`}
              >
                Meus Eventos
              </button>
           </div>
           
           {currentUser.userType === UserType.CREATOR && (
             <button 
               onClick={() => setShowCreateModal(true)}
               className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] flex items-center gap-2 shadow-xl active:scale-95 transition-all uppercase tracking-widest"
             >
               <PlusIcon className="h-4 w-4 stroke-[4]" /> Criar Evento
             </button>
           )}
        </div>
      </header>

      {filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-darkcard rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100 dark:border-white/5 mx-2">
           <div className="bg-gray-50 dark:bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarIcon className="h-10 w-10 text-gray-300" />
           </div>
           <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Nenhum encontro agendado</h3>
           <p className="text-gray-500 font-medium">Fique atento às notificações dos seus professores favoritos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
           {filteredEvents.map(evt => {
             const isJoined = evt.attendees.includes(currentUser.id);
             const isCreator = evt.creatorId === currentUser.id;

             return (
               <div key={evt.id} className="bg-white dark:bg-darkcard rounded-[2.5rem] overflow-hidden border border-gray-50 dark:border-white/5 shadow-sm group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden">
                     <img src={evt.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={evt.title} />
                     <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black text-gray-900 uppercase shadow-lg border border-white/20">
                        {evt.type === 'ONLINE' ? '🎥 Aula Online' : '📍 Encontro Presencial'}
                     </div>
                     {!evt.isPublic && (
                        <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-md p-1.5 rounded-full text-white shadow-lg">
                           <LockClosedIcon className="h-4 w-4" />
                        </div>
                     )}
                  </div>

                  <div className="p-8">
                     <div className="flex items-center gap-2 mb-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                          {new Date(evt.dateTime).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                           {new Date(evt.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>

                     <h4 className="text-xl font-black text-gray-900 dark:text-white mb-3 leading-tight truncate">{evt.title}</h4>
                     <p className="text-gray-500 dark:text-gray-400 text-sm font-medium line-clamp-2 mb-6 leading-relaxed">
                        {evt.description}
                     </p>
                     
                     <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase">
                           <MapPinIcon className="h-4 w-4 text-blue-500" />
                           <span className="truncate">{evt.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase">
                           <UserGroupIcon className="h-4 w-4 text-blue-500" />
                           <span>{evt.attendees.length} inscritos</span>
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-white/5">
                        <div className="flex items-center gap-2">
                           <img 
                            src={findUserById(evt.creatorId)?.profilePicture || DEFAULT_PROFILE_PIC} 
                            className="w-8 h-8 rounded-lg object-cover border-2 border-white shadow-sm" 
                            alt={evt.creatorName}
                           />
                           <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase truncate max-w-[80px]">{evt.creatorName.split(' ')[0]}</p>
                        </div>
                        {!isCreator ? (
                          <button 
                            onClick={() => handleJoin(evt.id)}
                            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              isJoined 
                              ? 'bg-green-50 text-green-600 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20' 
                              : 'bg-blue-600 text-white shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-700 active:scale-95'
                            }`}
                          >
                             {isJoined ? 'Confirmado' : 'Participar'}
                          </button>
                        ) : (
                           <button className="px-5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest cursor-default">
                              Organizador
                           </button>
                        )}
                     </div>
                  </div>
               </div>
             );
           })}
        </div>
      )}

      {/* NEW FACEBOOK-STYLE EVENT CREATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-0 md:p-6 animate-fade-in" onClick={() => setShowCreateModal(false)}>
           <div className="bg-white dark:bg-darkcard w-full max-w-5xl h-full md:h-auto md:max-h-[92vh] rounded-none md:rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
              
              {/* Sidebar do Formulário */}
              <div className="w-full md:w-[400px] border-r border-gray-100 dark:border-white/10 flex flex-col bg-white dark:bg-darkbg">
                 <div className="p-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                    <div>
                       <h3 className="text-xl font-black dark:text-white tracking-tight">Criar Evento</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Detalhes da sua experiência</p>
                    </div>
                    <button onClick={() => setShowCreateModal(false)} className="md:hidden p-2 hover:bg-gray-100 rounded-full"><XMarkIcon className="h-6 w-6" /></button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Cover Image Input */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Imagem de Capa (URL)</label>
                       <div className="relative">
                          <PhotoIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                          <input 
                            type="text" 
                            value={imageUrl} 
                            onChange={e => setImageUrl(e.target.value)} 
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-bold text-xs dark:text-white transition-all" 
                            placeholder="https://imagem-do-evento.jpg" 
                          />
                       </div>
                    </div>

                    {/* Title Input */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Evento</label>
                       <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm dark:text-white transition-all" 
                        placeholder="Ex: Workshop de Astrofísica Avançada" 
                        required 
                       />
                    </div>

                    {/* Type & Privacy Toggle */}
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         type="button" 
                         onClick={() => setType('ONLINE')} 
                         className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'ONLINE' ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-600 text-blue-600' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400'}`}
                       >
                          <VideoCameraIcon className="h-5 w-5" />
                          <span className="text-[9px] font-black uppercase">Online</span>
                       </button>
                       <button 
                         type="button" 
                         onClick={() => setType('PRESENTIAL')} 
                         className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'PRESENTIAL' ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-600 text-blue-600' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400'}`}
                       >
                          <MapPinIcon className="h-5 w-5" />
                          <span className="text-[9px] font-black uppercase">Presencial</span>
                       </button>
                    </div>

                    {/* Date & Time Section */}
                    <div className="space-y-4 pt-2">
                       <div className="flex items-center gap-2 text-gray-400">
                          <ClockIcon className="h-4 w-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Início</span>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl font-bold text-xs dark:text-white" required />
                          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl font-bold text-xs dark:text-white" required />
                       </div>
                       
                       <div className="flex items-center gap-2 text-gray-400 pt-2">
                          <ClockIcon className="h-4 w-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Término (Opcional)</span>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl font-bold text-xs dark:text-white" />
                          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl font-bold text-xs dark:text-white" />
                       </div>
                    </div>

                    {/* Location/Link Input */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Localização ou Link</label>
                       <div className="relative">
                          <GlobeAltIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                          <input 
                            type="text" 
                            value={location} 
                            onChange={e => setLocation(e.target.value)} 
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-bold text-xs dark:text-white transition-all" 
                            placeholder={type === 'ONLINE' ? 'Link do Zoom, Google Meet...' : 'Rua, Cidade, Prédio...'} 
                            required 
                          />
                       </div>
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sobre o Evento</label>
                       <textarea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-medium text-sm dark:text-white h-32 resize-none" 
                        placeholder="Descreva o que os alunos irão aprender e por que devem participar..." 
                        required 
                       />
                    </div>

                    {/* Privacy Select */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Privacidade</label>
                       <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => setIsPublic(true)} 
                            className={`flex-1 p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${isPublic ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-600 text-blue-600' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400'}`}
                          >
                             <GlobeAmericasIcon className="h-5 w-5" />
                             <span className="text-[9px] font-black uppercase">Público</span>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setIsPublic(false)} 
                            className={`flex-1 p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${!isPublic ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-600 text-blue-600' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400'}`}
                          >
                             <LockClosedIcon className="h-5 w-5" />
                             <span className="text-[9px] font-black uppercase">Privado</span>
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-white dark:bg-darkbg border-t border-gray-100 dark:border-white/10">
                    <button 
                      onClick={handleCreateEvent}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.8rem] font-black text-base shadow-2xl shadow-blue-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                       Publicar Evento <SparklesIcon className="h-6 w-6" />
                    </button>
                 </div>
              </div>

              {/* Preview Dinâmico do Evento (Desktop Only) */}
              <div className="hidden md:flex flex-1 bg-gray-50 dark:bg-darkcard/50 flex-col items-center justify-center p-12">
                 <div className="w-full max-w-md bg-white dark:bg-darkcard rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col animate-fade-in">
                    <div className="relative h-56 bg-gray-100 dark:bg-white/5 overflow-hidden group">
                       {imageUrl ? (
                          <img src={imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Preview" />
                       ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                             <div className="bg-white/50 p-4 rounded-full"><CameraIcon className="h-10 w-10" /></div>
                             <span className="text-[10px] font-black uppercase tracking-widest">Sua arte aqui</span>
                          </div>
                       )}
                       <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-[9px] font-black uppercase text-blue-600 shadow-sm">
                          Preview ao Vivo
                       </div>
                    </div>

                    <div className="p-8">
                       <div className="flex items-start gap-4 mb-6">
                          <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-2xl flex flex-col items-center shadow-sm">
                             <span className="text-[10px] font-black text-red-600 uppercase">{startDate ? new Date(startDate).toLocaleDateString('pt-BR', { month: 'short' }) : 'Mês'}</span>
                             <span className="text-xl font-black text-red-700">{startDate ? new Date(startDate).getDate() + 1 : '00'}</span>
                          </div>
                          <div>
                             <h4 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-1">{title || 'Título do Evento'}</h4>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {startTime || '00:00'} {endTime ? `- ${endTime}` : ''}
                             </p>
                          </div>
                       </div>

                       <div className="space-y-4 mb-8">
                          <div className="flex items-center gap-4 text-xs text-gray-500 font-bold">
                             <div className="bg-blue-50 dark:bg-white/5 p-2 rounded-xl"><MapPinIcon className="h-5 w-5 text-blue-600" /></div>
                             <span className="truncate">{location || 'Localização aparecerá aqui'}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 font-bold">
                             <div className="bg-blue-50 dark:bg-white/5 p-2 rounded-xl"><EyeIcon className="h-5 w-5 text-blue-600" /></div>
                             <span className="truncate">{isPublic ? 'Evento Público' : 'Somente convidados'}</span>
                          </div>
                       </div>

                       <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/5">
                          <div className="flex items-center gap-3">
                             <img src={currentUser.profilePicture || DEFAULT_PROFILE_PIC} className="w-10 h-10 rounded-2xl border-2 border-blue-50 object-cover" alt="" />
                             <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Organizador</p>
                                <p className="text-xs font-black dark:text-white">{currentUser.firstName} {currentUser.lastName}</p>
                             </div>
                          </div>
                          <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl opacity-50 cursor-default">
                             Tenho Interesse
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="mt-10 flex items-center gap-3 bg-blue-600/10 p-5 rounded-[2rem] max-w-sm border border-blue-600/20">
                    <InformationCircleIcon className="h-6 w-6 text-blue-600 shrink-0" />
                    <p className="text-[11px] text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                       A prévia ajuda você a ver como seu evento será exibido para os alunos no marketplace de educação.
                    </p>
                 </div>
              </div>

              {/* Close Button Desktop */}
              <button onClick={() => setShowCreateModal(false)} className="hidden md:block absolute top-8 right-8 p-3 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-600 transition-all z-50">
                 <XMarkIcon className="h-6 w-6" />
              </button>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
};

export default EventsPage;
