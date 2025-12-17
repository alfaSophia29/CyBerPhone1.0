import React, { useState, useEffect, useRef } from 'react';
import { Comment, User, Post } from '../types';
import { getPosts, addPostComment } from '../services/storageService';
import { DEFAULT_PROFILE_PIC } from '../constants';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CommentsModalProps {
  postId: string;
  currentUser: User;
  onClose: () => void;
  onCommentsUpdated: () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ postId, currentUser, onClose, onCommentsUpdated }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allPosts = getPosts();
    const foundPost = allPosts.find(p => p.id === postId);
    setPost(foundPost || null);
  }, [postId]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      profilePic: currentUser.profilePicture,
      text: newCommentText,
      timestamp: Date.now(),
    };
    addPostComment(postId, newComment);
    setNewCommentText('');
    onCommentsUpdated(); // Notify parent to refresh post data
    setPost(prevPost => prevPost ? { ...prevPost, comments: [...prevPost.comments, newComment] } : null);
  };
  
  // Close modal if clicked outside main content area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // The background div is the event.target when clicking outside
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && (event.target as HTMLElement).contains(modalRef.current)) {
        onClose();
      }
    };
    const background = modalRef.current?.parentElement;
    background?.addEventListener('click', handleClickOutside);
    return () => {
      background?.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  if (!post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div 
        ref={modalRef} 
        className="bg-white w-full max-w-lg h-[70vh] rounded-t-2xl shadow-xl flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()} // Prevent clicks inside from closing
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 text-center flex-grow">Comentários ({post.comments.length})</h2>
          <button onClick={onClose} className="absolute right-4 p-2 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </header>

        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {post.comments.length === 0 ? (
            <p className="text-gray-500 text-center pt-10">Nenhum comentário ainda. Seja o primeiro!</p>
          ) : (
            [...post.comments].sort((a, b) => a.timestamp - b.timestamp).map(comment => (
              <div key={comment.id} className="flex items-start space-x-3">
                <img src={comment.profilePic || DEFAULT_PROFILE_PIC} alt={comment.userName} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 bg-gray-100 p-3 rounded-xl">
                  <p className="font-semibold text-sm">{comment.userName}</p>
                  <p className="text-gray-800 break-words">{comment.text}</p>
                  <span className="text-xs text-gray-400 mt-1 block">{new Date(comment.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
          <form onSubmit={handleAddComment} className="flex items-center space-x-2">
            <img src={currentUser.profilePicture || DEFAULT_PROFILE_PIC} alt="Você" className="w-10 h-10 rounded-full object-cover" />
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Adicione um comentário..."
              className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newCommentText.trim()}
            >
              Publicar
            </button>
          </form>
        </footer>
      </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CommentsModal;