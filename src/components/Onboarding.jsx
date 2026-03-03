import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Search, Heart, Zap, ChevronRight, X } from 'lucide-react';

const ONBOARDING_KEY = 'gamehub_onboarding_done';

const SLIDES = [
  {
    icon: Gamepad2,
    emoji: '🎮',
    title: 'Welcome to GameHub',
    description: 'Thousands of free HTML5 games from multiple sources, playable right in your browser.',
    color: 'text-neon-cyan',
  },
  {
    icon: Search,
    emoji: '🔍',
    title: 'Discover & Search',
    description: 'Browse by category, filter by source, or search across the entire library instantly.',
    color: 'text-neon-purple',
  },
  {
    icon: Heart,
    emoji: '❤️',
    title: 'Save Your Favorites',
    description: 'Heart games to build your collection. Track play time, earn badges, and rate games.',
    color: 'text-neon-pink',
  },
  {
    icon: Zap,
    emoji: '⚡',
    title: 'Play Anywhere',
    description: 'Install as an app, play offline, and pick up right where you left off.',
    color: 'text-neon-green',
  },
];

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShow(true);
    }
  }, []);

  const handleDone = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShow(false);
  };

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      setStep(step + 1);
    } else {
      handleDone();
    }
  };

  if (!show) return null;

  const slide = SLIDES[step];
  const Icon = slide.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-dark-900/98 backdrop-blur-md flex items-center justify-center p-6"
      >
        <button
          onClick={handleDone}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-dark-700/50 text-dim hover:text-white transition-colors"
          aria-label="Skip onboarding"
        >
          <X size={18} />
        </button>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="max-w-sm w-full text-center"
        >
          <div className="mb-8">
            <div className={`w-20 h-20 mx-auto rounded-2xl bg-dark-700/50 border border-dark-500/20 flex items-center justify-center mb-6 ${slide.color}`}>
              <Icon size={36} />
            </div>
            <h2 className="font-display text-2xl font-black text-white mb-3">{slide.title}</h2>
            <p className="text-sm text-dim leading-relaxed">{slide.description}</p>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mb-8">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300
                  ${i === step ? 'w-6 bg-neon-cyan' : 'w-1.5 bg-dark-500'}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="btn-cyber text-sm flex items-center gap-2 mx-auto"
          >
            {step < SLIDES.length - 1 ? (
              <>Next <ChevronRight size={16} /></>
            ) : (
              <>Let's Play! <Gamepad2 size={16} /></>
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
