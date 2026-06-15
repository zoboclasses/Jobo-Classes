'use client';
import { motion } from 'framer-motion';

// Fade-up reveal on scroll for any block.
export function Reveal({ children, delay = 0, y = 28, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

// Word-by-word text reveal on scroll.
export function TextReveal({ text, className }) {
  const words = text.split(' ');
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ staggerChildren: 0.06 }}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-2 align-top">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: '110%' },
              visible: { y: 0, transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] } }
            }}
          >
            {word}&nbsp;
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
