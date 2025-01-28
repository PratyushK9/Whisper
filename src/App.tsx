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

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          {[
            {
              icon: Shield,
              title: "100% Anonymous",
              description: "No login required. No data tracked. Your secret stays secret."
            },
            {
              icon: Heart,
              title: "Safe Space",
              description: "Express yourself freely without judgment or consequences."
            },
            {
              icon: Eye,
              title: "Private & Secure",
              description: "Your confessions are encrypted and protected."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="bg-white rounded-xl p-6 text-center shadow-lg"
            >
              <feature.icon className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>

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