'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { Header } from '@/components/header';
import { NeoButton, NeoInput } from '@/components/ui';
import { PipMascot } from '@/components/pip-mascot';

export default function HelpPage() {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#FFE4D6] relative">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white border-3 border-[#181016] flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        {/* Mascot */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-[#181016] border-4 border-[#181016] overflow-hidden">
            <PipMascot variant="happy" size="sm" animate={false} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[#181016] mb-2">
            How can Pip help you today?
          </h1>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] p-8 text-center"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="font-display text-2xl font-bold text-[#181016] mb-2">
              Message Sent!
            </h2>
            <p className="text-[#181016]/70 mb-6">
              Pip will get back to you within 5 minutes!
            </p>
            <NeoButton
              variant="primary"
              size="lg"
              onClick={() => {
                setSubmitted(false);
                setQuestion('');
              }}
            >
              Ask Another Question
            </NeoButton>
          </motion.div>
        ) : (
          <>
            {/* Question Input */}
            <motion.div
              className="w-full max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] p-4">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  className="w-full h-48 p-4 text-xl font-medium resize-none focus:outline-none placeholder:text-[#181016]/30"
                />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              className="mt-8 w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <NeoButton
                variant="cyan"
                size="xl"
                icon={<Send className="w-6 h-6" />}
                iconPosition="right"
                onClick={handleSubmit}
                disabled={!question.trim() || isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send to Pip'}
              </NeoButton>

              <p className="text-center mt-4 text-[#181016]/60 font-medium">
                Pip usually replies within 5 minutes!
              </p>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}

