
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { BrandProfile, UploadedFile } from '../types';
import { inferFieldFromContext } from '../services/geminiService';
import { Target, Users, Upload, FileText, X, Paperclip, Search, ArrowRight, Image as ImageIcon, Calendar, Heart, Briefcase, Globe, MapPin, Download, History, ChevronDown, Wand2, ThermometerSun, Trash2 } from 'lucide-react';

interface SidebarProps {
  brandProfile: BrandProfile;
  setBrandProfile: (profile: BrandProfile) => void;
  onFileUpload: (file: UploadedFile | null) => void;
  currentFile: UploadedFile | null;
  onSearch: () => void;
  isSearching: boolean;
  viewSaved: () => void;
  onExport: () => void;
}

const KPIS = [
  "Brand Awareness", "Brand Love", "Brand Relevance", "Brand Trust", "Thought Leadership",
  "Lead Generation", "Customer Acquisition", "Sales Volume", "Revenue Growth", "Market Share",
  "Viral Reach", "Social Engagement", "Community Growth", "PR Coverage", "Share of Voice",
  "Customer Retention", "Loyalty Program Signups", "Churn Reduction", "Lifetime Value (LTV)", "NPS Score",
  "Product Launch", "Feature Adoption", "App Downloads", "Website Traffic", "Dwell Time",
  "Sustainability Impact", "Social Responsibility", "Diversity & Inclusion", "Local Impact", "Cultural Credibility",
  "Partnership Value", "Influencer ROI", "Co-creation", "User Generated Content", "Trend Jacking",
  "Crisis Management", "Reputation Repair", "Rebranding", "New Market Entry", "Demographic Shift",
  "Educational Value", "Entertainment Value", "Emotional Connection", "Nostalgia", "Innovation Showcase",
  "Cost Per Acquisition", "Return on Ad Spend", "Foot Traffic", "In-Store Sales", "Cross-Selling"
];

// Simplified Audience List
const AUDIENCES = [
  "Gen Alpha", "Gen Z", "Millennials", "Gen X", "Baby Boomers", "Silent Generation",
  "Ages 13-17", "Ages 18-24", "Ages 25-34", "Ages 35-44", "Ages 45-54", "Ages 55-64", "Ages 65+"
];

const REGIONS = ["Global", "International (Excl. US)", "North America", "Europe", "APAC", "LATAM", "National (US)", "Regional/Local"];

