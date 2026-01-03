'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Mail } from 'lucide-react';
import { Header } from '@/components/header';
import { NeoButton, NeoInput } from '@/components/ui';
import { PipMascot } from '@/components/pip-mascot';

export default function HelpPage() {
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !question.trim()) return;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/help/create-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          message: question.trim(),
        }),
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned an error. Please check the console for details.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setTicketNumber(data.ticketNumber);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting ticket:', err);
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            {ticketNumber && (
              <p className="text-[#181016]/80 mb-4 font-bold">
                Ticket: {ticketNumber}
              </p>
            )}
            <p className="text-[#181016]/70 mb-6">
              Pip will get back to you within 5 minutes!
            </p>
            <NeoButton
              variant="primary"
              size="lg"
              onClick={() => {
                setSubmitted(false);
                setQuestion('');
                setEmail('');
                setTicketNumber(null);
                setError(null);
              }}
            >
              Ask Another Question
            </NeoButton>
          </motion.div>
        ) : (
          <>
            {/* Email Input */}
            <motion.div
              className="w-full max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <NeoInput
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-6 h-6" />}
                size="lg"
                disabled={isSubmitting}
                required
              />
            </motion.div>

            {/* Question Input */}
            <motion.div
              className="w-full max-w-2xl mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] p-4">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  className="w-full h-48 p-4 text-xl font-medium resize-none focus:outline-none placeholder:text-[#181016]/30"
                  disabled={isSubmitting}
                />
              </div>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl mt-4 bg-red-50 border-4 border-red-500 rounded-2xl p-4"
              >
                <p className="text-red-700 font-bold text-center">{error}</p>
              </motion.div>
            )}

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
                disabled={!email.trim() || !question.trim() || isSubmitting}
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

