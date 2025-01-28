import React, { useState, useCallback } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useErrorBoundary } from '../hooks/useErrorBoundary';
import confetti from 'canvas-confetti';

const topics = [
  "First Love Stories 💕",
  "College Life Secrets 🎓",
  "Family Drama 👨‍👩‍👧‍👦",
  "Friendship Tales 👥",
  "Career Struggles 💼",
  "Personal Growth 🌱",
  "Mental Health 🧠",
  "Social Media Reality 📱",
  "Life Goals & Dreams ⭐",
  "Relationship Advice ❤️"
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
              placeholder="Type your confession here... It's completely anonymous!"
              maxLength={1000}
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={isSubmitting || !confession.trim() || !title.trim()}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5 mr-2" />
              Share Anonymously
            </button>

            <div className="flex items-center text-sm text-gray-500">
              <Sparkles className="w-4 h-4 mr-1" />
              {confession.length}/1000
            </div>
          </div>
        </form>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            Need inspiration? Try these topics:
          </h3>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <motion.button
                key={topic}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition-all"
                onClick={() => setConfession(prev => `${prev ? prev + '\n\n' : ''}Topic: ${topic}\n`)}
              >
                {topic}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
};