const Sidebar: React.FC<SidebarProps> = ({ 
  brandProfile, 
  setBrandProfile, 
  onFileUpload, 
  currentFile,
  onSearch,
  isSearching,
  viewSaved,
  onExport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAllKPIs, setShowAllKPIs] = useState(false);
  const [animateSaved, setAnimateSaved] = useState(false);
  const [recentBrands, setRecentBrands] = useState<string[]>([]);
  const [showBrandHistory, setShowBrandHistory] = useState(false);
  const prevSavedCount = useRef(brandProfile.savedMoments.length);
  const [inferring, setInferring] = useState<string | null>(null);

  // Load recent brands on mount
  useEffect(() => {
    const saved = localStorage.getItem('momentumRecentBrands');
    if (saved) {
      try {
        setRecentBrands(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Trigger animation when saved count increases
  useEffect(() => {
    if (brandProfile.savedMoments.length > prevSavedCount.current) {
      setAnimateSaved(true);
      const timer = setTimeout(() => setAnimateSaved(false), 1000);
      return () => clearTimeout(timer);
    }
    prevSavedCount.current = brandProfile.savedMoments.length;
  }, [brandProfile.savedMoments.length]);

  const handleChange = (field: keyof BrandProfile, value: any) => {
    setBrandProfile({ ...brandProfile, [field]: value });
  };

  const selectBrand = (name: string) => {
    handleChange('name', name);
    setShowBrandHistory(false);
  };

  const toggleSelection = (field: 'campaignGoal' | 'targetAudience', item: string) => {
    const current = brandProfile[field].split(', ').filter(s => s.trim());
    let next: string[];
    
    if (current.includes(item)) {
      next = current.filter(i => i !== item);
    } else {
      next = [...current, item];
    }
    handleChange(field, next.join(', '));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const [prefix, base64Data] = result.split(',');
      const mimeType = prefix.split(':')[1].split(';')[0];

      onFileUpload({
        name: file.name,
        mimeType: mimeType,
        data: base64Data
      });
    };
    reader.readAsDataURL(file);
  };

  const handleInfer = async (field: 'campaignGoal' | 'targetAudience' | 'name') => {
      if (!currentFile) return;
      setInferring(field);
      
      let options: string[] = [];
      if (field === 'campaignGoal') options = KPIS;
      if (field === 'targetAudience') options = AUDIENCES;

      try {
          const val = await inferFieldFromContext(field, [currentFile], options);
          if (val) {
              handleChange(field, val);
          }
      } catch(e) {
          console.error(e);
      } finally {
          setInferring(null);
      }
  };

  const isImage = (mime: string) => mime.startsWith('image/');
  const today = new Date().toISOString().split('T')[0];

  // Sorting Logic: Selected items first
  const sortedKPIs = useMemo(() => {
    const selected = KPIS.filter(k => brandProfile.campaignGoal.includes(k));
    const unselected = KPIS.filter(k => !brandProfile.campaignGoal.includes(k));
    return [...selected, ...unselected];
  }, [brandProfile.campaignGoal]);

  return (
    <div className="w-96 h-screen bg-neutral-900 text-white border-r border-neutral-800 flex flex-col overflow-y-auto fixed left-0 top-0 z-20 flex-shrink-0 shadow-xl scrollbar-hide">
      <div className="p-6 border-b border-neutral-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <span className="font-bold text-lg">M</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Momentum</h1>
        </div>
        <p className="text-xs text-neutral-500">Strategic Moments Finder</p>
      </div>

      <div className="p-6 space-y-8 flex-1">
        
        {/* 1. Context & Assets (Moved to Top) */}
        <div className="space-y-3 bg-neutral-800/30 p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center justify-between">
             <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-3 h-3" /> Context & Assets
             </label>
          </div>
          
          {!currentFile ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 rounded-lg p-4 hover:bg-neutral-800 transition-colors cursor-pointer flex flex-col items-center gap-2 text-center group"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-800 group-hover:bg-neutral-700 flex items-center justify-center transition-colors">
                 <Upload className="w-4 h-4 text-neutral-400 group-hover:text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-300">Upload Brief or Asset</p>
                <p className="text-[10px] text-neutral-500">PDF, TXT, MD, Images</p>
              </div>
            </div>
          ) : (
             <div className="bg-neutral-800 rounded-lg p-3 flex items-center gap-3 border border-neutral-700 relative group">
                <div className="w-8 h-8 rounded bg-neutral-700 flex items-center justify-center flex-shrink-0">
                    {isImage(currentFile.mimeType) ? <ImageIcon className="w-4 h-4 text-pink-400" /> : <FileText className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{currentFile.name}</p>
                    <p className="text-[10px] text-neutral-500 uppercase">{currentFile.mimeType.split('/')[1]}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onFileUpload(null); }}
                  className="p-1.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-red-400 transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
             </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.txt,.md,.csv,.json,image/png,image/jpeg,image/webp"
          />
        </div>

        {/* 2. Brand Identity */}
        <div className="space-y-3 relative">
          <div className="flex justify-between items-center">
             <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> Brand Identity
             </label>
             {currentFile && (
                 <button onClick={() => handleInfer('name')} disabled={!!inferring} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Wand2 className={`w-3 h-3 ${inferring === 'name' ? 'animate-spin' : ''}`} />
                    {inferring === 'name' ? '...' : 'Infer'}
                 </button>
             )}
          </div>
          <div className="relative">
            <input 
                type="text" 
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-neutral-600"
                placeholder={currentFile ? "Auto-infer from file..." : "e.g. Gatorade"}
                value={brandProfile.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onFocus={() => setShowBrandHistory(true)}
                onBlur={() => setTimeout(() => setShowBrandHistory(false), 200)}
            />
            {showBrandHistory && recentBrands.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-30 max-h-32 overflow-y-auto">
                    <div className="px-3 py-2 text-[10px] text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-700">Recent</div>
                    {recentBrands.map(b => (
                        <button key={b} onMouseDown={() => selectBrand(b)} className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors">
                            {b}
                        </button>
                    ))}
                </div>
            )}
            <div className="absolute right-3 top-2.5 pointer-events-none">
               <History className="w-4 h-4 text-neutral-600" />
            </div>
          </div>
        </div>

        {/* 3. Campaign Goal */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
             <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-3 h-3" /> Campaign Goal
             </label>
             {currentFile && (
                 <button onClick={() => handleInfer('campaignGoal')} disabled={!!inferring} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Wand2 className={`w-3 h-3 ${inferring === 'campaignGoal' ? 'animate-spin' : ''}`} />
                    {inferring === 'campaignGoal' ? '...' : 'Infer'}
                 </button>
             )}
          </div>
          <input 
            type="text" 
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none mb-2"
            placeholder="e.g. Drive Brand Love..."
            value={brandProfile.campaignGoal}
            onChange={(e) => handleChange('campaignGoal', e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {(showAllKPIs ? sortedKPIs : sortedKPIs.slice(0, 8)).map(kpi => (
              <button
                key={kpi}
                onClick={() => toggleSelection('campaignGoal', kpi)}
                className={`
                  px-2.5 py-1 rounded text-[10px] font-medium border transition-all
                  ${brandProfile.campaignGoal.includes(kpi) 
                    ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-300 shadow-glow' 
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'}
                `}
              >
                {kpi}
              </button>
            ))}
            <button 
                onClick={() => setShowAllKPIs(!showAllKPIs)}
                className="px-2 py-1 text-[10px] text-neutral-500 hover:text-white underline decoration-neutral-700"
            >
                {showAllKPIs ? "Show Less" : "Show More"}
            </button>
          </div>
        </div>

        {/* 4. Target Audience */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
             <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3 h-3" /> Target Audience
             </label>
             {currentFile && (
                 <button onClick={() => handleInfer('targetAudience')} disabled={!!inferring} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Wand2 className={`w-3 h-3 ${inferring === 'targetAudience' ? 'animate-spin' : ''}`} />
                    {inferring === 'targetAudience' ? '...' : 'Infer'}
                 </button>
             )}
          </div>
          <input 
            type="text" 
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none mb-2"
            placeholder="Specific niche (e.g. Gamers)"
            value={brandProfile.targetAudience}
            onChange={(e) => handleChange('targetAudience', e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {AUDIENCES.map(aud => (
              <button
                key={aud}
                onClick={() => toggleSelection('targetAudience', aud)}
                className={`
                  px-2.5 py-1 rounded text-[10px] font-medium border transition-all
                  ${brandProfile.targetAudience.includes(aud) 
                    ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-300 shadow-glow' 
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'}
                `}
              >
                {aud}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Region & Scale */}
        <div className="space-y-3">
           <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3 h-3" /> Target Region
           </label>
           <div className="grid grid-cols-2 gap-2">
              {REGIONS.slice(0, 4).map(r => (
                  <button 
                    key={r}
                    onClick={() => handleChange('targetRegion', r)}
                    className={`px-2 py-1.5 rounded text-[10px] border transition-all text-center ${brandProfile.targetRegion === r ? 'bg-neutral-200 text-neutral-900 border-white font-bold' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
                  >
                    {r}
                  </button>
              ))}
           </div>
           <div className="grid grid-cols-2 gap-2">
              {REGIONS.slice(4).map(r => (
                  <button 
                    key={r}
                    onClick={() => handleChange('targetRegion', r)}
                    className={`px-2 py-1.5 rounded text-[10px] border transition-all text-center ${brandProfile.targetRegion === r ? 'bg-neutral-200 text-neutral-900 border-white font-bold' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
                  >
                    {r}
                  </button>
              ))}
           </div>
           {brandProfile.targetRegion === 'Regional/Local' && (
               <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                   <div className="relative">
                     <MapPin className="w-3 h-3 absolute left-3 top-3 text-neutral-500" />
                     <input 
                        type="text"
                        className="w-full pl-8 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none"
                        placeholder="Enter City or State (e.g. Austin, TX)"
                        value={brandProfile.customLocation || ''}
                        onChange={(e) => handleChange('customLocation', e.target.value)}
                     />
                   </div>
               </div>
           )}
        </div>

        {/* 6. Timeframe */}
        <div className="space-y-3">
           <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Timeframe
           </label>
           <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-neutral-500 mb-1 block">Start</span>
                <input 
                    type="date" 
                    min={today}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                    value={brandProfile.timeframe.start}
                    onChange={(e) => handleChange('timeframe', { ...brandProfile.timeframe, start: e.target.value })}
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 mb-1 block">End</span>
                <input 
                    type="date" 
                    min={brandProfile.timeframe.start || today}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                    value={brandProfile.timeframe.end}
                    onChange={(e) => handleChange('timeframe', { ...brandProfile.timeframe, end: e.target.value })}
                />
              </div>
           </div>
           <input 
             type="text"
             placeholder="Or Season (e.g. Q3 2025, Summer)"
             className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
             value={brandProfile.fuzzyTimeframe || ''}
             onChange={(e) => handleChange('fuzzyTimeframe', e.target.value)}
           />
        </div>

        {/* 7. Strategic Variance (Creativity Slider) */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
           <div className="flex justify-between items-center">
               <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                    <ThermometerSun className="w-3 h-3" /> Strategic Variance
               </label>
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                   brandProfile.creativityLevel < 30 ? 'bg-blue-900/30 text-blue-400' :
                   brandProfile.creativityLevel > 70 ? 'bg-pink-900/30 text-pink-400' :
                   'bg-yellow-900/30 text-yellow-400'
               }`}>
                   {brandProfile.creativityLevel < 30 ? 'Safe / Established' :
                    brandProfile.creativityLevel > 70 ? 'Wild / Unexpected' :
                    'Balanced / Mixed'}
               </span>
           </div>
           <div className="px-1">
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 step="10"
                 value={brandProfile.creativityLevel}
                 onChange={(e) => handleChange('creativityLevel', parseInt(e.target.value))}
                 className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
               />
               <div className="flex justify-between mt-2 text-[9px] text-neutral-600 font-medium uppercase tracking-widest">
                   <span>Proven</span>
                   <span>Emerging</span>
                   <span>Experimental</span>
               </div>
           </div>
        </div>

      </div>

      <div className="p-6 border-t border-neutral-800 bg-neutral-900 space-y-3">
        <button 
          onClick={onSearch}
          disabled={isSearching || (!brandProfile.name && !currentFile && !brandProfile.campaignGoal)}
          className={`
            w-full py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all
            ${isSearching || (!brandProfile.name && !currentFile && !brandProfile.campaignGoal)
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/20 hover:-translate-y-0.5'}
          `}
        >
          {isSearching ? (
             <>Finding Moments...</>
          ) : (
             <>
               <Search className="w-4 h-4" /> Find Moments
             </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={viewSaved}
                className="flex items-center justify-center gap-2 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors relative"
             >
                <Heart className={`w-3.5 h-3.5 ${animateSaved ? 'text-pink-500 scale-125 transition-transform' : ''}`} /> 
                Saved ({brandProfile.savedMoments.length})
                {animateSaved && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-bold text-pink-500 animate-bounce">+1</span>
                )}
             </button>
             <button 
                onClick={onExport}
                disabled={brandProfile.savedMoments.length === 0}
                className="flex items-center justify-center gap-2 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Download className="w-3.5 h-3.5" /> Export
             </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
