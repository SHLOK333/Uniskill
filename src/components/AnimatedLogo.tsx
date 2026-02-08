'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Player = dynamic(
  () => import('@lottiefiles/react-lottie-player').then((mod) => mod.Player),
  { ssr: false }
);

// Verified working Lottie animations
const LOGO_ANIMATIONS = {
  gear: 'https://assets2.lottiefiles.com/packages/lf20_cwA7Cn.json',
  tech: 'https://assets9.lottiefiles.com/packages/lf20_w51pcehl.json',
  circuit: 'https://assets6.lottiefiles.com/packages/lf20_myejiggj.json',
  pulse: 'https://assets3.lottiefiles.com/packages/lf20_UJNc2t.json',
};

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'minimal' | 'full';
  className?: string;
  animated?: boolean;
}

export function AnimatedLogo({ 
  size = 'md', 
  showText = true, 
  variant = 'default',
  className = '',
  animated = true,
}: AnimatedLogoProps) {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizes = {
    sm: { icon: 32, text: 'text-lg', gap: 'gap-2' },
    md: { icon: 40, text: 'text-2xl', gap: 'gap-3' },
    lg: { icon: 56, text: 'text-3xl', gap: 'gap-4' },
    xl: { icon: 80, text: 'text-5xl', gap: 'gap-5' },
  };

  const { icon: iconSize, text: textSize, gap } = sizes[size];

  return (
    <div 
      className={`flex items-center ${gap} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Icon */}
      <div 
        className={`relative transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}
        style={{ width: iconSize, height: iconSize }}
      >
        {/* Glow effect */}
        <div 
          className={`absolute inset-0 rounded-xl blur-xl transition-opacity duration-500 ${
            isHovered ? 'opacity-60' : 'opacity-30'
          }`}
          style={{
            background: 'linear-gradient(135deg, #14F195 0%, #9945FF 100%)',
          }}
        />
        
        {/* Main icon container */}
        <div 
          className="relative w-full h-full rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #14F195 0%, #00FFA3 50%, #9945FF 100%)',
            padding: '2px',
          }}
        >
          <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center overflow-hidden">
            {mounted && animated ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Animated inner glow */}
                <div 
                  className="absolute inset-0 animate-pulse"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(20, 241, 149, 0.3) 0%, transparent 70%)',
                  }}
                />
                {/* Tool/Wrench emoji with animation */}
                <span 
                  className={`text-${size === 'xl' ? '4xl' : size === 'lg' ? '2xl' : size === 'md' ? 'xl' : 'lg'} 
                    transition-transform duration-300 ${isHovered ? 'rotate-12' : ''}`}
                  style={{ 
                    filter: 'drop-shadow(0 0 8px rgba(20, 241, 149, 0.5))',
                  }}
                >
                  🛠️
                </span>
              </div>
            ) : (
              <span className={`text-${size === 'xl' ? '4xl' : size === 'lg' ? '2xl' : size === 'md' ? 'xl' : 'lg'}`}>
                🛠️
              </span>
            )}
          </div>
        </div>

        {/* Orbiting particles */}
        {animated && mounted && (
          <>
            <div 
              className="absolute w-2 h-2 rounded-full bg-[#14F195] animate-orbit"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: `${iconSize * 0.7}px center`,
                animation: 'orbit 3s linear infinite',
              }}
            />
            <div 
              className="absolute w-1.5 h-1.5 rounded-full bg-[#9945FF] animate-orbit"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: `${iconSize * 0.6}px center`,
                animation: 'orbit 4s linear infinite reverse',
              }}
            />
          </>
        )}
      </div>

      {/* Text */}
      {showText && (
        <div className="relative">
          <span 
            className={`font-bold ${textSize} bg-gradient-to-r from-[#14F195] via-[#00FFA3] to-[#9945FF] bg-clip-text text-transparent
              transition-all duration-300 ${isHovered ? 'tracking-wider' : ''}`}
            style={{
              backgroundSize: '200% 100%',
              animation: animated && mounted ? 'gradientShift 3s ease infinite' : 'none',
            }}
          >
            SolSkill
          </span>
          
          {/* Underline effect on hover */}
          <div 
            className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#14F195] to-[#9945FF] 
              transition-all duration-300 ${isHovered ? 'w-full' : 'w-0'}`}
          />
        </div>
      )}

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(${iconSize * 0.7}px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(${iconSize * 0.7}px) rotate(-360deg); }
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

// Hero version with Lottie background
export function HeroLogo({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Large glowing background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(20, 241, 149, 0.3) 0%, rgba(153, 69, 255, 0.2) 50%, transparent 70%)',
          }}
        />
      </div>

      {/* Lottie animation background */}
      {mounted && (
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Player
            src={LOGO_ANIMATIONS.circuit}
            autoplay
            loop
            style={{ width: 400, height: 400 }}
          />
        </div>
      )}

      {/* Main logo */}
      <div className="relative z-10">
        <AnimatedLogo size="xl" />
      </div>
    </div>
  );
}

// Compact nav version
export function NavLogo({ className = '' }: { className?: string }) {
  return <AnimatedLogo size="md" className={className} />;
}

// Loading/splash version
export function SplashLogo({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => {
        setPhase(4);
        onComplete?.();
      }, 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      {/* Background glow */}
      <div 
        className={`absolute w-96 h-96 rounded-full blur-3xl transition-all duration-1000 ${
          phase >= 1 ? 'opacity-50 scale-100' : 'opacity-0 scale-50'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(20, 241, 149, 0.4) 0%, rgba(153, 69, 255, 0.3) 50%, transparent 70%)',
        }}
      />

      {/* Icon */}
      <div 
        className={`relative transition-all duration-700 ${
          phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        <div 
          className="w-32 h-32 rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #14F195 0%, #00FFA3 50%, #9945FF 100%)',
            padding: '3px',
          }}
        >
          <div className="w-full h-full bg-black rounded-[21px] flex items-center justify-center">
            <span className="text-6xl" style={{ filter: 'drop-shadow(0 0 20px rgba(20, 241, 149, 0.5))' }}>
              🛠️
            </span>
          </div>
        </div>
      </div>

      {/* Text */}
      <h1 
        className={`mt-8 text-5xl font-bold transition-all duration-700 ${
          phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <span className="bg-gradient-to-r from-[#14F195] via-[#00FFA3] to-[#9945FF] bg-clip-text text-transparent">
          SolSkill
        </span>
      </h1>

      {/* Tagline */}
      <p 
        className={`mt-4 text-gray-400 transition-all duration-700 ${
          phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        DeFi Skills for AI Agents
      </p>

      {/* Loading bar */}
      <div 
        className={`mt-12 w-48 h-1 bg-gray-800 rounded-full overflow-hidden transition-opacity duration-500 ${
          phase >= 1 && phase < 4 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div 
          className="h-full bg-gradient-to-r from-[#14F195] to-[#9945FF] transition-all duration-1000"
          style={{ width: `${Math.min(phase * 33, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default AnimatedLogo;
