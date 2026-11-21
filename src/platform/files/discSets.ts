// Validation for user-selected disc files. Playlists and cue sheets are untrusted input: every entry must be a
// bare file name that the user actually selected — no paths, no "..", no URLs (SECURITY_GUIDELINES.md, File access).

export const MAX_FILES_PER_DISC = 16;

export class DiscSetError extends Error {}

const BARE_NAME = /^[^/\\:*?"<>|\u0000-\u001f]{1,200}$/;

export function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i).toLowerCase() : '';
}

function checkReference(ref: string, selected: Set<string>, kind: string): string {
  const name = ref.trim();
  if (!name) throw new DiscSetError(`Empty entry in ${kind}`);
  if (/^[a-z][a-z0-9+.-]*:/i.test(name)) throw new DiscSetError(`${kind} entries must not be URLs: ${name}`);
  if (!BARE_NAME.test(name) || name === '.' || name === '..') throw new DiscSetError(`${kind} entries must be plain file names: ${name}`);
  if (!selected.has(name)) throw new DiscSetError(`${kind} refers to a file you did not select: ${name}`);
  return name;
}

/** Returns the referenced file names in order. Lines starting with # are comments (extended M3U). */
export function parseM3u(text: string, selected: Set<string>): string[] {
  const refs = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  if (refs.length === 0) throw new DiscSetError('Playlist is empty');
  if (refs.length > MAX_FILES_PER_DISC) throw new DiscSetError('Playlist has too many entries');
  return refs.map((r) => checkReference(r, selected, 'Playlist'));
}

/** Returns the data files a cue sheet references (FILE "name" BINARY). */
export function parseCueFiles(text: string, selected: Set<string>): string[] {
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*FILE\s+(?:"([^"]*)"|(\S+))\s+\S+\s*$/i.exec(line);
    if (m) out.push(checkReference(m[1] ?? m[2] ?? '', selected, 'Cue sheet'));
  }
  if (out.length === 0) throw new DiscSetError('Cue sheet references no data files');
  return out;
}

export interface SelectedFile {
  name: string;
  size: number;
  text?: () => Promise<string>;
}

/**
 * Validates a user selection for one disc entry:
 * - every file has an accepted extension;
 * - a .cue/.m3u only references files in the selection;
 * - no unreferenced extra files when a sheet/playlist is present.
 */
export async function validateSelection(files: SelectedFile[], accepted: string[]): Promise<{ primary: string; names: string[] }> {
  if (files.length === 0) throw new DiscSetError('No files selected');
  if (files.length > MAX_FILES_PER_DISC) throw new DiscSetError(`Select at most ${MAX_FILES_PER_DISC} files`);
  const acceptedSet = new Set(accepted.map((a) => a.toLowerCase()));
  const names = new Set<string>();
  for (const f of files) {
    if (!BARE_NAME.test(f.name)) throw new DiscSetError(`Unsupported file name: ${f.name}`);
    if (!acceptedSet.has(extensionOf(f.name))) throw new DiscSetError(`Unsupported file type: ${f.name}`);
    if (names.has(f.name)) throw new DiscSetError(`Duplicate file: ${f.name}`);
    names.add(f.name);
  }
  const sheets = files.filter((f) => ['.m3u', '.cue'].includes(extensionOf(f.name)));
  if (sheets.length === 0) {
    if (files.length !== 1) throw new DiscSetError('Select one disc image, or a .cue/.m3u together with the files it lists');
    return { primary: files[0]!.name, names: [...names] };
  }
  const playlist = sheets.find((s) => extensionOf(s.name) === '.m3u');
  const primary = playlist ?? sheets[0]!;
  const referenced = new Set<string>([primary.name]);
  const readText = async (f: SelectedFile) => {
    if (!f.text) throw new DiscSetError('Cannot read sheet');
    if (f.size > 64 * 1024) throw new DiscSetError(`${f.name} is too large to be a playlist or cue sheet`);
    return f.text();
  };
  const level1 = playlist ? parseM3u(await readText(playlist), names) : parseCueFiles(await readText(primary), names);
  for (const n of level1) {
    referenced.add(n);
    if (playlist && extensionOf(n) === '.cue') {
      const cue = files.find((f) => f.name === n)!;
      for (const d of parseCueFiles(await readText(cue), names)) referenced.add(d);
    }
  }
  const extra = [...names].filter((n) => !referenced.has(n));
  if (extra.length) throw new DiscSetError(`These files are not referenced by ${primary.name}: ${extra.join(', ')}`);
  return { primary: primary.name, names: [...names] };
}
