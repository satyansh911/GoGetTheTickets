/* Vendored from the GoGetTheTickets design system bundle (Claude Design): utilities, the icon set,
 * the logo, and the generated artwork (posters, backdrops, cast, food, city glyphs, seat-count
 * illustration, demo QR, screen curve). Kept verbatim so the app renders exactly like the design. */
/* eslint-disable */
const G = {};
/* ---------- utilities ---------- */
G.esc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};
G.inr = function (n, opts) {
  var frac = Math.round(n * 100) % 100 !== 0;
  var f = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: frac ? 2 : 0,
    maximumFractionDigits: 2
  }).format(n);
  return (opts && opts.minus ? '−' : '') + '₹' + f;
};
G.hash = function (str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
G.rng = function (seed) {
  var s = typeof seed === 'number' ? seed : G.hash(String(seed));
  return function () {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
var _uid = 0;
G.uid = function (p) { _uid += 1; return (p || 'g') + _uid; };
G.pad = function (n) { return (n < 10 ? '0' : '') + n; };
G.mmss = function (sec) { sec = Math.max(0, Math.ceil(sec)); return G.pad(Math.floor(sec / 60)) + ':' + G.pad(sec % 60); };
G.runtime = function (m) { return Math.floor(m / 60) + 'h ' + (m % 60) + 'm'; };
G.time12 = function (hhmm) {
  var p = hhmm.split(':'), h = +p[0], m = p[1];
  return ((h + 11) % 12 + 1) + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM');
};
var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
G.DAYS = DAYS; G.MONTHS = MONTHS;
G.parseDate = function (iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
G.isoDate = function (d) { return d.getFullYear() + '-' + G.pad(d.getMonth() + 1) + '-' + G.pad(d.getDate()); };
G.fmtDate = function (iso, style) {
  var d = typeof iso === 'string' ? G.parseDate(iso) : iso;
  if (style === 'short') return d.getDate() + ' ' + MONTHS[d.getMonth()];
  if (style === 'day') return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
  return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
};

/* ---------- icons (24px grid, 1.8 stroke, round caps) ---------- */
var I = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  chevLeft: '<path d="m15 18-6-6 6-6"/>',
  chevRight: '<path d="m9 18 6-6-6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  ticket: '<path d="M4 5h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6V6a1 1 0 0 1 1-1z"/><path d="M15 5v2M15 11v2M15 17v2"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  star: '<path fill="currentColor" stroke="none" d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9z"/>',
  play: '<path fill="currentColor" stroke="none" d="M8 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L9.2 4.1a.8.8 0 0 0-1.2.7z"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  playCircle: '<circle cx="12" cy="12" r="9"/><path fill="currentColor" stroke="none" d="M10 8.3v7.4c0 .4.4.6.7.4l5.6-3.7a.5.5 0 0 0 0-.8l-5.6-3.7c-.3-.2-.7 0-.7.4z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  share: '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.4 13.4 7.2 4.2M15.6 6.4l-7.2 4.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8L16.2 9.6"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  parking: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M10 17V7.5h3a2.8 2.8 0 0 1 0 5.6h-3"/>',
  food: '<path d="M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3M17.5 21V3c-2.2 1-3.5 3.6-3.5 7.2V13h3.5"/>',
  wheelchair: '<circle cx="11.5" cy="4.2" r="1.7"/><path d="M11 7.5v6.5h5.2l2.8 5.5"/><path d="M11 10.5h5"/><path d="M8.2 11.2a5 5 0 1 0 6.6 7"/>',
  alert: '<path d="M10.3 4 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/>',
  alertCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01"/>',
  wifiOff: '<path d="M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.8a10 10 0 0 1 4.2-2.3M19 12.8a10 10 0 0 0-2.4-1.7M2 8.8a15 15 0 0 1 4.3-2.6M22 8.8a15 15 0 0 0-10.8-3.8M12 20h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  heart: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sunrise: '<path d="M3 18h18M7 18a5 5 0 0 1 10 0M12 3.5v4M9.5 6 12 3.5 14.5 6M4.2 11.2l1.4 1.4M19.8 11.2l-1.4 1.4"/>',
  sunset: '<path d="M3 18h18M7 18a5 5 0 0 1 10 0M12 3.5v4.5M9.5 5.5 12 8l2.5-2.5M4.2 11.2l1.4 1.4M19.8 11.2l-1.4 1.4"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
  bank: '<path d="M3 9.5 12 4l9 5.5M4 20h16M5.5 10.5v7M10 10.5v7M14 10.5v7M18.5 10.5v7"/>',
  phone: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 4v4.5H8M12 7.5V12l3 2"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  tag: '<path d="M3 12.2V4a1 1 0 0 1 1-1h8.2l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-7.1 7.1a1.5 1.5 0 0 1-2.1 0z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  lock: '<rect x="4" y="10.5" width="16" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  zoomIn: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6M11 8v6"/>',
  zoomOut: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  seat: '<path d="M6.5 11V6.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2V11"/><path d="M4 11h16v5.5H4zM6 16.5V20M18 16.5V20"/>',
  popcorn: '<path d="M6 10h12l-1.6 11H7.6z"/><path d="M10 10l.4 11M14 10l-.4 11"/><path d="M6.4 10a2.6 2.6 0 0 1 2-4.3 3.2 3.2 0 0 1 6-.6 2.6 2.6 0 0 1 3.2 4.9"/>',
  map: '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/>',
  volume: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  maximize: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  qr: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h3v3M20.5 14v.01M14 20.5h.01M17 20.5h3.5V17"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8M12 17h.01"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.4 3.2 8.3 7.5 9.5 4.3-1.2 7.5-5.1 7.5-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'
};
G.iconNames = Object.keys(I);
G.icon = function (name, size, cls) {
  var s = size || 20;
  return '<svg class="g-ic' + (cls ? ' ' + cls : '') + '" width="' + s + '" height="' + s +
    '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (I[name] || I.info) + '</svg>';
};

/* ---------- logo ---------- */
var LOGO = {"ticket": "M10 10h44a8 8 0 0 1 8 8v8.5a5.5 5.5 0 0 0 0 11V46a8 8 0 0 1-8 8H10a8 8 0 0 1-8-8V37.5a5.5 5.5 0 0 0 0-11V18a8 8 0 0 1 8-8z", "ggt": "M19.33 38.93Q17.47 38.93 16.14 38.31Q14.81 37.69 13.96 36.68Q13.12 35.67 12.72 34.48Q12.33 33.3 12.33 32.16V31.77Q12.33 30.54 12.74 29.35Q13.15 28.15 13.99 27.18Q14.83 26.2 16.09 25.62Q17.35 25.03 19.04 25.03Q20.86 25.03 22.25 25.7Q23.65 26.37 24.49 27.55Q25.34 28.72 25.48 30.27H22.14Q22.03 29.68 21.61 29.2Q21.2 28.72 20.54 28.45Q19.89 28.17 19.04 28.17Q18.23 28.17 17.61 28.45Q16.99 28.72 16.57 29.24Q16.14 29.75 15.93 30.45Q15.71 31.15 15.71 31.98Q15.71 32.81 15.94 33.52Q16.18 34.23 16.63 34.76Q17.08 35.29 17.76 35.58Q18.45 35.87 19.33 35.87Q20.44 35.87 21.25 35.4Q22.06 34.93 22.39 34.16L22.14 36.14V33.28H25.2V35.98Q24.37 37.4 22.85 38.16Q21.33 38.93 19.33 38.93ZM18.97 33.93V31.59H26.28V33.93ZM34.14 38.93Q32.29 38.93 30.96 38.31Q29.62 37.69 28.78 36.68Q27.93 35.67 27.54 34.48Q27.14 33.3 27.14 32.16V31.77Q27.14 30.54 27.55 29.35Q27.97 28.15 28.81 27.18Q29.64 26.2 30.9 25.62Q32.16 25.03 33.85 25.03Q35.67 25.03 37.07 25.7Q38.46 26.37 39.31 27.55Q40.15 28.72 40.3 30.27H36.95Q36.84 29.68 36.43 29.2Q36.01 28.72 35.36 28.45Q34.7 28.17 33.85 28.17Q33.04 28.17 32.42 28.45Q31.8 28.72 31.38 29.24Q30.96 29.75 30.74 30.45Q30.52 31.15 30.52 31.98Q30.52 32.81 30.76 33.52Q30.99 34.23 31.44 34.76Q31.89 35.29 32.58 35.58Q33.26 35.87 34.14 35.87Q35.26 35.87 36.07 35.4Q36.88 34.93 37.2 34.16L36.95 36.14V33.28H40.01V35.98Q39.18 37.4 37.66 38.16Q36.14 38.93 34.14 38.93ZM33.78 33.93V31.59H41.09V33.93ZM45.23 38.57V27.99H48.58V38.57ZM41.63 28.35V25.43H52.18V28.35Z"};
G.mark = function (size) {
  var s = size || 32;
  return '<svg class="g-mark" width="' + s + '" height="' + s + '" viewBox="0 0 64 64" aria-hidden="true">' +
    '<path style="fill:var(--accent)" d="' + LOGO.ticket + '"/><path style="fill:var(--on-accent)" d="' + LOGO.ggt + '"/></svg>';
};
G.logo = function (opts) {
  opts = opts || {};
  return '<span class="g-logo' + (opts.compact ? ' g-logo--compact' : '') + '" aria-label="GoGetTheTickets">' + G.mark(opts.size || 34) +
    '<span class="g-logo__word">GoGetThe<b>Tickets</b></span></span>';
};

/* ---------- generated artwork (stand-ins for posterUrl / backdropUrl / photoUrl) ---------- */
function r1(n) { return Math.round(n * 10) / 10; }

var MOTIFS = {
  rain: function (w, h, p, R) {
    var s = '<circle cx="' + r1(w * .68) + '" cy="' + r1(h * .34) + '" r="' + r1(w * .3) + '" fill="' + p.c + '" opacity=".22"/>';
    s += '<circle cx="' + r1(w * .68) + '" cy="' + r1(h * .34) + '" r="' + r1(w * .12) + '" fill="' + p.c + '" opacity=".35"/>';
    var x = 0;
    while (x < w) {
      var bw = w * (.07 + R() * .08), bh = h * (.22 + R() * .34);
      s += '<rect x="' + r1(x) + '" y="' + r1(h - bh) + '" width="' + r1(bw) + '" height="' + r1(bh) + '" fill="#05070a" opacity=".92"/>';
      for (var k = 0; k < 5; k++) if (R() > .4) s += '<rect x="' + r1(x + bw * R() * .8) + '" y="' + r1(h - bh + bh * R() * .8) + '" width="' + r1(w * .012) + '" height="' + r1(w * .016) + '" fill="' + p.c + '" opacity=".8"/>';
      x += bw + w * .006;
    }
    for (var i = 0; i < 46; i++) {
      var rx = R() * w * 1.2, ry = R() * h, len = h * (.05 + R() * .08);
      s += '<path d="M' + r1(rx) + ' ' + r1(ry) + 'l' + r1(-len * .35) + ' ' + r1(len) + '" stroke="#fff" stroke-opacity="' + r1(.12 + R() * .25) + '" stroke-width="' + r1(w * .004) + '"/>';
    }
    return s;
  },
  orbit: function (w, h, p, R) {
    var cx = w * .58, cy = h * .44, r = Math.min(w, h) * .3, s = '';
    for (var i = 0; i < 60; i++) s += '<circle cx="' + r1(R() * w) + '" cy="' + r1(R() * h * .8) + '" r="' + r1(R() * w * .004 + .3) + '" fill="#fff" opacity="' + r1(.3 + R() * .6) + '"/>';
    s += '<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(r * 1.35) + '" fill="' + p.c + '" opacity=".12"/>';
    s += '<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(r) + '" fill="#120805"/>';
    s += '<path d="M' + r1(cx - r) + ' ' + r1(cy) + 'a' + r1(r) + ' ' + r1(r) + ' 0 0 1 ' + r1(2 * r) + ' 0" fill="none" stroke="' + p.c + '" stroke-width="' + r1(w * .012) + '" opacity=".9"/>';
    for (var j = 0; j < 3; j++) s += '<ellipse cx="' + r1(cx) + '" cy="' + r1(cy) + '" rx="' + r1(r * (1.5 + j * .35)) + '" ry="' + r1(r * (.32 + j * .08)) + '" fill="none" stroke="' + p.c + '" stroke-opacity="' + (.55 - j * .15) + '" stroke-width="' + r1(w * .005) + '" transform="rotate(-14 ' + r1(cx) + ' ' + r1(cy) + ')"/>';
    s += '<circle cx="' + r1(cx - r * 1.6) + '" cy="' + r1(cy + r * .5) + '" r="' + r1(w * .012) + '" fill="#fff"/>';
    return s;
  },
  eyes: function (w, h, p, R) {
    var s = '<ellipse cx="' + r1(w * .5) + '" cy="' + r1(h * .38) + '" rx="' + r1(w * .55) + '" ry="' + r1(h * .22) + '" fill="' + p.c + '" opacity=".16"/>';
    var ey = h * .36, ew = Math.min(w * .13, h * .2);
    [w * .38, w * .62].forEach(function (ex) {
      s += '<path d="M' + r1(ex - ew) + ' ' + r1(ey) + 'q' + r1(ew) + ' ' + r1(-ew * .7) + ' ' + r1(ew * 2) + ' 0q' + r1(-ew) + ' ' + r1(ew * .7) + ' ' + r1(-ew * 2) + ' 0z" fill="' + p.c + '"/>';
      s += '<ellipse cx="' + r1(ex) + '" cy="' + r1(ey) + '" rx="' + r1(ew * .18) + '" ry="' + r1(ew * .34) + '" fill="#0a0303"/>';
    });
    s += '<path d="M0 ' + r1(h * .72) + 'L' + r1(w) + ' ' + r1(h * .72) + 'V' + h + 'H0z" fill="#070404"/>';
    for (var i = 0; i < 5; i++) {
      var y = h * (.74 + i * .055), ww = w * (.02 + i * .012);
      s += '<rect x="' + r1(w * .5 - ww / 2) + '" y="' + r1(y) + '" width="' + r1(ww) + '" height="' + r1(h * (.012 + i * .006)) + '" fill="' + p.c + '" opacity=".75"/>';
    }
    s += '<path d="M' + r1(w * .46) + ' ' + r1(h * .72) + 'L' + r1(w * .05) + ' ' + h + 'M' + r1(w * .54) + ' ' + r1(h * .72) + 'L' + r1(w * .95) + ' ' + h + '" stroke="' + p.c + '" stroke-opacity=".4" stroke-width="' + r1(w * .005) + '"/>';
    return s;
  },
  train: function (w, h, p, R) {
    var s = '';
    for (var i = 0; i < 40; i++) s += '<circle cx="' + r1(R() * w) + '" cy="' + r1(R() * h * .6) + '" r="' + r1(R() * w * .004 + .3) + '" fill="#fff" opacity="' + r1(.3 + R() * .5) + '"/>';
    var mr = Math.min(w, h) * .2;
    s += '<circle cx="' + r1(w * .7) + '" cy="' + r1(h * .28) + '" r="' + r1(mr * 1.6) + '" fill="' + p.c + '" opacity=".15"/><circle cx="' + r1(w * .7) + '" cy="' + r1(h * .28) + '" r="' + r1(mr) + '" fill="' + p.c + '"/>';
    s += '<path d="M0 ' + r1(h * .7) + 'Q' + r1(w * .3) + ' ' + r1(h * .56) + ' ' + r1(w * .6) + ' ' + r1(h * .66) + 'T' + w + ' ' + r1(h * .6) + 'V' + h + 'H0z" fill="#0a1433"/>';
    var ty = h * .74, cw = w * .15, ch = h * .07;
    for (var c = 0; c < 7; c++) {
      var x = w * .02 + c * (cw + w * .01);
      s += '<rect x="' + r1(x) + '" y="' + r1(ty) + '" width="' + r1(cw) + '" height="' + r1(ch) + '" rx="' + r1(ch * .2) + '" fill="#050a1c"/>';
      for (var k = 0; k < 3; k++) s += '<rect x="' + r1(x + cw * (.1 + k * .3)) + '" y="' + r1(ty + ch * .22) + '" width="' + r1(cw * .2) + '" height="' + r1(ch * .34) + '" fill="' + p.c + '" opacity="' + (R() > .25 ? .95 : .3) + '"/>';
    }
    s += '<rect x="0" y="' + r1(ty + ch + h * .01) + '" width="' + w + '" height="' + r1(h * .006) + '" fill="' + p.c + '" opacity=".5"/>';
    return s;
  },
  ruins: function (w, h, p, R) {
    var s = '<circle cx="' + r1(w * .32) + '" cy="' + r1(h * .46) + '" r="' + r1(Math.min(w, h) * .26) + '" fill="' + p.c + '" opacity=".9"/>';
    s += '<ellipse cx="' + r1(w * .78) + '" cy="' + r1(h * .7) + '" rx="' + r1(w * .3) + '" ry="' + r1(h * .2) + '" fill="#2a130a"/>';
    s += '<ellipse cx="' + r1(w * .86) + '" cy="' + r1(h * .5) + '" rx="' + r1(w * .14) + '" ry="' + r1(h * .1) + '" fill="#34170c"/>';
    s += '<ellipse cx="' + r1(w * .7) + '" cy="' + r1(h * .56) + '" rx="' + r1(w * .1) + '" ry="' + r1(h * .08) + '" fill="#2a130a"/>';
    var bx = w * .06, by = h * .62, pw = w * .035, ph = h * .2;
    s += '<rect x="' + r1(bx - w * .02) + '" y="' + r1(by - h * .03) + '" width="' + r1(w * .46) + '" height="' + r1(h * .035) + '" fill="#1c0c06"/>';
    for (var i = 0; i < 5; i++) s += '<rect x="' + r1(bx + i * w * .095) + '" y="' + r1(by) + '" width="' + r1(pw) + '" height="' + r1(ph) + '" fill="#1c0c06"/>';
    s += '<rect x="0" y="' + r1(by + ph) + '" width="' + w + '" height="' + r1(h - by - ph) + '" fill="#150904"/>';
    return s;
  },
  palms: function (w, h, p, R) {
    var s = '<circle cx="' + r1(w * .3) + '" cy="' + r1(h * .3) + '" r="' + r1(Math.min(w, h) * .1) + '" fill="' + p.c + '"/>';
    s += '<rect x="0" y="' + r1(h * .6) + '" width="' + w + '" height="' + r1(h * .4) + '" fill="#031a16"/>';
    for (var i = 0; i < 14; i++) {
      var y = h * (.62 + i * .026), x = R() * w * .8;
      s += '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w * (.08 + R() * .2)) + '" height="' + r1(h * .004 + .4) + '" fill="' + p.c + '" opacity="' + r1(.2 + R() * .4) + '"/>';
    }
    [[.72, .9], [.84, 1], [.62, .8]].forEach(function (t, j) {
      var bx = w * t[0], top = h * (.62 - .42 * t[1]), lean = w * (.05 + j * .02);
      s += '<path d="M' + r1(bx) + ' ' + r1(h * .62) + 'Q' + r1(bx + lean * .4) + ' ' + r1((top + h * .62) / 2) + ' ' + r1(bx + lean) + ' ' + r1(top) + '" stroke="#021310" stroke-width="' + r1(w * .014) + '" fill="none" stroke-linecap="round"/>';
      for (var f = 0; f < 7; f++) {
        var a = (f / 7) * Math.PI * 2 + j, L = w * (.1 + t[1] * .05);
        s += '<path d="M' + r1(bx + lean) + ' ' + r1(top) + 'q' + r1(Math.cos(a) * L * .6) + ' ' + r1(Math.sin(a) * L * .2 - L * .3) + ' ' + r1(Math.cos(a) * L) + ' ' + r1(Math.abs(Math.sin(a)) * L * .5) + '" stroke="#021310" stroke-width="' + r1(w * .01) + '" fill="none" stroke-linecap="round"/>';
      }
    });
    s += '<path d="M' + r1(w * .12) + ' ' + r1(h * .6) + 'h' + r1(w * .34) + 'l' + r1(-w * .04) + ' ' + r1(h * .04) + 'h' + r1(-w * .26) + 'z" fill="#021310"/><path d="M' + r1(w * .16) + ' ' + r1(h * .6) + 'q' + r1(w * .13) + ' ' + r1(-h * .07) + ' ' + r1(w * .26) + ' 0" fill="#062a23"/>';
    return s;
  },
  beam: function (w, h, p, R) {
    var s = '<path d="M' + r1(w * .92) + ' ' + r1(h * .12) + 'L' + r1(-w * .1) + ' ' + r1(h * .45) + 'L' + r1(w * .05) + ' ' + r1(h * .95) + 'z" fill="' + p.c + '" opacity=".22"/>';
    s += '<path d="M' + r1(w * .92) + ' ' + r1(h * .12) + 'L' + r1(w * .1) + ' ' + r1(h * .55) + 'L' + r1(w * .18) + ' ' + r1(h * .78) + 'z" fill="' + p.c + '" opacity=".25"/>';
    for (var i = 0; i < 50; i++) s += '<circle cx="' + r1(R() * w * .8) + '" cy="' + r1(h * .3 + R() * h * .5) + '" r="' + r1(R() * w * .004 + .3) + '" fill="' + p.c + '" opacity="' + r1(R() * .8) + '"/>';
    var cx = w * .9, cy = h * .12, r = Math.min(w, h) * .1;
    s += '<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(r * 1.6) + '" fill="#0d0906"/><circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(r * .5) + '" fill="' + p.c + '"/>';
    s += '<g fill="none" stroke="' + p.c + '" stroke-opacity=".5" stroke-width="' + r1(w * .006) + '"><circle cx="' + r1(w * .2) + '" cy="' + r1(h * .22) + '" r="' + r1(r * 1.2) + '"/>';
    for (var k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2; s += '<circle cx="' + r1(w * .2 + Math.cos(a) * r * .65) + '" cy="' + r1(h * .22 + Math.sin(a) * r * .65) + '" r="' + r1(r * .22) + '"/>'; }
    s += '</g><rect x="0" y="' + r1(h * .82) + '" width="' + w + '" height="' + r1(h * .18) + '" fill="#0a0705"/>';
    for (var j = 0; j < 9; j++) s += '<path d="M' + r1(w * (.05 + j * .11)) + ' ' + r1(h * .86) + 'a' + r1(w * .035) + ' ' + r1(w * .035) + ' 0 0 1 ' + r1(w * .07) + ' 0v' + r1(h * .1) + 'h' + r1(-w * .07) + 'z" fill="#1a130d"/>';
    return s;
  },
  haveli: function (w, h, p, R) {
    var s = '<circle cx="' + r1(w * .5) + '" cy="' + r1(h * .3) + '" r="' + r1(Math.min(w, h) * .24) + '" fill="' + p.c + '" opacity=".18"/>';
    var bx = w * .12, bw = w * .76, by = h * .42;
    s += '<rect x="' + r1(bx) + '" y="' + r1(by) + '" width="' + r1(bw) + '" height="' + r1(h - by) + '" fill="#07100b"/>';
    [[.22, .07], [.5, .1], [.78, .07]].forEach(function (d) {
      var cx = w * d[0], r = w * d[1];
      s += '<path d="M' + r1(cx - r) + ' ' + r1(by) + 'a' + r1(r) + ' ' + r1(r) + ' 0 0 1 ' + r1(2 * r) + ' 0z" fill="#07100b"/><rect x="' + r1(cx - w * .004) + '" y="' + r1(by - r - h * .04) + '" width="' + r1(w * .008) + '" height="' + r1(h * .04) + '" fill="#07100b"/>';
    });
    for (var row = 0; row < 3; row++) for (var c = 0; c < 5; c++) {
      var x = bx + bw * (.08 + c * .185), y = by + h * (.08 + row * .15), aw = bw * .09, ah = h * .08;
      var lit = (row === 1 && c === 2) || R() > .86;
      s += '<path d="M' + r1(x) + ' ' + r1(y + ah) + 'v' + r1(-ah * .6) + 'a' + r1(aw / 2) + ' ' + r1(aw / 2) + ' 0 0 1 ' + r1(aw) + ' 0v' + r1(ah * .6) + 'z" fill="' + (lit ? p.c : '#142a1c') + '" opacity="' + (lit ? .95 : .8) + '"/>';
    }
    for (var b = 0; b < 4; b++) {
      var bxx = w * (.2 + R() * .6), byy = h * (.1 + R() * .2), sz = w * .03;
      s += '<path d="M' + r1(bxx - sz) + ' ' + r1(byy) + 'q' + r1(sz / 2) + ' ' + r1(-sz / 2) + ' ' + r1(sz) + ' 0q' + r1(sz / 2) + ' ' + r1(-sz / 2) + ' ' + r1(sz) + ' 0" stroke="#07100b" stroke-width="' + r1(w * .008) + '" fill="none"/>';
    }
    return s;
  },
  waves: function (w, h, p, R) {
    var cx = w * .5, cy = h * .46, s = '';
    for (var i = 6; i > 0; i--) s += '<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(Math.min(w, h) * .07 * i) + '" fill="none" stroke="' + p.c + '" stroke-opacity="' + r1(.1 + (6 - i) * .1) + '" stroke-width="' + r1(w * .006) + '" stroke-dasharray="' + r1(w * .08) + ' ' + r1(w * .03) + '"/>';
    s += '<path d="M' + r1(cx) + ' ' + r1(h * .08) + 'L' + r1(cx + w * .05) + ' ' + r1(cy) + 'L' + r1(cx) + ' ' + r1(h * .8) + 'L' + r1(cx - w * .05) + ' ' + r1(cy) + 'z" fill="#02080f"/>';
    s += '<circle cx="' + r1(cx) + '" cy="' + r1(h * .1) + '" r="' + r1(w * .025) + '" fill="' + p.c + '"/>';
    for (var k = 0; k < 4; k++) {
      var y = h * (.72 + k * .07), a = h * .03;
      var d = 'M0 ' + r1(y);
      for (var x = 0; x < w; x += w / 6) d += 'q' + r1(w / 24) + ' ' + r1(-a) + ' ' + r1(w / 12) + ' 0t' + r1(w / 12) + ' 0';
      s += '<path d="' + d + 'V' + h + 'H0z" fill="#03101d" opacity="' + (.5 + k * .15) + '"/><path d="' + d + '" fill="none" stroke="' + p.c + '" stroke-opacity=".35" stroke-width="' + r1(w * .004) + '"/>';
    }
    return s;
  },
  tiffin: function (w, h, p, R) {
    var s = '<circle cx="' + r1(w * .5) + '" cy="' + r1(h * .36) + '" r="' + r1(Math.min(w, h) * .3) + '" fill="' + p.c + '" opacity=".9"/>';
    var x0 = w * .06;
    [[.08, .22], [.07, .34], [.06, .18], [.09, .28], [.05, .4], [.08, .24], [.07, .3], [.1, .2]].forEach(function (b, i) {
      var bw = w * b[0], bh = h * b[1];
      s += '<rect x="' + r1(x0) + '" y="' + r1(h * .78 - bh) + '" width="' + r1(bw) + '" height="' + r1(bh) + '" fill="#2a0912"/>';
      x0 += bw + w * .015;
    });
    var tw = w * .22, tx = w * .5 - tw / 2, ty = h * .44, lh = h * .085;
    for (var i = 0; i < 3; i++) s += '<rect x="' + r1(tx) + '" y="' + r1(ty + i * (lh + h * .006)) + '" width="' + r1(tw) + '" height="' + r1(lh) + '" rx="' + r1(lh * .25) + '" fill="#c93a53" stroke="#fff" stroke-opacity=".25"/>';
    s += '<path d="M' + r1(tx + tw * .15) + ' ' + r1(ty) + 'v' + r1(-h * .05) + 'h' + r1(tw * .7) + 'v' + r1(h * .05) + '" fill="none" stroke="#2a0912" stroke-width="' + r1(w * .014) + '"/>';
    for (var k = 0; k < 3; k++) s += '<path d="M' + r1(tx + tw * (.3 + k * .2)) + ' ' + r1(ty - h * .08) + 'q' + r1(w * .02) + ' ' + r1(-h * .03) + ' 0 ' + r1(-h * .06) + 't0 ' + r1(-h * .06) + '" stroke="#fff" stroke-opacity=".6" stroke-width="' + r1(w * .007) + '" fill="none" stroke-linecap="round"/>';
    s += '<rect x="0" y="' + r1(h * .78) + '" width="' + w + '" height="' + r1(h * .22) + '" fill="#1c050b"/>';
    return s;
  },
  mirror: function (w, h, p, R) {
    var cx = w * .5, cy = h * .42, rx = Math.min(w * .26, h * .2), ry = rx * 1.35, s = '';
    s += '<ellipse cx="' + r1(cx) + '" cy="' + r1(cy) + '" rx="' + r1(rx * 1.25) + '" ry="' + r1(ry * 1.2) + '" fill="' + p.c + '" opacity=".08"/>';
    s += '<ellipse cx="' + r1(cx) + '" cy="' + r1(cy) + '" rx="' + r1(rx) + '" ry="' + r1(ry) + '" fill="#1a1e24" stroke="' + p.c + '" stroke-width="' + r1(w * .012) + '"/>';
    s += '<circle cx="' + r1(cx) + '" cy="' + r1(cy - ry * .2) + '" r="' + r1(rx * .32) + '" fill="#050608"/><path d="M' + r1(cx - rx * .7) + ' ' + r1(cy + ry * .8) + 'q' + r1(rx * .7) + ' ' + r1(-ry * .75) + ' ' + r1(rx * 1.4) + ' 0z" fill="#050608"/>';
    s += '<path d="M' + r1(cx + rx * .1) + ' ' + r1(cy - ry) + 'l' + r1(-rx * .15) + ' ' + r1(ry * .5) + 'l' + r1(rx * .25) + ' ' + r1(ry * .2) + 'l' + r1(-rx * .3) + ' ' + r1(ry * .6) + 'M' + r1(cx - rx * .05) + ' ' + r1(cy - ry * .5) + 'l' + r1(-rx * .5) + ' ' + r1(ry * .15) + '" stroke="' + p.c + '" stroke-width="' + r1(w * .005) + '" fill="none"/>';
    return s;
  },
  skyline: function (w, h, p, R) {
    var s = '<circle cx="' + r1(w * .5) + '" cy="' + r1(h * .56) + '" r="' + r1(Math.min(w, h) * .3) + '" fill="' + p.c + '"/>';
    for (var i = 0; i < 5; i++) s += '<rect x="0" y="' + r1(h * (.4 + i * .045)) + '" width="' + w + '" height="' + r1(h * (.008 + i * .004)) + '" fill="#1d0f06"/>';
    var x = 0;
    while (x < w) {
      var bw = w * (.05 + R() * .08), bh = h * (.1 + R() * .22);
      s += '<rect x="' + r1(x) + '" y="' + r1(h * .72 - bh) + '" width="' + r1(bw) + '" height="' + r1(bh + h * .3) + '" fill="#140902"/>';
      x += bw;
    }
    for (var n = 0; n < 4; n++) {
      var nx = w * (.12 + n * .22), ny = h * (.14 + (n % 2) * .08), r = w * .018;
      s += '<circle cx="' + r1(nx) + '" cy="' + r1(ny) + '" r="' + r1(r) + '" fill="' + p.c + '" opacity=".8"/><path d="M' + r1(nx + r) + ' ' + r1(ny) + 'v' + r1(-h * .06) + 'l' + r1(w * .03) + ' ' + r1(h * .01) + '" stroke="' + p.c + '" stroke-opacity=".8" stroke-width="' + r1(w * .006) + '" fill="none"/>';
    }
    return s;
  }
};

G.posterSvg = function (m, opts) {
  opts = opts || {};
  var W = 200, H = 300, id = G.uid('p'), R = G.rng(m.id + 'poster'), p = m.palette;
  var lines = m.posterLines || [m.title];
  var size = opts.titleSize || (lines.some(function (l) { return l.length > 11; }) ? 18 : 23);
  var s = '<svg class="g-art" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + G.esc(m.title) + ' poster">' +
    '<defs><linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + p.a + '"/><stop offset="1" stop-color="' + p.b + '"/></linearGradient>' +
    '<linearGradient id="' + id + 's" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></linearGradient></defs>' +
    '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'b)"/>' + MOTIFS[m.motif](W, H, p, R) +
    '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + 's)"/>';
  if (!opts.noText) {
    s += '<text x="14" y="22" font-family="Manrope, sans-serif" font-size="7" font-weight="800" letter-spacing="1.6" fill="#fff" fill-opacity=".7">' + G.esc(m.kicker || '') + '</text>';
    var y0 = H - 18 - (lines.length - 1) * (size * .98);
    lines.forEach(function (l, i) {
      s += '<text x="14" y="' + r1(y0 + i * size * .98) + '" font-family="Sora, Manrope, sans-serif" font-size="' + size + '" font-weight="800" letter-spacing="-.4" fill="#fff">' + G.esc(l.toUpperCase()) + '</text>';
    });
    s += '<rect x="14" y="' + r1(y0 - size - 6) + '" width="22" height="3" rx="1.5" fill="' + p.c + '"/>';
  }
  return s + '</svg>';
};
G.backdropSvg = function (m) {
  var W = 320, H = 180, id = G.uid('b'), R = G.rng(m.id + 'backdrop'), p = m.palette;
  return '<svg class="g-art" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.a + '"/><stop offset="1" stop-color="' + p.b + '"/></linearGradient></defs>' +
    '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + ')"/>' + MOTIFS[m.motif](W, H, p, R) + '</svg>';
};

