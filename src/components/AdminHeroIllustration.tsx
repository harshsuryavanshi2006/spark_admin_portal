import { motion } from 'motion/react';

export function AdminHeroIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-56 sm:w-64 h-40 shrink-0 select-none"
      aria-hidden="true"
    >
      <svg viewBox="0 0 280 180" fill="none" className="w-full h-full">
        {/* Soft lavender organic backdrop blob */}
        <path
          d="M28 112C14 78 44 42 94 46C128 49 144 22 184 20C228 18 264 52 260 96C256 142 214 166 154 164C96 162 42 146 28 112Z"
          fill="#E5DFFF"
        />

        {/* Animated spark rays */}
        <motion.g
          animate={{ opacity: [0.75, 1, 0.75], scale: [0.97, 1.03, 0.97] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '60px 55px' }}
        >
          <path d="M56 38L44 26" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M46 56L30 52" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
        </motion.g>

        {/* Character shoulders / Yellow hoodie */}
        <path
          d="M116 146C116 118 134 102 162 102C190 102 208 118 208 146V158H116V146Z"
          fill="#FCD34D"
          stroke="#121A36"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Hoodie collar & drawstrings */}
        <path
          d="M142 103C148 114 176 114 182 103"
          stroke="#121A36"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M154 114V128" stroke="#121A36" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M170 114V126" stroke="#121A36" strokeWidth="2.2" strokeLinecap="round" />

        {/* Neck */}
        <rect
          x="154"
          y="87"
          width="16"
          height="18"
          rx="6"
          fill="#FDE0C8"
          stroke="#121A36"
          strokeWidth="2.3"
        />

        {/* Head */}
        <ellipse
          cx="162"
          cy="68"
          rx="22"
          ry="24"
          fill="#FDE0C8"
          stroke="#121A36"
          strokeWidth="2.5"
        />
        {/* Ear */}
        <circle
          cx="140"
          cy="71"
          r="5"
          fill="#FDE0C8"
          stroke="#121A36"
          strokeWidth="2.2"
        />
        {/* Hair */}
        <path
          d="M140 64C138 45 154 35 170 38C185 41 190 54 185 68C183 60 179 54 170 53C160 52 148 56 140 64Z"
          fill="#121A36"
        />
        <path
          d="M148 44C156 32 174 32 182 42"
          stroke="#121A36"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Face features */}
        <circle cx="156" cy="68" r="2" fill="#121A36" />
        <circle cx="171" cy="68" r="2" fill="#121A36" />
        <path d="M152 61C154 59 158 59 160 61" stroke="#121A36" strokeWidth="2" strokeLinecap="round" />
        <path d="M167 61C169 59 173 59 175 61" stroke="#121A36" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M158 78C162 82 168 82 171 78"
          stroke="#121A36"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Laptop */}
        <path
          d="M72 104C72 100 75 97 79 97H141C145 97 148 100 148 104L153 152H77L72 104Z"
          fill="#1B254B"
          stroke="#121A36"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Laptop base */}
        <path
          d="M66 154H204"
          stroke="#121A36"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Golden Spark star on laptop lid */}
        <path
          d="M111 116L113.8 122.4L120.4 125L113.8 127.6L111 134L108.2 127.6L101.6 125L108.2 122.4L111 116Z"
          fill="#FACC15"
        />
        {/* Hand typing */}
        <ellipse
          cx="188"
          cy="148"
          rx="10"
          ry="6"
          fill="#FDE0C8"
          stroke="#121A36"
          strokeWidth="2.2"
        />
      </svg>
    </motion.div>
  );
}

export function MegaphoneIllustration() {
  return (
    <motion.div
      animate={{ rotate: [0, -3, 0, 2, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      className="w-16 h-16 shrink-0 select-none"
      aria-hidden="true"
    >
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        {/* Sound rays */}
        <path d="M58 20L66 13" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
        <path d="M64 31L74 28" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
        <path d="M62 43L71 46" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />

        {/* Handle */}
        <path
          d="M27 45L32 62C33 64 36 64 37 62L35 45"
          fill="#4F46E5"
          stroke="#121A36"
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
        {/* Megaphone cone */}
        <path
          d="M18 35L52 19V51L18 43V35Z"
          fill="#6366F1"
          stroke="#121A36"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <ellipse
          cx="52"
          cy="35"
          rx="5"
          ry="16"
          fill="#FDE047"
          stroke="#121A36"
          strokeWidth="2.4"
        />
        <rect
          x="13"
          y="34"
          width="7"
          height="10"
          rx="3"
          fill="#FDE047"
          stroke="#121A36"
          strokeWidth="2.2"
        />
      </svg>
    </motion.div>
  );
}
