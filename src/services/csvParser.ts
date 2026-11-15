import type { OxfordWord, CefrLevel } from '../types';

/**
 * Strip wrapping slashes from a phonetic cell.
 * The CSV already stores values like `/ə/`; the UI adds one pair itself.
 */
export function phoneticInner(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '');
}

/**
 * RFC-style CSV parse. Quoted fields may contain commas and newlines.
 * A previous two-pass parser dropped the quote characters while splitting
 * lines, so commas inside definitions were treated as column breaks.
 */
function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  const pushRow = () => {
    row.push(field);
    field = '';
    const isBlank = row.length === 1 && row[0].trim() === '';
    if (!isBlank) rows.push(row);
    row = [];
  };

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++;
      pushRow();
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) pushRow();
  return rows;
}

/**
 * Parses the Oxford 3000 CSV into one card per data row.
 *
 * The file has a header plus 3,805 rows. Two of those rows are different
 * senses of the verb "lie" (recline vs. say something untrue) and share
 * `word|type`. Skipping ids that were already seen dropped that second
 * card, so the app showed 3.804. Every data row is kept; only a colliding
 * id gets a numeric suffix.
 */
export function parseOxfordCsv(csvText: string): OxfordWord[] {
  const source = csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText;
  const table = parseCsv(source);
  if (table.length <= 1) return [];

  const headerTokens = table[0].map(h => h.trim().toLowerCase());
  const wordIdx = headerTokens.indexOf('word');
  const typeIdx = headerTokens.indexOf('type');
  const cefrIdx = headerTokens.indexOf('cefr');
  const phonBrIdx = headerTokens.indexOf('phon_br');
  const phonNAmIdx = headerTokens.indexOf('phon_n_am');
  const defIdx = headerTokens.indexOf('definition');
  const exIdx = headerTokens.indexOf('example');
  const ukIdx = headerTokens.indexOf('uk');
  const usIdx = headerTokens.indexOf('us');

  const words: OxfordWord[] = [];
  const idCounts = new Map<string, number>();

  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    const word = row[wordIdx]?.trim() || '';
    const type = row[typeIdx]?.trim().toLowerCase() || 'other';
    const rawCefr = row[cefrIdx]?.trim().toLowerCase() || 'a1';
    const cefr: CefrLevel = (['a1', 'a2', 'b1', 'b2'].includes(rawCefr) ? rawCefr : 'a1') as CefrLevel;

    if (!word) continue;

    const baseId = `${word}|${type}`;
    const seen = (idCounts.get(baseId) ?? 0) + 1;
    idCounts.set(baseId, seen);
    const id = seen === 1 ? baseId : `${baseId}|${seen}`;

    words.push({
      id,
      word,
      type,
      cefr,
      phon_br: phoneticInner(row[phonBrIdx] || ''),
      phon_n_am: phoneticInner(row[phonNAmIdx] || ''),
      definition: row[defIdx]?.trim() || '',
      example: row[exIdx]?.trim() || '',
      arti: '',
      contoh_arti: '',
      uk: row[ukIdx]?.trim() || '',
      us: row[usIdx]?.trim() || '',
    });
  }

  return words;
}

export function meaningKey(word: string, type: string, cefr: string): string {
  return `${word.trim().toLowerCase()}|${type.trim().toLowerCase()}|${cefr.trim().toLowerCase()}`;
}

interface IndonesianEntry {
  word: string;
  type: string;
  cefr: string;
  arti: string;
  contoh_arti: string;
}

/**
 * Join Indonesian meanings onto Oxford cards.
 * Prefer the source row index (same order as oxford_3000.csv). If that row
 * is a different word, fall back to word + type + cefr.
 */
export function attachIndonesianMeanings(words: OxfordWord[], artiText: string): OxfordWord[] {
  const table = parseCsv(artiText.charCodeAt(0) === 0xfeff ? artiText.slice(1) : artiText);
  if (table.length <= 1) return words;

  const header = table[0].map(cell => cell.trim().toLowerCase());
  const indexIdx = header.indexOf('index');
  const wordIdx = header.indexOf('word');
  const typeIdx = header.indexOf('type');
  const cefrIdx = header.indexOf('cefr');
  const artiIdx = header.indexOf('arti');
  const contohIdx = header.indexOf('contoh_arti');
  if (wordIdx < 0 || typeIdx < 0 || cefrIdx < 0 || artiIdx < 0) return words;

  const byIndex: Array<IndonesianEntry | undefined> = [];
  const buckets = new Map<string, IndonesianEntry[]>();

  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    const entry: IndonesianEntry = {
      word: row[wordIdx]?.trim() || '',
      type: row[typeIdx]?.trim() || '',
      cefr: row[cefrIdx]?.trim() || '',
      arti: row[artiIdx]?.trim() || '',
      contoh_arti: contohIdx >= 0 ? (row[contohIdx]?.trim() || '') : '',
    };
    if (!entry.word) continue;

    const index = indexIdx >= 0 ? Number.parseInt(row[indexIdx] ?? '', 10) : i - 1;
    if (Number.isInteger(index) && index >= 0) byIndex[index] = entry;

    const key = meaningKey(entry.word, entry.type, entry.cefr);
    const list = buckets.get(key);
    if (list) list.push(entry);
    else buckets.set(key, [entry]);
  }

  const take = (entry: IndonesianEntry) => {
    const list = buckets.get(meaningKey(entry.word, entry.type, entry.cefr));
    if (!list) return;
    const at = list.indexOf(entry);
    if (at >= 0) list.splice(at, 1);
  };

  return words.map((word, i) => {
    const indexed = byIndex[i];
    const sameWord = indexed
      && meaningKey(indexed.word, indexed.type, indexed.cefr) === meaningKey(word.word, word.type, word.cefr);
    let match = sameWord ? indexed : undefined;
    if (match) {
      take(match);
    } else {
      const list = buckets.get(meaningKey(word.word, word.type, word.cefr));
      match = list?.shift();
    }
    if (!match) return word;
    return {
      ...word,
      arti: match.arti,
      contoh_arti: match.contoh_arti,
    };
  });
}

let cachedWords: OxfordWord[] | null = null;

export async function loadOxfordDataset(): Promise<OxfordWord[]> {
  if (cachedWords && cachedWords.length > 0) {
    return cachedWords;
  }

  const csvUrl = `${import.meta.env.BASE_URL}oxford_3000.csv`;
  const artiUrl = `${import.meta.env.BASE_URL}arti_id.csv`;
  const [res, artiRes] = await Promise.all([fetch(csvUrl), fetch(artiUrl)]);
  if (!res.ok) {
    throw new Error(`Gagal memuat dataset (${res.status}) dari ${csvUrl}`);
  }
  if (!artiRes.ok) {
    throw new Error(`Gagal memuat arti Indonesia (${artiRes.status}) dari ${artiUrl}`);
  }

  const [text, artiText] = await Promise.all([res.text(), artiRes.text()]);
  const parsed = attachIndonesianMeanings(parseOxfordCsv(text), artiText);
  if (parsed.length === 0) {
    return [];
  }

  cachedWords = parsed;
  return parsed;
}
