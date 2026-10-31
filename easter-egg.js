// Hand-drawn, schematic skeletons: decorative, not anatomical reference drawings.
const logo = document.querySelector('#bone-logo');
const stage = document.querySelector('#bone-parade');
const message = document.querySelector('#bone-parade-message');
const stop = document.querySelector('#bone-parade-stop');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let taps = 0;
let tapTimer;
let finishTimer;
let active = false;

const joint = (x, y, r = 3) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const limb = (x, y, path, phase = '') => `<g class="bone-limb ${phase}" style="transform-origin:${x}px ${y}px"><path d="${path}"/>${joint(x,y)}</g>`;
function quadruped(kind) {
  const horse = kind === 'horse';
  const legs = [
    limb(72,90,'M72 90 L58 127 L70 164 L79 164','bone-far'),
    limb(157,89,'M157 89 L166 125 L155 164 L166 164','bone-far bone-opposite'),
    limb(78,88,'M78 88 L91 123 L77 167 L88 167','bone-opposite'),
    limb(165,87,'M165 87 L153 125 L168 167 L179 167')
  ];
  const ribs = [94,105,116,127,138,149].map((x,i) => `<path d="M${x} 65 Q${x+15} ${91+i%2*5} ${x-1} 110 Q${x-13} 88 ${x} 65"/>`).join('');
  const head = horse
    ? '<path d="M158 66 L170 45 L182 22 L199 20 L211 34 L234 49 L229 63 L212 63 L194 47 L184 51 L179 76"/><path d="M183 22 L182 7 L191 18 M199 21 L204 9 L207 29 M211 48 L229 54 M214 59 L215 51 M220 61 L221 53"/><circle class="bone-eye" cx="198" cy="34" r="5"/>'
    : '<path d="M158 66 L174 47 L192 43 L211 53 L229 65 L225 77 L207 76 L188 63 L175 76"/><path d="M192 45 C166 13 155 57 184 52 C165 40 183 32 192 45 M206 50 L213 37 L219 43 L211 55 M210 71 L225 72 M215 72 L215 77 M221 72 L221 77"/><circle class="bone-eye" cx="204" cy="59" r="4"/>';
  return `<svg viewBox="0 0 260 190" aria-hidden="true"><g class="bone-ink">${legs.slice(0,2).join('')}<g class="bone-body"><path d="M58 65 Q108 54 160 64 M60 64 L43 75 L31 ${horse?115:92}"/>${ribs}<path d="M58 64 L78 59 L88 75 L79 94 L60 88 Z M156 65 L169 69 L161 92 Z M91 110 L150 110"/>${[72,84,96,108,120,132,144,156].map(x=>joint(x,62,2.5)).join('')}${head}</g>${legs.slice(2).join('')}</g></svg>`;
}
function chicken() {
  return `<svg viewBox="0 0 170 170" aria-hidden="true"><g class="bone-ink">${limb(77,96,'M77 96 L88 122 L72 150 M72 150 L54 154 M72 150 L80 155','bone-far bone-opposite')}<g class="bone-body"><path d="M42 62 Q76 47 104 68 Q114 93 87 105 Q55 107 42 62 Z M44 65 L21 43 L29 72 L12 65 L44 87 M56 61 Q94 61 89 95 M65 57 Q105 71 96 93 M75 59 Q114 75 99 86 M49 74 L73 80 L64 94 L48 83 M99 66 L110 53 L108 34"/><path d="M108 34 Q108 16 125 18 Q140 18 140 34 L156 39 L140 43 Q123 53 112 44 Z M110 25 L111 12 L119 17 L126 9 L131 19"/><circle class="bone-eye" cx="128" cy="31" r="4"/></g>${limb(88,98,'M88 98 L77 123 L92 150 M92 150 L108 154 M92 150 L84 155')}</g></svg>`;
}
function clearTapSequence() { taps = 0; clearTimeout(tapTimer); }
function endParade() {
  const restoreFocus = document.activeElement === stop;
  clearTimeout(finishTimer);
  clearTapSequence();
  stage.replaceChildren();
  stage.hidden = true;
  message.hidden = true;
  active = false;
  if (restoreFocus) logo.focus();
}
function startParade() {
  if (active) return;
  active = true;
  const animals = ['horse', 'sheep', 'chicken', 'sheep', 'chicken'];
  stage.innerHTML = animals.map((kind, i) => `<div class="bone-walker bone-${kind}" style="--delay:${i * 0.9}s;--lane:${i % 2 * 24}px;--slot:${i}"><div class="bone-gait">${kind === 'chicken' ? chicken() : quadruped(kind)}</div></div>`).join('');
  stage.hidden = false;
  message.hidden = false;
  finishTimer = setTimeout(endParade, reducedMotion.matches ? 7000 : 16000);
}
logo?.addEventListener('click', () => {
  if (active) return;
  clearTimeout(tapTimer);
  taps += 1;
  if (taps === 3) { clearTapSequence(); startParade(); }
  else tapTimer = setTimeout(clearTapSequence, 1600);
});
stop?.addEventListener('click', endParade);
document.addEventListener('keydown', event => { if (active && event.key === 'Escape') endParade(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) endParade(); });
reducedMotion.addEventListener('change', endParade);