/* cast photo stand-in: tinted silhouette */
G.avatarSvg = function (name, tint) {
  var R = G.rng(name), hue = Math.floor(R() * 360), id = G.uid('a');
  var c1 = tint || 'hsl(' + hue + ' 38% 42%)', c2 = 'hsl(' + ((hue + 40) % 360) + ' 45% 22%)';
  var skin = ['#c68a62', '#a8704d', '#8a5a3c', '#d9a07a', '#b57e58'][Math.floor(R() * 5)];
  var hair = ['#1b1210', '#2a1b14', '#0f0b0a', '#3b2a20'][Math.floor(R() * 4)];
  var long = R() > .5;
  return '<svg class="g-art" viewBox="0 0 80 80" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
    '<rect width="80" height="80" fill="url(#' + id + ')"/>' +
    (long ? '<path d="M24 38c-2 14 2 26 2 26h28s4-12 2-26z" fill="' + hair + '"/>' : '') +
    '<path d="M14 80c2-15 12-22 26-22s24 7 26 22z" fill="' + hair + '" opacity=".85"/>' +
    '<rect x="35" y="46" width="10" height="12" rx="4" fill="' + skin + '"/>' +
    '<ellipse cx="40" cy="36" rx="13" ry="15" fill="' + skin + '"/>' +
    '<path d="M27 34c0-10 6-15 13-15s13 5 13 15c-3-5-8-7-13-7s-10 2-13 7z" fill="' + hair + '"/></svg>';
};

