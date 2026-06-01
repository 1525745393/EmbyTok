import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface HeartData {
  id: number;
  x: number;
  y: number;
  rotate: number;
}

interface HeartAnimationProps {
  hearts: HeartData[];
}

const HeartAnimation: React.FC<HeartAnimationProps> = React.memo(({ hearts }) => {
  return (
    <AnimatePresence>
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.2, 1],
            opacity: [0, 1, 1],
            y: -100,
          }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left: heart.x - 40,
            top: heart.y - 40,
            zIndex: 100,
            rotate: heart.rotate,
          }}
        >
          <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-lg" />
        </motion.div>
      ))}
    </AnimatePresence>
  );
});

HeartAnimation.displayName = 'HeartAnimation';

export default HeartAnimation;
