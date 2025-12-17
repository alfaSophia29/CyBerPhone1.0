
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { findUserById } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { ExclamationCircleIcon, ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

interface ReportUserPageProps {
  currentUser: User;
  targetUserId?: string;
  onNavigate: (page: any) => void;
}

const ReportUserPage: React.FC<ReportUserPageProps> = ({ currentUser, targetUserId, onNavigate }) => {
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const reasons = [
    'Spam ou fraude',
    'Discurso de ódio ou assédio',
    'Conteúdo sexualmente explícito',
    'Propriedade intelectual',
    'Informações falsas',
    'Outro motivo'
  ];

  useEffect(() => {
    if (targetUserId) {
      const user = findUserById(targetUserId);
      if (user) setTargetUser(user);
    }
  }, [targetUserId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setIsSubmitting(true);
    // Simulação de processamento de denúncia
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => onNavigate('feed'), 3000);
    }, 1500);
  };

  if (!targetUser) return <div className="pt-24 text-center">Usuário não encontrado.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 pb-20 max-w-2xl">
      <button 
        onClick={() => onNavigate('feed')} 
        className="flex items-center text-gray-600 hover:text-blue-600 mb-6 font-semibold transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" /> Voltar ao Feed
      </button>

      <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 overflow-hidden relative">
        {isSuccess ? (
          <div className="text-center py-10 animate-fade-in">
            <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheckIcon className="h-14 w-14 text-green-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Denúncia Enviada!</h2>
            <p className="text-gray-500 font-medium">Obrigado por nos ajudar a manter a comunidade segura. Nossa equipe de moderação analisará este perfil em breve.</p>
            <p className="text-blue-600 mt-6 font-bold animate-pulse">Redirecionando você...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-8 p-4 bg-red-50 rounded-2xl border border-red-100">
              <ExclamationCircleIcon className="h-8 w-8 text-red-500" />
              <div>
                <h2 className="text-xl font-black text-gray-900">Denunciar Usuário</h2>
                <p className="text-sm text-gray-600">Conte-nos o que está acontecendo com este perfil.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-100">
              <img 
                src={targetUser.profilePicture || DEFAULT_PROFILE_PIC} 
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" 
                alt={targetUser.firstName} 
              />
              <div>
                <p className="font-black text-lg text-gray-900">{targetUser.firstName} {targetUser.lastName}</p>
                <p className="text-sm text-gray-500">ID: {targetUser.id}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-3">Qual o motivo da denúncia?</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reasons.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`p-4 text-left rounded-xl border-2 transition-all font-bold text-sm ${
                        reason === r ? 'border-red-500 bg-red-50 text-red-700 shadow-inner' : 'border-gray-100 hover:border-gray-200 text-gray-600'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-3">Detalhes adicionais (opcional)</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all h-32"
                  placeholder="Descreva o comportamento ou conteúdo problemático..."
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800 leading-tight">
                  Suas denúncias são anônimas. O usuário denunciado não saberá que você fez a denúncia.
                </p>
              </div>

              <button
                type="submit"
                disabled={!reason || isSubmitting}
                className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  !reason || isSubmitting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : 'Enviar Denúncia'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportUserPage;
