
import React, { useState, useEffect } from 'react';
import { User, CyberEvent, UserType } from '../types';
import { getEvents, createEvent, toggleJoinEvent, findUserById } from '../services/storageService';
import { CalendarIcon, MapPinIcon, VideoCameraIcon, UserGroupIcon, PlusIcon, XMarkIcon, GlobeAltIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface EventsPageProps {
  currentUser: User;
}

const EventsPage: React.FC<EventsPageProps> = ({ currentUser }) => {
  const [events, setEvents] = useState<CyberEvent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'MY_EVENTS'>('ALL');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<'ONLINE' | 'PRESENTIAL'>('ONLINE');

  useEffect(() => {
    setEvents(getEvents().sort((a, b) => a.dateTime - b.dateTime));
  }, []);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: CyberEvent = {
      id: `evt-${Date.now()}`,
      creatorId: currentUser.id,
      creatorName: `${currentUser.firstName} ${currentUser.lastName}`,
      title,
      description,
      dateTime: new Date(`${date}T${time}`).getTime(),
      location,
      type,
      attendees: [currentUser.id],
      imageUrl: `https://picsum.photos/800/400?random=${Date.now()}`
    };
    createEvent(newEvent);
    setEvents([...getEvents()].sort((a, b) => a.dateTime - b.dateTime));
    setShowCreateModal(false);
    setTitle(''); setDescription(''); setDate(''); setTime(''); setLocation('');
  };

  const handleJoin = (eventId: string) => {
    toggleJoinEvent(eventId, currentUser.id);
    setEvents(getEvents().sort((a, b) => a.dateTime - b.dateTime));
  };

  const filteredEvents = filter === 'ALL' 
    ? events 
    : events.filter(e => e.attendees.includes(currentUser.id));

  return (
    <div className="container mx-auto px-2 py-4 md:p-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 px-2">
        <div>
           <h2 className="text-2xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">Eventos</h2>
           <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px] md:text-xs">Educação além do digital</p>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={() => setFilter(filter === 'ALL' ? 'MY_EVENTS' : 'ALL')}
             className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${filter === 'MY_EVENTS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white dark:bg-white/5 text-gray-500 border border-gray-100 dark:border-white/10'}`}
           >
             {filter === 'MY_EVENTS' ? 'Inscritos' : 'Explorar'}
           </button>
           {currentUser.userType === UserType.CREATOR && (
             <button 
               onClick={() => setShowCreateModal(true)}
               className="bg-black dark:bg-white dark:text-black text-white px-4 py-2.5 rounded-xl font-black text-[10px] flex items-center gap-2 shadow-xl active:scale-95"
             >
               <PlusIcon className="h-4 w-4" /> Novo
             </button>
           )}
        </div>
      </header>

      {filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-darkcard rounded-[2.5rem] p-16 text-center border-2 border-dashed border-gray-100 dark:border-white/10 mx-2">
           <CalendarIcon className="h-12 w-12 text-gray-200 mx-auto mb-4" />
           <p className="text-gray-400 font-black uppercase text-[10px]">Nenhum encontro marcado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
           {filteredEvents.map(evt => {
             const isJoined = evt.attendees.includes(currentUser.id);
             const isCreator = evt.creatorId === currentUser.id;

             return (
               <div key={evt.id} className="bg-white dark:bg-darkcard rounded-[2rem] overflow-hidden border border-gray-50 dark:border-white/10 shadow-sm group">
                  <div className="relative h-40 overflow-hidden">
                     <img src={evt.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                     <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-black text-gray-900 uppercase">
                        {evt.type === 'ONLINE' ? '🎥 Online' : '📍 Presencial'}
                     </div>
                  </div>

                  <div className="p-6">
                     <p className="text-[10px] font-black text-blue-600 uppercase mb-2">
                       {new Date(evt.dateTime).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} &bull; {new Date(evt.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                     </p>
                     <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2 leading-tight truncate">{evt.title}</h4>
                     
                     <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase mb-6">
                        <span className="flex items-center gap-1"><UserGroupIcon className="h-3.5 w-3.5" /> {evt.attendees.length}</span>
                        <span className="flex items-center gap-1 truncate"><GlobeAltIcon className="h-3.5 w-3.5" /> {evt.location}</span>
                     </div>

                     <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Por {evt.creatorName.split(' ')[0]}</p>
                        {!isCreator ? (
                          <button 
                            onClick={() => handleJoin(evt.id)}
                            className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                              isJoined ? 'bg-green-50 text-green-600 dark:bg-white/5' : 'bg-blue-600 text-white shadow-lg'
                            }`}
                          >
                             {isJoined ? 'Inscrito' : 'Garantir Vaga'}
                          </button>
                        ) : <span className="text-[9px] font-black text-gray-400 italic">Dono</span>}
                     </div>
                  </div>
               </div>
             );
           })}
        </div>
      )}

      {/* Modal Create Event */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in" onClick={() => setShowCreateModal(false)}>
           <div className="bg-white dark:bg-darkcard w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-black mb-6 dark:text-white">Planejar Evento</h3>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                 <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-bold dark:text-white" placeholder="Título" required />
                 <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none font-medium h-24 dark:text-white" placeholder="Descrição" required />
                 <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl font-bold text-xs dark:text-white" required />
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl font-bold text-xs dark:text-white" required />
                 </div>
                 <div className="flex gap-2">
                    <button type="button" onClick={() => setType('ONLINE')} className={`flex-1 py-3 rounded-xl font-black text-[10px] border-2 transition-all ${type === 'ONLINE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-white/5 text-gray-400 border-transparent'}`}>🎥 ONLINE</button>
                    <button type="button" onClick={() => setType('PRESENTIAL')} className={`flex-1 py-3 rounded-xl font-black text-[10px] border-2 transition-all ${type === 'PRESENTIAL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-white/5 text-gray-400 border-transparent'}`}>📍 PRESENCIAL</button>
                 </div>
                 <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none dark:text-white text-xs font-bold" placeholder="Local ou Link" required />
                 <button type="submit" className="w-full bg-black dark:bg-white dark:text-black text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all">Criar Evento</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
