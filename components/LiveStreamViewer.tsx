
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

  if (!post || !post.liveStream || !creator) return null;
  const isTeacher = currentUser.id === creator.id;

  return (
    <div className="fixed inset-0 bg-[#020408] z-[60] flex flex-col overflow-hidden text-white font-sans">
      
      <nav className="w-full flex items-center justify-between px-4 pt-4 pb-2 z-50 flex-shrink-0">
        <button onClick={() => onNavigate('feed')} className="p-3 bg-white/10 rounded-xl">
          <XMarkIcon className="h-5 w-5" />
        </button>
        <div className="bg-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2">
          <SignalIcon className="h-3 w-3 animate-pulse" /> AO VIVO
        </div>
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
           <UsersIcon className="h-3 w-3 text-gray-400" />
           <span className="text-[10px] font-bold">42</span>
        </div>
      </nav>

      <main className="flex-1 flex relative items-center justify-center overflow-hidden p-2">
        <div className="w-full h-full max-w-5xl rounded-[2rem] overflow-hidden bg-black border border-white/5 relative">
          {isCamOn ? (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
               <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center text-4xl font-black">
                {creator.firstName[0]}
               </div>
            </div>
          )}
        </div>

        {activeSidebar === 'chat' && (
          <aside className="absolute right-0 top-0 bottom-0 w-full md:w-80 bg-black/95 backdrop-blur-xl border-l border-white/10 z-40 flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-black text-xs uppercase tracking-widest text-blue-500">Chat</h3>
              <button onClick={() => setActiveSidebar(null)}><XMarkIcon className="h-5 w-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {chatMessages.map(m => (
                 <div key={m.id} className="bg-white/5 p-2.5 rounded-xl">
                    <p className="text-[10px] font-black text-blue-400 uppercase">{findUserById(m.senderId)?.firstName}</p>
                    <p className="text-xs">{m.text}</p>
                 </div>
               ))}
            </div>
          </aside>
        )}
      </main>

      {showScreenShareSafety && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
           <div className="bg-darkcard border border-blue-500/30 w-full max-w-sm rounded-[2.5rem] p-8 text-center">
              <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                 <ShieldExclamationIcon className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">Aviso de Privacidade</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">Você está prestes a compartilhar sua tela. Certifique-se de que não há informações sensíveis, como senhas ou mensagens privadas, visíveis para os alunos.</p>
              <div className="flex flex-col gap-3">
                 <button onClick={startScreenShare} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs">Entendido, Compartilhar</button>
                 <button onClick={() => setShowScreenShareSafety(false)} className="w-full bg-white/5 py-4 rounded-2xl font-black uppercase text-xs text-gray-400">Cancelar</button>
              </div>
           </div>
        </div>
      )}

      <footer className="p-4 md:p-6 flex justify-center flex-shrink-0">
        <div className="bg-darkcard/80 backdrop-blur-2xl px-6 py-3 rounded-full border border-white/10 flex items-center gap-4 md:gap-8 shadow-2xl">
          <button onClick={toggleMic} className={`p-3 rounded-xl ${isMicOn ? 'bg-white/10' : 'bg-red-600'}`}>
            <MicrophoneIcon className="h-5 w-5" />
          </button>
          <button onClick={toggleCamera} className={`p-3 rounded-xl ${isCamOn ? 'bg-white/10' : 'bg-red-600'}`}>
            <VideoCameraIcon className="h-5 w-5" />
          </button>
          <button onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')} className={`p-3 rounded-xl ${activeSidebar === 'chat' ? 'bg-blue-600' : 'bg-white/10'}`}>
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
          </button>
          <button onClick={() => setHandRaised(!handRaised)} className={`p-3 rounded-xl ${handRaised ? 'bg-yellow-500' : 'bg-white/10'}`}>
            <HandRaisedIcon className="h-5 w-5" />
          </button>
          
          {/* BOTÃO COMPARTILHAR TELA - APÓS O ÍCONE DA MÃO */}
          <button 
            onClick={() => isScreenSharing ? stopStreams() : setShowScreenShareSafety(true)} 
            className={`p-3 rounded-xl transition-colors ${isScreenSharing ? 'bg-blue-600' : 'bg-white/10 text-gray-400 hover:text-white'}`}
          >
            <ComputerDesktopIcon className="h-5 w-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LiveStreamViewer;
