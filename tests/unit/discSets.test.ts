import { describe, expect, it } from 'vitest';
import { DiscSetError, parseCueFiles, parseM3u, validateSelection, type SelectedFile } from '../../src/platform/files/discSets';

const ACCEPTED = ['.chd', '.cue', '.bin', '.m3u', '.pbp', '.iso', '.exe'];
const file = (name: string, text?: string, size = 1000): SelectedFile => ({ name, size, ...(text !== undefined ? { text: async () => text } : {}) });

describe('parseM3u', () => {
  const selected = new Set(['Disc 1.cue', 'Disc 2.cue']);
  it('returns entries in order and ignores comments', () => {
    expect(parseM3u('#EXTM3U\nDisc 1.cue\r\n\n# c\nDisc 2.cue\n', selected)).toEqual(['Disc 1.cue', 'Disc 2.cue']);
  });
  it.each([
    ['../Disc 1.cue', /plain file names/],
    ['/etc/passwd', /plain file names/],
    ['C:\\games\\x.cue', /plain file names|URLs/], // rejected either way; the drive letter looks like a URL scheme
    ['sub/Disc 1.cue', /plain file names/],
    ['https://example.com/x.cue', /URLs/],
    ['file:///x.cue', /URLs/],
    ['other.cue', /did not select/],
  ])('rejects %j', (entry, why) => {
    expect(() => parseM3u(entry, selected)).toThrow(why);
  });
  it('rejects empty playlists', () => {
    expect(() => parseM3u('#EXTM3U\n', selected)).toThrow(DiscSetError);
  });
});

describe('parseCueFiles', () => {
  it('reads quoted and unquoted FILE lines', () => {
    const sel = new Set(['Track 01.bin', 'track2.bin']);
    expect(parseCueFiles('FILE "Track 01.bin" BINARY\n  TRACK 01 MODE2/2352\nFILE track2.bin BINARY\n', sel)).toEqual(['Track 01.bin', 'track2.bin']);
  });
  it('rejects traversal inside a cue sheet', () => {
    expect(() => parseCueFiles('FILE "../../secret.bin" BINARY', new Set(['secret.bin']))).toThrow(/plain file names/);
  });
});

describe('validateSelection', () => {
  it('accepts a single disc image', async () => {
    await expect(validateSelection([file('game.chd')], ACCEPTED)).resolves.toEqual({ primary: 'game.chd', names: ['game.chd'] });
  });
  it('accepts a cue with its bins', async () => {
    const r = await validateSelection([file('g.cue', 'FILE "g (Track 1).bin" BINARY\nFILE "g (Track 2).bin" BINARY'), file('g (Track 1).bin'), file('g (Track 2).bin')], ACCEPTED);
    expect(r.primary).toBe('g.cue');
  });
  it('accepts an m3u set and checks the cue sheets it lists', async () => {
    const r = await validateSelection([file('set.m3u', 'd1.cue\nd2.cue'), file('d1.cue', 'FILE "d1.bin" BINARY'), file('d2.cue', 'FILE "d2.bin" BINARY'), file('d1.bin'), file('d2.bin')], ACCEPTED);
    expect(r.primary).toBe('set.m3u');
  });
  it('rejects files a sheet does not reference', async () => {
    await expect(validateSelection([file('g.cue', 'FILE "g.bin" BINARY'), file('g.bin'), file('extra.bin')], ACCEPTED)).rejects.toThrow(/not referenced/);
  });
  it('rejects unsupported types and several loose images', async () => {
    await expect(validateSelection([file('evil.html')], ACCEPTED)).rejects.toThrow(/Unsupported file type/);
    await expect(validateSelection([file('a.chd'), file('b.chd')], ACCEPTED)).rejects.toThrow(/Select one disc image/);
  });
  it('rejects oversized sheets (not a real playlist)', async () => {
    await expect(validateSelection([file('big.cue', 'x', 10 * 1024 * 1024)], ACCEPTED)).rejects.toThrow(/too large/);
  });
  it('rejects too many files', async () => {
    await expect(validateSelection(Array.from({ length: 17 }, (_, i) => file(`${i}.bin`)), ACCEPTED)).rejects.toThrow(/at most/);
  });
});