/* food & beverage illustrations */
G.foodSvg = function (kind) {
  var bg = { popcorn: '#3a1414', caramel: '#3a2512', cola: '#101d33', nachos: '#33260c', combo: '#2a1433', coffee: '#2b1d14', samosa: '#33200a', brownie: '#241410' }[kind] || '#222';
  var art = {
    popcorn: '<path d="M40 38h40l-5 40H45z" fill="#fff"/><path d="M47 38l3 40M58 38v40M69 38l-3 40" stroke="#e03b3b" stroke-width="5"/><g fill="#fff4d6"><circle cx="44" cy="34" r="7"/><circle cx="54" cy="30" r="8"/><circle cx="65" cy="31" r="8"/><circle cx="75" cy="35" r="6"/><circle cx="60" cy="24" r="6"/></g>',
    caramel: '<path d="M38 38h44l-5 40H43z" fill="#f2c14e"/><path d="M38 46h44" stroke="#3a2512" stroke-width="3"/><g fill="#d98b2b"><circle cx="44" cy="33" r="7"/><circle cx="55" cy="29" r="8"/><circle cx="66" cy="30" r="8"/><circle cx="76" cy="34" r="6"/><circle cx="61" cy="22" r="6"/></g>',
    cola: '<path d="M46 28h28l-4 50H50z" fill="#e8413a"/><rect x="44" y="24" width="32" height="7" rx="3" fill="#fff"/><path d="M63 24l6-14" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M50 48h20" stroke="#fff" stroke-width="3" opacity=".8"/>',
    nachos: '<path d="M30 66h60l-6 12H36z" fill="#1f1f1f"/><g fill="#f5b83d" stroke="#33260c" stroke-width="1.5"><path d="M36 64l10-24 10 24z"/><path d="M50 64l12-28 12 28z"/><path d="M66 64l10-22 10 22z"/></g><ellipse cx="60" cy="50" rx="12" ry="5" fill="#ffd966" opacity=".9"/>',
    combo: '<path d="M26 40h32l-4 36H30z" fill="#fff"/><path d="M34 40l2 36M42 40v36M50 40l-2 36" stroke="#e03b3b" stroke-width="4"/><g fill="#fff4d6"><circle cx="31" cy="36" r="6"/><circle cx="41" cy="32" r="7"/><circle cx="52" cy="35" r="6"/></g><path d="M64 36h20l-3 42H67z" fill="#e8413a"/><rect x="62" y="32" width="24" height="6" rx="3" fill="#fff"/><path d="M76 32l4-12" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    coffee: '<path d="M44 34h32l-4 44H48z" fill="#c9a27e"/><rect x="42" y="28" width="36" height="8" rx="3" fill="#f3efe9"/><path d="M48 50h24" stroke="#6b4527" stroke-width="10" opacity=".6"/><path d="M62 28l4-14" stroke="#f3efe9" stroke-width="3" stroke-linecap="round"/>',
    samosa: '<path d="M26 72l18-34 18 34z" fill="#e0a13a" stroke="#8a5a1b" stroke-width="2"/><path d="M58 72l18-34 18 34z" fill="#eab04a" stroke="#8a5a1b" stroke-width="2"/><circle cx="60" cy="76" r="5" fill="#3aa35a"/>',
    brownie: '<rect x="36" y="44" width="48" height="28" rx="4" fill="#5a3322"/><rect x="36" y="44" width="48" height="8" rx="4" fill="#7a4a33"/><path d="M42 44q8-8 16 0t16 0" fill="none" stroke="#f3efe9" stroke-width="3"/><circle cx="72" cy="38" r="5" fill="#e03b3b"/>'
  }[kind] || '';
  return '<svg class="g-art" viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="' + bg + '"/><circle cx="60" cy="50" r="38" fill="#fff" opacity=".05"/>' + art + '</svg>';
};

