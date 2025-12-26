
import React, { useState, useRef } from 'react';
import { User, UserType } from '../types';
import { loginUser, registerUser, saveCurrentUser } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { DocumentArrowUpIcon, CheckCircleIcon, PaperClipIcon } from '@heroicons/react/24/outline';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [userType, setUserType] = useState<UserType>(UserType.STANDARD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [password, setPassword] = useState('');
  const [credentials, setCredentials] = useState('');
  const [bio, setBio] = useState('');
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClasses = "w-full p-4 bg-gray-50 dark:bg-white/5 dark:text-white rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-darkcard outline-none font-bold text-sm transition-all shadow-inner placeholder-gray-400";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('O comprovante deve ser um arquivo PDF.');
        setVerificationFile(null);
        return;
      }
      setVerificationFile(file);
      setError('');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!firstName || !lastName || !email || !phone || !documentId || !password) {
      setError('Todos os campos fundamentais são obrigatórios.');
      return;
    }
    
    if (userType === UserType.CREATOR) {
      if (!credentials || !bio) {
        setError('Perfil Profissional exige cargo/área e biografia.');
        return;
      }
      if (!verificationFile) {
        setError('É obrigatório anexar um comprovante profissional (PDF).');
        return;
      }
    }

    setLoading(true);
    try {
      const newUser = await registerUser({
        userType,
        firstName,
        lastName,
        email,
        phone,
        documentId,
        password,
        profilePicture: DEFAULT_PROFILE_PIC,
        credentials: userType === UserType.CREATOR ? credentials : undefined,
        bio: userType === UserType.CREATOR ? bio : undefined,
        verificationFileUrl: verificationFile ? verificationFile.name : undefined // Armazenamos o nome como mock
      });
      saveCurrentUser(newUser.id);
      onLoginSuccess(newUser);
    } catch (err: any) {
      setError(err.message || 'Erro no registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email e senha são obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      saveCurrentUser(user.id);
      onLoginSuccess(user);
    } catch (err: any) {
      setError('Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-4 font-sans">
      <div className="bg-white dark:bg-darkcard p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-fade-in border border-white/10 relative overflow-hidden">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-900 dark:text-white tracking-tighter">
            CyBer<span className="text-blue-600">Phone</span>
          </h2>
          <p className="text-center text-gray-400 font-bold uppercase text-[9px] tracking-[0.25em] mt-2">
            {isRegister ? 'Conectando Talentos e Oportunidades' : 'Seja bem-vindo novamente'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-[10px] font-black mb-6 text-center animate-pulse uppercase tracking-widest">
            {error}
          </div>
        )}

        {isRegister && (
          <div className="flex bg-gray-50 dark:bg-white/5 p-1.5 rounded-2xl mb-8 border border-gray-100 dark:border-white/5">
            <button 
              type="button" 
              onClick={() => { setUserType(UserType.STANDARD); setVerificationFile(null); }} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${userType === UserType.STANDARD ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}
            >
              CONTA NORMAL
            </button>
            <button 
              type="button" 
              onClick={() => setUserType(UserType.CREATOR)} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${userType === UserType.CREATOR ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400'}`}
            >
              PROFISSIONAL
            </button>
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          {isRegister && (
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nome" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClasses} />
              <input type="text" placeholder="Sobrenome" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClasses} />
            </div>
          )}
          <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} />
          {isRegister && (
            <div className="grid grid-cols-2 gap-3">
              <input type="tel" placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} className={inputClasses} />
              <input type="text" placeholder="ID / Documento" value={documentId} onChange={e => setDocumentId(e.target.value)} className={inputClasses} />
            </div>
          )}
          <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} />
          
          {isRegister && userType === UserType.CREATOR && (
            <div className="space-y-4 animate-fade-in pt-2">
              <input type="text" placeholder="Cargo ou Área (Ex: Designer, Médico)" value={credentials} onChange={e => setCredentials(e.target.value)} className={inputClasses} />
              <textarea placeholder="Resumo profissional..." value={bio} onChange={e => setBio(e.target.value)} className={inputClasses + " h-24 resize-none font-medium"} />
              
              <div className="pt-2">
                 <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Comprovante Profissional (PDF)</label>
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className={`w-full p-6 border-2 border-dashed rounded-[1.8rem] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${verificationFile ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-white/10 hover:border-blue-500'}`}
                 >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept=".pdf" 
                      className="hidden" 
                    />
                    {verificationFile ? (
                      <>
                        <CheckCircleIcon className="h-8 w-8 text-green-500" />
                        <span className="text-[10px] font-black text-green-600 uppercase truncate max-w-full px-4">{verificationFile.name}</span>
                      </>
                    ) : (
                      <>
                        <DocumentArrowUpIcon className="h-8 w-8 text-gray-300" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Clique para enviar comprovante</span>
                      </>
                    )}
                 </div>
              </div>
            </div>
          )}
          
          <button type="submit" disabled={loading} className="w-full py-5 rounded-[1.8rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 bg-green-600 text-white">
            {loading ? <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" /> : isRegister ? 'CRIAR MINHA CONTA' : 'ENTRAR'}
          </button>
        </form>

        <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="w-full mt-10 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-600 transition-colors">
          {isRegister ? 'Já tem conta? Login' : 'Novo por aqui? Criar conta'}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
