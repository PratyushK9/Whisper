import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, AlertTriangle, Check } from 'lucide-react';

type WelcomePopupProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const WelcomePopup = ({ isOpen, onClose }: WelcomePopupProps) => {
  const guidelines = [
    "Never share real names, usernames, or any identifying information",
    "Do not include phone numbers, email addresses, or social media handles",
    "Avoid mentioning specific locations or institutions that could identify someone",
    "Keep personal details vague to protect privacy",
    "Be respectful and mindful of others' feelings",
    "Do not share any confidential or sensitive information",
    "Avoid sharing information that could harm someone's reputation"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative w-[90%] max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-800">Welcome to Whisper</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center text-amber-600 mb-4">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <h3 className="font-semibold">Important Guidelines</h3>
                </div>
                <ul className="space-y-3">
                  {guidelines.map((guideline, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start"
                    >
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{guideline}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-purple-700 text-sm">
                  By using this platform, you agree to follow these guidelines and help maintain
                  a safe and respectful environment for everyone.
                </p>
              </div>

              <button
                onClick={onClose}
                className="mt-6 w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                I Understand, Let's Begin
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};