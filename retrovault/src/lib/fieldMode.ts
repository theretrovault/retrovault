export type CopyCondition = "Loose" | "CIB" | "New/Sealed" | "Good";

export const CONDITION_OPTIONS: CopyCondition[] = ["Loose", "CIB", "New/Sealed", "Good"];

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function findInventoryMatch<T extends { title: string; platform: string }>(
  items: T[],
  title: string,
  platform: string
): T | undefined {
  const t = normalizeText(title);
  const p = normalizeText(platform);
  return items.find(item => normalizeText(item.title) === t && normalizeText(item.platform) === p);
}

export function getCopyFlags(condition: CopyCondition) {
  const hasBox = condition === 'CIB' || condition === 'New/Sealed';
  const hasManual = condition === 'CIB' || condition === 'New/Sealed';
  return { hasBox, hasManual };
}

export function buildFieldCopy(condition: CopyCondition, priceAcquired: string) {
  const { hasBox, hasManual } = getCopyFlags(condition);
  return {
    id: Math.random().toString(36).slice(2, 10),
    hasBox,
    hasManual,
    priceAcquired: priceAcquired || '0.00',
    condition,
  };
}

export function buildAcquisitionEntry(input: {
  title: string;
  platform: string;
  priceAcquired: string;
  notes?: string;
  source?: string;
}) {
  return {
    title: input.title,
    platform: input.platform,
    source: input.source || 'Field Mode',
    cost: input.priceAcquired || '0.00',
    date: new Date().toISOString().split('T')[0],
    notes: input.notes || 'Logged from Field Mode',
  };
}
