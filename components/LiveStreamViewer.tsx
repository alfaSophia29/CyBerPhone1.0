
import React, { useState, useEffect } from 'react';
import { Post, User, UserType } from '../types';
import { getPosts, findUserById, updateUserBalance } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { CreditCardIcon, QrCodeIcon, BanknotesIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface LiveStreamViewerProps {
  currentUser: User;
  postId: string;
  onNavigate: (page: string) => void;
  refreshUser: () => void;
}

const LiveStreamViewer: React.FC<LiveStreamViewerProps> = ({ currentUser, postId, onNavigate, refreshUser }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [creator, setCreator] = useState<User | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'success'>('selection');
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'pix' | 'card'>('balance');

  useEffect(() => {
    const foundPost = getPosts().find(p => p.id === postId);
    if (foundPost && foundPost.liveStream) {
      setPost(foundPost);
      setCreator(findUserById(foundPost.userId) || null);
      setHasPaid(!foundPost.liveStream.isPaid || currentUser.id === foundPost.userId);
    } else {
      onNavigate('feed');
    }
  }, [postId, onNavigate, currentUser.id]);

  const handlePayment = () => {
    if (!post?.liveStream) return;
    const price = post.liveStream.price || 0;

    if (paymentMethod === 'balance' && (currentUser.balance || 0) < price) {
      alert("Saldo insuficiente na carteira.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      if (paymentMethod === 'balance') updateUserBalance(currentUser.id, -price);
      if (creator) updateUserBalance(creator.id, price);
      
      setHasPaid(true);
      setIsProcessing(false);
      setPaymentStep('success');
      refreshUser();
    }, 2000);
  };

  if (!post || !post.liveStream || !creator) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 pb-20">
      {!hasPaid ? (
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 text-center animate-fade-in">
          {paymentStep === 'selection' ? (
            <>
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
              <p className="text-gray-500 mb-6">Esta live é exclusiva. Para assistir ao conteúdo de {creator.firstName}, adquira o acesso.</p>
              
              <div className="bg-gray-50 p-4 rounded-2xl mb-6">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Preço do Ingresso</p>
                <p className="text-3xl font-black text-blue-600">${post.liveStream.price?.toFixed(2)}</p>
              </div>

              <div className="space-y-3 mb-8">
                <button onClick={() => setPaymentMethod('balance')} className={`w-full flex items-center justify-between p-4 border-2 rounded-2xl transition-all ${paymentMethod === 'balance' ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3"><BanknotesIcon className="h-6 w-6 text-blue-600"/><p className="font-bold">Saldo (${(currentUser.balance || 0).toFixed(2)})</p></div>
                </button>
                <button onClick={() => setPaymentMethod('pix')} className={`w-full flex items-center justify-between p-4 border-2 rounded-2xl transition-all ${paymentMethod === 'pix' ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3"><QrCodeIcon className="h-6 w-6 text-green-600"/><p className="font-bold">Pix</p></div>
                </button>
              </div>

              <button onClick={handlePayment} disabled={isProcessing} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2">
                {isProcessing ? <ArrowPathIcon className="h-5 w-5 animate-spin"/> : 'Confirmar Pagamento'}
              </button>
            </>
          ) : (
            <div className="py-8">
              <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Acesso Liberado!</h2>
              <p className="text-gray-500 mb-8">Desejamos a você uma ótima live.</p>
              <button onClick={() => setHasPaid(true)} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold">Entrar na Live</button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="aspect-video bg-black">
            <iframe src={post.liveStream.streamUrl} className="w-full h-full" frameBorder="0" allowFullScreen title="Live" />
          </div>
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <img src={creator.profilePicture || DEFAULT_PROFILE_PIC} className="w-12 h-12 rounded-full border-2 border-blue-500" />
              <div>
                <h2 className="text-2xl font-bold">{post.liveStream.title}</h2>
                <p className="text-gray-500">Apresentado por {creator.firstName} {creator.lastName}</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">{post.liveStream.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamViewer;
