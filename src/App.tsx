import * as React from 'react';
import { useState, useEffect, useCallback, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence, MotionValue, useSpring, useTransform } from 'framer-motion';
import { ShimmerButton } from './components/ShimmerButton';
import { MagnetizeButton } from './components/MagnetizeButton';
import { ParticleButton } from './components/ParticleButton';
import { Play, Pause, RotateCcw, Trophy, Clock, User as UserIcon, Plus, ChevronRight, X, Pencil, Trash2, LogOut, Dices, Palette, User, RefreshCw } from 'lucide-react';
import { LimelightNav } from './components/LimelightNav';
import { PixelEmoji } from './components/PixelEmoji';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { generateDobbleDeck, shuffleDeck } from './utils/dobbleLogic';
import { 
  db, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  collection,
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  serverTimestamp,
  where,
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from './firebase';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h1>
          <pre className="bg-white p-4 rounded shadow text-sm overflow-auto max-w-full">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const EMOJIS = [
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
  "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
  "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋",
  "🐌", "🐞", "🐜", "🦟", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙",
  "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋",
  "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧"
];

const NATURE_EMOJIS = [
  "🌸", "🌺", "🌹", "🌷", "🌻", "🌼", "💐", "🍃", "🌿", "🌱",
  "🌵", "🌴", "🌳", "🌲", "🎄", "🎋", "🎍", "🍀", "☘️", "🌾",
  "🍄", "🍁", "🍂", "☁️", "☀️", "🌤️", "⛅", "🌥️", "🌦️", "🌧️",
  "⛈️", "🌩️", "🌨️", "❄️", "☃️", "⛄", "🌬️", "💨", "🌪️", "🌫️",
  "🌈", "🌊", "🌋", "🏔️", "⛰️", "🗻", "🏕️", "⛺", "🏜️", "🏝️",
  "🏞️", "🌅", "🌄", "🌇", "🌆", "🌃", "🌉"
];

const FRUIT_EMOJIS = [
  "🍎", "🍏", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
  "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑",
  "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅",
  "🥔", "🍠", "🫛", "🫚", "🍄", "🥜", "🫘", "🌰", "🎃", "🥗",
  "🌾", "🌿", "🍀", "☘️", "🍃", "🍂", "🍁", "🌵", "🌴", "🌳",
  "🌲", "🎍", "🎋", "🌸", "🌹", "🌺", "🌻"
];

const FLAG_EMOJIS = [
  "🏁","🚩","🎌","🏴","🏳️","🏳️‍🌈","🏳️‍⚧️","🏴‍☠️","🇦🇫","🇦🇽","🇦🇱","🇩🇿","🇦🇸","🇦🇩","🇦🇴","🇦🇮","🇦🇶","🇦🇬","🇦🇷","🇦🇲","🇦🇼","🇦🇺","🇦🇹","🇦🇿","🇧🇸","🇧🇭","🇧🇩","🇧🇧","🇧🇾","🇧🇪","🇧🇿","🇧🇯","🇧🇲","🇧🇹","🇧🇴","🇧🇦","🇧🇼","🇧🇷","🇮🇴","🇻🇬","🇧🇳","🇧🇬","🇧🇫","🇧🇮","🇰🇭","🇨🇲","🇨🇦","🇮🇨","🇨🇻","🇧🇶","🇰🇾","🇨🇫","🇹🇩","🇨🇱","🇨🇳","🇨🇽","🇨🇨"
];

const SMILEY_EMOJIS = [
  "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","🫠","😉","😊","😇","🥰","😍","🤩","😘","😗","☺️","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😶‍🌫️","😏","😒","🙄","😬","😮‍💨","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢"
];

const VEHICLE_EMOJIS = [
  "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🦯","🦽","🦼","🛴","🚲","🛵","🏍️","🛺","🚨","🚔","🚍","🚘","🚖","🚡","🚠","🚟","🚃","🚋","🚞","🚝","🚄","🚅","🚈","🚂","🚆","🚇","🚊","🚉","✈️","🛫","🛬","🛩️","💺","🛰️","🚀","🛸","🚁","🛶","⛵","🚤","🛥️","🛳️","⛴️"
];

const LANDMARK_IMAGES: string[] = Array.from({length: 57}, (_, i) =>
  `/landmarks/${String(i + 1).padStart(2, '0')}.png`
);

const LANDMARK_NAMES = [
  "Statue of Liberty", "Eiffel Tower", "Colosseum", "Great Pyramid of Giza", "Christ the Redeemer",
  "Leaning Tower of Pisa", "Golden Gate Bridge", "Sydney Opera House", "Stonehenge", "Hagia Sophia",
  "The Parthenon", "Notre-Dame", "Saint Basil's Cathedral", "Taj Mahal", "Arc de Triomphe",
  "Forbidden City", "Great Wall of China", "Petra", "Machu Picchu", "Easter Island Moai",
  "Brandenburg Gate", "Tower Bridge", "Saint Peter's Basilica", "Moscow Kremlin", "Neuschwanstein Castle",
  "Mont-Saint-Michel", "Atomium", "Big Ben", "Sagrada Família", "Burj Khalifa",
  "Burj Al Arab", "Taipei 101", "Lotus Temple", "White House", "Mount Rushmore",
  "Empire State Building", "The Sphinx", "Hollywood Sign", "Gateway Arch", "Chrysler Building",
  "Tokyo Tower", "Shwedagon Pagoda", "Angkor Wat", "Prambanan", "Charles Bridge",
  "Space Needle", "Chichén Itzá", "Marina Bay Sands", "London Eye", "Tower of London",
  "The Louvre", "Delicate Arch", "Mount Fuji", "The Pantheon", "Lincoln Memorial",
  "Uluru", "Flatiron Building"
];

const MASSIVE_EMOJI_POOL = Array.from(new Set([
  ...EMOJIS, ...NATURE_EMOJIS, ...FRUIT_EMOJIS, ...FLAG_EMOJIS, ...SMILEY_EMOJIS, ...VEHICLE_EMOJIS,
  "😀","😂","🤣","🙃","🫠","😉","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾","🙈","🙉","🙊","💋","💌","💘","💝","💖","💗","💓","💞","💕","💟","❣️","💔","❤️","🧡","💛","💚","💙","💜","🤎","🖤","🤍","💯","💢","💥","💫","💦","💨","🕳️","💣","💬","👁️‍🗨️","🗨️","🗯️","💭","💤","👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","👀","👁️","👅","👄","🫦"
]));

const MAX_PROFILES = 7;
const MAX_THEMES = 4;

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Animals': EMOJIS,
  'Nature': NATURE_EMOJIS,
  'Food & Drink': FRUIT_EMOJIS,
  'Flags': FLAG_EMOJIS,
  'Smileys': SMILEY_EMOJIS,
  'Vehicles': VEHICLE_EMOJIS
};

const FUNNY_MESSAGES = [
  "Pure unadulterated chaos",
  "Accidentally sent this",
  "A cry for help",
  "Everything is fine",
  "Passive aggressive toolkit",
  "My brain at 3am",
  "Reply all disaster",
  "Total emoji meltdown",
  "Vibe check failed",
  "Maximum effort theme",
  "Unnecessary but cool",
  "The ultimate collection"
];

type Theme = 'standard' | 'nature' | 'fruits' | 'landmarks' | 'custom';

const getSlots = () => {
  const slots = [{ x: 50, y: 50 }];
  const radius = 32; // Increased radius for better spacing
  for (let i = 0; i < 7; i++) {
    const angle = (i * 2 * Math.PI) / 7;
    slots.push({
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle)
    });
  }
  return slots;
};

function shuffle(array: any[]) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function prepareCard(symbols: string[]) {
  const slots = shuffle(getSlots());
  return symbols.map((symbol, idx) => {
    const slot = slots[idx];
    // Remove jitter and random scale for uniform placement
    const scale = 0.7 + Math.random() * 1.2;
    const rotation = Math.random() * 360;
    return {
      symbol,
      x: slot.x,
      y: slot.y,
      scale,
      rotation
    };
  });
}

