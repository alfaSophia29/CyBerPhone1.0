import React, { useState, useEffect } from 'react';
import { AdCampaign, User } from '../types';
import { saveAds, getAds, updateUserBalance } from '../services/storageService';
import { generateAdCopy } from '../services/geminiService';
import { MIN_AD_CAMPAIGN_USD_COST, KZT_TO_USD_RATE } from '../constants'; // Import monetization constants

interface AdCampaignPageProps {
  currentUser: User;
  refreshUser: () => void; // Added refreshUser for balance updates
}

const AdCampaignPage: React.FC<AdCampaignPageProps> = ({ currentUser, refreshUser }) => {
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdDescription, setNewAdDescription] = useState('');
  const [newAdTargetAudience, setNewAdTargetAudience] = useState('');
  const [newAdBudget, setNewAdBudget] = useState<number>(MIN_AD_CAMPAIGN_USD_COST); // Default to min cost
  const [newAdImageUrl, setNewAdImageUrl] = useState('');
  const [newAdLinkUrl, setNewAdLinkUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // For form submission
  const [geminiAdPrompt, setGeminiAdPrompt] = useState('');
  const [geminiAdLoading, setGeminiAdLoading] = useState(false);
  const [geminiAdError, setGeminiAdError] = useState('');

  useEffect(() => {
    // All users can create ads now, so just filter by currentUser.id
    const allAds = getAds();
    const userAds = allAds.filter((ad) => ad.professorId === currentUser.id); // professorId is conceptually creatorId
    setAdCampaigns(userAds);
  }, [currentUser]);

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!newAdTitle.trim() || !newAdDescription.trim() || !newAdTargetAudience.trim() || newAdBudget <= 0) {
      setError('Por favor, preencha todos os campos obrigatórios para o anúncio.');
      setLoading(false);
      return;
    }

    if (newAdBudget < MIN_AD_CAMPAIGN_USD_COST) {
      setError(`O orçamento mínimo para uma campanha de anúncio é $${MIN_AD_CAMPAIGN_USD_COST.toFixed(2)} USD (${(MIN_AD_CAMPAIGN_USD_COST * KZT_TO_USD_RATE).toFixed(0)} KZT).`);
      setLoading(false);
      return;
    }

    if ((currentUser.balance || 0) < newAdBudget) {
      setError(`Saldo insuficiente para cobrir o orçamento da campanha de $${newAdBudget.toFixed(2)} USD.`);
      setLoading(false);
      return;
    }

    const confirmDeduction = window.confirm(
      `Confirmar a criação da campanha de anúncio? $${newAdBudget.toFixed(2)} USD serão deduzidos do seu saldo.`
    );

    if (!confirmDeduction) {
      setError('Criação da campanha de anúncio cancelada.');
      setLoading(false);
      return;
    }

    // Deduct balance
    const balanceUpdated = updateUserBalance(currentUser.id, -newAdBudget);
    if (!balanceUpdated) {
      setError('Falha ao deduzir o orçamento da campanha do saldo.');
      setLoading(false);
      return;
    }
    refreshUser(); // Update currentUser state in App.tsx


    const newAd: AdCampaign = {
      id: `ad-${Date.now()}`,
      professorId: currentUser.id, // professorId is conceptually creatorId
      title: newAdTitle,
      description: newAdDescription,
      targetAudience: newAdTargetAudience,
      budget: newAdBudget,
      isActive: true, // New ads are active by default
      imageUrl: newAdImageUrl || `https://picsum.photos/600/300?random=${Date.now()}`, // Placeholder image
      linkUrl: newAdLinkUrl || '#',
      timestamp: Date.now(), // Add timestamp for sorting in feed
    };

    const allAds = getAds();
    saveAds([...allAds, newAd]);
    setAdCampaigns((prev) => [...prev, newAd]);

    // Clear form
    setNewAdTitle('');
    setNewAdDescription('');
    setNewAdTargetAudience('');
    setNewAdBudget(MIN_AD_CAMPAIGN_USD_COST); // Reset to min cost
    setNewAdImageUrl('');
    setNewAdLinkUrl('');
    setLoading(false);
    alert(`Campanha de anúncio criada com sucesso! $${newAdBudget.toFixed(2)} deduzidos do seu saldo.`);
  };

  const handleGenerateAdCopy = async () => {
    setGeminiAdLoading(true);
    setGeminiAdError('');
    try {
      const prompt = `Título: ${newAdTitle}. Audiência: ${newAdTargetAudience}. Descrição atual: ${newAdDescription}. Detalhes adicionais: ${geminiAdPrompt}`;
      const generatedCopy = await generateAdCopy(prompt);
      // Attempt to parse title and description from generated copy if possible
      const lines = generatedCopy.split('\n');
      const titleLine = lines.find(line => line.toLowerCase().startsWith('título:'));
      const descLines = lines.filter(line => !line.toLowerCase().startsWith('título:'));

      if (titleLine) {
        setNewAdTitle(titleLine.replace(/título:\s*/i, '').trim());
        setNewAdDescription(descLines.join('\n').trim());
      } else {
        setNewAdDescription(generatedCopy); // Fallback to entire output if no title found
      }
      setGeminiAdPrompt('');
    } catch (err: any) {
      setGeminiAdError(err.message || 'Erro ao gerar cópia do anúncio com Gemini.');
    } finally {
      setGeminiAdLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 pb-20 md:pb-8"> {/* Adjusted padding */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3 border-gray-200">Gerenciar Campanhas de Anúncios</h2>

      {/* Create New Ad Campaign */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 transform transition-all duration-300 hover:scale-[1.005]">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Criar Nova Campanha</h3>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <form onSubmit={handleCreateAd} className="space-y-4">
          <div>
            <label htmlFor="adTitle" className="block text-gray-700 text-sm font-bold mb-2">
              Título do Anúncio:
            </label>
            <input
              type="text"
              id="adTitle"
              value={newAdTitle}
              onChange={(e) => setNewAdTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              placeholder="Ex: Workshop Gratuito de Introdução à IA"
              required
            />
          </div>
          <div>
            <label htmlFor="adTarget" className="block text-gray-700 text-sm font-bold mb-2">
              Público-alvo:
            </label>
            <input
              type="text"
              id="adTarget"
              value={newAdTargetAudience}
              onChange={(e) => setNewAdTargetAudience(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              placeholder="Ex: Estudantes universitários de tecnologia, profissionais iniciantes"
              required
            />
          </div>
          <div>
            <label htmlFor="adDescription" className="block text-gray-700 text-sm font-bold mb-2">
              Descrição do Anúncio:
            </label>
            <textarea
              id="adDescription"
              value={newAdDescription}
              onChange={(e) => setNewAdDescription(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y transition-shadow duration-200"
              placeholder="Descreva seu anúncio de forma persuasiva."
              required
            ></textarea>
            {/* Gemini Ad Copy Generator */}
            <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                value={geminiAdPrompt}
                onChange={(e) => setGeminiAdPrompt(e.target.value)}
                placeholder="Ex: Focar nos benefícios de carreira e acesso exclusivo"
                className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 transition-shadow duration-200"
                disabled={geminiAdLoading}
              />
              <button
                type="button"
                onClick={handleGenerateAdCopy}
                className={`px-5 py-2 rounded-lg font-semibold text-white transition-colors flex-shrink-0 shadow-sm ${
                  geminiAdLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                }`}
                disabled={geminiAdLoading}
                aria-label="Gerar Cópia do Anúncio com Gemini"
              >
                {geminiAdLoading ? (
                  <svg className="animate-spin h-5 w-5 mr-3 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Gerar Cópia com Gemini'}
              </button>
            </div>
            {geminiAdError && (
              <p className="text-red-500 text-sm mt-1">{geminiAdError}</p>
            )}
          </div>
          <div>
            <label htmlFor="adBudget" className="block text-gray-700 text-sm font-bold mb-2">
              Orçamento Diário (USD):
            </label>
            <input
              type="number"
              id="adBudget"
              value={newAdBudget}
              onChange={(e) => setNewAdBudget(parseFloat(e.target.value))}
              min={MIN_AD_CAMPAIGN_USD_COST}
              step="0.01"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              *Orçamento mínimo: ${MIN_AD_CAMPAIGN_USD_COST.toFixed(2)} USD ({(MIN_AD_CAMPAIGN_USD_COST * KZT_TO_USD_RATE).toFixed(0)} KZT).
              Os preços aumentam com base no alcance do público e do tempo de exibição do anúncio.
            </p>
          </div>
          <div>
            <label htmlFor="adImageUrl" className="block text-gray-700 text-sm font-bold mb-2">
              URL da Imagem (Opcional):
            </label>
            <input
              type="url"
              id="adImageUrl"
              value={newAdImageUrl}
              onChange={(e) => setNewAdImageUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              placeholder="https://exemplo.com/imagem-do-anuncio.jpg"
            />
          </div>
          <div>
            <label htmlFor="adLinkUrl" className="block text-gray-700 text-sm font-bold mb-2">
              URL do Link (Opcional):
            </label>
            <input
              type="url"
              id="adLinkUrl"
              value={newAdLinkUrl}
              onChange={(e) => setNewAdLinkUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              placeholder="https://exemplo.com/pagina-destino"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors shadow-md hover:shadow-lg w-full"
            disabled={loading || geminiAdLoading}
          >
            {loading ? 'Criando Anúncio...' : 'Criar Campanha'}
          </button>
        </form>
      </div>

      {/* Existing Ad Campaigns */}
      <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 border-gray-200">Minhas Campanhas Ativas</h3>
      {adCampaigns.length === 0 ? (
        <p className="text-gray-600 text-center bg-white p-6 rounded-2xl shadow-md border border-gray-200">
          Você não tem campanhas de anúncios ativas.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adCampaigns.map((ad) => (
            <div key={ad.id} className="bg-white rounded-xl shadow-md p-5 border border-gray-200 transform transition-all duration-300 hover:scale-[1.005]">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">{ad.title}</h4>
              {ad.imageUrl && (
                <img src={ad.imageUrl} alt={ad.title} className="w-full h-32 object-cover rounded-md mb-3" />
              )}
              <p className="text-gray-700 text-sm mb-2">{ad.description}</p>
              <p className="text-gray-600 text-xs mb-1">Público: {ad.targetAudience}</p>
              <p className="text-gray-600 text-xs mb-3">Orçamento: ${ad.budget.toFixed(2)}/dia</p>
              <a
                href={ad.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                Ver Anúncio
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdCampaignPage;