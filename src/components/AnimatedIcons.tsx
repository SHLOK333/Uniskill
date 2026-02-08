'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, Suspense } from 'react';

const Player = dynamic(
  () => import('@lottiefiles/react-lottie-player').then((mod) => mod.Player),
  { ssr: false }
);

// Verified Lottie animation URLs
const ICON_ANIMATIONS = {
  // Tools & Tech
  tool: 'https://assets3.lottiefiles.com/packages/lf20_ydo1amjm.json', // using lock animation as fallback
  gear: 'https://assets2.lottiefiles.com/packages/lf20_cwA7Cn.json',
  
  // Security
  lock: 'https://assets3.lottiefiles.com/packages/lf20_ydo1amjm.json',
  shield: 'https://assets8.lottiefiles.com/packages/lf20_xlmz9xwm.json',
  security: 'https://assets2.lottiefiles.com/packages/lf20_yzoqyyqf.json',
  
  // Robot/AI
  robot: 'https://assets9.lottiefiles.com/packages/lf20_3vbOcw.json',
  ai: 'https://assets5.lottiefiles.com/packages/lf20_fcfjwiyb.json',
  
  // Speed/Power
  lightning: 'https://assets6.lottiefiles.com/packages/lf20_ohvtwiro.json',
  rocket: 'https://assets2.lottiefiles.com/packages/lf20_l3qxn9jy.json',
  speed: 'https://assets7.lottiefiles.com/packages/lf20_p8bfn5to.json',
  
  // Finance
  swap: 'https://assets3.lottiefiles.com/packages/lf20_xvrofzfk.json',
  exchange: 'https://assets3.lottiefiles.com/packages/lf20_xvrofzfk.json', // using swap animation
  bank: 'https://assets10.lottiefiles.com/packages/lf20_06a6pf9i.json',
  vault: 'https://assets9.lottiefiles.com/packages/lf20_rmfmjy5d.json',
  chart: 'https://assets10.lottiefiles.com/packages/lf20_2cwDXD.json',
  wallet: 'https://assets10.lottiefiles.com/packages/lf20_06a6pf9i.json',
  money: 'https://assets4.lottiefiles.com/packages/lf20_kf1kxo5p.json',
  
  // Actions
  water: 'https://assets3.lottiefiles.com/packages/lf20_bq485nmk.json',
  target: 'https://cdn.lordicon.com/kkvxgpti.json', // crosshair/target icon
  bell: 'https://cdn.lordicon.com/psnhyobz.json', // bell notification icon
  notification: 'https://cdn.lordicon.com/psnhyobz.json',
  
  // Documents
  document: 'https://assets3.lottiefiles.com/packages/lf20_jcikwtux.json',
  file: 'https://assets9.lottiefiles.com/packages/lf20_uxfwzw7i.json',
  
  // Status
  success: 'https://assets6.lottiefiles.com/packages/lf20_s2lryxtd.json',
  check: 'https://assets6.lottiefiles.com/packages/lf20_s2lryxtd.json',
  loading: 'https://assets4.lottiefiles.com/packages/lf20_usmfx6bp.json',
  
  // Social
  twitter: 'https://assets2.lottiefiles.com/packages/lf20_xwmj0hsk.json',
  github: 'https://assets5.lottiefiles.com/packages/lf20_6HFXXE.json',
  
  // Misc
  star: 'https://assets4.lottiefiles.com/packages/lf20_u4yrau.json',
  wave: 'https://assets9.lottiefiles.com/packages/lf20_xyadoh9h.json',
  confetti: 'https://assets4.lottiefiles.com/packages/lf20_u4yrau.json',
  
  // Portfolio
  portfolio: 'https://assets10.lottiefiles.com/packages/lf20_2cwDXD.json',
};

type IconName = keyof typeof ICON_ANIMATIONS;

interface AnimatedIconProps {
  name: IconName;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  className?: string;
  hover?: boolean;
}

export function AnimatedIcon({
  name,
  size = 32,
  loop = true,
  autoplay = true,
  speed = 1,
  className = '',
  hover = false,
}: AnimatedIconProps) {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src = ICON_ANIMATIONS[name];

  if (!mounted) {
    return (
      <div
        className={`animate-pulse bg-gray-700/30 rounded ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center transition-transform duration-200 ${
        isHovered ? 'scale-110' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
    >
      <Suspense
        fallback={
          <div
            className="animate-pulse bg-gray-700/30 rounded"
            style={{ width: size, height: size }}
          />
        }
      >
        <Player
          src={src}
          autoplay={hover ? isHovered : autoplay}
          loop={loop}
          speed={speed}
          style={{ 
            width: size, 
            height: size,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          onEvent={(event: string) => {
            if (event === 'load') setIsLoaded(true);
          }}
        />
      </Suspense>
    </div>
  );
}

// Pre-configured icon components for common use cases
export function ToolIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="tool" {...props} />;
}

export function LockIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="lock" {...props} />;
}

export function ShieldIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="shield" {...props} />;
}

export function RobotIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="robot" {...props} />;
}

export function LightningIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="lightning" {...props} />;
}

export function RocketIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="rocket" {...props} />;
}

export function SwapIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="swap" {...props} />;
}

export function BankIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="bank" {...props} />;
}

export function ChartIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="chart" {...props} />;
}

export function WalletIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="wallet" {...props} />;
}

export function WaterIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="water" {...props} />;
}

export function TargetIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="target" {...props} />;
}

export function BellIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="bell" {...props} />;
}

export function DocumentIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="document" {...props} />;
}

export function SuccessIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="success" loop={false} {...props} />;
}

export function LoadingIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="loading" {...props} />;
}

export function WaveIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="wave" {...props} />;
}

export function PortfolioIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="portfolio" {...props} />;
}

export function VaultIcon(props: Omit<AnimatedIconProps, 'name'>) {
  return <AnimatedIcon name="vault" {...props} />;
}

export { ICON_ANIMATIONS };
export type { IconName };
