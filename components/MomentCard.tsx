
import React, { useState } from 'react';
import { Moment } from '../types';
import { Calendar, MapPin, Activity, Star, Globe, Heart, Users, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface MomentCardProps {
  moment: Moment;
  onClick: () => void;
  onSave: (e: React.MouseEvent) => void;
  isSelected: boolean;
  isSaved: boolean;
}

const categoryColors: Record<string, string> = {
  'Music': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Sports': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Tech': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Culture': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Fashion': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Other': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const MomentCard: React.FC<MomentCardProps> = ({ moment, onClick, onSave, isSelected, isSaved }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      onClick={onClick}
      className={`
        relative group cursor-pointer rounded-xl border p-5 transition-all duration-300 flex flex-col h-full
        ${isSelected 
          ? 'bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/10' 
          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/50'}
      `}
    >
      {/* Match Score Badge */}
      {moment.matchScore !== undefined && (
        <div className="absolute -top-3 -right-3 bg-neutral-900 border border-neutral-700 rounded-full p-1 shadow-xl z-10 group-hover:scale-110 transition-transform">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2
            ${moment.matchScore > 80 ? 'border-emerald-500 text-emerald-400' : 
              moment.matchScore > 50 ? 'border-yellow-500 text-yellow-400' : 'border-neutral-500 text-neutral-400'}
          `}
           title="Strategic Match Score based on goals & audience"
          >
            {moment.matchScore}
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-3 pr-8">
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${categoryColors[moment.category] || categoryColors['Other']}`}>
          {moment.category}
        </span>
        <button 
          onClick={onSave}
          className={`
             p-2 rounded-full hover:bg-neutral-800 transition-colors z-20
             ${isSaved ? 'text-pink-500' : 'text-neutral-600 hover:text-pink-400'}
          `}
        >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors pr-2 leading-tight">
        {moment.title}
      </h3>

      <div className="space-y-2 mb-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2 text-neutral-400 text-xs">
          <Calendar className="w-3.5 h-3.5" />
          <span>{moment.date}</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-400 text-xs">
          <MapPin className="w-3.5 h-3.5" />
          <span>{moment.location}</span>
        </div>
        {moment.estimatedReach && (
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>{moment.estimatedReach}</span>
          </div>
        )}
      </div>
      
      {moment.matchReason && (
        <div className="mb-4 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
                <Star className="w-3 h-3 text-indigo-400" fill="currentColor" />
                <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider">Strategic Fit</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
                {moment.matchReason}
            </p>
        </div>
      )}

      <div className="mb-4 flex-1">
         <p className={`text-neutral-400 text-sm leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {moment.description}
         </p>
         {moment.description.length > 100 && (
             <button 
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-xs text-neutral-500 hover:text-white mt-1 flex items-center gap-1"
             >
                 {expanded ? (
                     <>Show Less <ChevronUp className="w-3 h-3" /></>
                 ) : (
                     <>See More <ChevronDown className="w-3 h-3" /></>
                 )}
             </button>
         )}
      </div>

      <div className="flex items-center gap-3 mt-auto pt-3 border-t border-neutral-800/50 justify-between">
        {moment.websiteUrl && (
            <a 
                href={moment.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 font-medium"
            >
                <Globe className="w-3 h-3" />
                Website
            </a>
        )}
        
        {moment.verificationDate && (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-emerald-500/80 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle className="w-3 h-3" /> Verified
            </div>
            <span className="text-[9px] text-neutral-600">{moment.verificationDate}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MomentCard;
