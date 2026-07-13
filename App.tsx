import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bookmark, CalendarDays, ExternalLink, Loader2, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { findMoments, generateStrategy, localStrategy } from './services/geminiService';
import type { ActivationStrategy, BrandProfile, Moment } from './types';

const starterMoments: Moment[] = [
  { id: 'comic-con-2026', title: 'Comic-Con 2026', date: 'July 23–26, 2026', location: 'San Diego, California', category: 'Culture', description: 'The global fandom calendar converges across entertainment, gaming, creators, and cosplay.', longDescription: 'A dense four-day collision of fan communities, entertainment franchises, artists, games, collectibles, and identity-led participation.', scale: 'Global', estimatedReach: '130k+ attendees', groundingUrls: ['https://www.comic-con.org/cc/'], websiteUrl: 'https://www.comic-con.org/cc/', matchScore: 91, matchReason: 'High concentration of fandom, creator culture, and participatory identity.', verificationDate: 'Verified July 2026' },
  { id: 'burning-man-2026', title: 'Burning Man 2026', date: 'August 30–September 7, 2026', location: 'Black Rock City, Nevada', category: 'Art', description: 'A participant-built temporary city shaped by art, gifting, experimentation, and radical self-expression.', scale: 'Global', estimatedReach: '70k+ participants', groundingUrls: ['https://burningman.org/'], websiteUrl: 'https://burningman.org/', matchScore: 84, matchReason: 'A powerful but high-risk space for community-first participation.', verificationDate: 'Official calendar' },
  { id: 'us-open-2026', title: 'US Open Tennis Championships', date: 'August 30–September 13, 2026', location: 'Queens, New York', category: 'Sports', description: 'Two weeks where tennis, fashion, food, celebrity, and New York energy share one stage.', scale: 'Global', estimatedReach: '1M+ on-site visits', groundingUrls: ['https://www.usopen.org/'], websiteUrl: 'https://www.usopen.org/', matchScore: 88, matchReason: 'Crosses elite sport with lifestyle, hospitality, and highly social fandom.', verificationDate: 'Official event site' },
  { id: 'art-basel-miami-2026', title: 'Art Basel Miami Beach', date: 'December 4–6, 2026', location: 'Miami Beach, Florida', category: 'Art', description: 'The art world, design, fashion, hospitality, and creator economy take over Miami.', scale: 'Global', estimatedReach: '80k+ visitors', groundingUrls: ['https://www.artbasel.com/miami-beach/'], websiteUrl: 'https://www.artbasel.com/miami-beach/', matchScore: 86, matchReason: 'A broad cultural week with room for credible art, design, and hospitality partnerships.', verificationDate: 'Verified July 2026' }
];

const initialBrand: BrandProfile = { name: '', campaignGoal: '', targetAudience: '', targetRegion: 'United States', customLocation: '', timeframe: { start: '', end: '' }, fuzzyTimeframe: 'Next six months', creativityLevel: 55, savedMoments: [] };

