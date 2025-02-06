import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type Comment = {
  id: string;
  content: string;
  created_at: string;
  confession_id: string;
  client_id: string;
  likes: number;
};

type CommentSectionProps = {
  confessionId: string;
  initialComments?: Comment[];
};

const CLIENT_ID = Math.random().toString(36).substring(2) + Date.now().toString(36);

export const CommentSection: React.FC<CommentSectionProps> = ({ confessionId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedLikes = localStorage.getItem('likedComments');
    if (savedLikes) {
      setLikedComments(new Set(JSON.parse(savedLikes)));
    }
  }, []);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('confession_comments')
        .select('*')
        .eq('confession_id', confessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      toast.error('Failed to load comments');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('confession_comments')
        .insert([
          {
            content: newComment.trim(),
            confession_id: confessionId,
            client_id: CLIENT_ID
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setNewComment('');
      setComments(prev => [...prev, data]);
      toast.success('Comment added successfully!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (commentId: string) => {
    try {
      const { data: isLiked, error } = await supabase.rpc('toggle_comment_like', {
        target_comment_id: commentId,
        client_id: CLIENT_ID
      });

      if (error) throw error;

      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? { ...comment, likes: comment.likes + (isLiked ? 1 : -1) }
            : comment
        )
      );

      const newLikedComments = new Set(likedComments);
      if (isLiked) {
        newLikedComments.add(commentId);
        toast.success('Comment liked!');
      } else {
        newLikedComments.delete(commentId);
      }
      
      setLikedComments(newLikedComments);
      localStorage.setItem('likedComments', JSON.stringify([...newLikedComments]));
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const toggleComments = async () => {
    if (!showComments) {
      await fetchComments();
    }
    setShowComments(!showComments);
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (showComments) {
      const channel = supabase
        .channel('comments_channel')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'confession_comments',
            filter: `confession_id=eq.${confessionId}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newComment = payload.new as Comment;
              if (newComment.client_id !== CLIENT_ID) {
                setComments(prev => [...prev, newComment]);
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedComment = payload.new as Comment;
              setComments(prev =>
                prev.map(comment =>
                  comment.id === updatedComment.id ? updatedComment : comment
                )
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [confessionId, showComments]);

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <button
        onClick={toggleComments}
        className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        <span>{comments.length} Comments</span>
      </button>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            <form onSubmit={handleSubmitComment} className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-grow px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>

            <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-gray-700 whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    </div>
                    <div className="mt-2 flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleToggleLike(comment.id)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
                            likedComments.has(comment.id)
                              ? 'bg-pink-100 text-pink-600'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${
                            likedComments.has(comment.id) ? 'fill-current' : ''
                          }`} />
                          <span>{comment.likes}</span>
                        </button>
                        <span className="text-gray-500">{formatDate(comment.created_at)}</span>
                      </div>
                      <span className="text-purple-600">Anonymous</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};