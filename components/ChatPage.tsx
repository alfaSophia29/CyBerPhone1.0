
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
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/solid';

interface ChatPageProps {
  currentUser: User;
}

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

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  const fetchContactsAndConversations = useCallback(() => {
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
    setTimeout(() => scrollToBottom('auto'), 50);
  }, [currentUser.id, fetchContactsAndConversations, scrollToBottom]);

  useEffect(() => {
    if (currentConversation) {
        scrollToBottom('smooth');
    }
  }, [currentConversation, scrollToBottom]);

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

  const filteredFollowedUsers = followedUsersForNewChat.filter(user =>
    user.firstName.toLowerCase().includes(followedSearchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(followedSearchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 top-[64px] md:top-[72px] bottom-[64px] md:bottom-0 flex flex-col md:flex-row bg-white dark:bg-darkbg overflow-hidden">
      
      {/* Sidebar - Contacts */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-darkcard border-r border-gray-100 dark:border-white/10 shrink-0 transition-transform duration-300 ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-gray-50 dark:border-white/5">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Conversas</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          <div className="space-y-1">
            {chatContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => selectContact(contact)}
                className={`w-full flex items-center p-4 rounded-2xl transition-all ${
                  selectedContact?.id === contact.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="relative shrink-0">
                  <img src={contact.profilePicture || DEFAULT_PROFILE_PIC} className="w-12 h-12 rounded-2xl object-cover border-2 border-white/20" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-darkcard rounded-full"></div>
                </div>
                <div className="ml-4 text-left overflow-hidden">
                  <p className="font-black text-sm truncate">{contact.firstName} {contact.lastName}</p>
                  <p className={`text-[10px] ${selectedContact?.id === contact.id ? 'text-blue-100' : 'text-gray-400'}`}>Online</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 px-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Sugeridos</h3>
            <input
              type="text"
              placeholder="Buscar..."
              value={followedSearchTerm}
              onChange={(e) => setFollowedSearchTerm(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-white/5 border-none rounded-xl text-xs font-bold dark:text-white mb-4"
            />
            {filteredFollowedUsers.map((contact) => (
              <button key={contact.id} onClick={() => selectContact(contact)} className="w-full flex items-center p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all">
                <img src={contact.profilePicture || DEFAULT_PROFILE_PIC} className="w-10 h-10 rounded-xl object-cover grayscale opacity-50" />
                <span className="ml-3 font-bold text-gray-700 dark:text-gray-300 text-xs">{contact.firstName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col h-full bg-[#f8fafc] dark:bg-black/20 relative ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
        {selectedContact ? (
          <>
            {/* Edge-to-Edge Header */}
            <div className="h-16 md:h-20 flex items-center justify-between px-4 bg-white/95 dark:bg-darkcard/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5 z-30 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-blue-600">
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <img src={selectedContact.profilePicture || DEFAULT_PROFILE_PIC} className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover border-2 border-blue-500 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm md:text-base font-black text-gray-900 dark:text-white leading-tight truncate">{selectedContact.firstName} {selectedContact.lastName}</h3>
                  <span className="text-[9px] text-green-500 font-black uppercase tracking-widest">Ativo Agora</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-2.5 text-gray-400 hover:text-blue-600"><PhoneIcon className="h-5 w-5 md:h-6 md:w-6" /></button>
                <button className="p-2.5 text-gray-400 hover:text-blue-600"><VideoCameraIcon className="h-5 w-5 md:h-6 md:w-6" /></button>
              </div>
            </div>

            {/* Centralized Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar scroll-smooth">
              <div className="max-w-4xl mx-auto w-full flex flex-col space-y-4">
                {currentConversation?.messages.map((message) => {
                  const isMine = message.senderId === currentUser.id;
                  return (
                    <div key={message.id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`relative max-w-[85%] md:max-w-[70%] p-4 rounded-[2rem] shadow-sm animate-fade-in transition-all ${
                        isMine 
                          ? 'bg-blue-600 text-white rounded-br-none ml-12' 
                          : 'bg-white dark:bg-darkcard text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-white/5 mr-12'
                      }`}>
                        {message.imageUrl && (
                          <div className="mb-3 rounded-2xl overflow-hidden shadow-md">
                             <img src={message.imageUrl} className="w-full h-auto object-cover max-h-96" />
                          </div>
                        )}
                        {message.text && (
                          <p className="text-sm md:text-base font-medium leading-relaxed break-all whitespace-pre-wrap">
                            {message.text}
                          </p>
                        )}
                        <div className={`flex items-center gap-1.5 mt-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                           <span className={`text-[8px] font-black uppercase tracking-tighter ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                             {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                           {isMine && <svg className="h-2.5 w-2.5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>

            {/* Input Bar - Edge-to-Edge on mobile */}
            <div className="p-4 md:p-6 bg-white dark:bg-darkcard border-t border-gray-100 dark:border-white/5 shrink-0 z-30">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex flex-col gap-3">
                {newImageToSend && (
                  <div className="relative w-24 h-24 animate-fade-in ml-4 mb-2">
                     <img src={newImageToSend} className="w-full h-full object-cover rounded-2xl border-4 border-blue-500 shadow-2xl" />
                     <button type="button" onClick={() => setNewImageToSend(null)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 shadow-xl border-2 border-white"><XMarkIcon className="h-4 w-4" /></button>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-2 rounded-[2.5rem] border border-gray-100 dark:border-white/10 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageAttachment} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 md:p-4 text-gray-400 hover:text-blue-600 transition-all shrink-0">
                    <PhotoIcon className="h-6 w-6" />
                  </button>
                  
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Sua mensagem..."
                    className="flex-grow bg-transparent p-2 text-sm md:text-base focus:outline-none font-bold dark:text-white placeholder-gray-400"
                  />
                  
                  <button type="submit" disabled={!newMessage.trim() && !newImageToSend} className="bg-blue-600 hover:bg-blue-700 text-white p-3 md:p-4 rounded-full shadow-xl active:scale-90 disabled:opacity-30 shrink-0 transition-all">
                    <PaperAirplaneIcon className="h-6 w-6" />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-10 animate-fade-in bg-slate-50/20 dark:bg-black/5 h-full">
             <div className="bg-blue-50 dark:bg-blue-900/10 w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center mb-8 shadow-inner">
                <ChatBubbleLeftRightIcon className="h-10 w-10 md:h-16 md:w-16 text-blue-200" />
             </div>
             <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Central de Mensagens</h3>
             <p className="text-gray-400 max-w-xs mt-3 text-xs md:text-sm font-medium leading-relaxed">Conecte-se com professores e alunos em um ambiente privado e seguro.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
