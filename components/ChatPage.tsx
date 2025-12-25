
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Message, ChatConversation } from '../types';
import {
  getUsers,
  getChats,
  saveChats,
  findUserById,
} from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  MicrophoneIcon, 
  VideoCameraSlashIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  PhoneXMarkIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon
} from '@heroicons/react/24/solid';
import { 
  MicrophoneIcon as MicrophoneIconOutline,
  VideoCameraIcon as VideoCameraIconOutline,
  PhotoIcon as PhotoIconOutline
} from '@heroicons/react/24/outline';

interface ChatPageProps {
  currentUser: User;
}

type CallType = 'audio' | 'video';

const ChatPage: React.FC<ChatPageProps> = ({ currentUser }) => {
  const [chatContacts, setChatContacts] = useState<User[]>([]);
  const [followedUsersForNewChat, setFollowedUsersForNewChat] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newImageToSend, setNewImageToSend] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [followedSearchTerm, setFollowedSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // Estados de Chamada
  const [activeCall, setActiveCall] = useState<{ type: CallType; contact: User } | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callIntervalRef = useRef<number | null>(null);

  const EMOJIS = ['👍', '❤️', '😂', '🔥', '👏'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContactsAndConversations = useCallback(() => {
    const allUsers = getUsers();
    const allChats = getChats();
    const existingChatPartnerIds = new Set<string>();
    
    allChats.forEach(chat => {
      if (chat.participants.includes(currentUser.id)) {
        chat.participants.forEach(p => {
          if (p !== currentUser.id) existingChatPartnerIds.add(p);
        });
      }
    });

    const chatContactsList = Array.from(existingChatPartnerIds)
      .map(id => findUserById(id))
      .filter(Boolean) as User[];

    const followedUsersForNewChatList = currentUser.followedUsers
      .filter(followedId => !existingChatPartnerIds.has(followedId) && followedId !== currentUser.id)
      .map(id => findUserById(id))
      .filter(Boolean) as User[];

    setChatContacts(chatContactsList.sort((a, b) => a.firstName.localeCompare(b.firstName)));
    setFollowedUsersForNewChat(followedUsersForNewChatList.sort((a, b) => a.firstName.localeCompare(b.firstName)));
  }, [currentUser.id, currentUser.followedUsers]);

  useEffect(() => {
    fetchContactsAndConversations();
  }, [fetchContactsAndConversations]);

  const selectContact = useCallback((contact: User) => {
    setSelectedContact(contact);
    const chats = getChats();
    let conversation = chats.find(
      (chat) =>
        (chat.participants[0] === currentUser.id && chat.participants[1] === contact.id) ||
        (chat.participants[0] === contact.id && chat.participants[1] === currentUser.id)
    );

    if (!conversation) {
      conversation = {
        id: `chat-${currentUser.id}-${contact.id}-${Date.now()}`,
        participants: [currentUser.id, contact.id],
        messages: [],
      };
      saveChats([...chats, conversation]);
      fetchContactsAndConversations();
    }
    setCurrentConversation(conversation);
  }, [currentUser.id, fetchContactsAndConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation]);

  const startCall = async (type: CallType) => {
    if (!selectedContact) return;
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Seu navegador não suporta chamadas.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: type === 'video', 
        audio: true 
      });
      localStreamRef.current = stream;
      setActiveCall({ type, contact: selectedContact });
      setCallDuration(0);
      
      callIntervalRef.current = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      setTimeout(() => {
        if (callVideoRef.current) {
          callVideoRef.current.srcObject = stream;
        }
      }, 100);

    } catch (err: any) {
      console.error("Erro ao iniciar chamada:", err);
      alert("Não foi possível iniciar a chamada. Verifique as permissões do navegador.");
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
    }
    setActiveCall(null);
    setIsMicMuted(false);
    setIsCameraOff(false);
    localStreamRef.current = null;
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current && activeCall?.type === 'video') {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !newImageToSend || !selectedContact || !currentConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: selectedContact.id,
      timestamp: Date.now(),
      text: newMessage,
      imageUrl: newImageToSend || undefined,
      reactions: {},
    };

    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, message],
    };

    const allChats = getChats();
    saveChats(allChats.map((chat) => chat.id === updatedConversation.id ? updatedConversation : chat));
    setCurrentConversation(updatedConversation);
    setNewMessage('');
    setNewImageToSend(null);
  };

  const handleImageAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageToSend(reader.result as string);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReactToMessage = (messageId: string, emoji: string) => {
    if (!currentConversation) return;
    const updatedMessages = currentConversation.messages.map(msg => {
      if (msg.id === messageId) {
        const currentReactions = msg.reactions || {};
        const userReactions = currentReactions[emoji] || [];
        let newReactions = { ...currentReactions };
        if (userReactions.includes(currentUser.id)) {
          newReactions[emoji] = userReactions.filter(id => id !== currentUser.id);
          if (newReactions[emoji].length === 0) delete newReactions[emoji];
        } else {
          newReactions[emoji] = [...userReactions, currentUser.id];
        }
        return { ...msg, reactions: newReactions };
      }
      return msg;
    });
    const updatedConversation = { ...currentConversation, messages: updatedMessages };
    const allChats = getChats();
    saveChats(allChats.map((chat) => chat.id === updatedConversation.id ? updatedConversation : chat));
    setCurrentConversation(updatedConversation);
    setShowEmojiPicker(null);
  };

  const filteredFollowedUsers = followedUsersForNewChat.filter(user =>
    user.firstName.toLowerCase().includes(followedSearchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(followedSearchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 pb-20 md:pb-8 flex flex-col md:flex-row min-h-[calc(100vh-160px)]">
      
      <div className="w-full md:w-1/4 bg-white rounded-2xl shadow-xl p-4 mb-6 md:mb-0 md:mr-6 flex-shrink-0 border border-gray-100 overflow-hidden flex flex-col h-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 border-gray-200">Conversas</h2>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {chatContacts.length === 0 ? (
            <p className="text-gray-600 text-sm italic py-4 text-center">Nenhuma conversa ativa.</p>
          ) : (
            <ul className="space-y-3 mb-6">
              {chatContacts.map((contact) => (
                <li
                  key={contact.id}
                  onClick={() => selectContact(contact)}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedContact?.id === contact.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-50'
                  }`}
                >
                  <img src={contact.profilePicture || DEFAULT_PROFILE_PIC} className="w-10 h-10 rounded-full object-cover border-2 border-white/20" />
                  <span className="ml-3 font-bold truncate">{contact.firstName} {contact.lastName}</span>
                </li>
              ))}
            </ul>
          )}

          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 mt-6">Seguindo</h2>
          <input
            type="text"
            placeholder="Filtrar seguidores..."
            value={followedSearchTerm}
            onChange={(e) => setFollowedSearchTerm(e.target.value)}
            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-sm"
          />
          <ul className="space-y-3">
            {filteredFollowedUsers.map((contact) => (
              <li
                key={contact.id}
                onClick={() => selectContact(contact)}
                className="flex items-center p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
              >
                <img src={contact.profilePicture || DEFAULT_PROFILE_PIC} className="w-10 h-10 rounded-full object-cover" />
                <span className="ml-3 font-semibold text-gray-700">{contact.firstName}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-grow bg-white rounded-2xl shadow-xl p-6 flex flex-col border border-gray-100 relative overflow-hidden h-[calc(100vh-200px)]">
        {selectedContact ? (
          <>
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center">
                <img src={selectedContact.profilePicture || DEFAULT_PROFILE_PIC} className="w-12 h-12 rounded-full object-cover border-2 border-blue-500" />
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">{selectedContact.firstName} {selectedContact.lastName}</h3>
                  <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-black uppercase">Online</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => startCall('audio')} className="p-3 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full transition-all active:scale-90"><PhoneIcon className="h-6 w-6" /></button>
                <button onClick={() => startCall('video')} className="p-3 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full transition-all active:scale-90"><VideoCameraIcon className="h-6 w-6" /></button>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {currentConversation?.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40 py-10">
                   <ChatBubbleLeftRightIcon className="h-16 w-16 mb-4" />
                   <p className="italic font-medium">Inicie uma conversa segura.</p>
                </div>
              ) : (
                currentConversation?.messages.map((message) => (
                  <div key={message.id} className={`flex group relative ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm relative ${
                      message.senderId === currentUser.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}>
                      {message.imageUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden shadow-md">
                           <img src={message.imageUrl} className="max-w-full h-auto object-cover max-h-64 cursor-pointer hover:scale-105 transition-transform" />
                        </div>
                      )}
                      {message.text && <p className="text-sm break-words leading-relaxed">{message.text}</p>}
                      <span className={`block text-[10px] mt-1 font-bold ${message.senderId === currentUser.id ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <div className="absolute -bottom-3 right-0 bg-white shadow-md rounded-full px-2 py-0.5 flex items-center border border-gray-200">
                          {Object.entries(message.reactions).map(([emoji, userIds]: any) => (
                            <span key={emoji} className="text-xs mr-1">{emoji} {userIds.length}</span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                        className="absolute -top-3 -right-3 bg-white hover:bg-gray-100 rounded-full p-1.5 text-gray-600 text-xs hidden group-hover:block transition-all shadow-md border border-gray-100"
                      >😊</button>
                      {showEmojiPicker === message.id && (
                        <div className="absolute bottom-full right-0 mb-2 bg-white p-2 rounded-xl shadow-2xl flex gap-1 z-10 border border-gray-100 animate-fade-in">
                          {EMOJIS.map(emoji => (
                            <button key={emoji} onClick={() => handleReactToMessage(message.id, emoji)} className="p-1.5 rounded-lg text-lg hover:bg-gray-100 transition-colors">{emoji}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 flex flex-col gap-3">
              {newImageToSend && (
                <div className="relative w-24 h-24 animate-fade-in">
                   <img src={newImageToSend} className="w-full h-full object-cover rounded-2xl border-4 border-blue-500 shadow-xl" />
                   <button 
                     type="button" 
                     onClick={() => setNewImageToSend(null)} 
                     className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 shadow-lg active:scale-95 transition-all"
                   >
                     <XMarkIcon className="h-4 w-4" />
                   </button>
                </div>
              )}
              <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageAttachment} />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`bg-white hover:bg-blue-50 p-3 rounded-xl transition-all shadow-sm ${newImageToSend ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  <PhotoIcon className="h-6 w-6" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={newImageToSend ? "Dê uma legenda a esta foto..." : "Sua mensagem aqui..."}
                  className="flex-grow bg-transparent p-3 text-sm focus:outline-none font-medium"
                />
                <button type="submit" disabled={!newMessage.trim() && !newImageToSend} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-10 animate-fade-in">
             <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-blue-300" />
             </div>
             <h3 className="text-xl font-black text-gray-800">Suas Mensagens</h3>
             <p className="text-gray-400 max-w-xs mt-2 text-sm">Selecione um contato para iniciar.</p>
          </div>
        )}

        {activeCall && (
          <div className="absolute inset-0 bg-gray-900 z-[100] flex flex-col items-center justify-center animate-fade-in p-6">
            <div className="absolute inset-0 overflow-hidden opacity-30">
               <img src={activeCall.contact.profilePicture || DEFAULT_PROFILE_PIC} className="w-full h-full object-cover blur-3xl scale-125" />
            </div>
            <div className="relative z-10 w-full max-w-md flex flex-col items-center flex-grow py-10">
               <div className="relative mb-8">
                  {activeCall.type === 'video' && !isCameraOff ? (
                    <video ref={callVideoRef} autoPlay playsInline muted className="w-48 h-64 md:w-64 md:h-80 object-cover rounded-[2rem] border-4 border-white/20 shadow-2xl bg-black" />
                  ) : (
                    <img src={activeCall.contact.profilePicture || DEFAULT_PROFILE_PIC} className="w-40 h-40 rounded-full border-8 border-white/10 shadow-2xl object-cover" />
                  )}
               </div>
               <h2 className="text-3xl font-black text-white text-center mb-2">{activeCall.contact.firstName} {activeCall.contact.lastName}</h2>
               <p className="text-blue-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>{activeCall.type === 'video' ? 'Vídeo' : 'Voz'} • {formatDuration(callDuration)}</p>
               <div className="flex-grow"></div>
               <div className="w-full bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] flex items-center justify-around gap-4 border border-white/10 shadow-2xl">
                  <button onClick={toggleMic} className={`p-5 rounded-full transition-all ${isMicMuted ? 'bg-red-500' : 'bg-white/10 text-white hover:bg-white/20'}`}>{isMicMuted ? <MicrophoneIconOutline className="h-7 w-7" /> : <MicrophoneIcon className="h-7 w-7" />}</button>
                  <button onClick={endCall} className="p-6 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-xl group"><PhoneXMarkIcon className="h-8 w-8 group-hover:rotate-12 transition-transform" /></button>
                  {activeCall.type === 'video' && <button onClick={toggleCamera} className={`p-5 rounded-full transition-all ${isCameraOff ? 'bg-red-500' : 'bg-white/10 text-white hover:bg-white/20'}`}>{isCameraOff ? <VideoCameraSlashIcon className="h-7 w-7" /> : <VideoCameraIcon className="h-7 w-7" />}</button>}
                  {activeCall.type === 'audio' && <button className="p-5 rounded-full bg-white/10 text-white"><SpeakerWaveIcon className="h-7 w-7" /></button>}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
