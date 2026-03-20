import * as React from 'react';
import { useState, useEffect, useCallback, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence, MotionValue, useSpring, useTransform } from 'framer-motion';
import { ShimmerButton } from './components/ShimmerButton';
import { MagnetizeButton } from './components/MagnetizeButton';
import { ParticleButton } from './components/ParticleButton';
import { Play, Pause, RotateCcw, Trophy, Clock, User as UserIcon, Plus, ChevronRight, X, Pencil, Trash2, LogOut, Dices, Palette, User, RefreshCw } from 'lucide-react';
import { LimelightNav } from './components/LimelightNav';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { generateDobbleDeck, shuffleDeck } from './utils/dobbleLogic';
import { 
  db, 
  doc, 
  setDoc, 
  getDoc, 
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

type Theme = 'standard' | 'nature' | 'fruits' | 'custom';

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

const Card = ({ data, onClick, label, feedback }: { data: any[], onClick: (s: string) => void, label?: string, feedback?: 'correct' | 'incorrect' | null }) => {
  return (
    <div className="relative flex flex-col items-center">
      {label && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black/40 text-white px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase backdrop-blur-md border border-white/10 shadow-sm z-20">
          {label}
        </div>
      )}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
        animate={{ 
          opacity: 1, 
          rotate: 0,
          borderColor: feedback === 'correct' ? '#4ade80' : feedback === 'incorrect' ? '#ef4444' : 'white'
        }}
        transition={{ duration: 0.2 }}
        key={data.map(d => d.symbol).join('')}
        className="relative w-[50vh] h-[50vh] md:w-[38vh] md:h-[38vh] lg:w-[550px] lg:h-[550px] max-w-[95vw] bg-[#fdfdfd] rounded-full card-shadow border-[8px] sm:border-[12px] overflow-hidden transition-all"
      >
        {data.map((item) => (
          <div
            key={item.symbol}
            onClick={() => onClick(item.symbol)}
            className="absolute flex items-center justify-center cursor-pointer select-none"
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
                  className="w-full h-full object-cover rounded-full border-4 border-white shadow-[0_4px_10px_rgba(0,0,0,0.3)] bg-white"
                  referrerPolicy="no-referrer"
                />
                {/* Sticker "cut-out" effect overlay */}
                <div className="absolute inset-0 rounded-full border-2 border-white/50 pointer-events-none" />
              </div>
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
  const [user, setUser] = useState<any>(null);
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
  const [profileName, setProfileName] = useState<string>(() => localStorage.getItem('dobble_profile') || '');
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
  const [customThemeName, setCustomThemeName] = useState('');
  const [customThemeIcon, setCustomThemeIcon] = useState('✨');
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [themeToDelete, setThemeToDelete] = useState<any | null>(null);
  const [builderTab, setBuilderTab] = useState<'library' | 'selection'>('selection');

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

  const saveScore = async (finalScore: number) => {
    if (!profileName || !user) return;
    try {
      await addDoc(collection(db, 'scores'), {
        profileName,
        userId: user.uid,
        score: finalScore,
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
  };

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
      saveScore(score);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isPaused, timeLeft]);

  const startGame = useCallback((themeOverride?: string | React.MouseEvent) => {
    const activeTheme = typeof themeOverride === 'string' ? themeOverride : theme;
    let symbols: string[] = [];
    if (activeTheme === 'standard') symbols = EMOJIS;
    else if (activeTheme === 'nature') symbols = NATURE_EMOJIS;
    else if (activeTheme === 'fruits') symbols = FRUIT_EMOJIS;
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
      setScore(s => s + 1);
      
      setTimeout(() => {
        if (deck.length === 0) {
          setGameOver(true);
          setIsPlaying(false);
          saveScore(score + 1);
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
      setTimeout(() => setFeedback(null), 400);
    }
  }, [deck, playerCard, centerCard, gameOver, isPlaying, score, profileName]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center p-4 font-sans">
        <div className="bg-white/10 backdrop-blur-lg p-8 md:p-12 rounded-[2rem] text-center max-w-md w-full shadow-2xl border border-white/20">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-5xl">🎯</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
            MATCH IT
          </h1>
          <p className="text-white/80 mb-8 text-lg leading-relaxed">
            Please sign in to save your profiles, custom themes, and high scores!
          </p>
          <button 
            onClick={handleLogin}
            className="w-full py-5 bg-white text-purple-600 rounded-2xl font-black text-xl hover:bg-gray-100 transition shadow-xl transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3"
          >
            <UserIcon className="w-6 h-6" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (!profileName || isCreatingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex flex-col items-center justify-start pt-12 md:pt-20 p-4 font-sans">
        <div className="bg-white/10 backdrop-blur-lg p-6 md:p-8 rounded-[2rem] text-center max-w-md w-full shadow-2xl border border-white/20">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserIcon className="w-8 h-8 text-purple-600" />
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex flex-col items-center p-4 font-sans">
        <div className="bg-white/10 backdrop-blur-lg p-3 rounded-[2rem] w-full max-w-md shadow-2xl border border-white/20 flex flex-col h-[98vh] max-h-[1200px]">
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex flex-col items-center justify-start pt-4 md:pt-8 p-4 font-sans relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
          
          {/* Hero Title Section */}
          <div className="text-center mb-4 md:mb-6">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-1 flex items-center justify-center gap-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FFD26F] via-[#FF8A8A] to-[#FF6B6B] drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]">MATCH</span>
              <span className="text-[#A5D8FF] drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]">IT</span>
            </h1>
            <p className="text-white text-lg md:text-xl font-medium opacity-90 whitespace-nowrap">
              find the matching symbol in 60 seconds
            </p>
          </div>

          {/* Hero Graphic (Refined recreation) */}
          <div className="relative w-full h-[220px] md:h-[320px] flex items-center justify-center mb-2 md:mb-4 perspective-1000">
            {/* Left Card */}
            <motion.div 
              initial={{ x: -60, opacity: 0, rotate: -8 }}
              animate={{ x: 0, opacity: 1, rotate: -8 }}
              whileHover={{ rotate: -5, scale: 1.02 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute left-1/2 -translate-x-[90%] w-[180px] h-[180px] md:w-[280px] md:h-[280px] bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-8 border-white/30 flex items-center justify-center overflow-hidden"
              style={{ 
                background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f0f0 100%)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05), 0 20px 50px rgba(0,0,0,0.3)'
              }}
            >
              <div className="relative w-full h-full p-8">
                <span className="absolute top-[15%] left-[20%] text-3xl md:text-5xl drop-shadow-sm">🇸🇽</span>
                <span className="absolute top-[20%] right-[20%] text-4xl md:text-6xl rotate-12 drop-shadow-sm">🦁</span>
                <span className="absolute bottom-[20%] left-[20%] text-3xl md:text-5xl -rotate-12 drop-shadow-sm">🍕</span>
                <span className="absolute bottom-[20%] right-[20%] text-3xl md:text-5xl rotate-6 drop-shadow-sm">🚲</span>
                
                {/* Matching Symbol with Enhanced Glow */}
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    {/* Two gold circles around matching item */}
                    <div className="absolute inset-0 -m-3 border-2 border-yellow-400 rounded-full" />
                    <div className="absolute inset-0 -m-5 border-2 border-yellow-400 rounded-full" />
                    <span className="text-6xl md:text-8xl relative z-10 drop-shadow-md">🔥</span>
                    <motion.div 
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 -m-6 border-4 border-cyan-400 rounded-full blur-md"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      className="absolute inset-0 -m-10 border-2 border-cyan-300 rounded-full blur-xl"
                    />
                  </div>
                </div>
              </div>
              {/* Glossy Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none"></div>
            </motion.div>

            {/* Right Card */}
            <motion.div 
              initial={{ x: 60, opacity: 0, rotate: 8 }}
              animate={{ x: 0, opacity: 1, rotate: 8 }}
              whileHover={{ rotate: 5, scale: 1.02 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="absolute left-1/2 -translate-x-[10%] w-[180px] h-[180px] md:w-[280px] md:h-[280px] bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-8 border-white/30 flex items-center justify-center overflow-hidden"
              style={{ 
                background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f0f0 100%)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05), 0 20px 50px rgba(0,0,0,0.3)'
              }}
            >
              <div className="relative w-full h-full p-8">
                <span className="absolute top-[15%] left-[20%] text-4xl md:text-6xl -rotate-12 drop-shadow-sm">⭐</span>
                <span className="absolute top-[20%] right-[20%] text-3xl md:text-5xl rotate-6 drop-shadow-sm">🍓</span>
                <span className="absolute bottom-[20%] left-[20%] text-4xl md:text-6xl rotate-12 drop-shadow-sm">🐶</span>
                <span className="absolute bottom-[20%] right-[20%] text-3xl md:text-5xl -rotate-6 drop-shadow-sm">🍆</span>

                
                {/* Matching Symbol with Enhanced Glow */}
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    {/* Two gold circles around matching item */}
                    <div className="absolute inset-0 -m-2 border-2 border-yellow-400 rounded-full" />
                    <div className="absolute inset-0 -m-4 border-2 border-yellow-400 rounded-full" />
                    <span className="text-4xl md:text-6xl relative z-10 drop-shadow-md">🔥</span>
                    <motion.div 
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 -m-6 border-4 border-cyan-400 rounded-full blur-md"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      className="absolute inset-0 -m-10 border-2 border-cyan-300 rounded-full blur-xl"
                    />
                  </div>
                </div>
              </div>
              {/* Glossy Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none"></div>
            </motion.div>
          </div>

          {/* Controls Section - Container removed as requested */}
          <div className="w-full max-w-md text-center">
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

            {/* Playing As Card */}
            <div className="flex items-center justify-between bg-white/10 p-2 rounded-2xl border border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold shadow-inner">
                  {profileName[0]?.toUpperCase() || 'P'}
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-white font-bold text-sm leading-tight">{profileName}</div>
                  <div className="text-white/40 text-[8px] font-bold uppercase tracking-[0.2em]">Top Score: {leaderboard.filter(entry => entry.name === profileName).reduce((max, entry) => Math.max(max, entry.highScore || 0), 0)}</div>
                </div>
              </div>
              <button 
                onClick={switchProfile}
                className="text-white/60 hover:text-white transition p-1.5 rounded-xl hover:bg-white/10"
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
              <ParticleButton 
                onClick={() => setTheme('standard')}
                className={`w-full py-3 rounded-xl font-bold transition flex flex-col items-center gap-1 border-2 ${theme === 'standard' ? 'bg-white text-purple-600 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
              >
                <span className="text-2xl">🦁</span>
                <span className="text-[10px] uppercase tracking-widest">Standard</span>
              </ParticleButton>
              <button 
                onClick={() => setTheme('nature')}
                className={`w-full py-3 rounded-xl font-bold transition flex flex-col items-center gap-1 border-2 ${theme === 'nature' ? 'bg-white text-purple-600 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
              >
                <span className="text-2xl">🌸</span>
                <span className="text-[10px] uppercase tracking-widest">Nature</span>
              </button>
              <button 
                onClick={() => setTheme('fruits')}
                className={`w-full py-3 rounded-xl font-bold transition flex flex-col items-center gap-1 border-2 ${theme === 'fruits' ? 'bg-white text-purple-600 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
              >
                <span className="text-2xl">🍓</span>
                <span className="text-[10px] uppercase tracking-widest">Fruits</span>
              </button>
              <MagnetizeButton 
                onClick={() => setIsBuildingTheme(true)}
                className={`w-full py-3 rounded-xl font-bold transition flex flex-col items-center gap-1 border-2 ${theme === 'custom' ? 'bg-white text-purple-600 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
              >
                <Plus className="w-8 h-8 mb-0" />
                <span className="text-[10px] uppercase tracking-widest">Build</span>
              </MagnetizeButton>
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
                    <Leaderboard data={leaderboard} />
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
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
                >
                  <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Profile?</h3>
                  <p className="text-gray-500 mb-8">
                    Are you sure you want to delete <span className="font-bold text-gray-900">"{profileToDelete}"</span>?
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setProfileToDelete(null)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">CANCEL</button>
                    <button onClick={() => { handleDeleteProfile(profileToDelete); setProfileToDelete(null); }} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold">DELETE</button>
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

      {/* Main Game Container */}
      <div className="relative w-full max-w-lg md:max-w-4xl lg:max-w-6xl flex flex-col items-center justify-start p-4">
        
        {/* Header Stats */}
        <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start z-20 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-1.5 flex items-center gap-2 border border-white/10 shadow-2xl">
              <div className="bg-yellow-400 p-1.5 rounded-lg shadow-lg shadow-yellow-400/20">
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

          <div className="bg-black/30 backdrop-blur-xl rounded-xl p-1.5 flex items-center gap-2 border border-white/10 shadow-2xl pointer-events-auto">
            <div className="text-right">
              <div className="text-white/50 text-[8px] font-black uppercase tracking-[0.2em] mb-0">Time</div>
              <div className={`font-black text-sm leading-none ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {timeLeft}s
              </div>
            </div>
            <div className={`p-1.5 rounded-lg shadow-lg ${timeLeft <= 10 ? 'bg-red-400/20 text-red-400 shadow-red-400/10' : 'bg-blue-400/20 text-blue-400 shadow-blue-400/10'}`}>
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Vertical Control Bar */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="bg-black/30 backdrop-blur-xl rounded-xl p-2.5 text-white hover:bg-white/10 transition-all border border-white/10 shadow-2xl active:scale-90 group"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
          </button>
          <button 
            onClick={startGame}
            className="bg-black/30 backdrop-blur-xl rounded-xl p-2.5 text-white hover:bg-white/10 transition-all border border-white/10 shadow-2xl active:scale-90"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={stopGame}
            className="bg-black/30 backdrop-blur-xl rounded-xl p-2.5 text-white hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10 shadow-2xl active:scale-90"
            title="Quit Game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Game Area */}
        <div className={`flex flex-col lg:flex-row items-center justify-center gap-0 lg:gap-12 w-full z-10 mt-2 lg:mt-8 ${isPaused ? 'blur-md pointer-events-none' : ''}`}>
          {centerCard && <Card data={centerCard} onClick={handleSymbolClick} label="Target" feedback={feedback} />}
          <div className="-mt-6 lg:mt-0">
            {playerCard && <Card data={playerCard} onClick={handleSymbolClick} feedback={feedback} />}
          </div>
        </div>

        <AnimatePresence>
          {isPaused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white p-8 rounded-[2rem] text-center max-w-sm w-full shadow-2xl"
              >
                <h2 className="text-3xl font-black text-gray-900 mb-6">Game Paused</h2>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setIsPaused(false)}
                    className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-xl hover:bg-purple-700 transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <Play className="w-6 h-6" />
                    Resume Game
                  </button>
                  <button 
                    onClick={startGame}
                    className="w-full py-4 bg-gray-100 text-gray-900 rounded-xl font-bold text-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-6 h-6" />
                    Restart
                  </button>
                  <button 
                    onClick={stopGame}
                    className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-bold text-xl hover:bg-red-100 transition flex items-center justify-center gap-2"
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white p-8 md:p-12 rounded-[2rem] text-center max-w-sm w-full shadow-2xl"
              >
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-10 h-10 text-yellow-500" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-2">Time's Up!</h2>
                <div className="flex flex-col items-center mb-6">
                  <div className="text-gray-500 text-sm uppercase tracking-widest font-bold mb-1">Matches Found</div>
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="text-7xl font-black text-purple-600 drop-shadow-sm flex justify-center"
                  >
                    <AnimatedCounter value={score} fontSize={72} />
                  </motion.div>
                </div>
                
                <div className="mb-8 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="text-left">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-px flex-1 bg-gray-100"></div>
                      <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">Leaderboard</h3>
                      <div className="h-px flex-1 bg-gray-100"></div>
                    </div>
                    <div className="space-y-1">
                      {leaderboard.map((entry, idx) => (
                        <div 
                          key={entry.id} 
                          onClick={() => {
                            setProfileName(entry.name);
                            localStorage.setItem('dobble_profile', entry.name);
                          }}
                          className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-4 text-gray-400 font-bold text-xs">{idx + 1}</span>
                            <span className={`font-medium ${entry.name === profileName ? 'text-purple-600 font-bold' : 'text-gray-700 group-hover:text-purple-600'}`}>{entry.name}</span>
                          </div>
                          <span className="font-black text-gray-900">{entry.highScore || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-xl hover:bg-purple-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
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

export default function App() {
  return (
    <ErrorBoundary>
      <DobbleGame />
    </ErrorBoundary>
  );
}
