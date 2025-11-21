
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MomentCard from './components/MomentCard';
import ChatAssistant from './components/ChatAssistant';
import { findMoments, generateStrategy, generateConceptImage, quickSuggest } from './services/geminiService';
import { BrandProfile, Moment, ActivationStrategy, ImageResolution, UploadedFile } from './types';
import { Search, Loader2, Sparkles, BrainCircuit, X, Image as ImageIcon, Filter, Heart, Globe, ArrowUpRight, Users, Megaphone, Zap, Trophy, Calendar, MapPin } from 'lucide-react';

// Initial State
const initialBrand: BrandProfile = {
  name: '',
  campaignGoal: '',
  targetAudience: '',
  targetRegion: '',
  customLocation: '',
  timeframe: { start: '', end: '' },
  fuzzyTimeframe: '',
  creativityLevel: 50,
  savedMoments: []
};

// Expanded Categories
const categories = ['All', 'Saved', 'Culture', 'Music', 'Sports', 'Tech', 'Fashion', 'Gaming', 'Food & Drink', 'Art', 'Wellness', 'Business'];
const scales = ['All Scales', 'Global', 'National', 'Local'];

const App: React.FC = () => {
  // State
  const [brand, setBrand] = useState<BrandProfile>(initialBrand);
  const [query, setQuery] = useState('');
  const [fileContext, setFileContext] = useState<UploadedFile | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [strategy, setStrategy] = useState<ActivationStrategy | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedScale, setSelectedScale] = useState('All Scales');
  
  // Loading States
  const [isSearching, setIsSearching] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // UI Toggles
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [imageRes, setImageRes] = useState<ImageResolution>('1K');
  const [animateSavedTab, setAnimateSavedTab] = useState(false);
  const prevSavedCount = useRef(brand.savedMoments.length);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('momentumBrandProfile');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (!parsed.savedMoments) parsed.savedMoments = [];
        setBrand(parsed);
      } catch (e) {
        console.error("Failed to load saved state");
      }
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('momentumBrandProfile', JSON.stringify(brand));
  }, [brand]);

  // Animate Saved Tab
  useEffect(() => {
    if (brand.savedMoments.length > prevSavedCount.current) {
      setAnimateSavedTab(true);
      const timer = setTimeout(() => setAnimateSavedTab(false), 1000);
      return () => clearTimeout(timer);
    }
    prevSavedCount.current = brand.savedMoments.length;
  }, [brand.savedMoments.length]);

  // Handlers
  const handleSearch = async () => {
    let effectiveQuery = query;
    
    // Save brand to history if provided
    if (brand.name.trim()) {
        const recent = localStorage.getItem('momentumRecentBrands');
        let brands: string[] = recent ? JSON.parse(recent) : [];
        if (!brands.includes(brand.name)) {
            brands = [brand.name, ...brands].slice(0, 10);
            localStorage.setItem('momentumRecentBrands', JSON.stringify(brands));
        }
    }

    const brandNameOrInference = brand.name.trim() || "Brand: (Infer from context/file)";

    if (!effectiveQuery.trim()) {
        if (brand.campaignGoal || brand.name || fileContext) {
            effectiveQuery = `
              Brand: ${brandNameOrInference}
              Objectives: ${brand.campaignGoal || 'Infer from context'}
              Audience: ${brand.targetAudience || 'Infer from context'}
              Region: ${brand.targetRegion} ${brand.customLocation ? `(${brand.customLocation})` : ''}
              Dates: ${brand.timeframe.start} to ${brand.timeframe.end} ${brand.fuzzyTimeframe ? `(${brand.fuzzyTimeframe})` : ''}
            `;
        } else {
            return;
        }
    }

    setIsSearching(true);
    setMoments([]);
    setSelectedMoment(null);
    setStrategy(null);
    setSelectedCategory('All');
    
    try {
      // Pass savedMoments and creativityLevel for smart inference/exclusion
      const results = await findMoments(
          effectiveQuery, 
          fileContext || undefined, 
          brand.savedMoments, 
          brand.creativityLevel
      );
      const sorted = results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setMoments(sorted);
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
      setSuggestions([]);
    }
  };

  const handleQuickSuggest = async (text: string) => {
    setQuery(text);
    if (text.length > 4) {
      try {
        const suggs = await quickSuggest(text);
        setSuggestions(suggs);
      } catch (e) {}
    } else {
      setSuggestions([]);
    }
  };

  const handleSaveMoment = (e: React.MouseEvent, moment: Moment) => {
    e.stopPropagation();
    const exists = brand.savedMoments.some(m => m.id === moment.id);
    let newSaved;
    if (exists) {
      newSaved = brand.savedMoments.filter(m => m.id !== moment.id);
    } else {
      newSaved = [...brand.savedMoments, moment];
    }
    setBrand({ ...brand, savedMoments: newSaved });
  };

  const handleExport = () => {
    if (brand.savedMoments.length === 0) return;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Strategic Strategy Report - ${brand.name}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; background: #111; color: #eee; margin: 0; padding: 40px; line-height: 1.5; }
            .container { max-width: 900px; margin: 0 auto; }
            h1 { font-size: 3rem; letter-spacing: -1px; margin-bottom: 10px; color: #fff; }
            h2 { color: #6366f1; border-bottom: 1px solid #333; padding-bottom: 10px; margin-top: 40px; }
            .meta { background: #1a1a1a; padding: 24px; border-radius: 12px; border: 1px solid #333; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .meta-item label { display: block; color: #888; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
            .meta-item div { font-weight: 500; }
            .moment-card { background: #1a1a1a; border: 1px solid #333; padding: 24px; border-radius: 12px; margin-bottom: 20px; page-break-inside: avoid; }
            .moment-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; }
            .moment-title { font-size: 1.5rem; font-weight: 700; margin: 0; color: #fff; }
            .moment-date { color: #6366f1; font-weight: 500; }
            .tags { display: flex; gap: 8px; margin-bottom: 16px; }
            .tag { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
            .tag.cat { background: rgba(99, 102, 241, 0.1); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.2); }
            .tag.score { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
            .desc { color: #aaa; margin-bottom: 16px; font-size: 0.95rem; }
            .reason { background: rgba(99, 102, 241, 0.05); padding: 16px; border-radius: 8px; color: #ccc; font-size: 0.9rem; font-style: italic; border-left: 3px solid #6366f1; }
            .links { margin-top: 16px; display: flex; gap: 12px; }
            a { color: #818cf8; text-decoration: none; font-size: 0.85rem; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Momentum Strategy</h1>
            <p style="color: #666; margin-bottom: 40px;">Generated on ${new Date().toLocaleDateString()}</p>
            
            <div class="meta">
                <div class="meta-item"><label>Brand</label><div>${brand.name || 'Inferred'}</div></div>
                <div class="meta-item"><label>Campaign Goal</label><div>${brand.campaignGoal || 'Not Specified'}</div></div>
                <div class="meta-item"><label>Target Audience</label><div>${brand.targetAudience || 'General'}</div></div>
                <div class="meta-item"><label>Strategy Variance</label><div>${brand.creativityLevel > 70 ? 'High (Wild)' : brand.creativityLevel < 30 ? 'Low (Safe)' : 'Medium'}</div></div>
            </div>

            <h2>Shortlisted Opportunities</h2>
            ${brand.savedMoments.map(m => `
                <div class="moment-card">
                    <div class="moment-header">
                        <div>
                            <h3 class="moment-title">${m.title}</h3>
                            <div style="color: #666; font-size: 0.9rem; margin-top: 4px;">${m.location} • ${m.scale}</div>
                        </div>
                        <div class="moment-date">${m.date}</div>
                    </div>
                    <div class="tags">
                        <span class="tag cat">${m.category}</span>
                        <span class="tag score">Match: ${m.matchScore}%</span>
                        ${m.estimatedReach ? `<span class="tag cat">${m.estimatedReach}</span>` : ''}
                    </div>
                    <p class="desc">${m.longDescription || m.description}</p>
                    <div class="reason">" ${m.matchReason || 'Strong strategic fit based on campaign parameters.'} "</div>
                    <div class="links">
                        ${m.websiteUrl ? `<a href="${m.websiteUrl}" target="_blank">Official Website &rarr;</a>` : ''}
                    </div>
                </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Momentum_Strategy_${brand.name.replace(/\s+/g, '_') || 'Draft'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleGenerateStrategy = async () => {
    if (!selectedMoment) return;
    const brandName = brand.name || "Our Brand";
    setIsThinking(true);
    setStrategy(null);
    setGeneratedImage(null);
    try {
      const result = await generateStrategy(brandName, brand.campaignGoal || "Awareness", selectedMoment);
      setStrategy(result);
    } catch (e) {
      console.error("Strategy gen failed", e);
    } finally {
      setIsThinking(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!strategy || !selectedMoment) return;
    setIsGeneratingImage(true);
    try {
      const prompt = `Marketing visualization for ${brand.name || 'Brand'}. Event: ${selectedMoment.title}. Concept: ${strategy.conceptName}. High quality, cinematic.`;
      const imgData = await generateConceptImage(prompt, imageRes);
      if (imgData) setGeneratedImage(imgData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Smart Filter Logic: Only show categories that exist in the results
  const availableCategories = new Set(moments.map(m => m.category));
  const activeCategories = categories.filter(c => c === 'All' || c === 'Saved' || availableCategories.has(c as any));
  
  let filteredMoments = moments;
  if (selectedCategory === 'Saved') {
    filteredMoments = brand.savedMoments;
  } else {
    if (selectedCategory !== 'All') {
      filteredMoments = filteredMoments.filter(m => m.category.toLowerCase().includes(selectedCategory.toLowerCase()) || m.category === 'Other');
    }
    if (selectedScale !== 'All Scales') {
      filteredMoments = filteredMoments.filter(m => m.scale.toLowerCase() === selectedScale.toLowerCase());
    }
  }

  return (
    <div className="flex min-h-screen bg-neutral-950 font-sans text-neutral-200">
      <Sidebar 
        brandProfile={brand} 
        setBrandProfile={setBrand} 
        onFileUpload={setFileContext}
        currentFile={fileContext}
        onSearch={handleSearch}
        isSearching={isSearching}
        viewSaved={() => setSelectedCategory('Saved')}
        onExport={handleExport}
      />

      <main className="ml-96 flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Bar */}
        <header className="h-auto min-h-24 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md flex flex-col justify-center px-8 py-4 z-10 sticky top-0 gap-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1 max-w-3xl relative">
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-neutral-500 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                
                <div className="flex bg-neutral-900 border border-neutral-700 rounded-xl shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all overflow-hidden">
                    <input
                        type="text"
                        className="flex-1 min-w-0 pl-12 pr-3 py-3 bg-transparent placeholder-neutral-500 focus:outline-none text-white sm:text-sm"
                        placeholder={brand.campaignGoal ? `Search based on campaign details...` : "Describe your idea..."}
                        value={query}
                        onChange={(e) => handleQuickSuggest(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button 
                        onClick={handleSearch}
                        className="m-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium text-sm"
                    >
                        Find Moments
                    </button>
                </div>

                {/* Quick Suggestions */}
                {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {suggestions.map((s, i) => (
                        <button key={i} onClick={() => { setQuery(s); setSuggestions([]); handleSearch(); }} className="block w-full text-left px-4 py-3 text-sm hover:bg-neutral-700 border-b border-neutral-700/50 text-neutral-300">
                        {s}
                        </button>
                    ))}
                    </div>
                )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`p-2.5 rounded-lg border transition-all ${isChatOpen ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'}`}
                >
                <Sparkles className="w-4 h-4" />
                </button>
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
                <Filter className="w-4 h-4 text-neutral-500 mr-2 flex-shrink-0" />
                {activeCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`
                            px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex items-center gap-1 relative
                            ${selectedCategory === cat 
                                ? 'bg-white text-black border-white' 
                                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500 hover:text-white'}
                            ${cat === 'Saved' && animateSavedTab ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-neutral-900 animate-pulse' : ''}
                        `}
                    >
                        {cat === 'Saved' && <Heart className={`w-3 h-3 ${selectedCategory === 'Saved' ? 'fill-current' : ''}`} />}
                        {cat}
                        {cat === 'Saved' && brand.savedMoments.length > 0 && (
                            <span className="ml-1 bg-pink-500 text-white text-[9px] px-1 rounded-full">{brand.savedMoments.length}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2 ml-4 border-l border-neutral-700 pl-4">
                <Globe className="w-3 h-3 text-neutral-500" />
                <select 
                    value={selectedScale}
                    onChange={(e) => setSelectedScale(e.target.value)}
                    className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded-lg px-2 py-1 outline-none focus:border-neutral-500"
                >
                    {scales.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Results Panel */}
          <div className={`flex-1 overflow-y-auto p-8 ${selectedMoment ? 'w-1/2 mr-[600px]' : 'w-full'} transition-all duration-500`}>
            {isSearching ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <div className="text-center">
                    <p className="font-medium text-white">Scanning global cultural calendar...</p>
                    <p className="text-sm">Analyzing verified future moments.</p>
                </div>
              </div>
            ) : filteredMoments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500 border-2 border-dashed border-neutral-800 rounded-xl m-4 bg-neutral-900/30">
                <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium text-neutral-400">
                   {selectedCategory === 'Saved' ? "No saved moments yet." : "Ready to plan."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {filteredMoments.map(moment => (
                  <MomentCard 
                    key={moment.id} 
                    moment={moment} 
                    isSelected={selectedMoment?.id === moment.id}
                    isSaved={brand.savedMoments.some(m => m.id === moment.id)}
                    onClick={() => setSelectedMoment(moment)} 
                    onSave={(e) => handleSaveMoment(e, moment)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail & Strategy Panel (Back of Card) */}
          {selectedMoment && (
            <div className="absolute top-0 right-0 bottom-0 w-[600px] border-l border-neutral-800 bg-neutral-900/95 backdrop-blur-xl overflow-y-auto shadow-2xl flex flex-col z-20 animate-in slide-in-from-right duration-300">
               <button 
                onClick={() => setSelectedMoment(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 z-50 backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Rich Hero Image */}
              <div className="h-64 relative group">
                 {/* Fallback Gradient or Actual Image if we had one */}
                 <div className={`absolute inset-0 bg-gradient-to-br ${
                    selectedMoment.category === 'Music' ? 'from-pink-900 to-purple-900' :
                    selectedMoment.category === 'Sports' ? 'from-orange-900 to-red-900' :
                    'from-indigo-900 to-slate-900'
                 }`}>
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                 </div>
                 
                 {/* If we have an image URL (from API or mocked) */}
                 {selectedMoment.imageUrl && (
                     <img src={selectedMoment.imageUrl} alt={selectedMoment.title} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
                 )}

                 <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-transparent"></div>
                 
                 <div className="absolute bottom-0 left-0 p-8 w-full">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-white/10 backdrop-blur rounded text-[10px] font-bold uppercase tracking-wider text-white border border-white/20">
                           {selectedMoment.category}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-500/20 backdrop-blur rounded text-[10px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                           Match: {selectedMoment.matchScore}%
                        </span>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-1 leading-none">{selectedMoment.title}</h2>
                    <div className="flex items-center gap-4 text-neutral-300 text-sm mt-2">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {selectedMoment.date}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {selectedMoment.location}</span>
                    </div>
                 </div>
              </div>

              <div className="p-8 space-y-8 pb-20">
                
                {/* Rich Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
                        <div className="flex items-center gap-2 text-indigo-400 mb-2">
                            <Zap className="w-4 h-4" />
                            <h4 className="text-xs font-bold uppercase tracking-wider">Vibe & Atmosphere</h4>
                        </div>
                        <p className="text-sm text-neutral-300">{selectedMoment.richDetails?.vibe || "High energy, cultural resonance."}</p>
                    </div>
                    <div className="p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <Users className="w-4 h-4" />
                            <h4 className="text-xs font-bold uppercase tracking-wider">Audience</h4>
                        </div>
                        <p className="text-sm text-neutral-300">{selectedMoment.richDetails?.demographics || "Diverse, engaged."}</p>
                    </div>
                </div>

                {/* Deep Context */}
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-3">Strategic Context</h3>
                    <p className="text-neutral-200 text-base leading-relaxed font-light">
                        {selectedMoment.longDescription || selectedMoment.description}
                    </p>
                    
                    <div className="mt-4 p-4 bg-indigo-900/20 border-l-2 border-indigo-500 rounded-r-lg">
                        <p className="text-sm text-indigo-200 italic">
                            <span className="font-bold text-indigo-400 not-italic block mb-1">Why this works:</span>
                            "{selectedMoment.matchReason}"
                        </p>
                    </div>
                </div>

                {/* Links & Validation */}
                <div className="flex gap-3 pb-6 border-b border-neutral-800">
                    {selectedMoment.websiteUrl && (
                        <a href={selectedMoment.websiteUrl} target="_blank" className="text-xs flex items-center gap-1 text-neutral-400 hover:text-white transition-colors bg-neutral-800 px-3 py-2 rounded-lg">
                            <Globe className="w-3 h-3" /> Official Site
                        </a>
                    )}
                    {selectedMoment.groundingUrls?.map((u, i) => (
                         <a key={i} href={u} target="_blank" className="text-xs flex items-center gap-1 text-neutral-400 hover:text-white transition-colors bg-neutral-800 px-3 py-2 rounded-lg">
                            <ArrowUpRight className="w-3 h-3" /> Source {i+1}
                        </a>
                    ))}
                </div>

                {/* Strategy Generator Block */}
                {!strategy && (
                    <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 p-6 rounded-2xl border border-neutral-700 text-center space-y-4">
                        <Trophy className="w-8 h-8 text-yellow-500 mx-auto opacity-80" />
                        <div>
                            <h3 className="text-white font-bold">Activate this Moment</h3>
                            <p className="text-sm text-neutral-400">Generate a bespoke concept, rationale, and execution plan.</p>
                        </div>
                        <button 
                            onClick={handleGenerateStrategy}
                            disabled={isThinking}
                            className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                        >
                            {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                            Generate Strategy
                        </button>
                    </div>
                )}

                {/* Strategy Result */}
                {strategy && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="p-6 bg-neutral-800 rounded-2xl border border-neutral-700">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-black text-white">{strategy.conceptName}</h3>
                                    <p className="text-sm text-indigo-400 font-medium">Strategic Concept</p>
                                </div>
                                <button onClick={() => setStrategy(null)} className="text-neutral-500 hover:text-white"><X className="w-4 h-4"/></button>
                            </div>
                            <p className="text-neutral-300 mb-6 leading-relaxed">{strategy.rationale}</p>
                            
                            <div className="space-y-3 mb-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Execution Steps</h4>
                                {strategy.executionSteps.map((step, i) => (
                                    <div key={i} className="flex gap-3 text-sm text-neutral-300">
                                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-neutral-400 border-t border-neutral-700 pt-4">
                                <Users className="w-4 h-4" /> Est. Reach: <span className="text-white">{strategy.estimatedReach}</span>
                            </div>
                        </div>

                        {/* Visualiser */}
                        <div className="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden">
                            <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
                                <h4 className="font-bold text-white flex items-center gap-2"><ImageIcon className="w-4 h-4 text-pink-400" /> Concept Visualizer</h4>
                                <div className="flex items-center gap-2">
                                   <select 
                                      value={imageRes} 
                                      onChange={(e) => setImageRes(e.target.value as ImageResolution)}
                                      className="bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-xs outline-none"
                                   >
                                      <option value="1K">1K</option>
                                      <option value="2K">2K</option>
                                      <option value="4K">4K</option>
                                   </select>
                                </div>
                            </div>
                            
                            {generatedImage ? (
                                <div className="relative group">
                                    <img src={generatedImage} alt="Concept" className="w-full h-auto" />
                                    <a href={generatedImage} download="concept.png" className="absolute bottom-4 right-4 bg-black/50 backdrop-blur text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-black/80 transition-colors flex items-center gap-2">
                                        Download
                                    </a>
                                </div>
                            ) : (
                                <div className="p-8 flex flex-col items-center text-center">
                                    <p className="text-sm text-neutral-400 mb-4">Visualize this campaign concept with Gemini Imagen.</p>
                                    <button 
                                        onClick={handleGenerateImage}
                                        disabled={isGeneratingImage}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50"
                                    >
                                        {isGeneratingImage ? 'Generating...' : 'Generate Visualization'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
              </div>
            </div>
          )}

        </div>
      </main>

      <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default App;
