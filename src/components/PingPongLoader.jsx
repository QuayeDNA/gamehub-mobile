import { motion } from 'framer-motion';

/**
 * PingPongLoader
 * ─────────────────────────────────────────────────────────────────────────
 * A 3-second looping Pong animation used as the between-page loading screen.
 *
 * Layout (SVG viewBox 320 × 108):
 *
 *   LX=18                               RX=302
 *    │     LY=33 →→→→→→→→→→→→→→→→→→→→  │
 *    │     ←←←←←←←←←←←←←←←←← RY=75   │
 *   [left paddle]                  [right paddle]
 *              [neon-cyan ball + 2-circle trail]
 *
 * Ball travels in a straight diagonal line (linear ease).
 * Each paddle eases to its intercept y just as the ball arrives, then
 * drifts back to the vertical centre while the ball is at the other end.
 * Two trailing ghost circles with short delays simulate motion blur.
 */

// ── Arena geometry ────────────────────────────────────────────────────────
const W = 320;          // SVG viewBox width
const H = 108;          // SVG viewBox height

const BALL_R  = 5.5;    // ball radius
const PAD_W   = 7;      // paddle width
const PAD_H   = 38;     // paddle height
const PAD_RX  = 3.5;    // paddle corner radius

const LX = 18;          // left paddle center x
const RX = W - 18;      // right paddle center x  (302)

// Ball y at each end — a diagonal makes the rally feel alive
const LY = 33;          // ball y at left paddle   (upper area)
const RY = 75;          // ball y at right paddle  (lower area)

// ── Paddle y positions ─────────────────────────────────────────────────────
// y here is the TOP-LEFT corner of each paddle rect
const toTop = (cy) => cy - PAD_H / 2;

const L_HIT  = toTop(LY);         // 14   left paddle intercepts ball here
const L_REST = toTop(H / 2);      // 35   left paddle rests here mid-rally
const R_REST = toTop(H / 2);      // 35   right paddle rests here at start
const R_HIT  = toTop(RY);         // 56   right paddle intercepts ball here

// ── Animation ─────────────────────────────────────────────────────────────
const DUR = 3;   // full left-right-left loop in seconds

const ballTransition = {
  duration: DUR,
  repeat: Infinity,
  ease: 'linear',
};

// Ghost trail: two circles that follow the ball with a short delay.
// The delay shifts them behind the ball, creating a motion-blur effect.
const TRAIL = [
  { delay: 0.09, r: 4.2,  fill: '#00f5ff40' },
  { delay: 0.18, r: 3.0,  fill: '#00f5ff1a' },
];

// ── Glow styles ────────────────────────────────────────────────────────────
const BALL_GLOW = {
  filter: 'drop-shadow(0 0 5px #00f5ff) drop-shadow(0 0 14px rgba(0,245,255,0.55))',
};
const PAD_GLOW = {
  filter: 'drop-shadow(0 0 3px #bf00ff) drop-shadow(0 0 9px rgba(191,0,255,0.5))',
};

// ─────────────────────────────────────────────────────────────────────────

