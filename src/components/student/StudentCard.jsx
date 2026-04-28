import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  MoreHorizontal, 
  AlertCircle,
  Star,
  Zap,
  ArrowUpRight,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

const TrendBadge = ({ trend }) => {
  const configs = {
    'Improving': { icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', label: 'Improving' },
    'Declining': { icon: TrendingDown, color: 'text-red-600 bg-red-50', label: 'Declining' },
    'Consistent': { icon: Zap, color: 'text-blue-600 bg-blue-50', label: 'Consistent' },
    'Recovering': { icon: TrendingUp, color: 'text-amber-600 bg-amber-50', label: 'Recovering' },
    'Variable': { icon: MoreHorizontal, color: 'text-slate-400 bg-slate-50', label: 'Variable' },
    'New': { icon: Zap, color: 'text-slate-400 bg-slate-50', label: 'New' }
  };

  const config = configs[trend] || configs['New'];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </div>
  );
};

const FlagBadge = ({ flag }) => {
  const configs = {
    'Need Support': { icon: AlertCircle, color: 'bg-red-500 text-white shadow-sm shadow-red-200' },
    'Star Student': { icon: Star, color: 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' },
    'Inconsistent': { icon: AlertCircle, color: 'bg-amber-100 text-amber-700' },
    'Recovering': { icon: TrendingUp, color: 'bg-blue-100 text-blue-700' },
    'New': { icon: Zap, color: 'bg-slate-100 text-slate-500' }
  };

  const config = configs[flag] || configs['New'];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${config.color}`}>
      <Icon size={10} fill={flag === 'Star Student' ? 'currentColor' : 'none'} />
      {flag}
    </div>
  );
};

const StudentCard = ({ student, currentRating, trend, flags, onClick, isSelected, onToggleSelect, onDelete }) => {
  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      onClick={() => onClick(student)}
      className={`bg-white p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer group relative overflow-hidden ${
        isSelected 
          ? 'border-blue-500 shadow-xl shadow-blue-500/10' 
          : 'border-slate-50 hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50'
      }`}
    >
      {/* Selection Overlay/Checkbox */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(student.id);
        }}
        className={`absolute top-4 left-4 z-10 w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
          isSelected 
            ? 'bg-blue-500 border-blue-500 text-white' 
            : 'bg-white border-slate-200 text-transparent opacity-0 group-hover:opacity-100 hover:border-blue-400'
        }`}
      >
        <CheckCircle2 size={14} />
      </div>

      <div className="flex justify-between items-start mb-6 mt-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:border-blue-100 transition-all">
          {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div className="flex flex-col items-end gap-2">
          <TrendBadge trend={trend} />
          <div className="flex flex-wrap justify-end gap-1.5 mt-1">
            {flags.map((flag, i) => <FlagBadge key={i} flag={flag} />)}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1 truncate">
          {student.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Rating</span>
          <div className="h-px flex-1 bg-slate-50" />
          <span className={`text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
            currentRating === 'Outstanding' ? 'text-emerald-600' :
            currentRating === 'Good' ? 'text-blue-600' :
            currentRating === 'Average' ? 'text-amber-600' :
            currentRating === 'Need Support' ? 'text-red-600' : 'text-slate-300'
          }`}>
            {currentRating}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(student);
            }}
            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={18} />
          </button>
        </div>
        <button className="text-slate-300 group-hover:text-blue-600 transition-all">
          <ArrowUpRight size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default StudentCard;