export default function App() {
  const [brand, setBrand] = useState<BrandProfile>(() => safeRead('memento:brand', initialBrand));
  const [moments, setMoments] = useState<Moment[]>(starterMoments);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Moment | null>(() => window.innerWidth > 700 ? starterMoments[0] : null);
  const [category, setCategory] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('Verified starter moments are ready. Add a brief to run live discovery.');
  const [strategy, setStrategy] = useState<ActivationStrategy | null>(null);
  const [isStrategizing, setIsStrategizing] = useState(false);

  useEffect(() => { safeWrite('memento:brand', brand); }, [brand]);
  const filtered = useMemo(() => moments.filter((moment) => category === 'All' || moment.category === category), [moments, category]);
  const categories = ['All', ...Array.from(new Set(moments.map((moment) => moment.category)))];

  async function runSearch() {
    if (!query.trim() && !brand.name.trim() && !brand.campaignGoal.trim()) { setMessage('Add a brand, objective, or search thought first.'); return; }
    setIsSearching(true); setMessage('Scanning for verified future moments…'); setStrategy(null);
    try {
      const next = await findMoments(query, brand);
      if (!next.length) throw new Error('No verified results returned.');
      setMoments(next); setSelected(next[0]); setMessage(`${next.length} new moments found and ranked for fit.`);
    } catch (error) { setMoments(starterMoments); setSelected(starterMoments[0]); setMessage(error instanceof Error ? `${error.message} Starter set restored.` : 'Starter set restored.'); }
    finally { setIsSearching(false); }
  }

  function toggleSave(moment: Moment) {
    const exists = brand.savedMoments.some((item) => item.id === moment.id);
    setBrand({ ...brand, savedMoments: exists ? brand.savedMoments.filter((item) => item.id !== moment.id) : [...brand.savedMoments, moment] });
  }

  async function buildStrategy() {
    if (!selected) return;
    setIsStrategizing(true);
    try { setStrategy(await generateStrategy(brand, selected)); }
    catch { setStrategy(localStrategy(brand, selected)); }
    finally { setIsStrategizing(false); }
  }

  return <div className="memento-app">
    <header className="topbar"><a href="https://jgerms20.github.io/AgencyThings/"><ArrowLeft aria-hidden="true" />Joshua&apos;s AgencyThings</a><div><strong>Memento</strong><span>Cultural Moments Finder</span></div><button type="button" className="saved-button" onClick={() => setCategory('Saved')}><Bookmark aria-hidden="true" />Saved {brand.savedMoments.length}</button></header>
    <div className="workspace">
      <aside className="plan-rail"><div className="rail-heading"><SlidersHorizontal aria-hidden="true" /><div><span>Plan the search</span><strong>Find the right moment, not just a date.</strong></div></div>
        <label>Brand / client<input value={brand.name} onChange={(event) => setBrand({ ...brand, name: event.target.value })} placeholder="e.g. Gatorade" /></label>
        <label>Objective<textarea value={brand.campaignGoal} onChange={(event) => setBrand({ ...brand, campaignGoal: event.target.value })} placeholder="What should this moment help accomplish?" /></label>
        <label>Audience<input value={brand.targetAudience} onChange={(event) => setBrand({ ...brand, targetAudience: event.target.value })} placeholder="Who are we trying to move?" /></label>
        <label>Region<input value={brand.targetRegion} onChange={(event) => setBrand({ ...brand, targetRegion: event.target.value })} /></label>
        <label>Timing<input value={brand.fuzzyTimeframe} onChange={(event) => setBrand({ ...brand, fuzzyTimeframe: event.target.value })} placeholder="Next quarter" /></label>
        <label className="range-label"><span>Creativity flex <b>{brand.creativityLevel}</b></span><input type="range" min="0" max="100" value={brand.creativityLevel} onChange={(event) => setBrand({ ...brand, creativityLevel: Number(event.target.value) })} /></label>
        <button className="primary" type="button" onClick={runSearch} disabled={isSearching}>{isSearching ? <Loader2 className="spin" aria-hidden="true" /> : <Search aria-hidden="true" />}Update results</button>
        <div className="visual-asset"><img src="/cultural-moments-collage.png" alt="A collage of music, sport, art, gaming, fashion, and food culture" /></div>
      </aside>

      <main className="results"><div className="search-band"><label><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runSearch()} placeholder="Search a theme, behavior, audience, event, or cultural tension" /></label><button type="button" onClick={runSearch}>Find moments</button></div>
        <div className="timeline"><div><CalendarDays aria-hidden="true" /><span>Upcoming moments</span></div>{filtered.slice(0, 5).map((moment) => <button key={moment.id} onClick={() => setSelected(moment)} className={selected?.id === moment.id ? 'active' : ''}><small>{moment.date.split(',')[0]}</small><strong>{moment.title}</strong></button>)}</div>
        <div className="filters"><div>{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><p role="status">{message}</p></div>
        <section className="moment-list">{(category === 'Saved' ? brand.savedMoments : filtered).map((moment, index) => <article key={moment.id} className={selected?.id === moment.id ? 'selected' : ''} onClick={() => { setSelected(moment); setStrategy(null); }}>
          <div className={`moment-image crop-${index % 4}`}><img src={moment.imageUrl || '/cultural-moments-collage.png'} alt="" /></div><time>{moment.date}</time><div className="moment-copy"><span>{moment.category} · {moment.scale}</span><h2>{moment.title}</h2><p>{moment.location}</p><small>{moment.description}</small></div><div className="match"><span>Match</span><strong>{moment.matchScore ?? 75}</strong><small>{moment.verificationDate}</small></div><button className="bookmark" aria-label={brand.savedMoments.some((item) => item.id === moment.id) ? 'Remove saved moment' : 'Save moment'} onClick={(event) => { event.stopPropagation(); toggleSave(moment); }}><Bookmark aria-hidden="true" fill={brand.savedMoments.some((item) => item.id === moment.id) ? 'currentColor' : 'none'} /></button>
        </article>)}{(category === 'Saved' ? brand.savedMoments : filtered).length === 0 && <div className="empty">No saved moments yet.</div>}</section>
      </main>

      <aside className={`detail-panel ${selected ? 'open' : ''}`}>{selected && <><button className="close" aria-label="Close moment detail" onClick={() => setSelected(null)}><X /></button><span className="eyebrow">Selected moment</span><h2>{selected.title}</h2><p className="detail-meta">{selected.date}<br />{selected.location}</p><div className="detail-score">{selected.matchScore ?? 75}<span>Match score</span></div>
        <section><h3>Why now</h3><p>{selected.longDescription || selected.description}</p></section><section><h3>Brand fit</h3><p>{selected.matchReason || `${brand.name || 'The brand'} can earn a role by adding value to the people already participating.`}</p></section>
        <section><h3>Activation territory</h3>{strategy ? <><h4>{strategy.conceptName}</h4><p>{strategy.rationale}</p><ol>{strategy.executionSteps.map((step) => <li key={step}>{step}</li>)}</ol></> : <button className="strategy-button" type="button" onClick={buildStrategy} disabled={isStrategizing}>{isStrategizing ? <Loader2 className="spin" /> : <Sparkles />}Build a territory</button>}</section>
        <section><h3>Source & links</h3><div className="source-list">{(selected.groundingUrls.length ? selected.groundingUrls : [selected.websiteUrl]).filter(Boolean).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">Official source <ExternalLink /></a>)}</div></section></>}</aside>
    </div>
  </div>;
}

function safeRead<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? { ...fallback, ...JSON.parse(value) } : fallback; } catch { return fallback; } }
function safeWrite(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* optional local persistence */ } }
