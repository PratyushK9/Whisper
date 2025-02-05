import React, { useState, useEffect } from 'react';
import { Heart, Shield, Eye } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { ConfessionBox } from './components/ConfessionBox';
import { ConfessionsList } from './components/ConfessionsList';
import { WelcomePopup } from './components/WelcomePopup';
import { Footer } from './components/Footer';
import { motion } from 'framer-motion';
import { supabase } from './lib/supabase';

function App() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Show welcome popup after a short delay
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col">
      <Toaster position="top-center" />
      <WelcomePopup isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      
      <div className="container mx-auto px-4 py-12 flex-grow">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Whisper Your Truth
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share your thoughts, secrets, and stories completely anonymously. 
            Your voice matters, your identity doesn't.
          </p>
        </motion.div>

        

        <div className="max-w-4xl mx-auto grid gap-12">
          <ConfessionBox />
          <ConfessionsList />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;