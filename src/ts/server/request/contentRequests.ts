import { cacheFirstFetchJSON, cacheFirstFetchText } from "../cache";
import { getServerLang } from "../localeManager";
import { OnThisDayEvents } from "../type/OnThisDayEvents";
import { Story } from "../type/Story";

// MARK: onThisDay

export const onThisDayRequest = ({
  batchId = "latest",
}: {
  batchId?: string;
} = {}) =>
  cacheFirstFetchJSON<OnThisDayEvents>(
    `https://news.kagi.com/api/batches/${batchId}/onthisday${getServerLang() && `?lang=${getServerLang()}`}`,
  );

// MARK: smallWebFeed

export type SmallWebEntry = Pick<
  Story,
  "title" | "id" | "short_summary" | "articles"
>;

export type SmallWebFeedResponse = {
  entries: SmallWebEntry[];
};

// A summary has to be readable on a watch, and a page dump both defeats the
// point of a summary and sends the reader away from the source site.
const MAX_SUMMARY_LENGTH = 600;
// Ask for more than we need so filtering out unusable entries still fills a page.
const SMALL_WEB_OVERSCAN = 20;

const NAMED_ENTITIES: Record<string, string | undefined> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  copy: "©",
  reg: "®",
  trade: "™",
  middot: "·",
  deg: "°",
  eacute: "é",
  egrave: "è",
  agrave: "à",
  uuml: "ü",
  ouml: "ö",
  auml: "ä",
  szlig: "ß",
  ccedil: "ç",
  ntilde: "ñ",
};

// String.fromCodePoint is not available on the Pebble JS runtime.
const fromCodePoint = (code: number): string => {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return "";
  if (code <= 0xffff) return String.fromCharCode(code);
  const offset = code - 0x10000;
  return String.fromCharCode(
    0xd800 + (offset >> 10),
    0xdc00 + (offset & 0x3ff),
  );
};

const decodeHtmlEntities = (text: string): string =>
  text
    // Structural tags become line breaks before any tags are stripped. Both the
    // opening and closing form insert a break, otherwise "<p>Second</p>" would
    // glue "Second" onto the end of the previous sentence.
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|li|h[1-6]|blockquote|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    // Numeric references first, then named ones, then "&amp;" last so that an
    // escaped "&amp;lt;" cannot be decoded twice.
    .replace(/&#(\d+);/g, (_match, dec) => fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) =>
      fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (match, name: string) => {
      const decoded = NAMED_ENTITIES[name.toLowerCase()];
      return decoded === undefined ? match : decoded;
    })
    .replace(/&amp;/g, "&");

// Collapse what survives tag stripping: control characters, non-breaking
// spaces, trailing spaces at the end of a line, and runs of blank lines.
const sanitiseText = (text: string): string =>
  text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/^\s+|\s+$/g, "");

const truncateSummary = (text: string): string => {
  if (text.length <= MAX_SUMMARY_LENGTH) return text;
  const clipped = text.slice(0, MAX_SUMMARY_LENGTH);
  const lastSpace = clipped.lastIndexOf(" ");
  const body =
    lastSpace > MAX_SUMMARY_LENGTH * 0.6
      ? clipped.slice(0, lastSpace)
      : clipped;
  return body.replace(/\s+$/, "") + "…";
};

const cleanText = (raw: string): string =>
  sanitiseText(decodeHtmlEntities(raw));

const parseAtomFeed = (xmlText: string): SmallWebFeedResponse => {
  const entries: SmallWebEntry[] = [];

  // Match all <entry>...</entry> blocks
  const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entryXml = match[1];

    const getTagContent = (tag: string): string => {
      const tagRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const tagMatch = entryXml.match(tagRegex);
      return tagMatch ? tagMatch[1].trim() : "";
    };

    const getHrefAttr = (): string => {
      const linkRegex = /<link[^>]+href=["']([^"']+)["']/i;
      const linkMatch = entryXml.match(linkRegex);
      return linkMatch ? linkMatch[1] : "";
    };

    const title = cleanText(getTagContent("title"));
    const link = getHrefAttr();

    entries.push({
      title,
      id: getTagContent("id"),
      short_summary: truncateSummary(cleanText(getTagContent("summary"))),
      articles: [
        {
          link,
          domain: link.replace(/^https?:\/\/(www\.)?/, "").split("/")[0],
          image: "",
          image_caption: "",
          title,
          date: getTagContent("published"),
        },
      ],
    });
  }

  return { entries };
};

// An entry missing any of these has nothing to show on the watch.
const isUsableEntry = (entry: SmallWebEntry): boolean =>
  entry.title.length > 0 &&
  entry.short_summary.length > 0 &&
  (entry.articles?.[0]?.link ?? "").length > 0;

export const smallWebFeedRequest = async (
  limit = 12,
): Promise<SmallWebFeedResponse> => {
  const url = `https://kagi.com/api/v1/smallweb/feed?limit=${limit + SMALL_WEB_OVERSCAN}`;

  const xmlText = await cacheFirstFetchText(url);
  return {
    entries: parseAtomFeed(xmlText)
      .entries.filter(isUsableEntry)
      .slice(0, limit),
  };
};

// MARK: tension

type TensionResponse = {
  chaosIndex: number;
  chaosDescription: string;
  chaosLastUpdated: string;
};

export const tensionRequest = ({ batchId = "latest" }: { batchId?: string }) =>
  cacheFirstFetchJSON<TensionResponse>(
    `https://news.kagi.com/api/batches/${batchId}/chaos${getServerLang() && `?lang=${getServerLang()}`}`,
  );