const Card = ({ data, onClick, label, feedback, isRetro = false }: { data: any[], onClick: (s: string) => void, label?: string, feedback?: 'correct' | 'incorrect' | null, isRetro?: boolean }) => {
  return (
    <div className="relative flex flex-col items-center">
      {label && (
        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase z-20 ${isRetro ? 'bg-[var(--retro-bg-light)] text-[var(--retro-text)] border border-[var(--retro-border)]' : 'bg-black/40 text-white backdrop-blur-md border border-white/10 shadow-sm'}`}>
          {label}
        </div>
      )}
      <motion.div
        initial={isRetro ? { scale: 1, opacity: 0 } : { scale: 0.8, opacity: 0, rotate: -10 }}
        animate={{
          scale: 1,
          opacity: 1,
          rotate: 0,
          borderColor: feedback === 'correct' ? (isRetro ? 'var(--retro-green)' : '#4ade80') : feedback === 'incorrect' ? (isRetro ? 'var(--retro-red)' : '#ef4444') : (isRetro ? 'var(--retro-border)' : 'white')
        }}
        transition={isRetro ? { duration: 0.15, ease: [0, 0, 1, 1] } : { duration: 0.2 }}
        key={data.map(d => d.symbol).join('')}
        className={`relative w-[50vh] h-[50vh] md:w-[38vh] md:h-[38vh] lg:w-[550px] lg:h-[550px] max-w-[95vw] rounded-full border-[8px] sm:border-[12px] overflow-hidden transition-all ${isRetro ? 'bg-[var(--retro-bg-card)] retro-card-frame' : 'bg-[#fdfdfd] card-shadow'}`}
      >
        {data.map((item) => (
          <div
            key={item.symbol}
            onClick={() => onClick(item.symbol)}
            className={`absolute flex items-center justify-center cursor-pointer select-none ${isRetro ? 'pixel-emoji' : ''}`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
              fontSize: 'clamp(1.5rem, 6vh, 12rem)',
              width: 'clamp(2rem, 7vh, 14rem)',
              height: 'clamp(2rem, 7vh, 14rem)',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {item.symbol.startsWith('http') ? (
              <div className="w-full h-full relative group">
                <img
                  src={item.symbol}
                  alt="symbol"
                  className={`w-full h-full object-cover rounded-full border-4 bg-white ${isRetro ? 'border-[var(--retro-border)] pixelated' : 'border-white shadow-[0_4px_10px_rgba(0,0,0,0.3)]'}`}
                  referrerPolicy="no-referrer"
                  style={isRetro ? { imageRendering: 'pixelated' } : {}}
                />
                {!isRetro && <div className="absolute inset-0 rounded-full border-2 border-white/50 pointer-events-none" />}
              </div>
            ) : item.symbol.endsWith('.png') ? (
              <img
                src={item.symbol}
                alt="landmark"
                className="w-full h-full object-contain drop-shadow-lg"
                draggable={false}
                style={isRetro ? { imageRendering: 'pixelated' } : {}}
              />
            ) : isRetro ? (
              <PixelEmoji emoji={item.symbol} size="80%" resolution={32} />
            ) : (
              item.symbol
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const Leaderboard = ({ data, onSelect }: { data: any[], onSelect?: (name: string) => void }) => (
  <div className="text-left w-full">
    <div className="flex items-center gap-2 mb-6">
      <div className="h-[1px] flex-1 bg-white/20"></div>
      <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
        Top 5 Players
      </span>
      <div className="h-[1px] flex-1 bg-white/20"></div>
    </div>
    <div className="bg-black/20 rounded-2xl overflow-hidden border border-white/10 backdrop-blur-md">
      {data.slice(0, 5).map((entry, idx) => (
        <div 
          key={entry.id} 
          className={`flex items-center justify-between p-3 border-b border-white/5 last:border-0 ${idx === 0 ? 'bg-yellow-400/10' : ''}`}
        >
          <div className="flex items-center gap-3">
            <span className={`w-6 text-center font-bold ${idx === 0 ? 'text-yellow-400' : 'text-white/40'}`}>{idx + 1}</span>
            <span className="text-white font-medium truncate max-w-[150px]">{entry.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-black">{entry.highScore || 0}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const GlobalLeaderboard = ({ data, currentUserId, isLoading, isRetro, onRefresh }: { data: any[], currentUserId?: string, isLoading: boolean, isRetro: boolean, onRefresh: () => void }) => (
  <div className="text-left w-full">
    <div className="flex items-center gap-2 mb-6">
      <div className={`h-[1px] flex-1 ${isRetro ? 'bg-[var(--retro-border)]' : 'bg-white/20'}`}></div>
      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isRetro ? 'text-[var(--retro-text-dim)] text-[8px]' : 'text-white/40'}`}>
        Global Top 20
      </span>
      <button onClick={onRefresh} className={`transition ${isRetro ? 'text-[var(--retro-text-dim)] hover:text-[var(--retro-cyan)]' : 'text-white/40 hover:text-white/70'}`}>
        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
      </button>
      <div className={`h-[1px] flex-1 ${isRetro ? 'bg-[var(--retro-border)]' : 'bg-white/20'}`}></div>
    </div>
    <div className={`rounded-2xl overflow-hidden ${isRetro ? 'retro-panel rounded-xl' : 'bg-black/20 border border-white/10 backdrop-blur-md'}`}>
      {data.length === 0 && (
        <div className={`p-4 text-sm text-center ${isRetro ? 'text-[var(--retro-text-dim)]' : 'text-white/40'}`}>
          {isLoading ? 'Loading...' : 'No scores yet'}
        </div>
      )}
      {data.map((entry) => (
        <div
          key={entry.id}
          className={`flex items-center justify-between p-3 border-b last:border-0 ${
            isRetro
              ? `border-[var(--retro-border)] ${entry.rank === 1 ? 'bg-[var(--retro-gold)]/10' : ''} ${entry.userId === currentUserId ? 'border-l-2 border-l-[var(--retro-cyan)]' : ''}`
              : `border-white/5 ${entry.rank === 1 ? 'bg-yellow-400/10' : ''} ${entry.userId === currentUserId ? 'bg-purple-500/10 border-l-2 border-l-purple-400' : ''}`
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`w-6 text-center font-bold ${
              isRetro
                ? entry.rank === 1 ? 'text-[var(--retro-gold)]' : 'text-[var(--retro-text-dim)]'
                : entry.rank === 1 ? 'text-yellow-400' : 'text-white/40'
            }`}>{entry.rank}</span>
            <span className={`font-medium truncate max-w-[150px] ${isRetro ? 'text-[var(--retro-text)]' : 'text-white'}`}>{entry.profileName}</span>
          </div>
          <span className={`font-black ${isRetro ? 'text-[var(--retro-gold)]' : 'text-white'}`}>{entry.score}</span>
        </div>
      ))}
    </div>
  </div>
);

const LeaderboardToggle = ({ tab, onTabChange, isRetro }: { tab: 'my' | 'global', onTabChange: (t: 'my' | 'global') => void, isRetro: boolean }) => (
  <div className="flex gap-2 mb-4">
    {(['my', 'global'] as const).map((t) => (
      <button
        key={t}
        onClick={() => onTabChange(t)}
        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${
          isRetro
            ? tab === t ? 'retro-btn' : 'bg-[var(--retro-bg)] text-[var(--retro-text-dim)] border border-[var(--retro-border)] hover:border-[var(--retro-cyan)]'
            : tab === t ? 'bg-white text-purple-600' : 'bg-white/10 text-white/60 hover:bg-white/20'
        }`}
      >
        {t === 'my' ? 'My Scores' : 'Global'}
      </button>
    ))}
  </div>
);

const ProfileSelector = ({
  profiles,
  onSelect,
  onCreateNew, 
  onEdit, 
  onDelete, 
  currentProfile 
}: { 
  profiles: any[], 
  onSelect: (name: string) => void, 
  onCreateNew?: () => void, 
  onEdit: (profile: any) => void,
  onDelete: (name: string) => void,
  currentProfile?: string 
}) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const itemsPerPage = 4;
  
  const allItems = [
    ...(onCreateNew ? [{ type: 'create' }] : []),
    ...profiles.map(p => ({ ...p, type: 'profile' }))
  ];
  
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  const currentPageItems = allItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const paginate = (newDirection: number) => {
    const newPage = page + newDirection;
    if (newPage >= 0 && newPage < totalPages) {
      setPage([newPage, newDirection]);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4 w-full">
        <div className="h-[1px] flex-1 bg-white/20"></div>
        <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
          {onCreateNew ? 'Select or Create Profile' : 'Switch Profile'}
        </span>
        <div className="h-[1px] flex-1 bg-white/20"></div>
      </div>
      
      <div className="relative w-full h-[210px] overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div 
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) > 50;
              if (swipe) {
                if (offset.x > 0) paginate(-1);
                else paginate(1);
              }
            }}
            className="grid grid-cols-2 grid-rows-2 gap-3 w-full h-full cursor-grab active:cursor-grabbing"
          >
            {currentPageItems.map((item) => (
              <div key={item.type === 'create' ? 'create' : item.id} className="relative group h-full">
                {item.type === 'create' ? (
                  <button
                    onClick={onCreateNew}
                    className="w-full h-full py-2 rounded-xl font-bold transition flex flex-col items-center justify-center gap-1 border-2 border-dashed bg-white/20 hover:bg-white/30 border-white/30 text-white shadow-lg active:scale-95 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider">New Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onSelect(item.name)}
                      className={`w-full h-full py-2 rounded-xl font-bold transition flex flex-col items-center justify-center gap-1 border-2 shadow-lg active:scale-95 ${
                        item.name === currentProfile 
                          ? 'bg-white text-purple-600 border-white scale-105 z-10' 
                          : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base shadow-inner transition-transform group-hover:scale-110 ${
                        item.name === currentProfile ? 'bg-purple-100 text-purple-600' : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                      }`}>
                        {item.name[0].toUpperCase()}
                      </div>
                      <span className="text-[10px] uppercase tracking-widest truncate w-full px-2 text-center">{item.name}</span>
                      {item.name === currentProfile && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white p-0.5 rounded-full shadow-lg">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        </div>
                      )}
                    </button>
                    
                    <div className="absolute top-0.5 right-0.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg scale-75 origin-top-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                        className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
                        title="Edit Profile"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.name);
                        }}
                        className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-1.5 mt-3">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage([i, i > page ? 1 : -1])}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                page === i ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function DobbleGame() {
  // Development mode: bypass auth for testing
  const [user, setUser] = useState<any>(typeof window !== 'undefined' && window.location.search.includes('test') ? { uid: 'test-user' } : null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [deck, setDeck] = useState<string[][]>([]);
  const [playerCard, setPlayerCard] = useState<any[] | null>(null);
  const [centerCard, setCenterCard] = useState<any[] | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [correctClicks, setCorrectClicks] = useState(0);
  const [incorrectClicks, setIncorrectClicks] = useState(0);
  const [profileName, setProfileName] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('test')) {
      return 'Tester';
    }
    return localStorage.getItem('dobble_profile') || '';
  });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any | null>(null);
  const [newName, setNewName] = useState('');
  const [theme, setTheme] = useState<Theme>('standard');
  const [activeTab, setActiveTab] = useState<'saved-themes' | 'leaderboard' | 'profiles'>('profiles');
  const [customThemeEmojis, setCustomThemeEmojis] = useState<string[]>([]);
  const [isBuildingTheme, setIsBuildingTheme] = useState(false);
  const [randomizerMessage, setRandomizerMessage] = useState<string | null>(null);
  const [savedThemes, setSavedThemes] = useState<any[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<'my' | 'global'>('my');
  const [globalLoading, setGlobalLoading] = useState(false);
  const [customThemeName, setCustomThemeName] = useState('');
  const [customThemeIcon, setCustomThemeIcon] = useState('✨');
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [themeToDelete, setThemeToDelete] = useState<any | null>(null);
  const [builderTab, setBuilderTab] = useState<'library' | 'selection'>('selection');
  const [visualTheme, setVisualTheme] = useState<'modern' | 'retro'>(() =>
    (typeof window !== 'undefined' && localStorage.getItem('matchit_visual_theme') as 'modern' | 'retro') || 'modern'
  );

  const isRetro = visualTheme === 'retro';

  useEffect(() => {
    localStorage.setItem('matchit_visual_theme', visualTheme);
  }, [visualTheme]);

  // Theme-aware class helper: returns retro class when retro mode is active, modern otherwise
  const r = (modern: string, retro: string) => isRetro ? retro : modern;
  const bg = isRetro ? 'retro-bg bg-[#1a1a2e]' : 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600';
  const panel = isRetro ? 'retro-panel' : 'bg-white/10 backdrop-blur-lg border border-white/20';
  const btn = isRetro ? 'retro-btn rounded-lg' : '';

  const ThemeToggle = () => (
    <button
      onClick={() => setVisualTheme(v => v === 'modern' ? 'retro' : 'modern')}
      className={`fixed top-4 right-4 z-[200] flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
        isRetro
          ? 'retro-btn text-[8px] tracking-wider'
          : 'bg-white/15 backdrop-blur-lg border border-white/25 text-white hover:bg-white/25 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
      }`}
      title={isRetro ? 'Switch to Modern' : 'Switch to Retro'}
    >
      <span className="text-lg">{isRetro ? '✨' : '👾'}</span>
      <span className={isRetro ? '' : 'text-[10px] font-bold uppercase tracking-widest opacity-80'}>
        {isRetro ? 'MODERN' : 'RETRO'}
      </span>
    </button>
  );

  const handleRandomizeTheme = () => {
    const shuffled = [...MASSIVE_EMOJI_POOL].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 57);
    setCustomThemeEmojis(selected);
    const randomMsg = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];
    setCustomThemeName(randomMsg);
    setCustomThemeIcon(selected[0]);
    setRandomizerMessage(null);
  };

  useEffect(() => {
    // Skip auth in test mode
    if (typeof window !== 'undefined' && window.location.search.includes('test')) {
      setIsAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLeaderboard([]);
      return;
    }
    const q = query(
      collection(db, 'profiles'), 
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort locally since we don't have a composite index for userId + highScore
      profiles.sort((a: any, b: any) => (b.highScore || 0) - (a.highScore || 0));
      setLeaderboard(profiles);
    });

    const themesQuery = query(
      collection(db, 'customThemes'),
      where('userId', '==', user.uid)
    );
    const unsubscribeThemes = onSnapshot(themesQuery, (snapshot) => {
      const themes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedThemes(themes);
    });

    return () => {
      unsubscribe();
      unsubscribeThemes();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfileName('');
      localStorage.removeItem('dobble_profile');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const saveScore = async (finalScore: number, correct: number, incorrect: number) => {
    if (!profileName || !user) return;
    try {
      await addDoc(collection(db, 'scores'), {
        profileName,
        userId: user.uid,
        score: finalScore,
        correctClicks: correct,
        incorrectClicks: incorrect,
        totalClicks: correct + incorrect,
        hitRate: correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0,
        timestamp: serverTimestamp(),
      });
      
      // Update high score in profile
      const profileRef = doc(db, 'profiles', `${user.uid}_${profileName}`);
      const profileDoc = await getDoc(profileRef);
      if (profileDoc.exists()) {
        const currentHighScore = profileDoc.data().highScore || 0;
        if (finalScore > currentHighScore) {
          await setDoc(profileRef, { highScore: finalScore, lastPlayed: new Date().toISOString() }, { merge: true });
        }
      } else {
        await setDoc(profileRef, { name: profileName, userId: user.uid, highScore: finalScore, lastPlayed: new Date().toISOString() });
      }
    } catch (err) {
      console.error('Error saving score:', err);
    }
    fetchGlobalLeaderboard();
  };

  const fetchGlobalLeaderboard = useCallback(async () => {
    setGlobalLoading(true);
    try {
      const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      setGlobalLeaderboard(snapshot.docs.map((d, idx) => ({
        id: d.id,
        rank: idx + 1,
        ...d.data(),
      })));
    } catch (err) {
      console.error('Error fetching global leaderboard:', err);
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  const handleCreateProfile = async () => {
    if (newName.trim() && user) {
      const name = newName.trim();
      
      if (editingProfile) {
        // Renaming logic
        if (name === editingProfile.name) {
          setEditingProfile(null);
          setNewName('');
          setIsCreatingProfile(false);
          return;
        }

        try {
          // Create new profile doc with same data but new name
          const oldRef = doc(db, 'profiles', `${user.uid}_${editingProfile.name}`);
          const newRef = doc(db, 'profiles', `${user.uid}_${name}`);
          
          const profileData = {
            ...editingProfile,
            name: name,
            userId: user.uid,
            lastPlayed: new Date().toISOString()
          };
          delete (profileData as any).id; // Remove Firestore ID if present

          await setDoc(newRef, profileData);
          await deleteDoc(oldRef);

          if (profileName === editingProfile.name) {
            setProfileName(name);
            localStorage.setItem('dobble_profile', name);
          }
        } catch (err) {
          console.error('Error updating profile:', err);
        }
      } else {
        if (leaderboard.length >= MAX_PROFILES) {
          alert(`You can only have up to ${MAX_PROFILES} profiles. Please delete one first.`);
          setIsCreatingProfile(false);
          setNewName('');
          return;
        }
        const newRef = doc(db, 'profiles', `${user.uid}_${name}`);
        await setDoc(newRef, { name, userId: user.uid, highScore: 0, lastPlayed: new Date().toISOString() });
        setProfileName(name);
        localStorage.setItem('dobble_profile', name);
      }
      
      setIsCreatingProfile(false);
      setEditingProfile(null);
      setNewName('');
    }
  };

  const handleDeleteProfile = async (name: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'profiles', `${user.uid}_${name}`));
      if (profileName === name) {
        setProfileName('');
        localStorage.removeItem('dobble_profile');
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
    }
  };

  const switchProfile = () => {
    setProfileName('');
    localStorage.removeItem('dobble_profile');
    setIsPlaying(false);
    setGameOver(false);
  };

  const handleSaveTheme = async () => {
    if (!user || !customThemeName.trim() || customThemeEmojis.length !== 57) return;
    if (!editingThemeId && savedThemes.length >= MAX_THEMES) {
      alert(`You can only save up to ${MAX_THEMES} custom themes. Please delete one first.`);
      return;
    }
    setIsSavingTheme(true);
    try {
      const themeIcon = customThemeIcon;
      if (editingThemeId) {
        await setDoc(doc(db, 'customThemes', editingThemeId), {
          name: customThemeName.trim(),
          icon: themeIcon,
          userId: user.uid,
          emojis: customThemeEmojis,
          createdAt: new Date().toISOString()
        }, { merge: true });
        setEditingThemeId(null);
      } else {
        await addDoc(collection(db, 'customThemes'), {
          name: customThemeName.trim(),
          icon: themeIcon,
          userId: user.uid,
          emojis: customThemeEmojis,
          createdAt: new Date().toISOString()
        });
      }
      setCustomThemeName('');
      setCustomThemeIcon('✨');
      setIsBuildingTheme(false);
    } catch (err) {
      console.error('Error saving theme:', err);
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'customThemes', themeId));
    } catch (err) {
      console.error('Error deleting theme:', err);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setGameOver(true);
      setIsPlaying(false);
      saveScore(score, correctClicks, incorrectClicks);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isPaused, timeLeft]);

  const startGame = useCallback((themeOverride?: string | React.MouseEvent) => {
    const activeTheme = typeof themeOverride === 'string' ? themeOverride : theme;
    let symbols: string[] = [];
    if (activeTheme === 'standard') symbols = EMOJIS;
    else if (activeTheme === 'nature') symbols = NATURE_EMOJIS;
    else if (activeTheme === 'fruits') symbols = FRUIT_EMOJIS;
    else if (activeTheme === 'landmarks') symbols = LANDMARK_IMAGES;
    else if (activeTheme === 'custom') symbols = customThemeEmojis;

    if (symbols.length < 57) {
      alert("Not enough symbols for the theme!");
      return;
    }

    const newDeck = shuffleDeck(generateDobbleDeck(symbols));
    const pCard = prepareCard(newDeck.pop()!);
    const cCard = prepareCard(newDeck.pop()!);
    setDeck(newDeck);
    setPlayerCard(pCard);
    setCenterCard(cCard);
    setScore(0);
    setCorrectClicks(0);
    setIncorrectClicks(0);
    setTimeLeft(60);
    setGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
  }, [theme, customThemeEmojis]);

  const stopGame = useCallback(() => {
    setIsPlaying(false);
    setGameOver(false);
    setIsPaused(false);
  }, []);

  const handleSymbolClick = useCallback((symbol: string) => {
    if (gameOver || !isPlaying || isPaused || !playerCard || !centerCard) return;

    const isOnPlayerCard = playerCard.some(s => s.symbol === symbol);
    const isOnCenterCard = centerCard.some(s => s.symbol === symbol);

    if (isOnPlayerCard && isOnCenterCard) {
      setFeedback('correct');
      setCorrectClicks(c => c + 1);
      setScore(s => s + 1);
      
      setTimeout(() => {
        if (deck.length === 0) {
          setGameOver(true);
          setIsPlaying(false);
          saveScore(score + 1, correctClicks + 1, incorrectClicks);
        } else {
          setPlayerCard(centerCard);
          const newDeck = [...deck];
          const nextCard = prepareCard(newDeck.pop()!);
          setDeck(newDeck);
          setCenterCard(nextCard);
        }
        setFeedback(null);
      }, 200);
    } else {
      setFeedback('incorrect');
      setIncorrectClicks(c => c + 1);
      setTimeout(() => setFeedback(null), 400);
    }
  }, [deck, playerCard, centerCard, gameOver, isPlaying, score, profileName]);

  if (!isAuthReady) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-4 ${isRetro ? 'retro-theme' : ''}`}>
        <div className={`w-12 h-12 border-4 border-white border-t-transparent rounded-full ${isRetro ? '' : 'animate-spin'}`}></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-4 ${isRetro ? 'retro-theme retro-scanlines' : 'font-sans'}`}>
        <ThemeToggle />
        <div className={`${panel} p-8 md:p-12 rounded-[2rem] text-center max-w-md w-full shadow-2xl`}>
          <div className={`w-24 h-24 ${isRetro ? 'bg-[#2a2a4e] border-2 border-[var(--retro-border)]' : 'bg-white'} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
            <span className="text-5xl">🎯</span>
          </div>
          <h1 className={`text-5xl font-black text-white mb-4 ${isRetro ? 'retro-title text-3xl' : 'tracking-tight'}`}>
            {isRetro ? (
              <>
                <span style={{ color: 'var(--retro-cyan)' }}>MAT</span>
                <span style={{ color: 'var(--retro-magenta)' }}>CH </span>
                <span style={{ color: 'var(--retro-yellow)' }}>IT</span>
              </>
            ) : 'MATCH IT'}
          </h1>
          <p className={`mb-8 leading-relaxed ${isRetro ? 'text-[var(--retro-text-dim)] text-[8px] leading-relaxed' : 'text-white/80 text-lg'}`}>
            Please sign in to save your profiles, custom themes, and high scores!
          </p>
          <button
            onClick={handleLogin}
            className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 ${isRetro ? 'retro-btn text-sm' : 'bg-white text-purple-600 hover:bg-gray-100 transition shadow-xl transform hover:-translate-y-1 active:translate-y-0'}`}
          >
            <UserIcon className="w-6 h-6" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // Admin stats panel — accessible via ?stats URL for authenticated users
  if (typeof window !== 'undefined' && window.location.search.includes('stats')) {
    return <StatsPanel onBack={() => { window.history.replaceState({}, '', window.location.pathname); window.location.reload(); }} />;
  }

  if (!profileName || isCreatingProfile) {
    return (
      <div className={`min-h-screen ${bg} flex flex-col items-center justify-start pt-12 md:pt-20 p-4 ${isRetro ? 'retro-theme retro-scanlines' : 'font-sans'}`}>
        <ThemeToggle />
        <div className={`${panel} p-6 md:p-8 rounded-[2rem] text-center max-w-md w-full shadow-2xl`}>
          <div className={`w-16 h-16 ${isRetro ? 'bg-[#2a2a4e] border-2 border-[var(--retro-border)]' : 'bg-white'} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            <UserIcon className={`w-8 h-8 ${isRetro ? 'text-[var(--retro-cyan)]' : 'text-purple-600'}`} />
          </div>
          <div className="relative mb-6">
            <div className="flex items-center gap-2">
              <div className="h-[1px] flex-1 bg-white/20"></div>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                {editingProfile ? 'Edit Profile' : isCreatingProfile ? 'New Profile' : 'Who is playing?'}
              </span>
              <div className="h-[1px] flex-1 bg-white/20"></div>
            </div>
            <button 
              onClick={handleLogout}
              className="absolute -top-1 -right-1 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition z-10"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <AnimatePresence mode="wait">
            {isCreatingProfile || editingProfile ? (
              <motion.div 
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <div className="relative">
                  <input 
                    type="text" 
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={editingProfile ? "Update name..." : "Enter your name..."}
                    className="w-full py-3.5 px-5 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-lg font-bold"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsCreatingProfile(false);
                      setEditingProfile(null);
                      setNewName('');
                    }}
                    className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateProfile}
                    disabled={!newName.trim()}
                    className="flex-[2] py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {editingProfile ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {editingProfile ? 'Update' : 'Create'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {leaderboard.length > 0 ? (
                  <div className="space-y-4">
                    <ProfileSelector 
                      profiles={leaderboard} 
                      onCreateNew={() => setIsCreatingProfile(true)}
                      onEdit={(profile) => {
                        setEditingProfile(profile);
                        setNewName(profile.name);
                      }}
                      onDelete={handleDeleteProfile}
                      onSelect={(name) => {
                        setProfileName(name);
                        localStorage.setItem('dobble_profile', name);
                      }} 
                    />
                    <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                      {leaderboard.length} / {MAX_PROFILES} Profiles
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsCreatingProfile(true)}
                    className="w-full py-5 bg-white text-purple-600 rounded-2xl font-black text-xl hover:bg-gray-100 transition shadow-xl flex items-center justify-center gap-3"
                  >
                    <Plus className="w-6 h-6" />
                    CREATE PROFILE
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (isBuildingTheme) {
    return (
      <div className={`min-h-screen ${bg} flex flex-col items-center p-4 ${isRetro ? 'retro-theme retro-scanlines' : 'font-sans'}`}>
        <ThemeToggle />
        <div className={`${panel} p-3 rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col h-[98vh] max-h-[1200px]`}>
          <div className="relative mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-[1px] flex-1 bg-white/20"></div>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                Build Custom Theme
              </span>
              <div className="h-[1px] flex-1 bg-white/20"></div>
            </div>
            <button 
              onClick={() => setIsBuildingTheme(false)}
              className="absolute -top-1 -right-1 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-col gap-2 mb-2 bg-white/10 p-2 rounded-xl border border-white/10 shrink-0">
            <div className="text-white font-bold text-center flex flex-col items-center justify-center gap-1 py-2">
              <span className="text-[10px] uppercase tracking-widest opacity-50">Selected</span>
              <div className="flex items-center gap-2">
                <span className={`text-4xl ${customThemeEmojis.length === 57 ? "text-green-400" : "text-yellow-400"}`}>
                  <AnimatedCounter value={customThemeEmojis.length} fontSize={32} />
                </span>
                <span className="text-white/30 text-2xl font-light">/ 57</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              <select
                onChange={(e) => {
                  if (e.target.value && EMOJI_CATEGORIES[e.target.value]) {
                    const selected = EMOJI_CATEGORIES[e.target.value].slice(0, 57);
                    setCustomThemeEmojis(selected);
                    setCustomThemeName(e.target.value);
                    setCustomThemeIcon(selected[0]);
                    setBuilderTab('selection');
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="flex-1 px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-bold transition text-[10px] outline-none cursor-pointer appearance-none text-center shadow-md"
              >
                <option value="" disabled className="bg-purple-900">Auto-fill Category...</option>
                {Object.keys(EMOJI_CATEGORIES).map(cat => (
                  <option key={cat} value={cat} className="bg-purple-900 text-white">{cat}</option>
                ))}
              </select>
              <button 
                onClick={handleRandomizeTheme}
                className="px-2 py-1.5 bg-white text-purple-600 rounded-lg font-bold transition text-[10px] flex items-center justify-center gap-1 shadow-md"
              >
                <Dices className="w-3 h-3" />
                Random
              </button>
              <button 
                onClick={() => { setCustomThemeEmojis([]); setRandomizerMessage(null); setEditingThemeId(null); setCustomThemeName(''); setCustomThemeIcon('✨'); }}
                className="px-2 py-1.5 bg-white text-red-500 rounded-lg font-bold transition text-[10px] shadow-md"
              >
                Clear
              </button>
            </div>
          </div>

          {!editingThemeId && savedThemes.length >= MAX_THEMES && (
            <p className="text-red-300 text-[10px] font-bold text-center mb-1">Max {MAX_THEMES} themes reached. Delete one to save.</p>
          )}

          {/* Tab Navigation */}
          <div className="flex p-1 bg-white/10 rounded-xl mb-2 border border-white/10 shrink-0">
            <button
              onClick={() => setBuilderTab('library')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                builderTab === 'library' 
                  ? 'bg-white text-purple-600 shadow-lg' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Emoji Library
            </button>
            <button
              onClick={() => setBuilderTab('selection')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all relative ${
                builderTab === 'selection' 
                  ? 'bg-white text-purple-600 shadow-lg' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Your Selection
              {customThemeEmojis.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-bold ${
                  builderTab === 'selection' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600'
                }`}>
                  <AnimatedCounter value={customThemeEmojis.length} fontSize={8} />
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 min-h-0 relative overflow-hidden mb-2">
            <AnimatePresence mode="wait">
              {builderTab === 'library' ? (
                <motion.div 
                  key="library"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="h-full flex flex-col"
                >
                  <div className="flex-1 h-full bg-white rounded-2xl overflow-hidden shadow-inner border-2 border-white/20">
                    <EmojiPicker 
                      onEmojiClick={(emojiData) => {
                        if (customThemeEmojis.length < 57 && !customThemeEmojis.includes(emojiData.emoji)) {
                          setCustomThemeEmojis([...customThemeEmojis, emojiData.emoji]);
                        }
                      }}
                      theme={EmojiTheme.LIGHT}
                      width="100%"
                      height="100%"
                      searchDisabled={false}
                      skinTonesDisabled={true}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="selection"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="h-full flex flex-col bg-white/10 rounded-2xl p-3 border border-white/20 overflow-y-auto custom-scrollbar"
                >
                  <div className="grid grid-cols-6 gap-1.5 content-start pb-10">
                    {customThemeEmojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCustomThemeIcon(emoji)}
                        className={`w-11 h-11 bg-white rounded-xl flex items-center justify-center text-2xl hover:bg-purple-50 hover:scale-105 transition-all shadow-sm relative group ${emoji === customThemeIcon ? 'ring-2 ring-yellow-400 scale-105 z-10' : ''}`}
                      >
                        {emoji}
                        {emoji === customThemeIcon && (
                          <div className="absolute -bottom-1 -left-1 bg-yellow-400 text-[8px] font-black px-1 rounded border border-yellow-600 text-yellow-900 uppercase">Icon</div>
                        )}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newEmojis = customThemeEmojis.filter(e => e !== emoji);
                            setCustomThemeEmojis(newEmojis);
                            if (emoji === customThemeIcon) {
                              setCustomThemeIcon(newEmojis[0] || '✨');
                            }
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                        >
                          <X className="w-3 h-3" />
                        </div>
                      </button>
                    ))}
                    {customThemeEmojis.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center text-white/50 text-center py-12">
                        <Palette className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium">Your selection is empty</p>
                        <p className="text-[10px] mt-1">Go to the library to pick some emojis!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => setBuilderTab('selection')}
                className="w-11 h-11 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center text-xl shadow-inner hover:bg-white/30 transition-colors shrink-0"
                title="Select Theme Icon"
              >
                {customThemeIcon}
              </button>
              <input
                type="text"
                value={customThemeName}
                onChange={(e) => setCustomThemeName(e.target.value)}
                placeholder="Theme name..."
                className="flex-1 px-3 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 font-bold text-sm shadow-inner"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveTheme()}
                disabled={customThemeEmojis.length !== 57 || !customThemeName.trim() || isSavingTheme || (!editingThemeId && savedThemes.length >= MAX_THEMES)}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-xs transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
              >
                {isSavingTheme ? 'SAVING...' : 'SAVE THEME'}
              </button>
              <ShimmerButton 
                onClick={async () => {
                  await handleSaveTheme();
                  setTheme('custom');
                  setIsBuildingTheme(false);
                  startGame('custom');
                }}
                disabled={customThemeEmojis.length !== 57 || !customThemeName.trim() || isSavingTheme}
                className="flex-1 py-2.5 bg-white text-purple-600 rounded-xl font-black text-xs transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                shimmerColor="#9333ea"
                shimmerSize="0.1em"
                shimmerDuration="2.5s"
                background="white"
                borderRadius="0.75rem"
              >
                SAVE & PLAY
              </ShimmerButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isPlaying && !gameOver) {
    return (
      <div className={`min-h-screen ${bg} flex flex-col items-center justify-start pt-4 md:pt-8 p-4 relative overflow-hidden ${isRetro ? 'retro-theme retro-scanlines' : 'font-sans'}`}>
        <ThemeToggle />
        {/* Background Pattern */}
        {!isRetro && <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>}

        <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
          
          {/* Hero Title Section */}
          <div className="text-center mb-4 md:mb-6">
            {isRetro ? (
              <>
                <h1 className="text-3xl md:text-5xl font-black mb-2 retro-title tracking-wide">
                  <span style={{ color: 'var(--retro-cyan)' }}>MA</span>
                  <span style={{ color: 'var(--retro-magenta)' }}>TC</span>
                  <span style={{ color: 'var(--retro-yellow)' }}>H </span>
                  <span style={{ color: 'var(--retro-green)' }}>IT</span>
                </h1>
                <p className="text-[var(--retro-text-dim)] text-[7px] md:text-[9px] whitespace-nowrap">
                  find the matching symbol in 60 seconds
                </p>
              </>
            ) : (
              <>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-1 flex items-center justify-center gap-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FFD26F] via-[#FF8A8A] to-[#FF6B6B] drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]">MATCH</span>
                  <span className="text-[#A5D8FF] drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]">IT</span>
                </h1>
                <p className="text-white text-lg md:text-xl font-medium opacity-90 whitespace-nowrap">
                  find the matching symbol in 60 seconds
                </p>
              </>
            )}
          </div>

          {/* Hero Graphic (Refined recreation) */}
          <div className="relative w-full h-[220px] md:h-[320px] flex items-center justify-center mb-2 md:mb-4 perspective-1000">
            {/* Left Card */}
            <motion.div
              initial={{ x: -60, opacity: 0, rotate: -8 }}
              animate={{ x: 0, opacity: 1, rotate: -8 }}
              whileHover={{ rotate: -5, scale: 1.02 }}
              transition={isRetro ? { duration: 0.4, ease: [0, 0, 1, 1] } : { duration: 0.8, ease: "easeOut" }}
              className={`absolute left-1/2 -translate-x-[90%] w-[180px] h-[180px] md:w-[280px] md:h-[280px] rounded-full flex items-center justify-center overflow-hidden ${isRetro ? 'retro-card-frame' : 'bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-8 border-white/30'}`}
              style={isRetro ? {} : {
                background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f0f0 100%)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05), 0 20px 50px rgba(0,0,0,0.3)'
              }}
            >
              <div className="relative w-full h-full p-8">
                {isRetro ? (
                  <>
                    <div className="absolute top-[15%] left-[20%]"><PixelEmoji emoji="🇸🇽" size={40} resolution={28} /></div>
                    <div className="absolute top-[20%] right-[20%] rotate-12"><PixelEmoji emoji="🦁" size={52} resolution={32} /></div>
                    <div className="absolute bottom-[20%] left-[20%] -rotate-12"><PixelEmoji emoji="🍕" size={40} resolution={28} /></div>
                    <div className="absolute bottom-[20%] right-[20%] rotate-6"><PixelEmoji emoji="🚲" size={40} resolution={28} /></div>
                  </>
                ) : (
                  <>
                    <span className="absolute top-[15%] left-[20%] text-3xl md:text-5xl drop-shadow-sm">🇸🇽</span>
                    <span className="absolute top-[20%] right-[20%] text-4xl md:text-6xl rotate-12 drop-shadow-sm">🦁</span>
                    <span className="absolute bottom-[20%] left-[20%] text-3xl md:text-5xl -rotate-12 drop-shadow-sm">🍕</span>
                    <span className="absolute bottom-[20%] right-[20%] text-3xl md:text-5xl rotate-6 drop-shadow-sm">🚲</span>
                  </>
                )}

                {/* Matching Symbol with Enhanced Glow */}
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    {/* Two gold circles around matching item */}
                    <div className={`absolute inset-0 -m-3 border-2 rounded-full ${isRetro ? 'border-[var(--retro-gold)]' : 'border-yellow-400'}`} />
                    <div className={`absolute inset-0 -m-5 border-2 rounded-full ${isRetro ? 'border-[var(--retro-gold)]' : 'border-yellow-400'}`} />
                    {isRetro ? (
                      <div className="relative z-10 retro-float"><PixelEmoji emoji="🔥" size={80} resolution={36} /></div>
                    ) : (
                      <span className="text-6xl md:text-8xl relative z-10 drop-shadow-md">🔥</span>
                    )}
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                      transition={isRetro ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 1.5, repeat: Infinity }}
                      className={`absolute inset-0 -m-6 border-4 rounded-full ${isRetro ? 'border-[var(--retro-cyan)]' : 'border-cyan-400 blur-md'}`}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={isRetro ? { duration: 1.5, repeat: Infinity, delay: 0.3, ease: "easeInOut" } : { duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      className={`absolute inset-0 -m-10 border-2 rounded-full ${isRetro ? 'border-[var(--retro-cyan)]/50' : 'border-cyan-300 blur-xl'}`}
                    />
                  </div>
                </div>
              </div>
              {/* Glossy Overlay */}
              {!isRetro && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none"></div>}
            </motion.div>

            {/* Right Card */}
            <motion.div
              initial={{ x: 60, opacity: 0, rotate: 8 }}
              animate={{ x: 0, opacity: 1, rotate: 8 }}
              whileHover={{ rotate: 5, scale: 1.02 }}
              transition={isRetro ? { duration: 0.4, ease: [0, 0, 1, 1], delay: 0.15 } : { duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className={`absolute left-1/2 -translate-x-[10%] w-[180px] h-[180px] md:w-[280px] md:h-[280px] rounded-full flex items-center justify-center overflow-hidden ${isRetro ? 'retro-card-frame' : 'bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-8 border-white/30'}`}
              style={isRetro ? {} : {
                background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f0f0 100%)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05), 0 20px 50px rgba(0,0,0,0.3)'
              }}
            >
              <div className="relative w-full h-full p-8">
                {isRetro ? (
                  <>
                    <div className="absolute top-[15%] left-[20%] -rotate-12"><PixelEmoji emoji="⭐" size={52} resolution={32} /></div>
                    <div className="absolute top-[20%] right-[20%] rotate-6"><PixelEmoji emoji="🍓" size={40} resolution={28} /></div>
                    <div className="absolute bottom-[20%] left-[20%] rotate-12"><PixelEmoji emoji="🐶" size={52} resolution={32} /></div>
                    <div className="absolute bottom-[20%] right-[20%] -rotate-6"><PixelEmoji emoji="🍆" size={40} resolution={28} /></div>
                  </>
                ) : (
                  <>
                    <span className="absolute top-[15%] left-[20%] text-4xl md:text-6xl -rotate-12 drop-shadow-sm">⭐</span>
                    <span className="absolute top-[20%] right-[20%] text-3xl md:text-5xl rotate-6 drop-shadow-sm">🍓</span>
                    <span className="absolute bottom-[20%] left-[20%] text-4xl md:text-6xl rotate-12 drop-shadow-sm">🐶</span>
                    <span className="absolute bottom-[20%] right-[20%] text-3xl md:text-5xl -rotate-6 drop-shadow-sm">🍆</span>
                  </>
                )}

                {/* Matching Symbol with Enhanced Glow */}
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    {/* Two gold circles around matching item */}
                    <div className={`absolute inset-0 -m-2 border-2 rounded-full ${isRetro ? 'border-[var(--retro-gold)]' : 'border-yellow-400'}`} />
                    <div className={`absolute inset-0 -m-4 border-2 rounded-full ${isRetro ? 'border-[var(--retro-gold)]' : 'border-yellow-400'}`} />
                    {isRetro ? (
                      <div className="relative z-10 retro-float"><PixelEmoji emoji="🔥" size={56} resolution={32} /></div>
                    ) : (
                      <span className="text-4xl md:text-6xl relative z-10 drop-shadow-md">🔥</span>
                    )}
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                      transition={isRetro ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 1.5, repeat: Infinity }}
                      className={`absolute inset-0 -m-6 border-4 rounded-full ${isRetro ? 'border-[var(--retro-cyan)]' : 'border-cyan-400 blur-md'}`}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={isRetro ? { duration: 1.5, repeat: Infinity, delay: 0.3, ease: "easeInOut" } : { duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      className={`absolute inset-0 -m-10 border-2 rounded-full ${isRetro ? 'border-[var(--retro-cyan)]/50' : 'border-cyan-300 blur-xl'}`}
                    />
                  </div>
                </div>
              </div>
              {/* Glossy Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none"></div>
            </motion.div>
          </div>

          {/* Controls Section */}
          <div className="w-full max-w-md text-center">
            {isRetro ? (
              <button
                onClick={() => startGame()}
                className="retro-btn w-full py-4 rounded-xl font-black text-sm mb-4 flex items-center justify-center gap-3"
              >
                <span style={{ color: 'var(--retro-magenta)' }}>▶</span>
                START GAME
              </button>
            ) : (
              <ShimmerButton
                onClick={() => startGame()}
                className="w-full py-4 bg-white text-purple-600 rounded-2xl font-black text-xl hover:bg-gray-100 transition shadow-xl transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 mb-4"
                shimmerColor="#9333ea"
                shimmerSize="0.1em"
                shimmerDuration="2.5s"
                background="white"
                borderRadius="1rem"
              >
                <Play className="w-6 h-6 fill-purple-600" />
                START GAME
              </ShimmerButton>
            )}

            {/* Playing As Card */}
            <div className={`flex items-center justify-between p-2 rounded-2xl mb-4 ${isRetro ? 'retro-panel rounded-xl' : 'bg-white/10 border border-white/10'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isRetro ? 'bg-[var(--retro-bg)] text-[var(--retro-cyan)] border border-[var(--retro-border)]' : 'bg-purple-100 text-purple-600 shadow-inner'}`}>
                  {profileName[0]?.toUpperCase() || 'P'}
                </div>
                <div className="flex flex-col items-start">
                  <div className={`font-bold leading-tight ${isRetro ? 'text-[var(--retro-text)] text-[9px]' : 'text-white text-sm'}`}>{profileName}</div>
                  <div className={`font-bold uppercase ${isRetro ? 'text-[var(--retro-text-dim)] text-[6px] tracking-wider' : 'text-white/40 text-[8px] tracking-[0.2em]'}`}>Top Score: {leaderboard.filter(entry => entry.name === profileName).reduce((max, entry) => Math.max(max, entry.highScore || 0), 0)}</div>
                </div>
              </div>
              <button
                onClick={switchProfile}
                className={`p-1.5 rounded-xl transition ${isRetro ? 'text-[var(--retro-text-dim)] hover:text-[var(--retro-cyan)]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                title="Switch Profile"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="h-[1px] flex-1 bg-white/20"></div>
              <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em]">
                Select Theme
              </span>
              <div className="h-[1px] flex-1 bg-white/20"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-2">
              {([
                { key: 'standard' as Theme, icon: '🦁', label: 'Standard' },
                { key: 'nature' as Theme, icon: '🌸', label: 'Nature' },
                { key: 'fruits' as Theme, icon: '🍓', label: 'Fruits' },
                // { key: 'landmarks' as Theme, icon: '🏔️', label: 'Landmarks' }, // TODO: improve image quality before enabling
              ] as const).map(({ key, icon, label }) => {
                const isActive = theme === key;
                const cls = isRetro
                  ? `w-full py-3 rounded-lg font-bold flex flex-col items-center gap-1 ${isActive ? 'retro-btn border-[var(--retro-cyan)]' : 'retro-btn opacity-80'}`
                  : `w-full py-3 rounded-xl font-bold transition flex flex-col items-center gap-1 border-2 ${isActive ? 'bg-white text-purple-600 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`;
                const Wrapper = key === 'standard' && !isRetro ? ParticleButton : 'button';
                return (
                  <Wrapper key={key} onClick={() => setTheme(key)} className={cls}>
                    {isRetro ? <PixelEmoji emoji={icon} size={32} resolution={28} /> : <span className="text-2xl">{icon}</span>}
                    <span className={isRetro ? 'text-[7px] uppercase tracking-wider' : 'text-[10px] uppercase tracking-widest'}>{label}</span>
                  </Wrapper>
                );
              })}
              {isRetro ? (
                <button
                  onClick={() => setIsBuildingTheme(true)}
                  className={`w-full py-3 rounded-lg font-bold flex flex-col items-center gap-1 retro-btn ${theme === 'custom' ? 'border-[var(--retro-cyan)]' : 'opacity-80'}`}
                >
                  <span className="text-2xl">➕</span>
                  <span className="text-[7px] uppercase tracking-wider">Build</span>
                </button>
              ) : (
                <MagnetizeButton
                  onClick={() => setIsBuildingTheme(true)}
                  className={`w-full py-3 rounded-xl font-bold transition flex flex-col items-center gap-1 border-2 ${theme === 'custom' ? 'bg-white text-purple-600 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                >
                  <Plus className="w-8 h-8 mb-0" />
                  <span className="text-[10px] uppercase tracking-widest">Build</span>
                </MagnetizeButton>
              )}
            </div>

            <div className="flex justify-center mt-4 mb-2">
              <LimelightNav
                items={[
                  { id: 'profiles', icon: <User className="w-4 h-4" />, label: 'Profiles', onClick: () => setActiveTab('profiles') },
                  { id: 'saved-themes', icon: <Palette className="w-4 h-4" />, label: 'Saved', onClick: () => setActiveTab('saved-themes') },
                  { id: 'leaderboard', icon: <Trophy className="w-4 h-4" />, label: 'Leaderboard', onClick: () => setActiveTab('leaderboard') },
                ]}
                defaultActiveIndex={activeTab === 'profiles' ? 0 : activeTab === 'saved-themes' ? 1 : 2}
              />
            </div>

            <div className="h-[200px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar relative">
              <AnimatePresence mode="wait">
                {activeTab === 'saved-themes' && (
                  <motion.div 
                    key="saved-themes"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-[1px] flex-1 bg-white/20"></div>
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                        Your Saved Themes
                      </span>
                      <div className="h-[1px] flex-1 bg-white/20"></div>
                    </div>
                    {savedThemes.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 w-full">
                        {savedThemes.slice(0, 2).map(t => (
                          <div key={t.id} className="relative group">
                            <button
                              onClick={() => {
                                setCustomThemeEmojis(t.emojis);
                                setTheme('custom');
                              }}
                              className={`w-full py-3 rounded-xl font-bold transition flex flex-col items-center gap-1 border-2 ${theme === 'custom' && customThemeEmojis === t.emojis ? 'bg-white text-purple-600 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                            >
                              <span className="text-2xl">{t.icon || '✨'}</span>
                              <span className="text-[10px] uppercase tracking-widest truncate w-full px-2 text-center">{t.name}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-white/60 text-sm font-bold py-4">No saved themes yet.</div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'profiles' && (
                  <motion.div 
                    key="profiles"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mb-8"
                  >
                    {leaderboard.length > 0 ? (
                      <ProfileSelector 
                        profiles={leaderboard} 
                        currentProfile={profileName}
                        onCreateNew={() => setIsCreatingProfile(true)}
                        onEdit={(profile) => {
                          setEditingProfile(profile);
                          setNewName(profile.name);
                        }}
                        onDelete={(name) => setProfileToDelete(name)}
                        onSelect={(name) => {
                          setProfileName(name);
                          localStorage.setItem('dobble_profile', name);
                        }} 
                      />
                    ) : (
                      <div className="text-white/60 text-sm font-bold py-4">No profiles yet.</div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'leaderboard' && (
                  <motion.div
                    key="leaderboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mb-8"
                  >
                    <LeaderboardToggle tab={leaderboardTab} onTabChange={(t) => { setLeaderboardTab(t); if (t === 'global' && globalLeaderboard.length === 0) fetchGlobalLeaderboard(); }} isRetro={isRetro} />
                    {leaderboardTab === 'my' ? (
                      <Leaderboard data={leaderboard} />
                    ) : (
                      <GlobalLeaderboard data={globalLeaderboard} currentUserId={user?.uid} isLoading={globalLoading} isRetro={isRetro} onRefresh={fetchGlobalLeaderboard} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {profileToDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${isRetro ? 'bg-black/80' : 'bg-black/80 backdrop-blur-sm'}`}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`p-8 max-w-sm w-full text-center shadow-2xl ${isRetro ? 'retro-panel rounded-xl' : 'bg-white rounded-3xl'}`}
                >
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isRetro ? 'bg-[var(--retro-bg)] border-2 border-[var(--retro-red)]' : 'bg-red-100'}`}>
                    <Trash2 className={`w-10 h-10 ${isRetro ? 'text-[var(--retro-red)]' : 'text-red-500'}`} />
                  </div>
                  <h3 className={`text-2xl font-black mb-2 ${isRetro ? 'text-[var(--retro-text)] text-lg' : 'text-gray-900'}`}>Delete Profile?</h3>
                  <p className={`mb-8 ${isRetro ? 'text-[var(--retro-text-dim)] text-[8px] leading-relaxed' : 'text-gray-500'}`}>
                    Are you sure you want to delete <span className={`font-bold ${isRetro ? 'text-[var(--retro-text)]' : 'text-gray-900'}`}>"{profileToDelete}"</span>?
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setProfileToDelete(null)} className={`flex-1 py-4 rounded-2xl font-bold ${isRetro ? 'retro-btn text-xs rounded-lg' : 'bg-gray-100 text-gray-600'}`}>CANCEL</button>
                    <button onClick={() => { handleDeleteProfile(profileToDelete); setProfileToDelete(null); }} className={`flex-1 py-4 rounded-2xl font-bold ${isRetro ? 'retro-btn text-xs rounded-lg text-[var(--retro-red)]' : 'bg-red-500 text-white'}`}>DELETE</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} flex flex-col items-center justify-center p-4 relative overflow-hidden ${isRetro ? 'retro-theme retro-scanlines' : 'font-sans'}`}>

      {/* Background Pattern */}
      {!isRetro && <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>}

      {/* Main Game Container */}
      <div className="relative w-full max-w-lg md:max-w-4xl lg:max-w-6xl flex flex-col items-center justify-start p-4">
        
        {/* Header Stats */}
        <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start z-20 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className={`rounded-xl p-1.5 flex items-center gap-2 shadow-2xl ${isRetro ? 'retro-panel' : 'bg-black/30 backdrop-blur-xl border border-white/10'}`}>
              <div className={`p-1.5 rounded-lg ${isRetro ? 'bg-[var(--retro-gold)]' : 'bg-yellow-400 shadow-lg shadow-yellow-400/20'}`}>
                <Trophy className="w-3.5 h-3.5 text-yellow-900" />
              </div>
              <div>
                <div className="text-white/50 text-[8px] font-black uppercase tracking-[0.2em] mb-0">Score</div>
                <div className="text-white font-black leading-none">
                  <AnimatedCounter value={score} fontSize={14} />
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-1.5 flex items-center gap-2 shadow-2xl pointer-events-auto ${isRetro ? 'retro-panel' : 'bg-black/30 backdrop-blur-xl border border-white/10'}`}>
            <div className="text-right">
              <div className={`text-[8px] font-black uppercase tracking-[0.2em] mb-0 ${isRetro ? 'text-[var(--retro-text-dim)]' : 'text-white/50'}`}>Time</div>
              <div className={`font-black text-sm leading-none ${timeLeft <= 10 ? (isRetro ? 'text-[var(--retro-red)]' : 'text-red-400 animate-pulse') : (isRetro ? 'text-[var(--retro-text)]' : 'text-white')}`}>
                {timeLeft}s
              </div>
            </div>
            <div className={`p-1.5 rounded-lg ${isRetro ? (timeLeft <= 10 ? 'bg-[var(--retro-red)]/20 text-[var(--retro-red)]' : 'bg-[var(--retro-cyan)]/20 text-[var(--retro-cyan)]') : (timeLeft <= 10 ? 'bg-red-400/20 text-red-400 shadow-lg shadow-red-400/10' : 'bg-blue-400/20 text-blue-400 shadow-lg shadow-blue-400/10')}`}>
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Vertical Control Bar */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`rounded-xl p-2.5 ${isRetro ? 'retro-btn' : 'bg-black/30 backdrop-blur-xl text-white hover:bg-white/10 transition-all border border-white/10 shadow-2xl active:scale-90'}`}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className={`w-4 h-4 ${isRetro ? '' : 'fill-white'}`} /> : <Pause className={`w-4 h-4 ${isRetro ? '' : 'fill-white'}`} />}
          </button>
          <button
            onClick={startGame}
            className={`rounded-xl p-2.5 ${isRetro ? 'retro-btn' : 'bg-black/30 backdrop-blur-xl text-white hover:bg-white/10 transition-all border border-white/10 shadow-2xl active:scale-90'}`}
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={stopGame}
            className={`rounded-xl p-2.5 ${isRetro ? 'retro-btn' : 'bg-black/30 backdrop-blur-xl text-white hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10 shadow-2xl active:scale-90'}`}
            title="Quit Game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Game Area */}
        <div className={`flex flex-col lg:flex-row items-center justify-center gap-0 lg:gap-12 w-full z-10 mt-2 lg:mt-8 ${isPaused ? 'blur-md pointer-events-none' : ''}`}>
          {centerCard && <Card data={centerCard} onClick={handleSymbolClick} label="Target" feedback={feedback} isRetro={isRetro} />}
          <div className="-mt-6 lg:mt-0">
            {playerCard && <Card data={playerCard} onClick={handleSymbolClick} feedback={feedback} isRetro={isRetro} />}
          </div>
        </div>

        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 z-30 flex items-center justify-center p-4 ${isRetro ? 'bg-black/80' : 'bg-black/60 backdrop-blur-sm'}`}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={`p-8 rounded-[2rem] text-center max-w-sm w-full shadow-2xl ${isRetro ? 'retro-panel rounded-xl' : 'bg-white'}`}
              >
                <h2 className={`text-3xl font-black mb-6 ${isRetro ? 'retro-title text-xl text-[var(--retro-text)]' : 'text-gray-900'}`}>Game Paused</h2>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setIsPaused(false)}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${isRetro ? 'retro-btn text-xs' : 'bg-purple-600 text-white text-xl hover:bg-purple-700 transition shadow-lg'}`}
                  >
                    <Play className="w-6 h-6" />
                    Resume Game
                  </button>
                  <button
                    onClick={startGame}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${isRetro ? 'retro-btn text-xs' : 'bg-gray-100 text-gray-900 text-xl hover:bg-gray-200 transition'}`}
                  >
                    <RotateCcw className="w-6 h-6" />
                    Restart
                  </button>
                  <button
                    onClick={stopGame}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${isRetro ? 'retro-btn text-xs text-[var(--retro-red)]' : 'bg-red-50 text-red-600 text-xl hover:bg-red-100 transition'}`}
                  >
                    <X className="w-6 h-6" />
                    Quit to Menu
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex items-center justify-center z-50 p-4 ${isRetro ? 'bg-black/80' : 'bg-black/60 backdrop-blur-sm'}`}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={`p-8 md:p-12 rounded-[2rem] text-center max-w-sm w-full shadow-2xl ${isRetro ? 'retro-panel rounded-xl' : 'bg-white'}`}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isRetro ? 'bg-[var(--retro-bg)] border-2 border-[var(--retro-gold)]' : 'bg-yellow-100'}`}>
                  <Trophy className={`w-10 h-10 ${isRetro ? 'text-[var(--retro-gold)]' : 'text-yellow-500'}`} />
                </div>
                <h2 className={`text-4xl font-black mb-2 ${isRetro ? 'retro-title text-2xl text-[var(--retro-text)]' : 'text-gray-900'}`}>Time's Up!</h2>
                <div className="flex flex-col items-center mb-6">
                  <div className={`text-sm uppercase tracking-widest font-bold mb-1 ${isRetro ? 'text-[var(--retro-text-dim)] text-[8px]' : 'text-gray-500'}`}>Matches Found</div>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={isRetro ? { duration: 0.2 } : { type: "spring", stiffness: 200, damping: 10 }}
                    className={`text-7xl font-black drop-shadow-sm flex justify-center ${isRetro ? 'retro-gold text-5xl' : 'text-purple-600'}`}
                  >
                    <AnimatedCounter value={score} fontSize={isRetro ? 48 : 72} />
                  </motion.div>
                </div>

                <div className="mb-8 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex gap-2 mb-3">
                    {(['my', 'global'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setLeaderboardTab(t); if (t === 'global' && globalLeaderboard.length === 0) fetchGlobalLeaderboard(); }}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition ${
                          isRetro
                            ? leaderboardTab === t ? 'retro-btn' : 'bg-[var(--retro-bg)] text-[var(--retro-text-dim)] border border-[var(--retro-border)]'
                            : leaderboardTab === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {t === 'my' ? 'My Scores' : 'Global'}
                      </button>
                    ))}
                  </div>

                  {leaderboardTab === 'my' ? (
                    <div className="text-left">
                      <div className="space-y-1">
                        {leaderboard.map((entry, idx) => (
                          <div
                            key={entry.id}
                            onClick={() => {
                              setProfileName(entry.name);
                              localStorage.setItem('dobble_profile', entry.name);
                            }}
                            className={`flex items-center justify-between text-sm cursor-pointer p-1.5 rounded-lg transition-colors group ${isRetro ? 'hover:bg-[var(--retro-bg)]' : 'hover:bg-gray-50'}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-4 font-bold text-xs ${isRetro ? 'text-[var(--retro-text-dim)]' : 'text-gray-400'}`}>{idx + 1}</span>
                              <span className={`font-medium ${isRetro ? (entry.name === profileName ? 'text-[var(--retro-cyan)]' : 'text-[var(--retro-text)]') : (entry.name === profileName ? 'text-purple-600 font-bold' : 'text-gray-700 group-hover:text-purple-600')}`}>{entry.name}</span>
                            </div>
                            <span className={`font-black ${isRetro ? 'text-[var(--retro-gold)]' : 'text-gray-900'}`}>{entry.highScore || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-left">
                      {globalLeaderboard.length === 0 ? (
                        <div className={`p-4 text-sm text-center ${isRetro ? 'text-[var(--retro-text-dim)]' : 'text-gray-400'}`}>
                          {globalLoading ? 'Loading...' : 'No scores yet'}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {globalLeaderboard.map((entry) => (
                            <div
                              key={entry.id}
                              className={`flex items-center justify-between text-sm p-1.5 rounded-lg ${
                                isRetro
                                  ? `${entry.userId === user?.uid ? 'bg-[var(--retro-bg)] border-l-2 border-l-[var(--retro-cyan)]' : ''}`
                                  : `${entry.userId === user?.uid ? 'bg-purple-50 border-l-2 border-l-purple-400' : ''}`
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-4 font-bold text-xs ${isRetro ? (entry.rank === 1 ? 'text-[var(--retro-gold)]' : 'text-[var(--retro-text-dim)]') : (entry.rank === 1 ? 'text-yellow-500' : 'text-gray-400')}`}>{entry.rank}</span>
                                <span className={`font-medium truncate max-w-[120px] ${isRetro ? 'text-[var(--retro-text)]' : 'text-gray-700'}`}>{entry.profileName}</span>
                              </div>
                              <span className={`font-black ${isRetro ? 'text-[var(--retro-gold)]' : 'text-gray-900'}`}>{entry.score}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={startGame}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${isRetro ? 'retro-btn text-sm' : 'bg-purple-600 text-white text-xl hover:bg-purple-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1'}`}
                >
                  <RotateCcw className="w-6 h-6" />
                  Play Again
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const DEFAULT_COUNTER_FONT_SIZE = 14;
const DEFAULT_COUNTER_PADDING = 4;

function AnimatedCounter({ value, fontSize = DEFAULT_COUNTER_FONT_SIZE }: { value: number, fontSize?: number }) {
  const height = fontSize + (fontSize * 0.3); // Proportional padding
  return (
    <div
      style={{ fontSize, height }}
      className="flex overflow-hidden leading-none text-inherit font-bold"
    >
      <Digit place={10} value={value} fontSize={fontSize} />
      <Digit place={1} value={value} fontSize={fontSize} />
    </div>
  );
}

function Digit({ place, value, fontSize }: { place: number; value: number, fontSize: number }) {
  const height = fontSize + (fontSize * 0.3);
  let valueRoundedToPlace = Math.floor(value / place);
  let animatedValue = useSpring(valueRoundedToPlace, {
    stiffness: 100,
    damping: 15,
  });

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <div style={{ height }} className="relative w-[1ch] tabular-nums">
      {[...Array(10).keys()].map((i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </div>
  );
}

function Number({ mv, number, height }: { mv: MotionValue; number: number, height: number }) {
  let y = useTransform(mv, (latest) => {
    let placeValue = latest % 10;
    let offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) {
      memo -= 10 * height;
    }
    return memo;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {number}
    </motion.span>
  );
}

function StatsPanel({ onBack }: { onBack: () => void }) {
  const [stats, setStats] = useState<{
    totalGames: number;
    uniquePlayers: number;
    avgScore: number;
    maxScore: number;
    gamesPerDay: Record<string, number>;
    playerBreakdown: Record<string, { games: number; bestScore: number; worstScore: number; totalScore: number; totalCorrect: number; totalIncorrect: number; lastPlayed: string }>;
    firstGame: string;
    totalDays: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDocs(query(collection(db, 'scores'), orderBy('score', 'desc')));
        const scores = snapshot.docs.map(d => ({ ...d.data() })) as any[];

        const uniqueUserIds = new Set(scores.map(s => s.userId));
        const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length : 0;
        const maxScore = scores.length > 0 ? scores[0].score : 0;

        const gamesPerDay: Record<string, number> = {};
        const playerBreakdown: Record<string, { games: number; bestScore: number; worstScore: number; totalScore: number; totalCorrect: number; totalIncorrect: number; lastPlayed: string }> = {};

        let earliestDate = new Date();
        scores.forEach(s => {
          const date = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
          const dayKey = date.toISOString().split('T')[0];
          gamesPerDay[dayKey] = (gamesPerDay[dayKey] || 0) + 1;
          if (date < earliestDate) earliestDate = date;

          const playerKey = s.profileName || 'Unknown';
          const sc = s.score || 0;
          if (!playerBreakdown[playerKey]) {
            playerBreakdown[playerKey] = { games: 0, bestScore: 0, worstScore: Infinity, totalScore: 0, totalCorrect: 0, totalIncorrect: 0, lastPlayed: '' };
          }
          const p = playerBreakdown[playerKey];
          p.games++;
          p.totalScore += sc;
          if (sc > p.bestScore) p.bestScore = sc;
          if (sc < p.worstScore) p.worstScore = sc;
          p.totalCorrect += s.correctClicks || 0;
          p.totalIncorrect += s.incorrectClicks || 0;
          if (!p.lastPlayed || dayKey > p.lastPlayed) p.lastPlayed = dayKey;
        });
        // Fix Infinity for players with no games
        Object.values(playerBreakdown).forEach(p => { if (p.worstScore === Infinity) p.worstScore = 0; });

        const totalDays = Math.max(1, Math.ceil((Date.now() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)));

        setStats({
          totalGames: scores.length,
          uniquePlayers: uniqueUserIds.size,
          avgScore: Math.round(avgScore * 10) / 10,
          maxScore,
          gamesPerDay,
          playerBreakdown,
          firstGame: earliestDate.toISOString().split('T')[0],
          totalDays,
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Monetization estimates based on industry benchmarks
  const getMonetizationEstimate = () => {
    if (!stats) return null;
    const dailyActiveUsers = stats.totalGames / stats.totalDays;
    const monthlyActiveUsers = Math.min(stats.uniquePlayers, dailyActiveUsers * 30);

    // Industry benchmarks for casual mobile games
    const adRevenuePerDAU = 0.05; // $0.03-0.08 per DAU/day for casual games (rewarded ads + banners)
    const iapConversionRate = 0.02; // 2% of players buy something
    const avgIapSpend = 4.99; // Average in-app purchase
    const subscriptionRate = 0.01; // 1% convert to premium
    const subscriptionPrice = 2.99; // Monthly premium price

    return {
      dailyAdRevenue: dailyActiveUsers * adRevenuePerDAU,
      monthlyAdRevenue: dailyActiveUsers * adRevenuePerDAU * 30,
      potentialIapRevenue: monthlyActiveUsers * iapConversionRate * avgIapSpend,
      potentialSubRevenue: monthlyActiveUsers * subscriptionRate * subscriptionPrice,
      totalMonthlyPotential: (dailyActiveUsers * adRevenuePerDAU * 30) +
        (monthlyActiveUsers * iapConversionRate * avgIapSpend) +
        (monthlyActiveUsers * subscriptionRate * subscriptionPrice),
      dailyActiveUsers: Math.round(dailyActiveUsers * 10) / 10,
      monthlyActiveUsers: Math.round(monthlyActiveUsers),
    };
  };

  const money = getMonetizationEstimate();
  const sortedDays = stats ? Object.entries(stats.gamesPerDay).sort(([a], [b]) => b.localeCompare(a)).slice(0, 14) : [];
  const sortedPlayers = stats ? Object.entries(stats.playerBreakdown).sort(([, a], [, b]) => b.games - a.games) : [];
  const maxDayGames = sortedDays.length > 0 ? Math.max(...sortedDays.map(([, v]) => v)) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">Match It Analytics</h1>
            <p className="text-white/50 text-sm mt-1">Admin Dashboard</p>
          </div>
          <button onClick={onBack} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-bold">
            Back to Game
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/50">Loading analytics...</div>
        ) : !stats || stats.totalGames === 0 ? (
          <div className="text-center py-20 text-white/50">No game data yet. Play some games first!</div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Games', value: stats.totalGames, icon: '🎮' },
                { label: 'Unique Players', value: stats.uniquePlayers, icon: '👤' },
                { label: 'Avg Score', value: stats.avgScore, icon: '📊' },
                { label: 'Best Score', value: stats.maxScore, icon: '🏆' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-2xl md:text-3xl font-black">{value}</div>
                  <div className="text-white/40 text-xs font-bold uppercase tracking-wider mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Activity Timeline */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm">
              <h2 className="text-lg font-bold mb-1">Activity (Last 14 Days)</h2>
              <p className="text-white/40 text-xs mb-4">Since {stats.firstGame} ({stats.totalDays} days)</p>
              <div className="flex items-end gap-1 h-24">
                {sortedDays.reverse().map(([day, count]) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-purple-500/60 rounded-t-sm min-h-[2px] transition-all"
                      style={{ height: `${(count / maxDayGames) * 100}%` }}
                    />
                    <span className="text-[7px] text-white/30 -rotate-45 origin-left whitespace-nowrap">{day.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Profiles */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm">
              <h2 className="text-lg font-bold mb-4">Player Profiles</h2>
              <div className="space-y-4">
                {sortedPlayers.map(([name, data]) => {
                  const avgScore = data.games > 0 ? Math.round((data.totalScore / data.games) * 10) / 10 : 0;
                  const totalAttempts = data.totalCorrect + data.totalIncorrect;
                  const hitRate = totalAttempts > 0 ? Math.round((data.totalCorrect / totalAttempts) * 100) : null;
                  return (
                    <div key={name} className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-600/50 flex items-center justify-center text-lg font-bold">
                            {name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold">{name}</div>
                            <div className="text-white/40 text-xs">Last played: {data.lastPlayed}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-black">{data.games}</div>
                          <div className="text-white/40 text-[10px] uppercase tracking-wider">games</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-black/20 rounded-lg p-2.5">
                          <div className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">Best</div>
                          <div className="font-black text-green-400">{data.bestScore}</div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2.5">
                          <div className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">Worst</div>
                          <div className="font-black text-red-400">{data.worstScore}</div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2.5">
                          <div className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">Avg Score</div>
                          <div className="font-black">{avgScore}</div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2.5">
                          <div className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">Hit Rate</div>
                          <div className="font-black">{hitRate !== null ? `${hitRate}%` : '—'}</div>
                        </div>
                      </div>
                      {totalAttempts > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${hitRate}%` }} />
                          </div>
                          <span className="text-[10px] text-white/40">{data.totalCorrect}✓ {data.totalIncorrect}✗</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monetization Estimates */}
            {money && (
              <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/20 rounded-2xl p-6 mb-8">
                <h2 className="text-lg font-bold mb-1">Monetization Potential</h2>
                <p className="text-white/40 text-xs mb-4">
                  Based on ~{money.dailyActiveUsers} DAU, {money.monthlyActiveUsers} MAU, casual game benchmarks
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-green-400 text-xs font-bold uppercase tracking-wider mb-1">Ad Revenue</div>
                    <div className="text-xl font-black">${money.monthlyAdRevenue.toFixed(2)}<span className="text-sm font-normal text-white/40">/mo</span></div>
                    <div className="text-white/30 text-xs mt-1">Rewarded ads + banners @ $0.05/DAU/day</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">In-App Purchases</div>
                    <div className="text-xl font-black">${money.potentialIapRevenue.toFixed(2)}<span className="text-sm font-normal text-white/40">/mo</span></div>
                    <div className="text-white/30 text-xs mt-1">2% conversion @ $4.99 avg purchase</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">Subscriptions</div>
                    <div className="text-xl font-black">${money.potentialSubRevenue.toFixed(2)}<span className="text-sm font-normal text-white/40">/mo</span></div>
                    <div className="text-white/30 text-xs mt-1">1% convert @ $2.99/mo premium</div>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                  <span className="text-white/60 font-bold text-sm">Total Monthly Potential</span>
                  <span className="text-2xl font-black text-green-400">${money.totalMonthlyPotential.toFixed(2)}</span>
                </div>
                <p className="text-white/20 text-[10px] mt-3">
                  Estimates based on casual game industry averages. Actual results depend on ad network, placement, user engagement, and retention.
                  Add Cloudflare Web Analytics for accurate visit/pageview data.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <DobbleGame />
    </ErrorBoundary>
  );
}
