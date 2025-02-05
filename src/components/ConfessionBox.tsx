import React, { useState, useCallback } from 'react';
import { Send, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useErrorBoundary } from '../hooks/useErrorBoundary';
import confetti from 'canvas-confetti';

const topics = [
  "First Love Stories 💕",
  "College Life 🎓",
  "Friendship Tales 👥",
  "Career Journey 💼",
  "Personal Growth 🌱",
  "Life Goals & Dreams ⭐",
  "Random Thoughts 💭",
  "Funny Moments 😄",
  "Travel Stories 🌍",
  "Creative Ideas 💡"
];

const RATE_LIMIT_DURATION = 60000;
const MAX_CONFESSIONS_PER_DURATION = 3;

const triggerCelebration = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

export const ConfessionBox = () => {
  const [title, setTitle] = useState('');
  const [confession, setConfession] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const { ErrorBoundary } = useErrorBoundary();
  const [lastSubmissions, setLastSubmissions] = useState<number[]>([]);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const recentSubmissions = lastSubmissions.filter(
      time => now - time < RATE_LIMIT_DURATION
    );
    
    if (recentSubmissions.length >= MAX_CONFESSIONS_PER_DURATION) {
      return false;
    }
    
    setLastSubmissions([...recentSubmissions, now]);
    return true;
  }, [lastSubmissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confession.trim() || !title.trim()) return;

    if (!checkRateLimit()) {
      toast.error('Please wait a moment before submitting another confession');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('confessions')
        .insert([{ title, content: confession }]);

      if (error) throw error;

      toast.success('Confession shared anonymously!');
      triggerCelebration();
      setTitle('');
      setConfession('');
    } catch (error) {
      toast.error('Failed to share confession. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTopicSelect = (topic: string) => {
    setConfession(prev => `${prev ? prev + '\n\n' : ''}${topic}\n`);
    setShowTopics(false);
  };

  return (
    <ErrorBoundary>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-lg font-medium text-gray-700">
              Title Your Secret
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              placeholder="Give your confession a title..."
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-medium text-gray-700">
              Share Your Secret
            </label>
            <textarea
              value={confession}
              onChange={(e) => setConfession(e.target.value)}
              className="w-full h-40 p-4 text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              placeholder="Type your confession here..."
              maxLength={1000}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTopics(!showTopics)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-between gap-2"
              >
                <span>Topic Ideas</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTopics ? 'rotate-180' : ''}`} />
              </button>
              
              {showTopics && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 max-h-64 overflow-y-auto"
                >
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTopicSelect(topic)}
                      className="w-full px-4 py-2 text-left hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 flex-1">
              <button
                type="submit"
                disabled={isSubmitting || !confession.trim() || !title.trim()}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5 mr-2" />
                Share
              </button>
              
              <div className="text-sm text-gray-500">
                {confession.length}/1000
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </ErrorBoundary>
  );
};