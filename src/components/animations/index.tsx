'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, Suspense } from 'react';

// Dynamically import Player to avoid SSR issues
const Player = dynamic(
  () => import('@lottiefiles/react-lottie-player').then((mod) => mod.Player),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-800/50 rounded-xl" />
  }
);

// Animation URLs from LottieFiles (all verified working)
const ANIMATIONS = {
  // AI/Robot animations
  robot: 'https://assets5.lottiefiles.com/packages/lf20_M9p23l.json',
  aiBot: 'https://assets9.lottiefiles.com/packages/lf20_3vbOcw.json',
  
  // Crypto/Finance
  bitcoin: 'https://assets4.lottiefiles.com/packages/lf20_kf1kxo5p.json',
  wallet: 'https://assets10.lottiefiles.com/packages/lf20_06a6pf9i.json',
  trading: 'https://assets10.lottiefiles.com/packages/lf20_2cwDXD.json',
  
  // Security
  security: 'https://assets2.lottiefiles.com/packages/lf20_yzoqyyqf.json',
  shield: 'https://assets8.lottiefiles.com/packages/lf20_k86wxpgr.json',
  
  // Actions
  swap: 'https://assets6.lottiefiles.com/packages/lf20_transferwithoutnumbers.json',
  success: 'https://assets6.lottiefiles.com/packages/lf20_s2lryxtd.json',
  loading: 'https://assets4.lottiefiles.com/packages/lf20_usmfx6bp.json',
  
  // Speed/Performance
  rocket: 'https://assets2.lottiefiles.com/packages/lf20_l3qxn9jy.json',
  speed: 'https://assets7.lottiefiles.com/packages/lf20_p8bfn5to.json',
  
  // Misc
  confetti: 'https://assets4.lottiefiles.com/packages/lf20_u4yrau.json',
  notification: 'https://assets3.lottiefiles.com/packages/lf20_hbexatlr.json',
};

interface AnimationProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  onComplete?: () => void;
}

function BaseAnimation({
  src,
  size = 200,
  loop = true,
  autoplay = true,
  speed = 1,
  className = '',
  style,
  onComplete,
}: AnimationProps & { src: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        className={`animate-pulse bg-gray-800/50 rounded-xl ${className}`}
        style={{ width: size, height: size, ...style }}
      />
    );
  }

  return (
    <div
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-50'} ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <Suspense fallback={<div className="animate-pulse bg-gray-800/50 rounded-xl w-full h-full" />}>
        <Player
          src={src}
          autoplay={autoplay}
          loop={loop}
          speed={speed}
          style={{ width: '100%', height: '100%' }}
          onEvent={(event: string) => {
            if (event === 'load') setIsLoaded(true);
            if (event === 'complete' && onComplete) onComplete();
          }}
        />
      </Suspense>
    </div>
  );
}

// Pre-configured animation components
export function HeroRobot(props: AnimationProps) {
  return <BaseAnimation src={ANIMATIONS.aiBot} size={400} {...props} />;
}

export function CryptoWallet(props: AnimationProps) {
  return <BaseAnimation src={ANIMATIONS.wallet} {...props} />;
}

export function TradingChart(props: AnimationProps) {
  return <BaseAnimation src={ANIMATIONS.trading} {...props} />;
}

export function SecurityShield(props: AnimationProps) {
  return <BaseAnimation src={ANIMATIONS.shield} {...props} />;
}

export function RocketSpeed(props: AnimationProps) {
  return <BaseAnimation src={ANIMATIONS.rocket} {...props} />;
}

export function SwapArrows(props: AnimationProps) {
  return <BaseAnimation src={ANIMATIONS.swap} {...props} />;
}

export function SuccessCheck(props: AnimationProps) {
  return <BaseAnimation src={ANIMATIONS.success} loop={false} {...props} />;
}

export function LoadingDots(props: AnimationProps) {
  return <BaseAnimation src={ANIMATIONS.loading} size={80} {...props} />;
}

export function Confetti(props: AnimationProps) {
  return <BaseAnimation src={ANIMATIONS.confetti} loop={false} {...props} />;
}

export function BitcoinSpin(props: AnimationProps) {
  return <BaseAnimation src={ANIMATIONS.bitcoin} {...props} />;
}

// Animated Gradient Background
export function AnimatedGradient({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#14F195]/20 via-transparent to-[#9945FF]/20 animate-pulse pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#14F195]/10 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Floating animation wrapper
export function FloatingWrapper({ 
  children, 
  delay = 0,
  duration = 3,
  className = '' 
}: { 
  children: React.ReactNode; 
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <div 
      className={className}
      style={{
        animation: `float ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {children}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

// Glow effect wrapper
export function GlowWrapper({
  children,
  color = '#14F195',
  className = '',
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div 
        className="absolute inset-0 blur-3xl opacity-30 animate-pulse"
        style={{ backgroundColor: color }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export { ANIMATIONS };
