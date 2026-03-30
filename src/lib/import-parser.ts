// ---------------------------------------------------------------------------
// Social media URL import parser
//
// Attempts to extract meal data from Instagram and TikTok URLs by fetching
// the page and reading Open Graph meta tags.
//
// IMPORTANT LIMITATIONS:
// - Instagram and TikTok frequently change their HTML structure.
// - Both platforms heavily rely on client-side JavaScript rendering, so
//   server-side fetches often receive incomplete HTML or redirect pages.
// - Rate limiting, login walls, and bot detection may block requests.
// - The og:title and og:description may contain irrelevant boilerplate.
// - This parser is best-effort; the `confidence` field reflects how much
//   data we were actually able to extract.
// - For reliable imports, consider using official APIs (Instagram Graph API,
//   TikTok API) which require authentication and app review.
// ---------------------------------------------------------------------------

import * as cheerio from "cheerio";

// ---- Types ----------------------------------------------------------------

export type SourceType = "instagram" | "tiktok" | "unknown";

export interface ParsedMealData {
  /** Extracted title (from og:title), if found. */
  title: string | null;
  /** Extracted description (from og:description), if found. */
  description: string | null;
  /** Extracted image URL (from og:image), if found. */
  imageUrl: string | null;
  /** Detected source platform. */
  sourceType: SourceType;
  /** Original URL provided by the user. */
  sourceUrl: string;
  /**
   * Confidence in the extracted data, 0-1.
   * - 0.0: could not fetch or parse anything
   * - 0.3: got the page but no useful OG tags
   * - 0.5: got some OG data
   * - 0.8: got title + description + image
   * - 1.0: reserved for API-backed extraction (not implemented yet)
   */
  confidence: number;
}

// ---- URL detection --------------------------------------------------------

const INSTAGRAM_PATTERNS = [
  /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\//i,
  /^https?:\/\/(www\.)?instagr\.am\//i,
];

const TIKTOK_PATTERNS = [
  /^https?:\/\/(www\.|vm\.)?tiktok\.com\//i,
  /^https?:\/\/(www\.)?tiktok\.com\/@[\w.]+\/video\//i,
];

function detectSourceType(url: string): SourceType {
  if (INSTAGRAM_PATTERNS.some((p) => p.test(url))) return "instagram";
  if (TIKTOK_PATTERNS.some((p) => p.test(url))) return "tiktok";
  return "unknown";
}

// ---- OG tag extraction ----------------------------------------------------

interface OgTags {
  title: string | null;
  description: string | null;
  image: string | null;
}

function extractOgTags(html: string): OgTags {
  const $ = cheerio.load(html);

  const getMetaContent = (property: string): string | null => {
    // Try both property and name attributes (some pages use one or the other)
    const content =
      $(`meta[property="${property}"]`).attr("content") ??
      $(`meta[name="${property}"]`).attr("content") ??
      null;
    return content?.trim() || null;
  };

  return {
    title: getMetaContent("og:title"),
    description: getMetaContent("og:description"),
    image: getMetaContent("og:image"),
  };
}

// ---- Confidence calculation -----------------------------------------------

function calculateConfidence(tags: OgTags, sourceType: SourceType): number {
  let score = 0;

  if (tags.title) score += 0.3;
  if (tags.description) score += 0.3;
  if (tags.image) score += 0.2;

  // Unknown source type reduces confidence
  if (sourceType === "unknown") score *= 0.7;

  return Math.min(score, 0.8); // Cap at 0.8 for scraping-based extraction
}

// ---- Clean up extracted text -----------------------------------------------

/**
 * Attempt to clean platform boilerplate from OG tags.
 * e.g. Instagram often appends " on Instagram: ..." or includes hashtags.
 */
function cleanTitle(title: string | null, sourceType: SourceType): string | null {
  if (!title) return null;

  let cleaned = title;

  if (sourceType === "instagram") {
    // Remove common Instagram boilerplate patterns
    cleaned = cleaned
      .replace(/\s*on Instagram:?\s*/i, " ")
      .replace(/\s*\|.*Instagram.*$/i, "")
      .replace(/@[\w.]+\s*/g, "") // remove @mentions
      .trim();
  }

  if (sourceType === "tiktok") {
    cleaned = cleaned
      .replace(/\s*\|.*TikTok.*$/i, "")
      .replace(/#\w+\s*/g, "") // remove hashtags
      .trim();
  }

  // If cleaning removed everything, return original
  return cleaned || title;
}

function cleanDescription(
  description: string | null,
  sourceType: SourceType
): string | null {
  if (!description) return null;

  let cleaned = description;

  // Remove excessive hashtags (keep the first 3 at most for context)
  const hashtags = cleaned.match(/#\w+/g) ?? [];
  if (hashtags.length > 3) {
    for (const tag of hashtags.slice(3)) {
      cleaned = cleaned.replace(tag, "");
    }
  }

  // Trim boilerplate suffixes
  if (sourceType === "instagram") {
    cleaned = cleaned.replace(
      /\d+\s*(likes?|comments?|views?)\s*$/i,
      ""
    );
  }

  return cleaned.replace(/\s+/g, " ").trim() || description;
}

// ---- Main parser ----------------------------------------------------------

/**
 * Parse a social media URL and attempt to extract meal data.
 *
 * @param url - An Instagram or TikTok post/reel URL
 * @returns Parsed meal data with a confidence score
 *
 * @example
 * ```ts
 * const data = await parseImportUrl("https://www.instagram.com/reel/ABC123/");
 * if (data.confidence > 0.3) {
 *   // Use data.title, data.description, data.imageUrl
 * }
 * ```
 */
export async function parseImportUrl(url: string): Promise<ParsedMealData> {
  const sourceType = detectSourceType(url);

  const empty: ParsedMealData = {
    title: null,
    description: null,
    imageUrl: null,
    sourceType,
    sourceUrl: url,
    confidence: 0,
  };

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return empty;
  }

  try {
    // Fetch with a browser-like User-Agent to reduce bot detection.
    // NOTE: This may still be blocked by Instagram/TikTok.
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return { ...empty, confidence: 0 };
    }

    const html = await response.text();
    const ogTags = extractOgTags(html);
    const confidence = calculateConfidence(ogTags, sourceType);

    return {
      title: cleanTitle(ogTags.title, sourceType),
      description: cleanDescription(ogTags.description, sourceType),
      imageUrl: ogTags.image,
      sourceType,
      sourceUrl: url,
      confidence,
    };
  } catch {
    // Network errors, timeouts, etc.
    // Return empty result with zero confidence rather than throwing,
    // so the caller can gracefully fall back to manual entry.
    return empty;
  }
}
