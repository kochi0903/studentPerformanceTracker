import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Zap, 
  User, 
  RotateCw, 
  CheckCircle2, 
  X, 
  Star,
  Loader2,
  ChevronRight,
  Keyboard,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { studentService } from '../../services/studentService';
import { batchService } from '../../services/batchService';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { sessionService } from '../../services/sessionService';

const RATING_LEVELS = [
  { value: 1, label: 'Need Support', color: 'bg-red-500', icon: AlertCircle },
  { value: 2, label: 'Average', color: 'bg-amber-500', icon: User },
  { value: 3, label: 'Good', color: 'bg-blue-500', icon: Zap },
  { value: 4, label: 'Outstanding', color: 'bg-emerald-500', icon: Trophy },
];

// Students rated Good (3) or Outstanding (4) are removed from the wheel.
// Students rated Need Support (1) or Average (2) stay on the wheel and can be picked again.
const WHEEL_POP_RATINGS = ['Good', 'Outstanding'];

const LiveSession = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [entries, setEntries] = useState([]);
  const [activeBatch, setActiveBatch] = useState(null);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [starMoment, setStarMoment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Initialize session: load batch + students, create Firestore session doc, start real-time entries listener
  useEffect(() => {
    let unsubscribeEntries = null;

    const initSession = async () => {
      try {
        const [batchData, studentsData] = await Promise.all([
          batchService.getBatchById(batchId),
          studentService.getStudentsByBatch(batchId),
        ]);
        setActiveBatch(batchData);
        setStudents(studentsData);

        // Create session document in Firestore
        const session = await sessionService.createSession(
          batchId,
          user?.uid,
          batchData.currentWeek
        );
        setSessionId(session.id);

        // Subscribe to real-time entries for this batch+week
        unsubscribeEntries = sessionService.getSessionEntriesLive(
          batchId,
          batchData.currentWeek,
          (liveEntries) => setEntries(liveEntries)
        );
      } catch (err) {
        console.error('Error initializing session:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Cleanup: unsubscribe real-time listener on unmount
    return () => {
      if (unsubscribeEntries) unsubscribeEntries();
    };
  }, [batchId, user?.uid]);

  // Compute eligible students:
  // - No entry this week → eligible
  // - Latest entry is 'Need Support' or 'Average' → stays on wheel (eligible)
  // - Latest entry is 'Good' or 'Outstanding' → removed from wheel (ineligible)
  const eligibleStudents = useMemo(() => {
    if (!activeBatch) return [];
    return students.filter(student => {
      const weekEntries = entries.filter(
        e => e.studentId === student.id && e.week === activeBatch.currentWeek
      );
      if (weekEntries.length === 0) return true; // No entry yet — always eligible
      // Sort descending by ratedAt to get the most recent rating
      const latest = weekEntries.sort(
        (a, b) => new Date(b.ratedAt || 0) - new Date(a.ratedAt || 0)
      )[0];
      return !WHEEL_POP_RATINGS.includes(latest.rating);
    });
  }, [students, entries, activeBatch]);

  // End session: mark as completed in Firestore then navigate home
  const handleEndSession = async () => {
    if (sessionId) {
      await sessionService.endSession(sessionId, 'completed');
    }
    navigate('/');
  };

  // Handle Spin
  const spin = () => {
    if (isSpinning || eligibleStudents.length === 0) return;
    
    setIsSpinning(true);
    setWinner(null);
    setShowRating(false);
    setStarMoment(false);

    // Random rotation: at least 5 full spins + random offset
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const randomOffset = Math.floor(Math.random() * 360);
    const newRotation = rotation + (extraSpins * 360) + randomOffset;
    
    setRotation(newRotation);

    // Calculate winner after animation
    setTimeout(() => {
      const finalAngle = newRotation % 360;
      const sliceSize = 360 / eligibleStudents.length;
      // The pointer is at the top (0 degrees). 
      // The wheel rotates clockwise, so the slice under the pointer is:
      // (360 - angle) % 360
      const pointerAngle = (360 - (finalAngle % 360)) % 360;
      const winnerIndex = Math.floor(pointerAngle / sliceSize);
      
      setWinner(eligibleStudents[winnerIndex]);
      setIsSpinning(false);
      
      // Dramatic delay before showing rating
      setTimeout(() => setShowRating(true), 1000);
    }, 4000); // Match CSS transition duration
  };

  // Handle Rating
  const handleRate = async (rating) => {
    if (saving || !winner || !activeBatch) return;

    // Convert numeric value to string label before persisting
    const ratingLabel = RATING_LEVELS.find(r => r.value === rating)?.label;
    if (!ratingLabel) return;

    setSaving(true);
    try {
      const ratingData = {
        rating: ratingLabel,
        feedback: starMoment ? "Star Moment Flagged!" : "",
        isStarMoment: starMoment
      };

      await sessionService.addWeeklyEntry(
        activeBatch.id,
        winner.id,
        activeBatch.currentWeek,
        sessionId,
        ratingData
      );
      
      // Update local state for immediate feedback
      const newEntry = {
        ...ratingData,
        batchId: activeBatch.id,
        studentId: winner.id,
        week: activeBatch.currentWeek,
        ratedAt: new Date().toISOString() // Serialized timestamp for local UI
      };
      
      setEntries(prev => [newEntry, ...prev]);
      
      if (ratingLabel === 'Outstanding' || ratingLabel === 'Good') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ratingLabel === 'Outstanding' ? ['#10b981', '#3b82f6', '#f59e0b'] : ['#3b82f6', '#ffffff']
        });
      }

      // Close rating and reset
      setShowRating(false);
      setTimeout(() => {
        setWinner(null);
        setStarMoment(false);
      }, 500);
    } catch (err) {
      console.error("Rating error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Keyboard Shortcuts for Rating
  // 'S'/'s' uses functional state update to avoid stale closure over starMoment
  useKeyboardShortcuts({
    '1': () => showRating && handleRate(1),
    '2': () => showRating && handleRate(2),
    '3': () => showRating && handleRate(3),
    '4': () => showRating && handleRate(4),
    's': () => showRating && setStarMoment(prev => !prev),
    'S': () => showRating && setStarMoment(prev => !prev),
    ' ': () => !isSpinning && !winner && spin(),
    'Enter': () => !isSpinning && !winner && spin(),
  });

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-blue-500 font-bold uppercase tracking-widest text-xs">Initializing Session...</p>
      </div>
    );
  }

  if (eligibleStudents.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-center p-6">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-500 mb-8 border border-emerald-500/20">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tight">Week Complete!</h2>
        <p className="text-slate-400 max-w-md text-lg font-medium leading-relaxed mb-12">
          All students in <span className="text-white">{activeBatch?.name}</span> have been rated for Week {activeBatch?.currentWeek}.
        </p>
        <button 
          onClick={handleEndSession}
          className="px-10 py-4 bg-white text-black rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-sm shadow-2xl shadow-white/5"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden relative font-sans">
      
      {/* Background Ambient Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header Info */}
      <div className="absolute top-10 left-10 flex items-center gap-6 z-20">
        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Active Batch</p>
          <h1 className="text-lg font-black text-white tracking-tight">{activeBatch?.name}</h1>
        </div>
        <div className="px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black text-blue-500/40 uppercase tracking-[0.2em] mb-1">Week</p>
          <p className="text-lg font-black text-blue-400 tracking-tight">{activeBatch?.currentWeek}</p>
        </div>
      </div>

      {/* Progress Counter */}
      <div className="absolute top-10 right-10 flex items-center gap-4 z-20">
        <div className="text-right">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Progress</p>
          <p className="text-lg font-black text-white tracking-tight">
            {students.length - eligibleStudents.length} / {students.length}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center relative">
          <svg className="w-full h-full -rotate-90">
            <circle 
              cx="24" cy="24" r="20" 
              fill="transparent" 
              stroke="currentColor" 
              strokeWidth="3" 
              className="text-white/5"
            />
            <circle 
              cx="24" cy="24" r="20" 
              fill="transparent" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeDasharray={125.6}
              strokeDashoffset={125.6 * (eligibleStudents.length / students.length)}
              className="text-blue-500 transition-all duration-1000"
            />
          </svg>
          <User size={16} className="absolute text-white/20" />
        </div>
      </div>

      {/* The Wheel Container */}
      <div className="relative w-[600px] h-[600px] mt-12 flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <div className="w-8 h-12 bg-blue-500 clip-path-triangle transform rotate-180" />
        </div>

        {/* Outer Ring */}
        <div className="absolute inset-[-20px] rounded-full border-[10px] border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)]" />

        {/* The Actual Wheel */}
        <div 
          className="relative w-full h-full rounded-full border-8 border-white/10 overflow-hidden shadow-2xl transition-transform ease-out"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transitionDuration: '4s',
            background: 'conic-gradient(from 0deg, #111 0%, #1a1a1a 100%)'
          }}
        >
          {eligibleStudents.map((student, index) => {
            const sliceSize = 360 / eligibleStudents.length;
            const rotationAngle = index * sliceSize;
            
            return (
              <div 
                key={student.id}
                className="absolute top-0 left-1/2 w-1 h-1/2 origin-bottom flex flex-col items-center"
                style={{ 
                  transform: `translateX(-50%) rotate(${rotationAngle}deg)`,
                }}
              >
                <div className="pt-8 flex flex-col items-center">
                  <span 
                    className={`text-sm font-black uppercase tracking-widest whitespace-nowrap ${
                      eligibleStudents.length > 15 ? 'text-[8px]' : 'text-[12px]'
                    } ${index % 2 === 0 ? 'text-white' : 'text-white/40'}`}
                    style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
                  >
                    {student.name}
                  </span>
                </div>
                {/* Slice Divider */}
                <div 
                  className="absolute bottom-0 h-[1000px] w-[1px] bg-white/5" 
                  style={{ transform: `rotate(${sliceSize / 2}deg)` }}
                />
              </div>
            );
          })}
        </div>

        {/* Center Hub */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-24 h-24 bg-[#0a0a0a] rounded-full border-4 border-white/10 shadow-2xl flex items-center justify-center group">
            <button 
              onClick={spin}
              disabled={isSpinning || !!winner}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isSpinning ? 'bg-blue-500/20 text-blue-500 animate-pulse' : 'bg-blue-500 text-white hover:scale-110 active:scale-95 cursor-pointer'
              }`}
            >
              <RotateCw size={32} className={isSpinning ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Controls Hint */}
      {!winner && !isSpinning && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            <Keyboard size={16} className="text-white/40" />
            <p className="text-xs font-bold text-white/60 tracking-wider">
              Press <span className="text-white px-1.5 py-0.5 bg-white/10 rounded mx-1">SPACE</span> to Spin
            </p>
          </div>
        </motion.div>
      )}

      {/* Winner Overlay */}
      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-xl p-6"
          >
            <div className="max-w-3xl w-full flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 20 }}
                className="mb-8"
              >
                <div className="w-32 h-32 rounded-[3rem] bg-blue-500 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.5)] mb-8">
                  <User size={64} className="text-white" />
                </div>
                <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-4">Presentation By</h2>
                <h3 className="text-7xl font-black text-white tracking-tighter uppercase">{winner.name}</h3>
              </motion.div>

              <AnimatePresence>
                {showRating && (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 mb-12">
                      {RATING_LEVELS.map((level) => {
                        const Icon = level.icon;
                        return (
                          <button
                            key={level.value}
                            onClick={() => handleRate(level.value)}
                            disabled={saving}
                            className={`group relative flex flex-col items-center gap-4 p-6 rounded-[2rem] border transition-all cursor-pointer ${
                              saving ? 'opacity-50' : 'hover:scale-105 active:scale-95'
                            } bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20`}
                          >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${level.color}`}>
                              <Icon size={24} />
                            </div>
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{level.label}</span>
                            <div className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black text-white/40">
                              {level.value}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-col items-center gap-8">
                      <button 
                        onClick={() => setStarMoment(!starMoment)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all cursor-pointer border ${
                          starMoment 
                            ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]' 
                            : 'bg-white/5 text-white/40 border-white/10 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <Star size={20} fill={starMoment ? "currentColor" : "none"} />
                        <span className="uppercase tracking-widest text-xs">Flag as Star Moment (S)</span>
                      </button>

                      <div className="flex items-center gap-3 text-white/20">
                        <Keyboard size={16} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Press key 1-4 to rate instantly</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .clip-path-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
};

export default LiveSession;
