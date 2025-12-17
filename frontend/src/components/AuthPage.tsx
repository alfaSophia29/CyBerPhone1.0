
import React, { useState } from 'react';
import { User, UserType } from '../types';
import { loginUser, registerUser, saveCurrentUser } from '../services/storageService'; // Updated imports
import { DEFAULT_PROFILE_PIC } from '../constants';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [userType, setUserType] = useState<UserType>(UserType.STANDARD); // Default to STANDARD

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [documentId, setDocumentId] = useState(''); // CPF, BI, NIF
  const [password, setPassword] = useState(''); // Simulated password
  const [credentials, setCredentials] = useState(''); // CREATOR specific
  const [bio, setBio] = useState(''); // CREATOR specific

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // New loading state

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!firstName || !lastName || !email || !phone || !documentId || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }
    if (userType === UserType.CREATOR && (!credentials || !bio)) {
      setError('Por favor, preencha todos os campos obrigatórios para o perfil Profissional (Criador).');
      setLoading(false);
      return;
    }

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
      });

      saveCurrentUser(newUser.id); // Save current user ID to localStorage
      onLoginSuccess(newUser);
      alert('Cadastro realizado com sucesso! Bem-vindo(a) ao CyBerPhone.');
    } catch (err: any) {
      setError(err.message || 'Erro durante o cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha email e senha.');
      setLoading(false);
      return;
    }

    try {
      const user = await loginUser(email, password);
      saveCurrentUser(user.id); // Save current user ID to localStorage
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Erro durante o login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const commonFormFields = (
    <>
      <input
        type="text"
        placeholder="Nome"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
        required
      />
      <input
        type="text"
        placeholder="Sobrenome"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
        required
      />
      <input
        type="tel"
        placeholder="Telefone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
        required
      />
      <input
        type="text"
        placeholder="CPF, BI ou NIF"
        value={documentId}
        onChange={(e) => setDocumentId(e.target.value)}
        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
        required
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
        required
      />
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 hover:scale-[1.01]">
        <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8">
          {isRegister ? 'Cadastre-se' : 'Bem-vindo(a) de volta!'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {isRegister && (
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-3">
              Seu perfil será:
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setUserType(UserType.STANDARD)}
                className={`flex-1 p-3 rounded-xl font-semibold text-lg ${
                  userType === UserType.STANDARD
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-all duration-300 ease-in-out`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setUserType(UserType.CREATOR)}
                className={`flex-1 p-3 rounded-xl font-semibold text-lg ${
                  userType === UserType.CREATOR
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-all duration-300 ease-in-out`}
              >
                Profissional (Criador)
              </button>
            </div>
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="flex flex-col space-y-4">
          {isRegister ? (
            <>
              {commonFormFields}
              {userType === UserType.CREATOR && (
                <>
                  <textarea
                    placeholder="Credenciais Profissionais (Ex: Doutor em Física, Mestre em História)"
                    value={credentials}
                    onChange={(e) => setCredentials(e.target.value)}
                    rows={3}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y transition-shadow duration-200"
                    required
                  ></textarea>
                  <textarea
                    placeholder="Sua Biografia (Fale sobre você e sua área de atuação como criador de conteúdo)"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y transition-shadow duration-200"
                    required
                  ></textarea>
                </>
              )}
              <button
                type="submit"
                className={`bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Registrar'}
              </button>
            </>
          ) : (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                required
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                required
              />
              <button
                type="submit"
                className={`bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Entrar'}
              </button>
            </>
          )}
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="mt-6 text-blue-600 hover:text-blue-800 text-center w-full font-medium transition-colors duration-200"
          disabled={loading}
        >
          {isRegister ? 'Já tem uma conta? Faça login.' : 'Não tem uma conta? Crie uma.'}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
