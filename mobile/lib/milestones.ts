// Milestone tier definitions — mirrors web dashboard tiers in
// src/app/user/(protected)/dashboard/page.tsx. Keep in sync.
// Colors sourced from shared TIER_COLORS — never inline hex/rgba.

import { TIER_COLORS, withAlpha } from '@fitconnect/shared/theme';

export interface Tier {
    name: string;
    threshold: number;
    color: string;
    bg: string;
    iconName: 'shield' | 'medal' | 'award' | 'crown' | 'gem';
}

export const TIERS: readonly Tier[] = [
    { name: 'Bronze',   threshold: 0,   color: TIER_COLORS.bronze.color,   bg: withAlpha(TIER_COLORS.bronze.color,   TIER_COLORS.bronze.bgAlpha),   iconName: 'shield' },
    { name: 'Silver',   threshold: 10,  color: TIER_COLORS.silver.color,   bg: withAlpha(TIER_COLORS.silver.color,   TIER_COLORS.silver.bgAlpha),   iconName: 'medal' },
    { name: 'Gold',     threshold: 25,  color: TIER_COLORS.gold.color,     bg: withAlpha(TIER_COLORS.gold.color,     TIER_COLORS.gold.bgAlpha),     iconName: 'award' },
    { name: 'Platinum', threshold: 50,  color: TIER_COLORS.platinum.color, bg: withAlpha(TIER_COLORS.platinum.color, TIER_COLORS.platinum.bgAlpha), iconName: 'crown' },
    { name: 'Diamond',  threshold: 100, color: TIER_COLORS.diamond.color,  bg: withAlpha(TIER_COLORS.diamond.color,  TIER_COLORS.diamond.bgAlpha),  iconName: 'gem' },
] as const;

export interface MilestoneStatus {
    currentTier: Tier;
    currentTierIdx: number;
    nextTier: Tier | null;
    progress: number;
}

export function getMilestone(totalClasses: number): MilestoneStatus {
    let currentTierIdx = 0;
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (totalClasses >= TIERS[i].threshold) {
            currentTierIdx = i;
            break;
        }
    }
    const currentTier = TIERS[currentTierIdx];
    const nextTier = TIERS[currentTierIdx + 1] || null;
    const progress = nextTier
        ? ((totalClasses - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100
        : 100;
    return { currentTier, currentTierIdx, nextTier, progress: Math.min(progress, 100) };
}
