'use client';

import { motion } from 'framer-motion';

type Props = {
  x: number;
  y: number;
  displayName: string;
  theme: string;
};

const cursorVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
};

export function OtherUserCursor({ x, y, displayName, theme }: Props) {
  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0 z-50"
      style={{
        translateX: `${x}px`,
        translateY: `${y}px`,
      }}
      initial="hidden"
      animate="visible"
      variants={cursorVariants}
    >
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2))` }}
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19209e-07L23.5 12.3673H5.65376Z"
          fill="white"
          stroke={theme}
          strokeWidth="2"
        />
      </svg>
      <div
        className="absolute left-4 top-4 whitespace-nowrap rounded-full px-3 py-1 text-sm text-white"
        style={{ backgroundColor: theme }}
      >
        {displayName}
      </div>
    </motion.div>
  );
}