export default function PingPongLoader() {
  return (
    <div
      className="min-h-screen bg-dark-900 flex flex-col items-center justify-center gap-7 px-4"
      role="status"
      aria-label="Loading"
    >

      {/* Score display — static 0 : 0, branded with app colours */}
      <div className="flex items-center gap-5 select-none" aria-hidden="true">
        <span className="font-display text-3xl font-black text-neon-purple"
              style={{ textShadow: '0 0 12px rgba(191,0,255,0.6)' }}>
          0
        </span>
        <span className="font-display text-[10px] text-dark-400 tracking-[0.3em]">VS</span>
        <span className="font-display text-3xl font-black text-neon-cyan"
              style={{ textShadow: '0 0 12px rgba(0,245,255,0.6)' }}>
          0
        </span>
      </div>

      {/* ── Pong arena ───────────────────────────────────────────────────── */}
      <div className="w-full" style={{ maxWidth: `${W}px` }} aria-hidden="true">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ── Court ──────────────────────────────────────────────────── */}

          {/* Background */}
          <rect
            x="0.5" y="0.5"
            width={W - 1} height={H - 1}
            rx="8"
            fill="rgba(10,10,15,0.72)"
            stroke="rgba(0,245,255,0.14)"
            strokeWidth="1"
          />

          {/* Top wall line */}
          <line
            x1={LX + 14} y1={5}
            x2={RX - 14} y2={5}
            stroke="rgba(0,245,255,0.07)" strokeWidth="1"
          />
          {/* Bottom wall line */}
          <line
            x1={LX + 14} y1={H - 5}
            x2={RX - 14} y2={H - 5}
            stroke="rgba(0,245,255,0.07)" strokeWidth="1"
          />

          {/* Centre dashed net */}
          <line
            x1={W / 2} y1={8}
            x2={W / 2} y2={H - 8}
            stroke="rgba(0,245,255,0.09)"
            strokeWidth="2"
            strokeDasharray="5 4"
          />

          {/* Centre dot */}
          <circle
            cx={W / 2} cy={H / 2} r={2.5}
            fill="rgba(0,245,255,0.1)"
          />

          {/* ── Left paddle ──────────────────────────────────────────────
              Starts at intercept (L_HIT), drifts to rest while ball is
              on the right, then returns to intercept for the comeback.   */}
          <motion.g
            initial={{ y: L_HIT }}
            animate={{ y: [L_HIT, L_REST, L_HIT] }}
            transition={{
              duration: DUR,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.40, 1],
            }}
          >
            <rect
              x={LX - PAD_W / 2}
              y={0}
              width={PAD_W}
              height={PAD_H}
              rx={PAD_RX}
              fill="#bf00ff"
              style={PAD_GLOW}
            />
          </motion.g>

          {/* ── Right paddle ─────────────────────────────────────────────
              Starts at rest, moves to intercept when ball arrives at t=0.5,
              then drifts back to rest for the second half of the rally.   */}
          <motion.g
            initial={{ y: R_REST }}
            animate={{ y: [R_REST, R_HIT, R_REST] }}
            transition={{
              duration: DUR,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.50, 1],
            }}
          >
            <rect
              x={RX - PAD_W / 2}
              y={0}
              width={PAD_W}
              height={PAD_H}
              rx={PAD_RX}
              fill="#bf00ff"
              style={PAD_GLOW}
            />
          </motion.g>

          {/* ── Trail ghost balls ─────────────────────────────────────────
              Same path as the main ball, delayed slightly so they appear
              to lag behind — simulating a motion-blur trail.              */}
          {TRAIL.map(({ delay, r, fill }) => (
            <motion.circle
              key={delay}
              cx={LX}
              cy={LY}
              r={r}
              fill={fill}
              animate={{
                cx: [LX, RX, LX],
                cy: [LY, RY, LY],
              }}
              transition={{ ...ballTransition, delay }}
            />
          ))}

          {/* ── Ball ─────────────────────────────────────────────────────
              Travels the diagonal path at constant speed (linear ease).  */}
          <motion.circle
            cx={LX}
            cy={LY}
            r={BALL_R}
            fill="#00f5ff"
            style={BALL_GLOW}
            animate={{
              cx: [LX, RX, LX],
              cy: [LY, RY, LY],
            }}
            transition={ballTransition}
          />
        </svg>
      </div>

      {/* ── Loading label ────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2.5" aria-hidden="true">
        <span className="font-display text-[11px] font-bold text-neon-cyan/50 tracking-[0.45em]">
          LOADING
        </span>

        {/* Three pulsing dots, staggered */}
        <div className="flex items-center gap-1.5">
          {[0, 0.22, 0.44].map((delay, i) => (
            <motion.div
              key={i}
              className="rounded-full bg-neon-cyan/35"
              style={{ width: 5, height: 5 }}
              animate={{
                opacity: [0.25, 1, 0.25],
                scale:   [0.7, 1.3, 0.7],
              }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