/* city glyphs (40px line drawings) */
var CITY = {
  arch: '<path d="M8 34V16a12 12 0 0 1 24 0v18M14 34V18a6 6 0 0 1 12 0v16M5 34h30M8 12h24"/>',
  gate: '<path d="M6 34V12h28v22M14 34V21a6 6 0 0 1 12 0v13M4 12h32M20 6v6M16 6h8M4 34h32"/>',
  palace: '<path d="M6 34V20h28v14M12 20a8 8 0 0 1 16 0M20 8v4M8 20v-4M32 20v-4M4 34h32M17 34v-6h6v6"/>',
  minar: '<path d="M8 34V10M32 34V10M8 10l-1-4h2zM32 10l-1-4h2zM12 34V22a8 8 0 0 1 16 0v12M4 34h32M8 18h24"/>',
  temple: '<path d="M10 34 13 24h14l3 10M13 24l2-7h10l2 7M15 17l2-6h6l2 6M18 11l1-4h2l1 4M4 34h32"/>',
  bridge: '<path d="M4 28h32M10 28V8M30 28V8M10 10 4 28M10 10l10 18M30 10l-10 18M30 10l6 18M4 34h32"/>',
  fort: '<path d="M4 34V16h4v-4h4v4h4v-4h8v4h4v-4h4v4h4v18M16 34v-8a4 4 0 0 1 8 0v8"/>',
  net: '<path d="M6 34 20 12l14 22M20 12 10 6M20 12l10-6M10 6l-2 10M30 6l2 10M8 16h24M4 34h32"/>',
  stepwell: '<path d="M4 12h32M8 12v22M32 12v22M8 18h24M12 18v16M28 18v16M12 24h16M16 24v10M24 24v10M4 34h32"/>',
  waves: '<path d="M4 18q4-4 8 0t8 0 8 0 8 0M4 25q4-4 8 0t8 0 8 0 8 0M4 32q4-4 8 0t8 0 8 0 8 0M20 4v8"/>'
};
G.cityIcon = function (kind, size) {
  var s = size || 40;
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (CITY[kind] || CITY.arch) + '</svg>';
};

