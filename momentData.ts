import type { Moment } from './types';

export const MOMENT_IMAGE_LIBRARY = [
  '/moment-comic-con-editorial.jpg',
  '/moment-burning-man-editorial.jpg',
  '/moment-us-open-editorial.jpg',
  '/moment-art-basel-editorial.jpg',
  '/moment-comic-con.svg',
  '/moment-burning-man.svg',
  '/moment-us-open.svg',
  '/moment-art-basel.svg',
  '/moment-music-night.svg',
  '/moment-fashion-week.svg',
  '/moment-food-market.svg',
  '/moment-tech-fair.svg'
];

export const starterMoments: Moment[] = [
  {
    id: 'comic-con-2026',
    title: 'Comic-Con 2026',
    date: 'July 23–26, 2026',
    startDate: '2026-07-23',
    location: 'San Diego, California',
    category: 'Culture',
    description: 'The global fandom calendar converges across entertainment, gaming, creators, and cosplay.',
    longDescription: 'A dense four-day collision of fan communities, entertainment franchises, artists, games, collectibles, and identity-led participation.',
    scale: 'Global',
    estimatedReach: '130k+ attendees',
    groundingUrls: ['https://www.comic-con.org/cc/'],
    websiteUrl: 'https://www.comic-con.org/cc/',
    imageUrl: '/moment-comic-con-editorial.jpg',
    matchScore: 91,
    matchReason: 'High concentration of fandom, creator culture, and participatory identity.',
    verificationDate: 'Verified July 2026',
    imageTreatment: 'Convention attendees moving through a crowded fan culture gathering'
  },
  {
    id: 'burning-man-2026',
    title: 'Burning Man 2026',
    date: 'August 30–September 7, 2026',
    startDate: '2026-08-30',
    location: 'Black Rock City, Nevada',
    category: 'Art',
    description: 'A participant-built temporary city shaped by art, gifting, experimentation, and radical self-expression.',
    longDescription: 'A participant-built temporary city shaped by art, gifting, experimentation, and radical self-expression.',
    scale: 'Global',
    estimatedReach: '70k+ participants',
    groundingUrls: ['https://burningman.org/'],
    websiteUrl: 'https://burningman.org/',
    imageUrl: '/moment-burning-man-editorial.jpg',
    matchScore: 84,
    matchReason: 'A powerful but high-risk space for community-first participation.',
    verificationDate: 'Official calendar',
    imageTreatment: 'A temporary desert art city at sunrise'
  },
  {
    id: 'us-open-2026',
    title: 'US Open Tennis Championships',
    date: 'August 30–September 13, 2026',
    startDate: '2026-08-30',
    location: 'Queens, New York',
    category: 'Sports',
    description: 'Two weeks where tennis, fashion, food, celebrity, and New York energy share one stage.',
    longDescription: 'Two weeks where tennis, fashion, food, celebrity, and New York energy share one stage.',
    scale: 'Global',
    estimatedReach: '1M+ on-site visits',
    groundingUrls: ['https://www.usopen.org/'],
    websiteUrl: 'https://www.usopen.org/',
    imageUrl: '/moment-us-open-editorial.jpg',
    matchScore: 88,
    matchReason: 'Crosses elite sport with lifestyle, hospitality, and highly social fandom.',
    verificationDate: 'Official event site',
    imageTreatment: 'A night tennis match in a packed New York stadium'
  },
  {
    id: 'art-basel-miami-2026',
    title: 'Art Basel Miami Beach',
    date: 'December 4–6, 2026',
    startDate: '2026-12-04',
    location: 'Miami Beach, Florida',
    category: 'Art',
    description: 'The art world, design, fashion, hospitality, and creator economy take over Miami.',
    longDescription: 'The art world, design, fashion, hospitality, and creator economy take over Miami.',
    scale: 'Global',
    estimatedReach: '80k+ visitors',
    groundingUrls: ['https://www.artbasel.com/miami-beach/'],
    websiteUrl: 'https://www.artbasel.com/miami-beach/',
    imageUrl: '/moment-art-basel-editorial.jpg',
    matchScore: 86,
    matchReason: 'A broad cultural week with room for credible art, design, and hospitality partnerships.',
    verificationDate: 'Verified July 2026',
    imageTreatment: 'A contemporary Miami gallery filled with art week visitors'
  }
];

export function getMomentImage(moment: Moment, index = 0): string {
  if (moment.imageUrl) return moment.imageUrl;
  const hash = Array.from(moment.id).reduce((total, character) => total + character.charCodeAt(0), 0);
  return MOMENT_IMAGE_LIBRARY[(hash + index) % MOMENT_IMAGE_LIBRARY.length];
}

export function parseMomentStartDate(moment: Moment): number {
  return new Date(moment.startDate || moment.date).getTime();
}

export function upcomingMoments(moments: Moment[], now = Date.now()): Moment[] {
  return moments
    .filter((moment) => Number.isFinite(parseMomentStartDate(moment)) && parseMomentStartDate(moment) >= now)
    .sort((a, b) => parseMomentStartDate(a) - parseMomentStartDate(b));
}
