
import React, { useState, useEffect, useRef } from 'react';
import { Post, User, Message } from '../types';
import { getPosts, findUserById, updateUserBalance } from '../services/storageService';
import { 
  MicrophoneIcon, 
  VideoCameraIcon, 
  ChatBubbleLeftRightIcon, 
  XMarkIcon,
  ArrowPathIcon,
  LockClosedIcon,
  PhoneXMarkIcon,
  HandRaisedIcon,
  SignalIcon,
  SparklesIcon,
  UsersIcon,
  ArrowRightStartOnRectangleIcon,
  ComputerDesktopIcon,
  PhotoIcon,
  PaperAirplaneIcon,
  ShieldExclamationIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';
import { 
  MicrophoneIcon as MicrophoneIconOutline, 
  VideoCameraIcon as VideoCameraIconOutline,
  ComputerDesktopIcon as ComputerDesktopIconOutline,
  PhotoIcon as PhotoIconOutline
} from '@heroicons/react/24/outline';

interface LiveStreamViewerProps {
  currentUser: User;
  postId: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  refreshUser: () => void;
}

const LiveStreamViewer: React.FC<LiveStreamViewerProps> = ({ currentUser, postId, onNavigate, refreshUser }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [creator, setCreator] = useState<User | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showScreenShareSafety, setShowScreenShareSafety] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<'chat' | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [handRaiseNotification, setHandRaiseNotification] = useState<{id: string, name: string} | null>(null);

  // Chat da Aula
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const foundPost = getPosts().find(p => p.id === postId);
    if (foundPost && foundPost.liveStream) {
      setPost(foundPost);
      const author = findUserById(foundPost.userId);
      setCreator(author || null);
      setHasPaid(!foundPost.liveStream.isPaid || currentUser.id === foundPost.userId);
    } else {
      onNavigate('feed');
    }
    
    return () => {
      stopStreams();
    };
  }, [postId, onNavigate, currentUser.id]);

  useEffect(() => {
    let timer: number;
    if (handRaiseNotification) {
      timer = window.setTimeout(() => {
        setHandRaiseNotification(null);
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [handRaiseNotification]);

  const stopStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    streamRef.current = null;
  };

  const handlePayment = () => {
    if (!post?.liveStream) return;
    const price = post.liveStream.price || 0;

    if ((currentUser.balance || 0) < price) {
      alert("Saldo insuficiente na carteira.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      updateUserBalance(currentUser.id, -price);
      if (creator) updateUserBalance(creator.id, price);
      setHasPaid(true);
      setIsProcessing(false);
      refreshUser();
    }, 2000);
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ 
        video: true,
        audio: false 
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      
      screenTrack.onended = () => {
        setIsScreenSharing(false);
        setIsCamOn(false);
      };

      if (streamRef.current) {
        const oldTrack = streamRef.current.getVideoTracks()[0];
        if (oldTrack) streamRef.current.removeTrack(oldTrack);
        streamRef.current.addTrack(screenTrack);
      } else {
        streamRef.current = new MediaStream([screenTrack]);
      }

      if (localVideoRef.current) localVideoRef.current.srcObject = streamRef.current;
      setIsScreenSharing(true);
      setIsCamOn(true);
      setShowScreenShareSafety(false);
    } catch (err) {
      console.error("Erro ao compartilhar tela:", err);
      setShowScreenShareSafety(false);
    }
  };

  const toggleScreenShareClick = () => {
    if (isScreenSharing) {
      toggleCamera(); // Volta para a câmera se já estiver compartilhando
    } else {
      setShowScreenShareSafety(true); // Exibe aviso de segurança
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    const msg: Message = {
      id: `live-msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: 'room',
      timestamp: Date.now(),
      text: newMessage,
      imageUrl: selectedImage || undefined
    };

    setChatMessages(prev => [...prev, msg]);
    setNewMessage('');
    setSelectedImage(null);
  };

  const toggleCamera = async () => {
    if (isCamOn) {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => track.stop());
      }
      setIsCamOn(false);
      setIsScreenSharing(false);
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        if (streamRef.current) {
          const oldTrack = streamRef.current.getVideoTracks()[0];
          if (oldTrack) streamRef.current.removeTrack(oldTrack);
          streamRef.current.addTrack(videoTrack);
        } else {
          streamRef.current = new MediaStream([videoTrack]);
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = streamRef.current;
        setIsCamOn(true);
        setIsScreenSharing(false);
      } catch (err) {
        alert("Câmera indisponível.");
      }
    }
  };

  const toggleMic = async () => {
    if (isMicOn) {
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => { track.enabled = false; });
      }
      setIsMicOn(false);
    } else {
      try {
        if (streamRef.current && streamRef.current.getAudioTracks().length > 0) {
          streamRef.current.getAudioTracks().forEach(t => t.enabled = true);
        } else {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioTrack = audioStream.getAudioTracks()[0];
          if (streamRef.current) {
            streamRef.current.addTrack(audioTrack);
          } else {
            streamRef.current = new MediaStream([audioTrack]);
          }
        }
        setIsMicOn(true);
      } catch (err) {
        alert("Microfone indisponível.");
      }
    }
  };

  const handleRaiseHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    if (newState) {
      setHandRaiseNotification({ id: currentUser.id, name: currentUser.firstName });
    }
  };

  if (!post || !post.liveStream || !creator) return null;
  const isTeacher = currentUser.id === creator.id;

  const handleExit = () => {
    if (isTeacher) {
      if (window.confirm("Deseja realmente encerrar a aula para todos os alunos?")) {
        stopStreams();
        onNavigate('feed');
      }
    } else {
      onNavigate('feed');
    }
  };

  if (!hasPaid) {
    return (
      <div className="fixed inset-0 bg-darkbg z-[100] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-darkcard rounded-[3.5rem] shadow-2xl p-10 text-center animate-fade-in border border-gray-100 dark:border-white/5">
          <div className="bg-blue-50 dark:bg-blue-500/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <LockClosedIcon className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">Aula Exclusiva</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-12 font-medium">Acesso por apenas <b className="text-blue-600 font-black">${post.liveStream.price?.toFixed(2)}</b>.</p>
          <button onClick={handlePayment} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 disabled:opacity-50">
            {isProcessing ? <ArrowPathIcon className="h-7 w-7 animate-spin"/> : 'Desbloquear Acesso'}
          </button>
          <button onClick={() => onNavigate('feed')} className="mt-6 text-gray-400 font-black hover:text-gray-600 uppercase text-xs tracking-widest transition-colors">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#020408] z-[60] flex flex-col overflow-hidden text-white font-sans">
      
      {/* BARRA SUPERIOR REORGANIZADA - SAIR É O PRIMEIRO ITEM (ÍCONE APENAS) */}
      <nav className="w-full flex items-center justify-between px-6 pt-6 pb-2 z-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExit}
            className="group flex items-center justify-center bg-white/10 hover:bg-red-600 p-3.5 rounded-xl border border-white/10 transition-all active:scale-95 shadow-lg"
            title={isTeacher ? "Encerrar Aula" : "Sair da Aula"}
          >
            {isTeacher ? (
              <XMarkIcon className="h-5 w-5 text-white" />
            ) : (
              <ArrowRightStartOnRectangleIcon className="h-5 w-5 text-white" />
            )}
          </button>

          <div className="bg-red-600 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 shadow-[0_0_25px_rgba(220,38,38,0.4)] border border-red-500/50 h-[44px]">
              <SignalIcon className="h-4 w-4 animate-pulse" /> 
              <span>AO VIVO</span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/5 h-[44px]">
           <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_12px_#22c55e]"></div>
              <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-60"></div>
           </div>
           <UsersIcon className="h-3.5 w-3.5 text-gray-500" />
           <span className="text-[10px] font-black uppercase tracking-widest text-white">42 Online</span>
        </div>
      </nav>

      {/* LETREIRO TEMA DA AULA */}
      <div className="w-full px-6 mt-3 z-40 flex-shrink-0">
         <div className="relative bg-blue-600/10 backdrop-blur-2xl border border-blue-500/30 rounded-full overflow-hidden flex items-center h-12 shadow-sm">
            <div className="absolute left-1.5 z-10 bg-blue-600 p-2 rounded-full shadow-lg flex items-center justify-center">
               <SparklesIcon className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="whitespace-nowrap flex animate-ticker py-3.5 pl-16">
               {[1, 2, 3].map((_, i) => (
                 <p key={i} className="inline-block px-12 text-[11px] font-black uppercase tracking-[0.4em] text-white">
                    <span className="text-blue-400/60 mr-4">AULA:</span> {post.liveStream?.title}
                 </p>
               ))}
            </div>
         </div>
      </div>

      {/* ÁREA DE VÍDEO CENTRAL */}
      <main className="flex-1 flex relative items-center justify-center overflow-hidden px-4 md:px-10 mt-2">
        <div className={`w-full h-full max-h-[calc(100vh-320px)] relative flex items-center justify-center transition-all duration-700 ease-in-out ${activeSidebar ? 'md:mr-[360px]' : ''}`}>
          <div className="w-full h-full max-w-6xl rounded-[3.5rem] md:rounded-[5rem] overflow-hidden bg-[#05070a] border border-white/5 shadow-[0_0_120px_rgba(0,0,0,0.7)] relative group">
            {isCamOn ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-contain bg-black" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative mb-8 cursor-pointer" onClick={() => onNavigate('profile', { userId: creator.id })}>
                   <div className="absolute -inset-14 bg-blue-600/5 rounded-full blur-[120px] animate-pulse"></div>
                   <div className="relative w-40 h-40 md:w-60 md:h-60 rounded-[4.5rem] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-7xl md:text-9xl font-black text-white/5 border-2 border-white/5 shadow-2xl">
                    {creator.firstName[0]}
                   </div>
                </div>
                <p className="text-gray-700 font-black tracking-[0.6em] uppercase text-[9px] md:text-[10px]">Aguardando Professor</p>
              </div>
            )}
          </div>
        </div>

        {/* CHAT LATERAL */}
        {activeSidebar === 'chat' && (
          <aside className="absolute right-0 top-0 bottom-0 w-full md:w-[360px] bg-black/95 backdrop-blur-3xl border-l border-white/5 flex flex-col z-40 animate-fade-in shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-blue-500">Chat da Aula</h3>
              <button onClick={() => setActiveSidebar(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
               {chatMessages.map((m) => {
                 const sender = findUserById(m.senderId);
                 return (
                   <div key={m.id} className="bg-white/5 p-3 rounded-2xl border border-white/5">
                      <button 
                        onClick={() => onNavigate('profile', { userId: m.senderId })}
                        className="text-[10px] font-black text-blue-400 uppercase mb-1 hover:underline text-left block"
                      >
                        {sender?.firstName || 'Membro'}
                      </button>
                      {m.imageUrl && <div className="mb-2 rounded-xl overflow-hidden"><img src={m.imageUrl} className="w-full h-auto object-cover" /></div>}
                      {m.text && <p className="text-sm font-medium leading-relaxed">{m.text}</p>}
                   </div>
                 );
               })}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-black/50">
               {selectedImage && (
                 <div className="relative w-16 h-16 mb-2">
                    <img src={selectedImage} className="w-full h-full object-cover rounded-lg border border-blue-500" />
                    <button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 shadow-lg"><XMarkIcon className="h-3 w-3"/></button>
                 </div>
               )}
               <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white transition-colors">
                    <PhotoIconOutline className="h-6 w-6" />
                  </button>
                  <input 
                    type="text" 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} 
                    placeholder="Perguntar..." 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500 transition-all" 
                  />
                  <button type="submit" disabled={!newMessage.trim() && !selectedImage} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg active:scale-95 transition-all">
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
               </div>
            </form>
          </aside>
        )}
      </main>

      {/* NOTIFICAÇÃO DE MÃO LEVANTADA - FORMATO EXATO SOLICITADO */}
      {handRaiseNotification && (
        <div className="w-full flex justify-center z-[70] absolute bottom-36 px-4 animate-fade-in">
           <div className="bg-yellow-400 text-black px-8 py-3.5 rounded-full shadow-[0_30px_60px_rgba(250,204,21,0.3)] flex items-center gap-4 border-2 border-white/20 transform scale-105">
              <HandRaisedIcon className="h-6 w-6 animate-bounce" />
              <p className="font-black text-[11px] md:text-xs uppercase tracking-tight leading-none">
                 Atenção: <button onClick={() => onNavigate('profile', { userId: handRaiseNotification.id })} className="font-black underline decoration-2 underline-offset-2 hover:text-blue-900 transition-colors">{handRaiseNotification.name}</button> levantou a mão para falar!
              </p>
           </div>
        </div>
      )}

      {/* MODAL DE SEGURANÇA PARA COMPARTILHAMENTO DE TELA */}
      {showScreenShareSafety && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-[#0a0c14] border border-blue-500/30 w-full max-w-md rounded-[3rem] p-10 shadow-[0_0_80px_rgba(59,130,246,0.2)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
              <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-blue-500/20">
                 <ShieldExclamationIcon className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">Protocolo de Segurança</h3>
              <div className="space-y-4 text-left bg-white/5 p-6 rounded-3xl border border-white/5 mb-8">
                 <div className="flex gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500 shrink-0" />
                    <p className="text-xs text-gray-400 font-medium">Ao compartilhar o ecrã, todos os participantes verão suas abas e notificações abertas.</p>
                 </div>
                 <div className="flex gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500 shrink-0" />
                    <p className="text-xs text-gray-400 font-medium">Certifique-se de ocultar senhas e informações privadas antes de prosseguir.</p>
                 </div>
              </div>
              <div className="flex flex-col gap-3">
                 <button 
                   onClick={startScreenShare}
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/20 transition-all active:scale-95"
                 >
                   Entendido, prosseguir
                 </button>
                 <button 
                   onClick={() => setShowScreenShareSafety(false)}
                   className="w-full bg-white/5 hover:bg-white/10 text-gray-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                 >
                   Cancelar
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* FOOTER DE CONTROLES REORDENADO */}
      <footer className="h-32 flex items-center justify-center px-6 pb-6 z-50 flex-shrink-0">
        <div className="bg-[#0a0c14]/90 backdrop-blur-3xl px-8 md:px-12 py-5 rounded-full border border-white/10 shadow-2xl flex items-center gap-6 md:gap-10">
          
          <button 
            onClick={toggleMic}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isMicOn ? 'bg-white/5 text-white border border-white/10' : 'bg-red-600 text-white shadow-xl shadow-red-600/40'}`}
          >
            {isMicOn ? <MicrophoneIcon className="h-6 w-6" /> : <MicrophoneIconOutline className="h-6 w-6" />}
          </button>

          <button 
            onClick={toggleCamera}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isCamOn && !isScreenSharing ? 'bg-white/5 text-white border border-white/10' : 'bg-red-600 text-white shadow-xl shadow-red-600/40'}`}
          >
            {isCamOn && !isScreenSharing ? <VideoCameraIcon className="h-6 w-6" /> : <VideoCameraIconOutline className="h-6 w-6" />}
          </button>

          <button 
            onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')} 
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all ${activeSidebar === 'chat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'}`} 
          >
            <ChatBubbleLeftRightIcon className="h-6 w-6" />
          </button>

          <button 
            onClick={handleRaiseHand} 
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all ${handRaised ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'}`} 
          >
            <HandRaisedIcon className="h-6 w-6" />
          </button>

          {/* BOTÃO DE COMPARTILHAMENTO DE ECRÃ - DEPOIS DO ÍCONE DA MÃO */}
          <button 
            onClick={toggleScreenShareClick}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isScreenSharing ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/40' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
            title="Compartilhar Ecrã"
          >
            {isScreenSharing ? <ComputerDesktopIcon className="h-6 w-6" /> : <ComputerDesktopIconOutline className="h-6 w-6" />}
          </button>

        </div>
      </footer>

      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
        .animate-ticker { animation: ticker 40s linear infinite; }
      `}</style>
    </div>
  );
};

export default LiveStreamViewer;
