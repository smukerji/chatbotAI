/** Plan caps are stored as strings; some accounts use "unlimited". */
export function isUnlimitedCrawlLimit(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "unlimited";
}

export function remainingCrawlAllowance(
  planLimit: unknown,
  previousCount = 0,
  alreadyCrawledInBatch = 0
): number {
  if (isUnlimitedCrawlLimit(planLimit)) {
    return Number.MAX_SAFE_INTEGER;
  }
  const cap = Number(planLimit);
  if (!Number.isFinite(cap)) return 0;
  return Math.max(0, cap - previousCount - alreadyCrawledInBatch);
}

export function isCrawlLimitExceeded(
  currentCount: number,
  planLimit: unknown
): boolean {
  if (isUnlimitedCrawlLimit(planLimit)) return false;
  const cap = Number(planLimit);
  if (!Number.isFinite(cap)) return true;
  return currentCount > cap;
}
