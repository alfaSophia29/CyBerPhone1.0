
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Message, ChatConversation } from '../types';
import {
  getUsers,
  getChats,
  saveChats,
  findUserById,
} from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';

interface ChatPageProps {
  currentUser: User;
}

const ChatPage: React.FC<ChatPageProps> = ({ currentUser }) => {
  const [chatContacts, setChatContacts] = useState<User[]>([]);
  const [followedUsersForNewChat, setFollowedUsersForNewChat] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newImageToSend, setNewImageToSend] = useState<string | null>(null); // Base64 image
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [followedSearchTerm, setFollowedSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // Message ID for which to show picker

  const EMOJIS = ['👍', '❤️', '😂', '🔥', '👏'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContactsAndConversations = useCallback(() => {
    const allUsers = getUsers();
    const allChats = getChats();

    // Determine users involved in existing chats with currentUser
    const existingChatPartnerIds = new Set<string>();
    allChats.forEach(chat => {
      if (chat.participants.includes(currentUser.id)) {
        chat.participants.forEach(p => {
          if (p !== currentUser.id) {
            existingChatPartnerIds.add(p);
          }
        });
      }
    });

    const chatContactsList: User[] = Array.from(existingChatPartnerIds)
      .map(id => findUserById(id))
      .filter(Boolean) as User[];

    // Determine followed users who are NOT already in an existing chat
    const followedUsersForNewChatList: User[] = currentUser.followedUsers
      .filter(followedId => !existingChatPartnerIds.has(followedId) && followedId !== currentUser.id)
      .map(id => findUserById(id))
      .filter(Boolean) as User[];

    // Sort by first name for better UX
    chatContactsList.sort((a, b) => a.firstName.localeCompare(b.firstName));
    followedUsersForNewChatList.sort((a, b) => a.firstName.localeCompare(b.firstName));

    setChatContacts(chatContactsList);
    setFollowedUsersForNewChat(followedUsersForNewChatList);
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
      // Create a new conversation if it doesn't exist
      conversation = {
        id: `chat-${currentUser.id}-${contact.id}-${Date.now()}`,
        participants: [currentUser.id, contact.id],
        messages: [],
      };
      saveChats([...chats, conversation]);
      // Re-fetch contacts to move the new chat partner from 'followed' to 'active chats'
      fetchContactsAndConversations();
    }
    setCurrentConversation(conversation);
  }, [currentUser.id, fetchContactsAndConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation]);

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

    const updatedConversation: ChatConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, message],
    };

    const allChats = getChats();
    const updatedChats = allChats.map((chat) =>
      chat.id === updatedConversation.id ? updatedConversation : chat
    );
    saveChats(updatedChats);
    setCurrentConversation(updatedConversation); // Update state to re-render messages
    setNewMessage('');
    setNewImageToSend(null); // Clear image after sending
  };

  const handleImageAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageToSend(reader.result as string);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
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
          // User already reacted, remove their reaction
          newReactions[emoji] = userReactions.filter(id => id !== currentUser.id);
          if (newReactions[emoji].length === 0) {
            delete newReactions[emoji];
          }
        } else {
          // User wants to react, add their reaction
          newReactions[emoji] = [...userReactions, currentUser.id];
        }

        return { ...msg, reactions: newReactions };
      }
      return msg;
    });

    const updatedConversation: ChatConversation = {
      ...currentConversation,
      messages: updatedMessages,
    };

    const allChats = getChats();
    const updatedChats = allChats.map((chat) =>
      chat.id === updatedConversation.id ? updatedConversation : chat
    );
    saveChats(updatedChats);
    setCurrentConversation(updatedConversation); // Update state to re-render messages
    setShowEmojiPicker(null); // Close picker
  };

  const filteredFollowedUsers = followedUsersForNewChat.filter(user =>
    user.firstName.toLowerCase().includes(followedSearchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(followedSearchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 pb-20 md:pb-8 flex flex-col md:flex-row min-h-[calc(100vh-160px)]"> {/* Adjusted padding */}
      {/* Contact List */}
      <div className="w-full md:w-1/4 bg-white rounded-2xl shadow-xl p-4 mb-6 md:mb-0 md:mr-6 flex-shrink-0 border border-gray-100 transform transition-all duration-300 hover:scale-[1.005]">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 border-gray-200">Conversas Ativas</h2>
        {chatContacts.length === 0 ? (
          <p className="text-gray-600 text-sm italic py-4 text-center">Nenhuma conversa ativa.</p>
        ) : (
          <ul className="space-y-3 mb-6">
            {chatContacts.map((contact) => (
              <li
                key={contact.id}
                onClick={() => selectContact(contact)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedContact?.id === contact.id
                    ? 'bg-blue-100 border-l-4 border-blue-600 shadow-sm'
                    : 'hover:bg-gray-50'
                }`}
                role="button"
                aria-label={`Abrir chat com ${contact.firstName} ${contact.lastName}`}
              >
                <img
                  src={contact.profilePicture || DEFAULT_PROFILE_PIC}
                  alt={contact.firstName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                />
                <span className="ml-3 font-semibold text-gray-800">
                  {contact.firstName} {contact.lastName}
                </span>
              </li>
            ))}
          </ul>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 border-gray-200 mt-6">Pessoas que você segue</h2>
        <input
          type="text"
          placeholder="Buscar pessoas seguidas..."
          value={followedSearchTerm}
          onChange={(e) => setFollowedSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow duration-200 mb-4"
        />
        {filteredFollowedUsers.length === 0 ? (
          <p className="text-gray-600 text-sm italic py-4 text-center">Nenhuma pessoa seguida para iniciar um chat ou que corresponda à busca.</p>
        ) : (
          <ul className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
            {filteredFollowedUsers.map((contact) => (
              <li
                key={contact.id}
                onClick={() => selectContact(contact)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedContact?.id === contact.id
                    ? 'bg-blue-100 border-l-4 border-blue-600 shadow-sm'
                    : 'hover:bg-gray-50'
                }`}
                role="button"
                aria-label={`Iniciar chat com ${contact.firstName} ${contact.lastName}`}
              >
                <img
                  src={contact.profilePicture || DEFAULT_PROFILE_PIC}
                  alt={contact.firstName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                />
                <span className="ml-3 font-semibold text-gray-800">
                  {contact.firstName} {contact.lastName}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chat Window */}
      <div className="flex-grow bg-white rounded-2xl shadow-xl p-6 flex flex-col border border-gray-100 transform transition-all duration-300 hover:scale-[1.005]">
        {selectedContact ? (
          <>
            <div className="flex items-center border-b pb-4 mb-4">
              <img
                src={selectedContact.profilePicture || DEFAULT_PROFILE_PIC}
                alt={selectedContact.firstName}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
              />
              <h3 className="ml-4 text-2xl font-bold text-gray-900">
                {selectedContact.firstName} {selectedContact.lastName}
              </h3>
            </div>
            <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {currentConversation?.messages.length === 0 ? (
                <p className="text-center text-gray-500 italic mt-10">
                  Nenhuma mensagem ainda. Comece a conversar!
                </p>
              ) : (
                currentConversation?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex group relative ${
                      message.senderId === currentUser.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-xl shadow-sm relative ${
                        message.senderId === currentUser.id
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      {message.imageUrl && (
                        <img src={message.imageUrl} alt="Anexo" className="max-w-full rounded-lg mb-2 object-contain max-h-48" />
                      )}
                      {message.text && <p className="text-sm break-words">{message.text}</p>}
                      <span className={`block text-xs mt-1 ${message.senderId === currentUser.id ? 'text-blue-200' : 'text-gray-500'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {/* Emoji reactions display */}
                      {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <div className="absolute -bottom-3 right-0 bg-white shadow-md rounded-full px-2 py-0.5 flex items-center border border-gray-200">
                          {Object.entries(message.reactions).map(([emoji, userIds]: [string, string[]]) => userIds.length > 0 && ( // Explicitly cast userIds
                            <span key={emoji} className="text-xs mr-1">
                              {emoji} {userIds.length}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Emoji picker button */}
                      <button
                        onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                        className="absolute -top-3 -right-3 bg-gray-100 hover:bg-gray-200 rounded-full p-1 text-gray-600 text-xs hidden group-hover:block transition-all duration-200 shadow-md"
                        aria-label="Reagir com emoji"
                      >
                        😊
                      </button>

                      {/* Emoji picker popover */}
                      {showEmojiPicker === message.id && (
                        <div className="absolute bottom-full right-0 mb-2 bg-white p-2 rounded-lg shadow-xl flex gap-1 z-10">
                          {EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleReactToMessage(message.id, emoji)}
                              className={`p-1 rounded-full text-lg hover:bg-gray-100 transition-colors ${
                                message.reactions?.[emoji]?.includes(currentUser.id) ? 'bg-blue-100' : ''
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex items-center space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageAttachment}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-3 rounded-full transition-colors shadow-md"
                aria-label="Anexar imagem"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13.5" />
                </svg>
              </button>

              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={newImageToSend ? "Adicione uma legenda à imagem..." : "Digite sua mensagem..."}
                rows={1}
                className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-shadow duration-200"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                aria-label="Campo de nova mensagem"
              />
              {newImageToSend && (
                <div className="relative">
                  <img src={newImageToSend} alt="Pré-visualização" className="w-16 h-16 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setNewImageToSend(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 text-xs"
                    aria-label="Remover imagem"
                  >
                    x
                  </button>
                </div>
              )}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors shadow-md hover:shadow-lg"
                aria-label="Enviar mensagem"
                disabled={!newMessage.trim() && !newImageToSend}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-gray-500 text-xl italic p-8">
            Selecione um contato para começar a conversar.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;