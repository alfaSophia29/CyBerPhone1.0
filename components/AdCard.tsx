
import React from 'react';
import { AdCampaign } from '../types';
import { findUserById } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';

interface AdCardProps {
  ad: AdCampaign;
}

const AdCard: React.FC<AdCardProps> = ({ ad }) => {
  const professor = findUserById(ad.professorId);

  if (!professor) {
    return null; // Should not happen
  }

  return (
    <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl shadow-xl p-6 mb-6 border border-blue-300 relative overflow-hidden transform transition-all duration-300 hover:scale-[1.005] hover:shadow-2xl">
      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md">
        Anúncio
      </div>
      <div className="flex items-center mb-4">
        <img
          src={professor.profilePicture || DEFAULT_PROFILE_PIC}
          alt={professor.firstName}
          className="w-10 h-10 rounded-full object-cover border-2 border-purple-400 shadow-sm"
        />
        <div className="ml-3">
          <p className="font-bold text-gray-800 text-lg">
            {ad.title}
          </p>
          <p className="text-gray-600 text-sm">
            Por {professor.firstName} {professor.lastName}
          </p>
        </div>
      </div>
      {ad.imageUrl && (
        <div className="mb-4 rounded-lg overflow-hidden shadow-md">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-48 object-cover"
          />
        </div>
      )}
      <p className="text-gray-700 mb-4 leading-relaxed">{ad.description}</p>
      {ad.linkUrl && (
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-semibold transition-colors text-sm shadow-md hover:shadow-lg"
          aria-label={`Saiba mais sobre ${ad.title}`}
        >
          Saiba Mais
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-2 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </div>
  );
};

export default AdCard;