/* ticket-count illustration: one figure per seat */
G.countLabel = function (n) {
  return ['', 'Solo show', 'Date night', 'Trio', 'Squad', 'High five', 'The gang', 'Big gang', 'Crew outing', 'Family reunion', 'Whole row'][n] || '';
};
G.countSvg = function (n) {
  var W = 320, H = 120, fw = 28, gap = 2, total = 10, x0 = (W - (total * fw + (total - 1) * gap)) / 2;
  var tones = ['#ffc53d', '#ff9f45', '#6cb4ff', '#4ade94', '#ff8fa3', '#c9a0ff', '#ffd36b', '#7fd1b9', '#ffb38a', '#9ec5ff'];
  var skins = ['#c68a62', '#a8704d', '#8a5a3c', '#d9a07a', '#b57e58'];
  var s = '<svg class="g-countart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + n + ' seats">';
  for (var i = 0; i < total; i++) {
    var x = x0 + i * (fw + gap), on = i < n, d = (i * 40) + 'ms';
    if (on) {
      s += '<g class="g-countart__fig" style="animation-delay:' + d + '">' +
        '<rect x="' + (x + 5) + '" y="52" width="18" height="30" rx="8" fill="' + tones[i] + '"/>' +
        '<circle cx="' + (x + 14) + '" cy="42" r="8" fill="' + skins[i % 5] + '"/>' +
        '<path d="M' + (x + 6) + ' 40a8 8 0 0 1 16 0c-3-2-5-3-8-3s-5 1-8 3z" fill="#1b1210"/>' +
        (i % 3 === 0 ? '<path d="M' + (x + 17) + ' 60h9l-1.5 12h-6z" fill="#fff"/><path d="M' + (x + 19.5) + ' 60v12M' + (x + 22.5) + ' 60v12" stroke="#e03b3b" stroke-width="1.4"/><circle cx="' + (x + 19) + '" cy="58.5" r="2.2" fill="#fff4d6"/><circle cx="' + (x + 23) + '" cy="58" r="2.4" fill="#fff4d6"/>' : '') +
        '</g>';
    }
    s += '<path d="M' + (x + 1) + ' 72V66a6 6 0 0 1 6-6h14a6 6 0 0 1 6 6v6" fill="none" style="stroke:' + (on ? 'var(--accent)' : 'var(--line-strong)') + '" stroke-width="2"/>' +
      '<rect x="' + (x) + '" y="72" width="' + fw + '" height="14" rx="4" style="fill:' + (on ? 'var(--accent)' : 'var(--surface-3)') + '"/>' +
      '<path d="M' + (x + 4) + ' 86v8M' + (x + fw - 4) + ' 86v8" style="stroke:var(--line-strong)" stroke-width="2"/>';
  }
  return s + '</svg>';
};

