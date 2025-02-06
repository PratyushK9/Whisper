import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ThumbsUp, Clock, RefreshCcw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useErrorBoundary } from '../hooks/useErrorBoundary';
import { CommentSection } from './CommentSection';

type Confession = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  likes: number;
};

type SortOption = 'recent' | 'likes';

const CONFESSIONS_PER_PAGE = 12;
const CACHE_DURATION = 5 * 60 * 1000;

const CLIENT_ID = Math.random().toString(36).substring(2) + Date.now().toString(36);

export const ConfessionsList = () => {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [likedConfessions, setLikedConfessions] = useState<Set<string>>(new Set());
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedConfession, setSelectedConfession] = useState<Confession | null>(null);
  const { ErrorBoundary } = useErrorBoundary();

  const fetchConfessions = useCallback(async (pageNumber: number, force: boolean = false) => {
    const now = Date.now();
    if (!force && now - lastFetch < CACHE_DURATION && pageNumber === 0) {
      return;
    }

    try {
      if (pageNumber === 0) {
        setRefreshing(true);
      } else {
        setLoadingMore(true);
      }

      const from = pageNumber * CONFESSIONS_PER_PAGE;
      const to = from + CONFESSIONS_PER_PAGE - 1;

      const query = supabase
        .from('confessions')
        .select('*')
        .range(from, to);

      if (sortBy === 'likes') {
        query.order('likes', { ascending: false }).order('created_at', { ascending: false });
      } else {
        query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      if (pageNumber === 0) {
        setConfessions(data || []);
      } else {
        setConfessions(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data?.length || 0) === CONFESSIONS_PER_PAGE);
      setLastFetch(now);
    } catch (error) {
      toast.error('Failed to load confessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [lastFetch, sortBy]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchConfessions(nextPage);
  };

  const handleToggleLike = async (confessionId: string) => {
    try {
      const { data, error } = await supabase.rpc('toggle_like', {
        target_confession_id: confessionId,
        client_id: CLIENT_ID
      });

      if (error) throw error;

      const isLiked = data;
      
      setConfessions(prev =>
        prev.map(confession =>
          confession.id === confessionId
            ? { ...confession, likes: confession.likes + (isLiked ? 1 : -1) }
            : confession
        )
      );

      const newLikedConfessions = new Set(likedConfessions);
      if (isLiked) {
        newLikedConfessions.add(confessionId);
        toast.success('Thanks for sharing the love! ❤️');
      } else {
        newLikedConfessions.delete(confessionId);
        toast.success('Unlike successful');
      }
      
      setLikedConfessions(newLikedConfessions);
      localStorage.setItem('likedConfessions', JSON.stringify([...newLikedConfessions]));
    } catch (error) {
      toast.error('Failed to update like status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  const handleRefresh = async () => {
    setPage(0);
    await fetchConfessions(0, true);
  };

  useEffect(() => {
    setPage(0);
    fetchConfessions(0, true);
  }, [sortBy]);

  useEffect(() => {
    fetchConfessions(0);
    
    const savedLikes = localStorage.getItem('likedConfessions');
    if (savedLikes) {
      setLikedConfessions(new Set(JSON.parse(savedLikes)));
    }
    
    const channel = supabase
      .channel('confessions_channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'confessions' },
        (payload) => {
          const newConfession = payload.new as Confession;
          setConfessions(prev => {
            if (!prev.some(c => c.id === newConfession.id)) {
              return [newConfession, ...prev];
            }
            return prev;
          });
          
          toast.success('New confession shared!', {
            icon: '🎉',
            duration: 3000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedConfession(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  if (loading && page === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <MessageCircle className="w-6 h-6 mr-2" />
            Recent Confessions
          </h2>
          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            >
              <option value="recent">Most Recent</option>
              <option value="likes">Most Liked</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-purple-100 rounded-full transition-colors"
            >
              <RefreshCcw className={`w-5 h-5 text-purple-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {confessions.map((confession, index) => (
              <motion.div
                key={confession.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 100 
                }}
                onClick={() => setSelectedConfession(confession)}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 cursor-pointer"
              >
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">{confession.title}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap line-clamp-4 flex-grow">{confession.content}</p>
                  
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(confession.id);
                        }}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
                          likedConfessions.has(confession.id)
                            ? 'bg-pink-100 text-pink-600'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${
                          likedConfessions.has(confession.id) ? 'fill-current' : ''
                        }`} />
                        <span>{confession.likes}</span>
                      </button>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDate(confession.created_at)}
                      </span>
                    </div>
                    <span className="text-purple-600 font-medium">Anonymous</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedConfession && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedConfession(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 20 }}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 flex flex-col h-full max-h-[90vh]">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 pr-8">{selectedConfession.title}</h2>
                    <button
                      onClick={() => setSelectedConfession(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto custom-scrollbar">
                    <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                      {selectedConfession.content}
                    </p>
                    
                    <CommentSection confessionId={selectedConfession.id} />
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleToggleLike(selectedConfession.id)}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
                          likedConfessions.has(selectedConfession.id)
                            ? 'bg-pink-100 text-pink-600'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${
                          likedConfessions.has(selectedConfession.id) ? 'fill-current' : ''
                        }`} />
                        <span>{selectedConfession.likes}</span>
                      </button>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDate(selectedConfession.created_at)}
                      </span>
                    </div>
                    <span className="text-purple-600 font-medium">Anonymous</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More</span>
              )}
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};