

import React, { useState, useEffect } from 'react';
import { Post, PostType, User, LiveStreamDetails, ReelDetails, UserType } from '../types';
import { savePosts, getPosts, updateUserBalance, findUserById, updatePost } from '../services/storageService'; // Added findUserById, updatePost
import { applyAIImageFilter } from '../services/geminiService';
import { MIN_AI_FILTER_USD_COST, KZT_TO_USD_RATE } from '../constants';
import AudioSelectionModal from './AudioSelectionModal'; // NEW

interface CreatePostProps {
  currentUser: User;
  onPostCreated: () => void;
  refreshUser: () => void; // Added refreshUser for balance updates
  postId?: string; // NEW: Optional postId for editing
}

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onPostCreated, refreshUser, postId }) => {
  const [postType, setPostType] = useState<PostType>(PostType.TEXT);
  const [content, setContent] = useState(''); // For TEXT/IMAGE post content
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(''); // Base64 for display
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState(''); // Blob URL for display
  const [liveStreamTitle, setLiveStreamTitle] = useState('');
  const [liveStreamDescription, setLiveStreamDescription] = useState('');
  const [isLiveStreamPaid, setIsLiveStreamPaid] = useState(false); // Only CREATORs can set this to true
  const [liveStreamPrice, setLiveStreamPrice] = useState<number>(0);
  const [liveStreamPaymentLink, setLiveStreamPaymentLink] = useState('');
  const [liveStreamPaymentQRCode, setLiveStreamPaymentQRCode] = useState('');
  const [reelTitle, setReelTitle] = useState('');
  const [reelDescription, setReelDescription] = useState('');
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string | undefined>(undefined); // NEW
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false); // NEW

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiFilterPrompt, setAiFilterPrompt] = useState('');
  const [aiFilterLoading, setAiFilterLoading] = useState(false);

  const isEditing = !!postId;

  useEffect(() => {
    if (isEditing) {
      const posts = getPosts();
      const postToEdit = posts.find(p => p.id === postId);
      if (postToEdit) {
        setPostType(postToEdit.type);
        setContent(postToEdit.content || '');
        setImageUrl(postToEdit.imageUrl || '');
        setVideoUrl(postToEdit.reel?.videoUrl || '');
        setLiveStreamTitle(postToEdit.liveStream?.title || '');
        setLiveStreamDescription(postToEdit.liveStream?.description || '');
        setIsLiveStreamPaid(postToEdit.liveStream?.isPaid || false);
        setLiveStreamPrice(postToEdit.liveStream?.price || 0);
        setLiveStreamPaymentLink(postToEdit.liveStream?.paymentLink || '');
        setLiveStreamPaymentQRCode(postToEdit.liveStream?.paymentQRCode || '');
        setReelTitle(postToEdit.reel?.title || '');
        setReelDescription(postToEdit.reel?.description || '');
        setSelectedAudioTrackId(postToEdit.reel?.audioTrackId); // NEW
      } else {
        setError('Postagem não encontrada para edição.');
      }
    } else {
      // Clear form when switching to create new post
      setPostType(PostType.TEXT);
      setContent('');
      setImageFile(null);
      setImageUrl('');
      setVideoFile(null);
      setVideoUrl('');
      setLiveStreamTitle('');
      setLiveStreamDescription('');
      setIsLiveStreamPaid(false);
      setLiveStreamPrice(0);
      setLiveStreamPaymentLink('');
      setLiveStreamPaymentQRCode('');
      setReelTitle('');
      setReelDescription('');
      setSelectedAudioTrackId(undefined); // NEW
      setAiFilterPrompt('');
      setError('');
    }
  }, [postId, isEditing]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImageUrl('');
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    } else {
      setVideoFile(null);
      setVideoUrl('');
    }
  };

  const handleApplyAIFilter = async () => {
    if (!imageFile && !imageUrl) {
      setError('Por favor, selecione ou carregue uma imagem para aplicar o filtro de IA.');
      return;
    }
    if (!aiFilterPrompt.trim()) {
      setError('Por favor, digite um prompt para o filtro de IA.');
      return;
    }
    setError('');

    if ((currentUser.balance || 0) < MIN_AI_FILTER_USD_COST) {
      setError(`Saldo insuficiente para aplicar o filtro. Custo mínimo: $${MIN_AI_FILTER_USD_COST.toFixed(2)} USD (${(MIN_AI_FILTER_USD_COST * KZT_TO_USD_RATE).toFixed(0)} KZT).`);
      return;
    }

    const confirmDeduction = window.confirm(
      `O filtro de IA custa $${MIN_AI_FILTER_USD_COST.toFixed(2)} USD (${(MIN_AI_FILTER_USD_COST * KZT_TO_USD_RATE).toFixed(0)} KZT). Deseja continuar e deduzir do seu saldo?`
    );

    if (!confirmDeduction) {
      setError('Operação de filtro cancelada.');
      return;
    }

    setAiFilterLoading(true);
    try {
      const mimeType = imageFile?.type || 'image/png'; // Use existing mimeType or default
      const base64Data = imageUrl.split(',')[1]; // Extract base64 part
      const filteredImageUrl = await applyAIImageFilter(base64Data, mimeType, aiFilterPrompt);
      
      const balanceUpdated = updateUserBalance(currentUser.id, -MIN_AI_FILTER_USD_COST);
      if (!balanceUpdated) {
        throw new Error('Falha ao deduzir o custo do filtro do saldo.');
      }
      refreshUser();

      setImageUrl(filteredImageUrl);
      alert(`Filtro de IA aplicado com sucesso! $${MIN_AI_FILTER_USD_COST.toFixed(2)} deduzido do seu saldo.`);
    } catch (err: any) {
      setError(err.message || 'Erro ao aplicar filtro de IA.');
      console.error('AI Filter Error:', err);
    } finally {
      setAiFilterLoading(false);
    }
  };

  const generateQRCode = async (link: string): Promise<string> => {
    if (!link) return '';
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(link)}`;
    return qrApiUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let postToSave: Post | null = null;
    const commonPostFields = {
      id: '', 
      timestamp: 0,
      userId: currentUser.id,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      authorProfilePic: currentUser.profilePicture,
      likes: [], comments: [], shares: [], saves: [],
    };

    try {
      if (postType === PostType.TEXT) {
        if (!content.trim()) {
          setError('O conteúdo do texto não pode ser vazio.');
          setLoading(false);
          return;
        }
        postToSave = { ...commonPostFields, type: PostType.TEXT, content };
      } else if (postType === PostType.IMAGE) {
        if (!imageFile && !imageUrl && !isEditing) {
          setError('Por favor, selecione uma imagem.');
          setLoading(false);
          return;
        }
        postToSave = { ...commonPostFields, type: PostType.IMAGE, content, imageUrl };
      } else if (postType === PostType.LIVE) {
        if (!liveStreamTitle.trim() || !liveStreamDescription.trim()) {
          setError('Título e descrição da live são obrigatórios.');
          setLoading(false);
          return;
        }
        if (currentUser.userType === UserType.CREATOR && isLiveStreamPaid && (!liveStreamPrice || liveStreamPrice <= 0 || !liveStreamPaymentLink.trim())) {
          setError('Preço e link de pagamento são obrigatórios para lives pagas.');
          setLoading(false);
          return;
        } else if (currentUser.userType === UserType.STANDARD && isLiveStreamPaid) {
          setError('Usuários normais não podem criar lives pagas.');
          setLoading(false);
          return;
        }

        let qrCodeData = '';
        if (liveStreamPaymentLink.trim() && currentUser.userType === UserType.CREATOR && isLiveStreamPaid) {
          qrCodeData = await generateQRCode(liveStreamPaymentLink.trim());
        }

        const liveStreamDetails: LiveStreamDetails = {
          title: liveStreamTitle,
          description: liveStreamDescription,
          isPaid: currentUser.userType === UserType.CREATOR ? isLiveStreamPaid : false,
          price: (currentUser.userType === UserType.CREATOR && isLiveStreamPaid) ? liveStreamPrice : undefined,
          paymentLink: (currentUser.userType === UserType.CREATOR && isLiveStreamPaid) ? liveStreamPaymentLink : undefined,
          paymentQRCode: (currentUser.userType === UserType.CREATOR && isLiveStreamPaid) ? qrCodeData : undefined,
          streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1'
        };
        postToSave = { ...commonPostFields, type: PostType.LIVE, liveStream: liveStreamDetails };
      } else if (postType === PostType.REEL) {
        if (!videoFile && !videoUrl && !isEditing) {
          setError('Por favor, selecione um vídeo para o Reel.');
          setLoading(false);
          return;
        }
        if (!reelTitle.trim() || !reelDescription.trim()) {
          setError('Título e descrição para o Reel são obrigatórios.');
          setLoading(false);
          return;
        }

        const reelDetails: ReelDetails = {
          title: reelTitle,
          description: reelDescription,
          videoUrl: videoUrl,
          audioTrackId: selectedAudioTrackId, // NEW
        };
        postToSave = { ...commonPostFields, type: PostType.REEL, reel: reelDetails };
      }

      if (postToSave) {
        if (isEditing) {
          const posts = getPosts();
          const existingPost = posts.find(p => p.id === postId);
          if (existingPost) {
            const updatedPost: Post = {
              ...existingPost,
              ...postToSave,
              id: postId,
              timestamp: existingPost.timestamp,
            };
            updatePost(updatedPost);
          }
        } else {
          const posts = getPosts();
          const newPostWithId: Post = { ...postToSave, id: `post-${Date.now()}`, timestamp: Date.now() };
          savePosts([newPostWithId, ...posts]);
        }
        onPostCreated();
        if (!isEditing) {
          setContent('');
          setImageFile(null);
          setImageUrl('');
          setVideoFile(null);
          setVideoUrl('');
          setLiveStreamTitle('');
          setLiveStreamDescription('');
          setIsLiveStreamPaid(false);
          setLiveStreamPrice(0);
          setLiveStreamPaymentLink('');
          setLiveStreamPaymentQRCode('');
          setReelTitle('');
          setReelDescription('');
          setAiFilterPrompt('');
          setPostType(PostType.TEXT);
          setSelectedAudioTrackId(undefined); // NEW
        }
      }
    } catch (err) {
      setError('Erro ao criar/editar post. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 transform transition-all duration-300 hover:scale-[1.005]">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditing ? 'Editar Publicação' : 'Criar Nova Publicação'}</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-3">Tipo de Publicação:</label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPostType(PostType.TEXT)}
                className={`flex-1 min-w-[100px] p-3 rounded-xl font-semibold text-base ${
                  postType === PostType.TEXT
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors duration-200`}
                disabled={isEditing}
              >
                Texto
              </button>
              <button
                type="button"
                onClick={() => setPostType(PostType.IMAGE)}
                className={`flex-1 min-w-[100px] p-3 rounded-xl font-semibold text-base ${
                  postType === PostType.IMAGE
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors duration-200`}
                disabled={isEditing}
              >
                Imagem
              </button>
              <button
                type="button"
                onClick={() => setPostType(PostType.LIVE)}
                className={`flex-1 min-w-[100px] p-3 rounded-xl font-semibold text-base ${
                  postType === PostType.LIVE
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors duration-200`}
                disabled={isEditing}
              >
                Live
              </button>
              <button
                type="button"
                onClick={() => setPostType(PostType.REEL)}
                className={`flex-1 min-w-[100px] p-3 rounded-xl font-semibold text-base ${
                  postType === PostType.REEL
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors duration-200`}
                disabled={isEditing}
              >
                Reel
              </button>
            </div>
            {isEditing && <p className="text-sm text-gray-500 mt-2">Você não pode mudar o tipo de postagem ao editar.</p>}
          </div>

          {postType === PostType.TEXT && (
            <div>
              <label htmlFor="content" className="block text-gray-700 text-sm font-bold mb-2">
                Conteúdo do Texto:
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y transition-shadow duration-200"
                placeholder="O que você gostaria de compartilhar?"
                required
              ></textarea>
            </div>
          )}

          {postType === PostType.IMAGE && (
            <div>
              <label htmlFor="imageFile" className="block text-gray-700 text-sm font-bold mb-2">
                Carregar Imagem:
              </label>
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                required={!imageUrl && !isEditing}
              />
              {imageUrl && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg shadow-sm">
                  <p className="text-gray-700 text-sm font-bold mb-2">Pré-visualização:</p>
                  <img src={imageUrl} alt="Pré-visualização" className="max-w-full h-auto rounded-lg max-h-64 object-contain mx-auto" />
                  <div className="mt-4">
                    <label htmlFor="aiFilterPrompt" className="block text-gray-700 text-sm font-bold mb-2">
                      Aplicar Filtro de Imagem com IA:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="aiFilterPrompt"
                        value={aiFilterPrompt}
                        onChange={(e) => setAiFilterPrompt(e.target.value)}
                        placeholder="Ex: cores vibrantes, estilo vintage, desenho animado"
                        className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                        disabled={aiFilterLoading}
                      />
                      <button
                        type="button"
                        onClick={handleApplyAIFilter}
                        className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors flex-shrink-0 ${
                          aiFilterLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                        disabled={aiFilterLoading}
                      >
                        {aiFilterLoading ? (
                          <svg className="animate-spin h-5 w-5 mr-1 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : 'Aplicar IA'}
                      </button>
                    </div>
                    {aiFilterLoading && <p className="text-sm text-gray-500 mt-1">Aplicando filtro de IA, aguarde...</p>}
                  </div>
                </div>
              )}
              <label htmlFor="imageContent" className="block text-gray-700 text-sm font-bold mb-2 mt-4">
                Legenda da Imagem (Opcional):
              </label>
              <textarea
                id="imageContent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y transition-shadow duration-200"
                placeholder="Adicione uma legenda à sua imagem."
              ></textarea>
            </div>
          )}

          {postType === PostType.LIVE && (
            <div className="space-y-4">
              <div>
                <label htmlFor="liveStreamTitle" className="block text-gray-700 text-sm font-bold mb-2">
                  Título da Live:
                </label>
                <input
                  type="text"
                  id="liveStreamTitle"
                  value={liveStreamTitle}
                  onChange={(e) => setLiveStreamTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                  placeholder="Ex: Aula de Cálculo Diferencial"
                  required
                />
              </div>
              <div>
                <label htmlFor="liveStreamDescription" className="block text-gray-700 text-sm font-bold mb-2">
                  Descrição da Live:
                </label>
                <textarea
                  id="liveStreamDescription"
                  value={liveStreamDescription}
                  onChange={(e) => setLiveStreamDescription(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y transition-shadow duration-200"
                  placeholder="Descreva o que será abordado na sua live."
                  required
                ></textarea>
              </div>
              {currentUser.userType === UserType.CREATOR && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isLiveStreamPaid"
                    checked={isLiveStreamPaid}
                    onChange={(e) => setIsLiveStreamPaid(e.target.checked)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="isLiveStreamPaid" className="ml-2 block text-sm text-gray-900 font-medium">
                    Live Paga
                  </label>
                </div>
              )}
              {isLiveStreamPaid && currentUser.userType === UserType.CREATOR && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="liveStreamPrice" className="block text-gray-700 text-sm font-bold mb-2">
                      Preço (USD):
                    </label>
                    <input
                      type="number"
                      id="liveStreamPrice"
                      value={liveStreamPrice}
                      onChange={(e) => setLiveStreamPrice(parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                      placeholder="Ex: 15.00"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="liveStreamPaymentLink" className="block text-gray-700 text-sm font-bold mb-2">
                      Link de Pagamento/Doação:
                    </label>
                    <input
                      type="url"
                      id="liveStreamPaymentLink"
                      value={liveStreamPaymentLink}
                      onChange={(e) => setLiveStreamPaymentLink(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                      placeholder="Ex: https://paypal.me/seucreator"
                      required
                    />
                    {liveStreamPaymentLink && (
                        <p className="text-xs text-gray-500 mt-1">O QR Code será gerado automaticamente.</p>
                    )}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-600 italic">
                *A funcionalidade de transmissão ao vivo utiliza URLs de plataformas de vídeo existentes. O link de pagamento/doação e o QR Code seriam processados por um gateway de pagamento externo.
              </p>
            </div>
          )}

          {postType === PostType.REEL && (
            <div className="space-y-4">
              <div>
                <label htmlFor="reelVideoFile" className="block text-gray-700 text-sm font-bold mb-2">
                  Carregar Vídeo (Reel):
                </label>
                <input
                  type="file"
                  id="reelVideoFile"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  required={!videoUrl && !isEditing}
                />
                {videoUrl && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg shadow-sm">
                    <p className="text-gray-700 text-sm font-bold mb-2">Pré-visualização do Reel:</p>
                    <video src={videoUrl} controls className="max-w-full h-auto rounded-lg max-h-64 object-contain mx-auto"></video>
                  </div>
                )}
              </div>
              {/* NEW: Audio selection button */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsAudioModalOpen(true)}
                  className="w-full p-3 border border-dashed border-purple-400 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.447-.894L4 6.424V2.5a1 1 0 00-2 0v11.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L4 15.586V10.42l12.553-3.261A1 1 0 0018 7V3z" /></svg>
                  {selectedAudioTrackId ? 'Alterar Áudio' : 'Adicionar Áudio'}
                </button>
              </div>
              <div>
                <label htmlFor="reelTitle" className="block text-gray-700 text-sm font-bold mb-2">
                  Título do Reel:
                </label>
                <input
                  type="text"
                  id="reelTitle"
                  value={reelTitle}
                  onChange={(e) => setReelTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                  placeholder="Ex: Dica de Estudo Rápida"
                  required
                />
              </div>
              <div>
                <label htmlFor="reelDescription" className="block text-gray-700 text-sm font-bold mb-2">
                  Descrição do Reel:
                </label>
                <textarea
                  id="reelDescription"
                  value={reelDescription}
                  onChange={(e) => setReelDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y transition-shadow duration-200"
                  placeholder="Descreva o conteúdo do seu vídeo curto."
                  required
                ></textarea>
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-bold text-lg transition-colors shadow-md flex items-center justify-center ${
              loading || aiFilterLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={loading || aiFilterLoading}
          >
            {(loading || aiFilterLoading) && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? (isEditing ? 'Salvando...' : 'Publicando...') : (isEditing ? 'Salvar Alterações' : 'Publicar')}
          </button>
        </form>
      </div>

      {isAudioModalOpen && (
        <AudioSelectionModal
          onClose={() => setIsAudioModalOpen(false)}
          onSelectTrack={(trackId) => {
            setSelectedAudioTrackId(trackId);
            setIsAudioModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default CreatePost;