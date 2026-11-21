// Accessible 8×8 board built from real buttons (ARIA grid pattern with a single roving tab stop).
// The root carries data-native-keys so the host's game-input service leaves arrow/Enter/Space to the board.

export interface Cell {
  text: string;
  label: string;
  classes?: string[];
}

export class BoardView {
  readonly root: HTMLDivElement;
  private readonly grid: HTMLDivElement;
  private readonly cells: HTMLButtonElement[] = [];
  private readonly statusEl: HTMLParagraphElement;
  private focusIndex = 0;
  private disabled = false;

  constructor(label: string, private readonly onActivate: (displayIndex: number) => void) {
    this.root = document.createElement('div');
    this.root.className = 'board-game';
    this.root.dataset.nativeKeys = 'true';
    this.grid = document.createElement('div');
    this.grid.className = 'board';
    this.grid.setAttribute('role', 'grid');
    this.grid.setAttribute('aria-label', label);
    for (let r = 0; r < 8; r++) {
      const row = document.createElement('div');
      row.setAttribute('role', 'row');
      row.className = 'board__row';
      for (let c = 0; c < 8; c++) {
        const i = r * 8 + c;
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'gridcell');
        b.className = 'board__cell ' + ((r + c) % 2 ? 'board__cell--dark' : 'board__cell--light');
        b.tabIndex = i === 0 ? 0 : -1;
        b.addEventListener('click', () => {
          this.focusIndex = i;
          this.syncTabStops();
          if (!this.disabled) this.onActivate(i);
        });
        row.appendChild(b);
        this.cells.push(b);
      }
      this.grid.appendChild(row);
    }
    this.grid.addEventListener('keydown', this.onKey);
    this.statusEl = document.createElement('p');
    this.statusEl.className = 'board-game__status';
    this.statusEl.setAttribute('role', 'status');
    this.root.append(this.statusEl, this.grid);
  }

  private onKey = (e: KeyboardEvent) => {
    const r = this.focusIndex >> 3;
    const c = this.focusIndex & 7;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [Math.max(0, r - 1), c],
      ArrowDown: [Math.min(7, r + 1), c],
      ArrowLeft: [r, Math.max(0, c - 1)],
      ArrowRight: [r, Math.min(7, c + 1)],
      Home: [r, 0],
      End: [r, 7],
    };
    const next = moves[e.key];
    if (!next) return;
    e.preventDefault();
    this.focusIndex = next[0] * 8 + next[1];
    this.syncTabStops();
    this.cells[this.focusIndex]!.focus();
  };

  private syncTabStops() {
    this.cells.forEach((b, i) => (b.tabIndex = i === this.focusIndex ? 0 : -1));
  }

  update(cells: Cell[], status: string, disabled: boolean) {
    this.disabled = disabled;
    this.grid.setAttribute('aria-disabled', String(disabled));
    cells.forEach((cell, i) => {
      const b = this.cells[i]!;
      if (b.textContent !== cell.text) b.textContent = cell.text;
      b.setAttribute('aria-label', cell.label);
      const dark = ((i >> 3) + (i & 7)) % 2 ? 'board__cell--dark' : 'board__cell--light';
      b.className = ['board__cell', dark, ...(cell.classes ?? [])].join(' ');
      b.setAttribute('aria-selected', String(cell.classes?.includes('is-selected') ?? false));
    });
    if (this.statusEl.textContent !== status) this.statusEl.textContent = status;
  }

  focus() {
    this.cells[this.focusIndex]?.focus();
  }
}
