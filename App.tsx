import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ExternalLink,
  LayoutList,
  Loader2,
  Moon,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  X
} from 'lucide-react';
import { findMoments, generateStrategy, localStrategy } from './services/geminiService';
import { getMomentImage, starterMoments, upcomingMoments } from './momentData';
import type { ActivationStrategy, BrandProfile, Moment } from './types';

type Theme = 'dark' | 'light';
type ResultsView = 'calendar' | 'list';

const initialBrand: BrandProfile = {
  name: '',
  campaignGoal: '',
  targetAudience: '',
  targetRegion: 'United States',
  customLocation: '',
  timeframe: { start: '', end: '' },
  fuzzyTimeframe: 'Next six months',
  creativityLevel: 55,
  savedMoments: []
};

const audiences = ['Gen Z culture seekers', 'Young families', 'Creators and fans', 'Design-conscious professionals', 'Local communities'];
const regions = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Japan', 'Global', 'Custom'];

export default function App() {
  const [brand, setBrand] = useState<BrandProfile>(() => safeRead('memento:brand', initialBrand));
  const [moments, setMoments] = useState<Moment[]>(starterMoments);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Moment | null>(() => typeof window !== 'undefined' && window.innerWidth > 700 ? starterMoments[0] : null);
  const [category, setCategory] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('Starter moments are verified against official event sources.');
  const [strategy, setStrategy] = useState<ActivationStrategy | null>(null);
  const [isStrategizing, setIsStrategizing] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => safeRead('memento:theme', getPreferredTheme()));
  const [resultsView, setResultsView] = useState<ResultsView>('calendar');
  const [importStatus, setImportStatus] = useState('No Sean calendar file imported');

  useEffect(() => {
    safeWrite('memento:brand', brand);
  }, [brand]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    safeWrite('memento:theme', theme);
  }, [theme]);

  const categories = ['All', ...Array.from(new Set(moments.map((moment) => moment.category)))];
  const visibleMoments = category === 'Saved' ? brand.savedMoments : moments.filter((moment) => category === 'All' || moment.category === category);
  const calendarMoments = useMemo(() => upcomingMoments(moments), [moments]);
  const renderedMoments = useMemo(() => {
    const usedImages = new Set<string>();
    return visibleMoments.map((moment, index) => {
      let image = moment.imageUrl && !usedImages.has(moment.imageUrl) ? moment.imageUrl : getMomentImage(moment, index);
      let attempt = 0;
      while (usedImages.has(image) && attempt < 12) {
        image = getMomentImage(moment, index + ++attempt);
      }
      usedImages.add(image);
      return { moment, image };
    });
  }, [visibleMoments]);

  function setBrandField<K extends keyof BrandProfile>(field: K, value: BrandProfile[K]) {
    setBrand((current) => ({ ...current, [field]: value }));
  }

  function selectMoment(moment: Moment) {
    setSelected(moment);
    setStrategy(null);
  }

  function validateTiming() {
    if (brand.timeframe.start && brand.timeframe.end && brand.timeframe.start > brand.timeframe.end) {
      setMessage('Timing needs an end date on or after the start date.');
      return false;
    }
    return true;
  }

  async function discover(kind: 'search' | 'suggest') {
    if (!validateTiming()) return;
    if (kind === 'search' && !query.trim() && !brand.name.trim() && !brand.campaignGoal.trim() && !brand.targetAudience.trim()) {
      setMessage('Add a brand, objective, audience, or search thought first.');
      return;
    }
    setIsSearching(true);
    setMessage(kind === 'suggest' ? 'Finding a varied set of future cultural moments...' : 'Scanning for verified future moments...');
    setStrategy(null);
    try {
      const next = await findMoments(kind === 'suggest' ? query || 'Suggest diverse cultural moments with strong participation energy' : query, brand);
      if (!next.length) throw new Error('No verified results returned.');
      setMoments(next);
      setCategory('All');
      selectMoment(next[0]);
      setMessage(`${next.length} moments ranked for this brief.`);
    } catch (error) {
      setMoments(starterMoments);
      setCategory('All');
      selectMoment(starterMoments[0]);
      setMessage(error instanceof Error ? `${error.message} Starter set restored.` : 'Starter set restored.');
    } finally {
      setIsSearching(false);
    }
  }

  function toggleSave(moment: Moment) {
    setBrand((current) => {
      const exists = current.savedMoments.some((item) => item.id === moment.id);
      return { ...current, savedMoments: exists ? current.savedMoments.filter((item) => item.id !== moment.id) : [...current.savedMoments, moment] };
    });
  }

  async function buildStrategy() {
    if (!selected) return;
    setIsStrategizing(true);
    try {
      setStrategy(await generateStrategy(brand, selected));
    } catch {
      setStrategy(localStrategy(brand, selected));
    } finally {
      setIsStrategizing(false);
    }
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportStatus(`${file.name} queued for local review`);
  }

  return (
    <div className="memento-app">
      <header className="topbar">
        <a href="https://jgerms20.github.io/AgencyThings/"><ArrowLeft aria-hidden="true" />Joshua&apos;s AgencyThings</a>
        <div className="brand-lockup"><strong>Memento</strong><span title="Cultural Moments Finder">Cultural Moments Planner</span></div>
        <div className="topbar-actions">
          <button type="button" className="icon-button theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </button>
          <button type="button" className="saved-button" onClick={() => setCategory('Saved')}><Bookmark aria-hidden="true" />Saved {brand.savedMoments.length}</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="plan-rail">
          <div className="rail-heading"><SlidersHorizontal aria-hidden="true" /><div><span>01 / Plan</span><strong>Give the search a point of view.</strong></div></div>
          <div className="field-group">
            <label htmlFor="brand">Brand / client</label>
            <input id="brand" value={brand.name} onChange={(event) => setBrandField('name', event.target.value)} placeholder="e.g. Gatorade" />
          </div>
          <div className="field-group">
            <label htmlFor="objective">Objective</label>
            <textarea id="objective" value={brand.campaignGoal} onChange={(event) => setBrandField('campaignGoal', event.target.value)} placeholder="What should this moment help accomplish?" />
          </div>
          <div className="field-group">
            <label htmlFor="audience">Audience</label>
            <input id="audience" list="audience-suggestions" value={brand.targetAudience} onChange={(event) => setBrandField('targetAudience', event.target.value)} placeholder="Who are we trying to move?" />
            <datalist id="audience-suggestions">{audiences.map((audience) => <option key={audience} value={audience} />)}</datalist>
          </div>
          <div className="field-group">
            <label htmlFor="region">Region</label>
            <select id="region" value={regions.includes(brand.targetRegion) ? brand.targetRegion : 'Custom'} onChange={(event) => setBrandField('targetRegion', event.target.value)}>
              {regions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
            {(brand.targetRegion === 'Custom' || !regions.includes(brand.targetRegion)) && <input className="custom-region" value={brand.customLocation || ''} onChange={(event) => setBrandField('customLocation', event.target.value)} placeholder="Type a city, market, or region" aria-label="Custom region" />}
          </div>
          <div className="field-group date-group">
            <label>Timing window</label>
            <div className="date-fields"><input aria-label="Timing start date" type="date" value={brand.timeframe.start} onChange={(event) => setBrandField('timeframe', { ...brand.timeframe, start: event.target.value })} onInput={(event) => setBrandField('timeframe', { ...brand.timeframe, start: event.currentTarget.value })} /><span>to</span><input aria-label="Timing end date" type="date" value={brand.timeframe.end} onChange={(event) => setBrandField('timeframe', { ...brand.timeframe, end: event.target.value })} onInput={(event) => setBrandField('timeframe', { ...brand.timeframe, end: event.currentTarget.value })} /></div>
            <input className="fuzzy-input" value={brand.fuzzyTimeframe || ''} onChange={(event) => setBrandField('fuzzyTimeframe', event.target.value)} placeholder="Or describe it: next quarter" aria-label="Flexible timing description" />
          </div>
          <label className="range-label" htmlFor="creativity"><span>Creativity flex <b>{brand.creativityLevel}</b></span><input id="creativity" type="range" min="0" max="100" value={brand.creativityLevel} onChange={(event) => setBrandField('creativityLevel', Number(event.target.value))} /></label>
          <button className="primary" type="button" onClick={() => discover('search')} disabled={isSearching}>{isSearching ? <Loader2 className="spin" aria-hidden="true" /> : <Search aria-hidden="true" />}Update results</button>

          <section className="import-block">
            <div className="import-heading"><CalendarRange aria-hidden="true" /><div><span>Sean&apos;s Cultural Calendar</span><strong>Bring in a local calendar file</strong></div></div>
            <p>Import point only. Live calendar access is not configured here.</p>
            <label className="import-button"><Upload aria-hidden="true" />Import .ics / .csv<input type="file" accept=".ics,.csv,.json" onChange={handleImport} /></label>
            <small>{importStatus}</small>
          </section>
        </aside>

        <main className="results">
          <section className="results-intro"><div><span className="section-kicker">02 / Discover</span><h1>Plan around what people already care about.</h1></div><p>Find verified future moments, then earn a credible role inside them.</p></section>
          <div className="search-band"><label htmlFor="search"><Search aria-hidden="true" /><input id="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && discover('search')} placeholder="Search a theme, behavior, audience, event, or tension" /></label><button type="button" onClick={() => discover('search')}>Find moments</button></div>

          <section className="calendar-section">
            <div className="section-header"><div><span className="section-kicker">Upcoming calendar</span><h2>See the next cultural openings.</h2></div><div className="section-actions"><button type="button" className="suggest-button" onClick={() => discover('suggest')} disabled={isSearching}><Sparkles aria-hidden="true" />Suggest moments</button><div className="view-toggle" aria-label="Calendar view"><button type="button" className={resultsView === 'calendar' ? 'active' : ''} onClick={() => setResultsView('calendar')} aria-label="Calendar timeline view" title="Calendar timeline view"><CalendarDays aria-hidden="true" /></button><button type="button" className={resultsView === 'list' ? 'active' : ''} onClick={() => setResultsView('list')} aria-label="List view" title="List view"><LayoutList aria-hidden="true" /></button></div></div></div>
            {resultsView === 'calendar' && <div className="calendar-track" aria-label="Upcoming moments timeline">{calendarMoments.length ? calendarMoments.map((moment) => <button key={moment.id} type="button" className={`calendar-event ${selected?.id === moment.id ? 'active' : ''}`} onClick={() => selectMoment(moment)}><time>{formatCalendarDate(moment)}</time><strong>{moment.title}</strong><span>{moment.category} / {moment.location}</span></button>) : <p className="calendar-empty">No upcoming moments in this result set.</p>}</div>}
          </section>

          <div className="filters"><div>{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><p role="status">{message}</p></div>
          <section className="moment-list" aria-label="Moment results">
            {renderedMoments.map(({ moment, image }) => <article key={moment.id} className={selected?.id === moment.id ? 'selected' : ''} onClick={() => selectMoment(moment)}>
              <div className="moment-image"><img src={image} alt={moment.imageTreatment || `${moment.title} visual treatment`} /></div>
              <time>{moment.date}</time>
              <div className="moment-copy"><span>{moment.category} / {moment.scale}</span><h2>{moment.title}</h2><p>{moment.location}</p><small>{moment.description}</small></div>
              <div className="match"><span>Match</span><strong>{moment.matchScore ?? 75}</strong><small>{moment.verificationDate || 'Needs verification'}</small></div>
              <button className="bookmark" aria-label={brand.savedMoments.some((item) => item.id === moment.id) ? 'Remove saved moment' : 'Save moment'} onClick={(event) => { event.stopPropagation(); toggleSave(moment); }}><Bookmark aria-hidden="true" fill={brand.savedMoments.some((item) => item.id === moment.id) ? 'currentColor' : 'none'} /></button>
            </article>)}
            {!renderedMoments.length && <div className="empty">No saved moments yet.</div>}
          </section>
        </main>

        <aside className={`detail-panel ${selected ? 'open' : ''}`}>
          {selected && <><button className="close" aria-label="Close moment detail" onClick={() => setSelected(null)}><X /></button><span className="eyebrow">03 / Selected moment</span><h2>{selected.title}</h2><p className="detail-meta">{selected.date}<br />{selected.location}</p><div className="detail-score">{selected.matchScore ?? 75}<span>Match score</span></div>
            <section><h3>Why now</h3><p>{selected.longDescription || selected.description}</p></section>
            <section><h3>Brand fit</h3><p>{selected.matchReason || `${brand.name || 'The brand'} can earn a role by adding value to the people already participating.`}</p></section>
            <section><h3>Activation territory</h3>{strategy ? <><h4>{strategy.conceptName}</h4><p>{strategy.rationale}</p><ol>{strategy.executionSteps.map((step) => <li key={step}>{step}</li>)}</ol></> : <button className="strategy-button" type="button" onClick={buildStrategy} disabled={isStrategizing}>{isStrategizing ? <Loader2 className="spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}Build a territory</button>}</section>
            <section><h3>Source & links</h3><div className="source-list">{(selected.groundingUrls.length ? selected.groundingUrls : [selected.websiteUrl]).filter(Boolean).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">Official source <ExternalLink aria-hidden="true" /></a>)}<span className="verified-note"><CheckCircle2 aria-hidden="true" />Source trail retained</span></div></section>
          </>}
        </aside>
      </div>
    </div>
  );
}

function formatCalendarDate(moment: Moment) {
  const parsed = moment.startDate ? new Date(`${moment.startDate}T00:00:00Z`) : new Date(moment.date);
  return Number.isNaN(parsed.getTime()) ? moment.date : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(parsed);
}

function getPreferredTheme(): Theme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    if (typeof fallback === 'object' && fallback !== null && !Array.isArray(fallback) && typeof parsed === 'object' && parsed !== null) return { ...fallback, ...parsed } as T;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence is optional when browser storage is unavailable.
  }
}
