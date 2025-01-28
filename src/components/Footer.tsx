import React from 'react';
import { Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-purple-600 text-white py-6 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-lg font-semibold">Whisper</span>
            <Heart className="w-4 h-4 mx-2 text-pink-300" />
            <span>{new Date().getFullYear()}</span>
          </div>
          <div className="text-sm text-purple-200">
            Made with love for anonymous confessions
          </div>
          <div className="text-sm mt-4 md:mt-0">
            All Rights Reserved @ENIGMA VSSUT
          </div>
        </div>
      </div>
    </footer>
  );
};