import type { CSSProperties } from "react";

interface Props {
  active: boolean;
}

const PARTICLES = Array.from({ length: 42 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  delay: `${(index % 9) * 0.08}s`,
  duration: `${2.2 + (index % 5) * 0.25}s`,
  rotation: `${(index * 47) % 360}deg`,
  drift: `${((index % 7) - 3) * 28}px`,
}));

export function ConfettiCelebration({ active }: Readonly<Props>) {
  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-100 overflow-hidden"
    >
      <style jsx>{`
        @keyframes timetolearn-confetti-fall {
          0% { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate3d(var(--drift), 110vh, 0) rotate(var(--rotation)); opacity: 0; }
        }
        .timetolearn-confetti {
          position: absolute;
          top: -18px;
          width: 9px;
          height: 14px;
          border-radius: 2px;
          animation-name: timetolearn-confetti-fall;
          animation-timing-function: cubic-bezier(.2,.7,.3,1);
          animation-fill-mode: both;
        }
        .timetolearn-confetti:nth-child(3n) { border-radius: 50%; width: 10px; height: 10px; }
        .timetolearn-confetti:nth-child(3n + 1) { width: 6px; height: 16px; }
        @media (prefers-reduced-motion: reduce) {
          .timetolearn-confetti { animation-duration: 0.01ms !important; }
        }
      `}</style>
      {PARTICLES.map((particle) => (
        <span
          key={particle.id}
          className="timetolearn-confetti"
          style={{
            left: particle.left,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
            backgroundColor: ["#FACC15", "#111827", "#16A34A", "#38BDF8", "#F97316", "#A78BFA"][particle.id % 6],
            "--drift": particle.drift,
            "--rotation": particle.rotation,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
