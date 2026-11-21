export function AboutPage() {
  return (
    <section className="page">
      <h1>About Retro Arcade</h1>
      <p>A study and research project, not a commercial product.</p>

      <h2>Privacy</h2>
      <ul>
        <li>No accounts, analytics, advertising, or tracking.</li>
        <li>Your disc images, BIOS files, and saves stay on this device. They are never uploaded.</li>
        <li>The app only talks to the site it was loaded from.</li>
      </ul>

      <h2>Your own discs</h2>
      <p>
        The PS1 player plays disc images you supply. Retro Arcade does not provide, link to, or help obtain games or BIOS files.
        Use only discs and BIOS files you have the right to use. “PS1” is used only to describe compatible disc formats; this project
        is not affiliated with or endorsed by the console's maker.
      </p>

      <h2>Third-party software</h2>
      <ul>
        <li>EmulatorJS 4.2.3 — GPL-3.0 (<a href="/emulator/ejs/LICENSE-EmulatorJS.txt">licence</a>, <a href="https://github.com/EmulatorJS/EmulatorJS" rel="noreferrer noopener">source</a>)</li>
        <li>PCSX ReARMed core (EmulatorJS build 4.2.3) — GPL-2.0 (<a href="https://github.com/EmulatorJS/pcsx_rearmed" rel="noreferrer noopener">source</a>, <a href="/emulator/ejs/NOTICE.txt">notice</a>)</li>
        <li>React — MIT</li>
      </ul>
      <p>Retro Arcade itself is licensed GPL-3.0-or-later. Comet Courier and all of its art and sound are original to this project.</p>
    </section>
  );
}
