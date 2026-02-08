'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Player = dynamic(
  () => import('@lottiefiles/react-lottie-player').then((mod) => mod.Player),
  { ssr: false }
);

// Features to display in the speech bubble
const FEATURES = [
  { text: "Swap any token instantly", icon: "🔄", color: "#14F195" },
  { text: "Earn yield on Kamino", icon: "📈", color: "#9945FF" },
  { text: "Add liquidity to pools", icon: "💧", color: "#00FFA3" },
  { text: "Check wallet balance", icon: "👛", color: "#14F195" },
  { text: "Borrow & lend assets", icon: "🏦", color: "#9945FF" },
  { text: "Track all positions", icon: "📊", color: "#00FFA3" },
  { text: "Best routes via Jupiter", icon: "⚡", color: "#14F195" },
  { text: "Self-custodial wallets", icon: "🔐", color: "#9945FF" },
];

// Bubble positions around the robot
const BUBBLE_POSITIONS = [
  { top: '5%', left: '60%', tailPosition: 'bottom-left' },
  { top: '20%', left: '70%', tailPosition: 'bottom-left' },
  { top: '40%', left: '75%', tailPosition: 'left' },
  { top: '60%', left: '70%', tailPosition: 'top-left' },
  { top: '15%', left: '-10%', tailPosition: 'bottom-right' },
  { top: '35%', left: '-15%', tailPosition: 'right' },
  { top: '55%', left: '-10%', tailPosition: 'top-right' },
  { top: '75%', left: '50%', tailPosition: 'top' },
];

interface HeroRobotInteractiveProps {
  size?: number;
  className?: string;
}

export function HeroRobotInteractive({ 
  size = 400, 
  className = '' 
}: HeroRobotInteractiveProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      // Start fade out
      setIsAnimating(true);
      setIsVisible(false);
      
      // Change content and position after fade out
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % FEATURES.length);
        setIsVisible(true);
        
        // End animation state
        setTimeout(() => {
          setIsAnimating(false);
        }, 300);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [mounted]);

  const currentFeature = FEATURES[currentIndex];
  const currentPosition = BUBBLE_POSITIONS[currentIndex % BUBBLE_POSITIONS.length];

  if (!mounted) {
    return (
      <div 
        className={`animate-pulse bg-gray-800/30 rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Glow effect behind robot */}
      <div 
        className="absolute inset-0 rounded-full blur-3xl animate-pulse"
        style={{
          background: `radial-gradient(circle, ${currentFeature.color}30 0%, transparent 70%)`,
          transition: 'background 0.5s ease',
        }}
      />

      {/* Robot Animation */}
      <div className="relative z-10">
        <Player
          src="https://assets9.lottiefiles.com/packages/lf20_3vbOcw.json"
          autoplay
          loop
          style={{ width: size, height: size }}
        />
      </div>

      {/* Speech Bubble */}
      <div
        className={`absolute z-20 transition-all duration-300 ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
        style={{
          top: currentPosition.top,
          left: currentPosition.left,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <SpeechBubble
          text={currentFeature.text}
          icon={currentFeature.icon}
          color={currentFeature.color}
          tailPosition={currentPosition.tailPosition}
        />
      </div>

      {/* Feature indicator dots */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {FEATURES.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsVisible(true);
              }, 200);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-[#14F195] w-6' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Speech Bubble Component
function SpeechBubble({
  text,
  icon,
  color,
  tailPosition,
}: {
  text: string;
  icon: string;
  color: string;
  tailPosition: string;
}) {
  const getTailStyles = () => {
    const base = "absolute w-4 h-4 rotate-45";
    switch (tailPosition) {
      case 'bottom-left':
        return `${base} -bottom-2 left-6`;
      case 'bottom-right':
        return `${base} -bottom-2 right-6`;
      case 'top-left':
        return `${base} -top-2 left-6`;
      case 'top-right':
        return `${base} -top-2 right-6`;
      case 'left':
        return `${base} top-1/2 -left-2 -translate-y-1/2`;
      case 'right':
        return `${base} top-1/2 -right-2 -translate-y-1/2`;
      case 'top':
        return `${base} -top-2 left-1/2 -translate-x-1/2`;
      case 'bottom':
        return `${base} -bottom-2 left-1/2 -translate-x-1/2`;
      default:
        return `${base} -bottom-2 left-6`;
    }
  };

  return (
    <div className="relative">
      {/* Bubble */}
      <div 
        className="relative px-4 py-3 rounded-2xl backdrop-blur-md border whitespace-nowrap"
        style={{
          background: `linear-gradient(135deg, ${color}20 0%, rgba(0,0,0,0.8) 100%)`,
          borderColor: `${color}40`,
          boxShadow: `0 0 20px ${color}20`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="font-medium text-white text-sm">{text}</span>
        </div>
      </div>
      
      {/* Tail */}
      <div 
        className={getTailStyles()}
        style={{
          background: `linear-gradient(135deg, ${color}20 0%, rgba(0,0,0,0.8) 100%)`,
          borderRight: `1px solid ${color}40`,
          borderBottom: `1px solid ${color}40`,
        }}
      />
    </div>
  );
}

export default HeroRobotInteractive;
