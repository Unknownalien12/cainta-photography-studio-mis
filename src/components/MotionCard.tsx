import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

interface Interactive3DTiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Interactive3DTiltCard: React.FC<Interactive3DTiltCardProps> = ({
  children,
  className = '',
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -10;
    const rY = ((x - centerX) / centerX) * 10;

    setRotateX(rX);
    setRotateY(rY);
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileTap={{ scale: 0.98 }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000
      }}
      className={`relative overflow-hidden cursor-pointer transition-shadow hover:shadow-2xl rounded-2xl ${className}`}
    >
      {/* Specular glare highlight layer */}
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 rounded-2xl"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8), transparent 70%)`
        }}
      />
      {children}
    </motion.div>
  );
};

interface MagnetButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
  type?: 'button' | 'submit';
}

export const MagnetButton: React.FC<MagnetButtonProps> = ({
  children,
  className = '',
  onClick,
  id,
  type = 'button'
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * 0.25;
    const y = (e.clientY - (rect.top + rect.height / 2)) * 0.25;
    setOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <motion.button
      id={id}
      type={type}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 15 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className={`relative font-medium transition-colors ${className}`}
    >
      {children}
    </motion.button>
  );
};

export const ScrollReveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children,
  className = '',
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScrollProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-1 bg-amber-600 origin-left z-50 pointer-events-none"
    />
  );
};
