import React, { useState } from 'react';
import { User, UserType } from '../types';
import { saveUsers, getUsers, saveCurrentUser, getStores, saveStores } from '../services/storageService';
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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !email || !phone || !documentId || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (userType === UserType.CREATOR && (!credentials || !bio)) {
      setError('Por favor, preencha todos os campos obrigatórios para o perfil Profissional (Criador).');
      return;
    }

    const users = getUsers();
    if (users.some(u => u.email === email)) {
      setError('Email já cadastrado.');
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      userType,
      firstName,
      lastName,
      email,
      phone,
      documentId,
      followedUsers: [],
      balance: 0, // All users start with 0 balance now
      credentials: userType === UserType.CREATOR ? credentials : undefined,
      bio: userType === UserType.CREATOR ? bio : undefined,
      profilePicture: DEFAULT_PROFILE_PIC, // Use default for new registrations
    };

    // If CREATOR, create a default store for them
    if (newUser.userType === UserType.CREATOR) {
      const newStoreId = `store-${newUser.id}`;
      newUser.storeId = newStoreId;
      const allStores = getStores();
      saveStores([...allStores, {
        id: newStoreId,
        professorId: newUser.id, // Retain professorId field name for consistency with types.ts for now
        name: `Loja de ${newUser.firstName} ${newUser.lastName}`,
        description: 'Bem-vindo à minha loja!',
        productIds: [],
      }]);
    }

    saveUsers([...users, newUser]);
    saveCurrentUser(newUser.id);
    onLoginSuccess(newUser);
    alert('Cadastro realizado com sucesso! Bem-vindo(a) ao CyBerPhone.');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha email e senha.');
      return;
    }

    const users = getUsers();
    const foundUser = users.find(u => u.email === email);

    if (!foundUser) {
      setError('Usuário não encontrado.');
      return;
    }

    if (password !== 'password') {
      setError('Senha incorreta.');
      return;
    }

    saveCurrentUser(foundUser.id);
    onLoginSuccess(foundUser);
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
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y transition-shadow duration-200"
                    required
                  ></textarea>
                </>
              )}
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Registrar
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
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Entrar
              </button>
            </>
          )}
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="mt-6 text-blue-600 hover:text-blue-800 text-center w-full font-medium transition-colors duration-200"
        >
          {isRegister ? 'Já tem uma conta? Faça login.' : 'Não tem uma conta? Crie uma.'}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;