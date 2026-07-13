import type { ActivationStrategy, BrandProfile, Moment } from '../types';

export async function findMoments(query: string, brand: BrandProfile): Promise<Moment[]> {
  const response = await fetch('/api/memento', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'moments', query, brand })
  });
  if (!response.ok) throw new Error('Live discovery is unavailable. Showing the verified starter set.');
  const payload = await response.json();
  return Array.isArray(payload.moments) ? payload.moments : [];
}

export async function generateStrategy(brand: BrandProfile, moment: Moment): Promise<ActivationStrategy> {
  const response = await fetch('/api/memento', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'strategy', brand, moment })
  });
  if (!response.ok) return localStrategy(brand, moment);
  const payload = await response.json();
  return payload.strategy ?? localStrategy(brand, moment);
}

export function localStrategy(brand: BrandProfile, moment: Moment): ActivationStrategy {
  return {
    conceptName: `${brand.name || 'Brand'} meets ${moment.title}`,
    rationale: `${moment.title} gives ${brand.name || 'the brand'} a timely way to connect ${brand.targetAudience || 'its audience'} with a real cultural behavior, not a borrowed hashtag.`,
    executionSteps: [
      `Earn a role before the moment through the official community or organizer.`,
      `Build one useful participation mechanic around ${brand.campaignGoal || 'the campaign objective'}.`,
      `Carry the learning forward with creator, attendee, or community voices after the event.`
    ],
    pastBrandActivations: ['Review organizer partner history before committing to a territory.'],
    estimatedReach: moment.estimatedReach || 'Validate with the organizer'
  };
}
