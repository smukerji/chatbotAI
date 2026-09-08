const ORG_HISTORY_PATTERN =
  /\b(how long|how many years|since when|when did|years has|been providing|been around|founded|how old|years of experience|history|established)\b/i;

const CONTACT_QUERY_PATTERN =
  /\b(whatsapp|wechat|phone|telephone|tel|mobile|call|contact|email|address|opening hours|hours|location|where (are|is) you|how (do i|can i) (reach|contact|call))\b/i;

const MEDICAL_ARTICLE_PATH =
  /\/(health|conditions|symptoms|disease|std|drugs|treatment|diagnosis)\b/i;

const COMPANY_PAGE_PATH =
  /\/(about|company|who-we-are|our-story|contact|faq)(?:\/|$)/i;

export function isOrgHistoryQuery(query: string): boolean {
  return ORG_HISTORY_PATTERN.test(query);
}

export function isContactQuery(query: string): boolean {
  return CONTACT_QUERY_PATTERN.test(query);
}

/** Sort key only — raw Pinecone score is returned to the client unchanged. */
export function boostedRetrievalScore(
  query: string,
  doc: { metadata?: Record<string, unknown>; pageContent?: string },
  score: number
): number {
  const content = String(doc.metadata?.content ?? doc.pageContent ?? "");
  const url = String(doc.metadata?.link ?? doc.metadata?.source_url ?? "");
  let boosted = score;

  if (isContactQuery(query)) {
    if (/\bwhatsapp\b/i.test(query) && /\bwhatsapp\b/i.test(content)) {
      boosted += 6;
    }
    if (/\bphone\b|\btel\b|\bcall\b/i.test(query) && /\bphone\b|\btel\b/i.test(content)) {
      boosted += 4;
    }
    if (/\baddress\b|\blocation\b|\bwhere\b/i.test(query) && /\baddress\b|\bcaine|road|street|building\b/i.test(content)) {
      boosted += 4;
    }
    if (/\bhours?\b/i.test(query) && /\b(mon|tue|wed|thu|fri|sat|sun|opening hours|\d{1,2}[:.]\d{2})\b/i.test(content)) {
      boosted += 4;
    }
    if (/\bemail\b/i.test(query) && /@/.test(content)) {
      boosted += 4;
    }
    if (/[+]?\d[\d\s-]{7,}/.test(content)) {
      boosted += 2;
    }
    if (COMPANY_PAGE_PATH.test(url) || /\/$/.test(url.replace(/^https?:\/\/[^/]+/, ""))) {
      boosted += 1;
    }
    // History micro-chunks often dominate contact queries after hybrid ranking
    if (/\bsince\s+\d{4}\b/i.test(content) && content.length < 120 && !/\bwhatsapp|phone|address\b/i.test(content)) {
      boosted -= 4;
    }
    return boosted;
  }

  if (!isOrgHistoryQuery(query)) {
    return boosted;
  }

  if (/\d+\s+years?\s+of\s+experience/i.test(content)) {
    boosted += 3;
  }
  if (/\b(since|founded|established)\s+\d{4}\b/i.test(content)) {
    boosted += 3;
  }
  if (/\d+\s+million\b/i.test(content)) {
    boosted += 1.5;
  }
  if (/\d+[\d,]*\s+(reviewers|readers|customers|clients|users)\b/i.test(content)) {
    boosted += 1.5;
  }
  if (COMPANY_PAGE_PATH.test(url) || /\/$/.test(url.replace(/^https?:\/\/[^/]+/, ""))) {
    boosted += 1;
  }
  if (MEDICAL_ARTICLE_PATH.test(url)) {
    boosted -= 4;
  }

  return boosted;
}

export function orgHistorySparseQuery(query: string): string {
  return `${query} years experience founded established history organization company`;
}

export function contactSparseQuery(query: string): string {
  return `${query} WhatsApp phone telephone address email opening hours contact`;
}
