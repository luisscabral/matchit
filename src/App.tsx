import * as React from 'react';
import { useState, useEffect, useCallback, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Trophy, Clock, User as UserIcon, Plus, ChevronRight, X, Pencil, Trash2 } from 'lucide-react';
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
  serverTimestamp 
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

type Theme = 'standard' | 'nature' | 'fruits';

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
    const scale = 1.0;
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
    <div className="flex flex-col items-center">
      {label && (
        <div className="bg-black/20 text-white px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest mb-1 uppercase backdrop-blur-md border border-white/10 shadow-sm">
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
        className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] bg-[#fdfdfd] rounded-full card-shadow border-[8px] overflow-hidden transition-colors"
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
              fontSize: '3.6rem',
              width: '4.5rem',
              height: '4.5rem',
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
  <div className="mt-8 text-left w-full">
    <h3 className="text-white font-black text-xl mb-4 flex items-center gap-2">
      <Trophy className="w-5 h-5 text-yellow-400" />
      TOP 10 PLAYERS
    </h3>
    <div className="bg-black/20 rounded-2xl overflow-hidden border border-white/10 backdrop-blur-md">
      {data.slice(0, 10).map((entry, idx) => (
        <div 
          key={entry.id} 
          className={`flex items-center justify-between p-3 border-b border-white/5 last:border-0 ${idx === 0 ? 'bg-yellow-400/10' : ''}`}
        >
          <div className="flex items-center gap-3">
            <span className={`w-6 text-center font-bold ${idx === 0 ? 'text-yellow-400' : 'text-white/40'}`}>{idx + 1}</span>
            <span className="text-white font-medium truncate max-w-[150px]">{entry.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-black">{entry.highScore}</span>
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
}) => (
  <div className="mt-8 w-full">
    <div className="flex items-center gap-2 mb-6">
      <div className="h-[1px] flex-1 bg-white/20"></div>
      <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
        {onCreateNew ? 'Select or Create Profile' : 'Switch Profile'}
      </span>
      <div className="h-[1px] flex-1 bg-white/20"></div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
      {onCreateNew && (
        <button
          onClick={onCreateNew}
          className="bg-white/20 hover:bg-white/30 border-2 border-dashed border-white/30 rounded-2xl p-4 text-white font-bold transition-all flex flex-col items-center justify-center gap-2 group shadow-lg active:scale-95 h-full min-h-[100px]"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] uppercase tracking-wider">New Profile</span>
        </button>
      )}
      {profiles.map((profile) => (
        <div key={profile.id} className="relative group">
          <button
            onClick={() => onSelect(profile.name)}
            className={`w-full border rounded-2xl p-4 text-white font-bold transition-all flex flex-col items-center gap-2 shadow-lg active:scale-95 min-h-[100px] ${
              profile.name === currentProfile 
                ? 'bg-white text-purple-600 border-white scale-105 z-10' 
                : 'bg-white/10 hover:bg-white/20 border-white/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner transition-transform group-hover:scale-110 ${
              profile.name === currentProfile ? 'bg-purple-100 text-purple-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {profile.name[0].toUpperCase()}
            </div>
            <span className="truncate w-full text-xs">{profile.name}</span>
            {profile.name === currentProfile && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            )}
          </button>
          
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(profile);
              }}
              className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white backdrop-blur-sm transition-colors"
              title="Edit Profile"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete profile "${profile.name}"?`)) {
                  onDelete(profile.name);
                }
              }}
              className="p-1.5 bg-red-500/50 hover:bg-red-500 rounded-lg text-white backdrop-blur-sm transition-colors"
              title="Delete Profile"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

function DobbleGame() {
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

  useEffect(() => {
    const q = query(collection(db, 'profiles'), orderBy('highScore', 'desc'), limit(30));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(profiles);
    });
    return () => unsubscribe();
  }, []);

  const saveScore = async (finalScore: number) => {
    if (!profileName) return;
    try {
      await addDoc(collection(db, 'scores'), {
        profileName,
        score: finalScore,
        timestamp: serverTimestamp(),
      });
      
      // Update high score in profile
      const profileRef = doc(db, 'profiles', profileName);
      const profileDoc = await getDoc(profileRef);
      if (profileDoc.exists()) {
        const currentHighScore = profileDoc.data().highScore || 0;
        if (finalScore > currentHighScore) {
          await setDoc(profileRef, { highScore: finalScore, lastPlayed: new Date().toISOString() }, { merge: true });
        }
      } else {
        await setDoc(profileRef, { name: profileName, highScore: finalScore, lastPlayed: new Date().toISOString() });
      }
    } catch (err) {
      console.error('Error saving score:', err);
    }
  };

  const handleCreateProfile = async () => {
    if (newName.trim()) {
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
          const oldRef = doc(db, 'profiles', editingProfile.name);
          const newRef = doc(db, 'profiles', name);
          
          const profileData = {
            ...editingProfile,
            name: name,
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
        setProfileName(name);
        localStorage.setItem('dobble_profile', name);
      }
      
      setIsCreatingProfile(false);
      setEditingProfile(null);
      setNewName('');
    }
  };

  const handleDeleteProfile = async (name: string) => {
    try {
      await deleteDoc(doc(db, 'profiles', name));
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

  const startGame = useCallback(() => {
    let symbols: string[] = [];
    if (theme === 'standard') symbols = EMOJIS;
    else if (theme === 'nature') symbols = NATURE_EMOJIS;
    else symbols = FRUIT_EMOJIS;

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
  }, [theme]);

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

  if (!profileName || isCreatingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center p-4 font-sans">
        <div className="bg-white/10 backdrop-blur-lg p-8 md:p-12 rounded-[2rem] text-center max-w-md w-full shadow-2xl border border-white/20">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <UserIcon className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-black text-white mb-6 tracking-tight">
            {editingProfile ? 'Edit Profile' : isCreatingProfile ? 'New Profile' : 'Who is playing?'}
          </h1>
          
          <AnimatePresence mode="wait">
            {isCreatingProfile || editingProfile ? (
              <motion.div 
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="relative">
                  <input 
                    type="text" 
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={editingProfile ? "Update name..." : "Enter your name..."}
                    className="w-full py-4 px-6 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-lg font-bold"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setIsCreatingProfile(false);
                      setEditingProfile(null);
                      setNewName('');
                    }}
                    className="flex-1 py-4 bg-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateProfile}
                    disabled={!newName.trim()}
                    className="flex-[2] py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {editingProfile ? <Pencil className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
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
                ) : (
                  <button 
                    onClick={() => setIsCreatingProfile(true)}
                    className="w-full py-6 bg-white text-purple-600 rounded-2xl font-black text-2xl hover:bg-gray-100 transition shadow-xl flex items-center justify-center gap-3"
                  >
                    <Plus className="w-8 h-8" />
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

  if (!isPlaying && !gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center p-4 font-sans">
        <div className="bg-white/10 backdrop-blur-lg p-8 md:p-12 rounded-[2rem] text-center max-w-md w-full shadow-2xl border border-white/20">
          <div className="flex items-center justify-between bg-white/20 p-4 rounded-2xl border border-white/20 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-white/60 text-xs font-bold uppercase tracking-wider">Playing as</div>
                <div className="text-white font-black text-lg leading-none">{profileName}</div>
              </div>
            </div>
            <button 
              onClick={switchProfile}
              className="text-white/60 hover:text-white transition text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-lg"
            >
              Switch
            </button>
          </div>

          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-5xl">🎯</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
            MATCH IT
          </h1>
          <p className="text-white/80 mb-8 text-lg leading-relaxed">
            Find the single matching symbol between your card and the target card. You have 60 seconds!
          </p>

          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setTheme('standard')}
              className={`flex-1 py-3 rounded-xl font-bold transition flex flex-col items-center gap-1 border-2 ${theme === 'standard' ? 'bg-white text-purple-600 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
            >
              <span className="text-2xl">🦁</span>
              <span className="text-xs uppercase tracking-widest">Standard</span>
            </button>
            <button 
              onClick={() => setTheme('nature')}
              className={`flex-1 py-3 rounded-xl font-bold transition flex flex-col items-center gap-1 border-2 ${theme === 'nature' ? 'bg-white text-purple-600 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
            >
              <span className="text-2xl">🌸</span>
              <span className="text-xs uppercase tracking-widest">Nature</span>
            </button>
            <button 
              onClick={() => setTheme('fruits')}
              className={`flex-1 py-3 rounded-xl font-bold transition flex flex-col items-center gap-1 border-2 ${theme === 'fruits' ? 'bg-white text-purple-600 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
            >
              <span className="text-2xl">🍓</span>
              <span className="text-xs uppercase tracking-widest">Fruits</span>
            </button>
          </div>

          <button 
            onClick={startGame}
            className="w-full py-5 bg-white text-purple-600 rounded-2xl font-black text-2xl hover:bg-gray-100 transition shadow-xl transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3"
          >
            <Play className="w-8 h-8 fill-purple-600" />
            START GAME
          </button>

          {leaderboard.length > 0 && (
            <ProfileSelector 
              profiles={leaderboard} 
              currentProfile={profileName}
              onCreateNew={switchProfile}
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
          )}

          <div className="mt-8">
            <Leaderboard data={leaderboard} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

      {/* Header Stats */}
      <div className="absolute top-0 left-0 w-full p-2 flex justify-between items-start z-20">
        <div className="flex items-center gap-2">
          <div className="bg-black/20 backdrop-blur-md rounded-xl p-2 flex items-center gap-2 border border-white/10">
            <div className="bg-yellow-400 p-1.5 rounded-lg">
              <Trophy className="w-4 h-4 text-yellow-900" />
            </div>
            <div>
              <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Score</div>
              <div className="text-white font-black text-lg leading-none">{score}</div>
            </div>
          </div>
          
          <div className="hidden sm:flex bg-black/20 backdrop-blur-md rounded-xl p-1.5 items-center gap-2 border border-white/10">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <UserIcon className="w-3 h-3 text-white" />
            </div>
            <span className="text-white text-xs font-bold pr-1">{profileName}</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="bg-black/20 backdrop-blur-md rounded-xl p-2 text-white hover:bg-white/10 transition border border-white/10"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button 
            onClick={startGame}
            className="bg-black/20 backdrop-blur-md rounded-xl p-2 text-white hover:bg-white/10 transition border border-white/10"
            title="Restart"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={stopGame}
            className="bg-black/20 backdrop-blur-md rounded-xl p-2 text-white hover:bg-red-500/20 hover:text-red-400 transition border border-white/10"
            title="Quit Game"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-black/20 backdrop-blur-md rounded-xl p-2 flex items-center gap-2 border border-white/10">
          <div>
            <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider text-right">Time</div>
            <div className={`font-black text-lg leading-none text-right ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </div>
          </div>
          <div className={`p-1.5 rounded-lg ${timeLeft <= 10 ? 'bg-red-400/20 text-red-400' : 'bg-blue-400/20 text-blue-400'}`}>
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className={`flex flex-col items-center gap-0 w-full max-w-md z-10 mt-8 ${isPaused ? 'blur-md pointer-events-none' : ''}`}>
        {centerCard && <Card data={centerCard} onClick={handleSymbolClick} label="Target Card" feedback={feedback} />}
        {playerCard && <Card data={playerCard} onClick={handleSymbolClick} feedback={feedback} />}
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
                  className="text-7xl font-black text-purple-600 drop-shadow-sm"
                >
                  {score}
                </motion.div>
              </div>
              
              <div className="mb-8 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-left">
                  <h3 className="text-gray-900 font-bold text-sm mb-2 uppercase tracking-wider opacity-50">Leaderboard</h3>
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
                        <span className="font-black text-gray-900">{entry.highScore}</span>
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
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <DobbleGame />
    </ErrorBoundary>
  );
}