/* demo QR: finder patterns + seeded modules (not a scannable code) */
G.qrSvg = function (text, size) {
  var N = 29, R = G.rng(text), cells = '', px = size || 132;
  function finder(x, y) {
    return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#111"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#111"/>';
  }
  var d = '';
  for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
    var inF = (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    if (inF) continue;
    var on = (y === 6 || x === 6) ? ((x + y) % 2 === 0) : R() > .52;
    if (on) d += 'M' + x + ' ' + y + 'h1v1h-1z';
  }
  cells = '<path d="' + d + '" fill="#111"/>';
  return '<svg class="g-qr" width="' + px + '" height="' + px + '" viewBox="-2 -2 ' + (N + 4) + ' ' + (N + 4) + '" shape-rendering="crispEdges" role="img" aria-label="Ticket QR code"><rect x="-2" y="-2" width="' + (N + 4) + '" height="' + (N + 4) + '" fill="#fff"/>' +
    cells + finder(0, 0) + finder(N - 7, 0) + finder(0, N - 7) + '</svg>';
};

/* screen indicator for the seat map */
G.screenSvg = function () {
  var id = G.uid('scr');
  return '<svg class="g-screen__svg" viewBox="0 0 600 70" preserveAspectRatio="none" aria-hidden="true"><defs>' +
    '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent)" stop-opacity=".28"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="' + id + 's" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--accent)" stop-opacity=".15"/><stop offset=".5" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity=".15"/></linearGradient></defs>' +
    '<path d="M20 22Q300 -6 580 22L600 70H0z" fill="url(#' + id + 'g)"/>' +
    '<path d="M20 22Q300 -6 580 22" fill="none" stroke="url(#' + id + 's)" stroke-width="5" stroke-linecap="round"/></svg>';
};

export default G;
