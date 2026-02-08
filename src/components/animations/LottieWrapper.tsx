'use client';

import { Player } from '@lottiefiles/react-lottie-player';
import { useRef, useEffect, useState } from 'react';

interface LottieWrapperProps {
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  onComplete?: () => void;
}

export function LottieWrapper({
  src,
  autoplay = true,
  loop = true,
  speed = 1,
  className = '',
  style,
  hover = false,
  onComplete,
}: LottieWrapperProps) {
  const playerRef = useRef<Player>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (hover && playerRef.current) {
      if (isHovered) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  }, [isHovered, hover]);

  return (
    <div
      className={className}
      style={style}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
    >
      <Player
        ref={playerRef}
        src={src}
        autoplay={hover ? false : autoplay}
        loop={loop}
        speed={speed}
        onEvent={(event) => {
          if (event === 'complete' && onComplete) {
            onComplete();
          }
        }}
      />
    </div>
  );
}

// Pre-configured animation components
export function RobotAnimation({ className = '', size = 300 }: { className?: string; size?: number }) {
  return (
    <LottieWrapper
      src="https://lottie.host/4db68bbd-31f6-4cd8-84eb-189571f1d2cf/S5mXsKxTdQ.json"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export function CryptoAnimation({ className = '', size = 200 }: { className?: string; size?: number }) {
  return (
    <LottieWrapper
      src="https://lottie.host/embedded/c2f5f4a5-7e0e-4c65-a4fb-6ba7d6ff6e60.json"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export function LoadingAnimation({ className = '', size = 100 }: { className?: string; size?: number }) {
  return (
    <LottieWrapper
      src="https://lottie.host/c41d33f5-3bb5-4e05-8c6b-bf9c46a6fa6a/8q0wlCdRFX.json"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export function SuccessAnimation({ 
  className = '', 
  size = 150,
  onComplete 
}: { 
  className?: string; 
  size?: number;
  onComplete?: () => void;
}) {
  return (
    <LottieWrapper
      src="https://lottie.host/d6031036-6549-4c5c-a19e-bc23c2fc7f42/UcpkJpDQxW.json"
      className={className}
      style={{ width: size, height: size }}
      loop={false}
      onComplete={onComplete}
    />
  );
}

export function WalletAnimation({ className = '', size = 200, hover = false }: { className?: string; size?: number; hover?: boolean }) {
  return (
    <LottieWrapper
      src="https://lottie.host/1f89c30e-5d47-4e3b-a77d-6d9e27e2a48e/Qq5jB5Qm8U.json"
      className={className}
      style={{ width: size, height: size }}
      hover={hover}
    />
  );
}

export function SwapAnimation({ className = '', size = 200 }: { className?: string; size?: number }) {
  return (
    <LottieWrapper
      src="https://lottie.host/c9c80d8f-0a3c-4e1d-af95-e9e7be84ce81/Yx6h1vz6Ut.json"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export function ChartAnimation({ className = '', size = 200 }: { className?: string; size?: number }) {
  return (
    <LottieWrapper
      src="https://lottie.host/dd7eeb9c-9a88-4e3d-b3e3-1b9ae9c7c5f5/PGKcMQgM5l.json"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export function SecurityAnimation({ className = '', size = 200 }: { className?: string; size?: number }) {
  return (
    <LottieWrapper
      src="https://lottie.host/7f9e2c4b-1c8d-4d3e-9f5a-2e8c6d4b3a1f/Pq7Kx9Rm8N.json"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
