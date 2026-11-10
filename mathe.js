/* Mathe-Teil der LernApp – Aufgaben-Erzeuger (ohne Bildschirm-Code, deshalb auch in Node testbar).
   Stoff der 2. Mathearbeit am 1. Dezember 2026 laut Selbsteinschätzungsbogen (Fotos in Mathe/, JPG-Kopien in Mathe/JPG):
   Buch Kapitel 1.7 und 1.8 (S. 28–33) sowie 2.1 bis 2.4 (S. 46–58).
   Die Aufgaben werden im Stil des Buchs neu erzeugt – Buchaufgaben werden nicht abgeschrieben.
   Jede Fertigkeit (= eine „Ich kann …“-Zeile des Bogens) hat Stufen von leicht nach schwer. Zu jeder Aufgabe gibt es
   einen Rechenweg, einen Tipp und meist „Schritt für Schritt“: dieselbe Aufgabe in kleinen Lernschritten
   (z. B. km → m → dm → cm). */
(function (G) {
"use strict";

/* ---------- Helfer ---------- */
const zr = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const wahl = a => a[Math.floor(Math.random() * a.length)];
function mische(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const gl = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));
const r6 = x => Math.round(x * 1e6) / 1e6; // Kommazahlen ohne Rechen-Krümel (1,66 statt 1,6600000000000001)
const pad2 = n => String(n).padStart(2, "0");
const gross1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const NB = " "; // schmales geschütztes Leerzeichen zwischen Tausendergruppen (wie im Buch: 24 000)

// Zahl in deutscher Schreibweise: Komma, ab fünf Stellen Tausendergruppen (4000, aber 24 000)
function fz(n) {
  if (typeof n !== "number" || !isFinite(n)) return String(n);
  const neg = n < 0; n = Math.abs(n);
  let s = String(Math.round(n * 1e6) / 1e6);
  if (/e/.test(s)) s = n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  let [g, d] = s.split(".");
  if (g.length >= 5) g = g.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  return (neg ? "−" : "") + g + (d ? "," + d : "");
}
function geldT(ct) { return ct % 100 === 0 ? fz(r6(ct / 100)) + " €" : fz(Math.floor(r6(ct / 100))) + "," + pad2(ct % 100) + " €"; }
function uhrT(h, m) { return h + ":" + pad2(m) + " Uhr"; }
function dauerT(min) { const h = Math.floor(min / 60), m = min % 60; return h && m ? h + " h " + m + " min" : h ? h + " h" : m + " min"; }

// Eingabe lesen: „4000“, „4 000“, „2,5“; „6.700“ gilt als 6700 (Tausenderpunkt), „2.5“ als 2,5 (mit Hinweis)
function zahlLesen(s) {
  let t = String(s === null || s === undefined ? "" : s).trim().replace(/[\s   ]/g, "").replace(/[−–]/g, "-");
  if (!t) return { leer: true };
  let punkt = false, tausender = false;
  if (/^-?\d+(,\d+)?$/.test(t)) { /* normal */ }
  else if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) { t = t.replace(/\./g, ""); tausender = true; }
  else if (/^-?\d*\.\d+$/.test(t)) { t = t.replace(".", ","); punkt = true; }
  else if (/^-?,\d+$/.test(t)) t = t.replace(",", "0,");
  else return { unlesbar: true };
  return { wert: parseFloat(t.replace(",", ".")), punkt, tausender };
}

/* ---------- Bausteine einer Aufgabe ----------
   Aufgabe = { lbl, frage, teile: [Teil, …], weg: [Zeilen des Rechenwegs], tipp, bild, schritte: () => {intro, teile, bild}, sek }
   Teil    = { frage, eingabe: { typ: zahl | zwei | uhr | wahl | zahlOderNicht, … }, loesung, loesungText, diagnose(x), erklaerung } */
function tZahl(frage, loesung, einheit, x) {
  const mitE = einheit && !(frage || "").includes("■ " + einheit) ? " " + einheit : ""; // Einheit ergänzen, wenn sie nicht schon hinter ■ steht
  return Object.assign({ frage, eingabe: { typ: "zahl", einheit: einheit || "" }, loesung,
    loesungText: frage ? frage.replace("■", fz(loesung) + mitE) : fz(loesung) + mitE }, x || {});
}
function tZwei(frage, loesung, einheiten, x) {
  let i = 0; const t = frage.replace(/■/g, () => fz(loesung[i++]));
  return Object.assign({ frage, eingabe: { typ: "zwei", einheiten }, loesung, loesungText: t }, x || {});
}
function tUhr(frage, loesung, x) {
  return Object.assign({ frage, eingabe: { typ: "uhr" }, loesung, loesungText: frage.replace("■", uhrT(loesung[0], loesung[1])) }, x || {});
}
function tWahl(frage, richtig, falsche, x) {
  const opts = mische([richtig].concat(falsche.filter((f, i, a) => f !== richtig && a.indexOf(f) === i)));
  return Object.assign({ frage, eingabe: { typ: "wahl", optionen: opts }, loesung: opts.indexOf(richtig), loesungText: richtig }, x || {});
}
function tFest(frage, optionen, richtig, x) {
  return Object.assign({ frage, eingabe: { typ: "wahl", optionen }, loesung: richtig, loesungText: optionen[richtig] }, x || {});
}
function tNull(frage, loesung, x) { // Zahl oder „geht nicht“ (loesung === null)
  return Object.assign({ frage, eingabe: { typ: "zahlOderNicht" }, loesung, loesungText: loesung === null ? "geht nicht" : fz(loesung) }, x || {});
}
function aufg(o) { return Object.assign({ teile: [], weg: [], tipp: "", bild: null, schritte: null, sek: 25 }, o); }
function schritte(intro, teile, bild) { return { intro, teile, bild: bild || null }; }

/* ---------- Prüfen ---------- */
// Kleiner Rechner für angezeigte Ausdrücke („12 + 8 · 11“, „2 · [3 + (5 − 1)]“) – für die Auswahl der Ablenker
function rechne(s) {
  const tk = String(s).replace(/ /g, "").match(/\d+(?:,\d+)?|[+−·:()[\]]/g); if (!tk) return NaN;
  let i = 0;
  const zahl = () => { const x = tk[i++]; if (x === "(" || x === "[") { const v = summe(); i++; return v; } return parseFloat(String(x).replace(",", ".")); };
  const produkt = () => { let v = zahl(); while (tk[i] === "·" || tk[i] === ":") { const o = tk[i++], w = zahl(); v = o === "·" ? v * w : v / w; } return v; };
  function summe() { let v = produkt(); while (tk[i] === "+" || tk[i] === "−") { const o = tk[i++], w = produkt(); v = o === "+" ? v + w : v - w; } return v; }
  const v = summe(); return i === tk.length ? v : NaN;
}
// Ablenker für „Welche Rechnung passt?“: nur Rechnungen mit ANDEREM Wert als die richtige (sonst wären zwei Antworten richtig)
function ablenker(richtig, kandidaten, n) {
  const werte = [rechne(richtig)], out = [];
  for (const k of kandidaten) {
    const w = rechne(k);
    if (k === richtig || out.includes(k) || (isFinite(w) && werte.some(x => isFinite(x) && Math.abs(x - w) < 1e-9))) continue;
    werte.push(w); out.push(k); if (out.length >= (n || 2)) break;
  }
  return out;
}
function zahlVarianten(frage) { // aus den Zahlen einer Aufgabe weitere Rechnungen bilden (Ersatz-Ablenker)
  const z = (String(frage).replace(/ /g, "").match(/\d+/g) || []).slice(0, 2).map(Number); if (z.length < 2) return [];
  const [p, q] = z.map(fz); return [p + " + " + q, p + " − " + q, q + " − " + p, p + " · " + q, p + " : " + q, q + " : " + p];
}
function opVarianten(term) { // gleiche Zahlen, ein Rechenzeichen getauscht
  const out = [], tk = term.split(" ");
  tk.forEach((x, i) => { if (["+", "−", "·", ":"].includes(x)) ["+", "−", "·", ":"].filter(o => o !== x).forEach(o => { const k = tk.slice(); k[i] = o; out.push(k.join(" ")); }); });
  return out;
}
function zehner(r, x) { // Ziffern richtig, aber Komma/Nullen verrutscht
  if (!x || !r) return null;
  for (let k = 1; k <= 9; k++) {
    const p = Math.pow(10, k);
    if (gl(x, r * p)) return "Die Ziffern stimmen, aber Deine Zahl ist " + fz(p) + "-mal zu groß.";
    if (gl(x, r / p)) return "Die Ziffern stimmen, aber Deine Zahl ist " + fz(p) + "-mal zu klein.";
  }
  return null;
}
function nah(r, x) {
  if (!Number.isInteger(r) || !Number.isInteger(x)) return null;
  const d = Math.abs(x - r);
  if (d === 1) return "So knapp! Nur 1 daneben – prüf die Einer noch einmal.";
  if (d === 10) return "Fast! Genau 10 daneben – prüf die Zehner (den Übergang) noch einmal.";
  if (d === 100) return "Fast! Genau 100 daneben – prüf die Hunderter noch einmal.";
  return null;
}
function pruefe(T, e) {
  const E = T.eingabe;
  if (E.typ === "wahl") {
    if (typeof e !== "number") return { erg: "leer" };
    return e === T.loesung ? { erg: "ok" } : { erg: "no", text: T.diagnose ? T.diagnose(e) : null };
  }
  if (E.typ === "zahl" || E.typ === "zahlOderNicht") {
    if (e && e.nicht) return T.loesung === null ? { erg: "ok" } : { erg: "no", text: T.diagnose ? T.diagnose("nicht") : null };
    const z = zahlLesen(e);
    if (z.leer) return { erg: "leer" };
    if (z.unlesbar) return { erg: "unlesbar" };
    if (T.loesung === null) return { erg: "no", text: T.diagnose ? T.diagnose(z.wert) : null };
    if (gl(z.wert, T.loesung)) return { erg: "ok", text: z.punkt ? "Tipp: In Mathe schreibt man ein Komma: " + fz(T.loesung) + "." : null };
    if (z.tausender && gl(z.wert / 1000, T.loesung)) return { erg: "ok", text: "Tipp: In Mathe schreibt man ein Komma: " + fz(T.loesung) + "." };
    const d = (T.diagnose && T.diagnose(z.wert)) || null, k = d ? null : (zehner(T.loesung, z.wert) || nah(T.loesung, z.wert));
    return { erg: "no", text: d || k, knapp: !!k };
  }
  if (E.typ === "reihe") {
    if (!Array.isArray(e) || e.length !== E.optionen.length) return { erg: "leer" };
    if (e.every((x, i) => x === T.loesung[i])) return { erg: "ok" };
    const verrutscht = e.filter((x, i) => x !== T.loesung[i]).length;
    return { erg: "no", knapp: verrutscht === 2, text: (verrutscht === 2 ? "Fast – nur zwei Angaben sind vertauscht. " : "") + "Richtig ist: " + T.loesung.map(i => E.optionen[i]).join(" < ") + "." };
  }
  if (E.typ === "zwei" || E.typ === "uhr") {
    const a = zahlLesen(e && e[0]), b = zahlLesen(e && e[1]);
    if (a.leer && b.leer) return { erg: "leer" };
    if (a.unlesbar || b.unlesbar) return { erg: "unlesbar" };
    const x = [a.leer ? 0 : a.wert, b.leer ? 0 : b.wert];
    if (gl(x[0], T.loesung[0]) && gl(x[1], T.loesung[1])) return { erg: "ok" };
    if (T.gleichwertig) { const t = T.gleichwertig(x); if (t) return { erg: "fast", text: t }; }
    return { erg: "no", text: T.diagnose ? T.diagnose(x) : null };
  }
  return { erg: "leer" };
}

/* ---------- Einheiten ---------- */
const FAM = {
  L: { e: ["km", "m", "dm", "cm", "mm"], z: [1000, 10, 10, 10], pos: [6, 3, 2, 1, 0], frage: "Was ist länger", gleich: "Beide sind gleich lang" },
  G: { e: ["t", "kg", "g", "mg"], z: [1000, 1000, 1000], pos: [9, 6, 3, 0], frage: "Was ist schwerer", gleich: "Beide sind gleich schwer" },
  M: { e: ["€", "Cent"], z: [100], pos: [2, 0], frage: "Was ist mehr", gleich: "Beides ist gleich viel" },
  Z: { e: ["d", "h", "min", "s"], z: [24, 60, 60], frage: "Was dauert länger", gleich: "Beides dauert gleich lang" }
};
function fak(F, i, j) { let f = 1; for (let k = Math.min(i, j); k < Math.max(i, j); k++) f *= F.z[k]; return f; } // Umrechnungszahl zwischen Einheit i und j
function gr(F, v, i) { // Größe als Text: „4 km“, „2,79 €“, „465 Cent“
  if (F === FAM.M && i === 0) return Number.isInteger(v) ? fz(v) + " €" : geldT(Math.round(v * 100));
  return fz(v) + " " + F.e[i];
}
function richtungText(kleiner, f) {
  return kleiner ? "Zur kleineren Einheit: mal " + fz(f) + " – die Zahl wird größer." : "Zur größeren Einheit: geteilt durch " + fz(f) + " – die Zahl wird kleiner.";
}
function treppe(key, v, i, j) { // Lernschritte: Stufe für Stufe von Einheit i nach j
  const F = FAM[key], d = i < j ? 1 : -1, teile = []; let cur = v;
  for (let k = i; k !== j; k += d) {
    const n = k + d, f = F.z[Math.min(k, n)], neu = d > 0 ? cur * f : cur / f;
    teile.push(tZahl(gr(F, cur, k) + " = ■ " + F.e[n], neu, F.e[n], { erklaerung: F.e[k] + " → " + F.e[n] + ": " + (d > 0 ? "mal " : "geteilt durch ") + fz(f), an: [k, n] }));
    cur = neu;
  }
  return teile;
}
function umDiag(F, v, i, j, x) {
  const f = fak(F, i, j), kleiner = i < j, w = kleiner ? v * f : v / f;
  if (f > 1 && gl(x, kleiner ? v / f : v * f)) return "Achtung, Richtung! " + richtungText(kleiner, f);
  if (F === FAM.Z && Math.abs(j - i) === 1 && F.z[Math.min(i, j)] === 60 && gl(x, kleiner ? v * 100 : v / 100))
    return "Achtung: Bei der Zeit ist die Umrechnungszahl 60 – nicht 100!";
  const z = zehner(w, x);
  if (z) return z + " Prüf die Umrechnungszahl: 1 " + F.e[Math.min(i, j)] + " = " + fz(f) + " " + F.e[Math.max(i, j)] + ".";
  return null;
}
function umAufgabe(key, v, i, j, lbl) { // „4 km = ■ cm“ (i, j = Einheiten-Nummern)
  const F = FAM[key], f = fak(F, i, j), kleiner = i < j, w = kleiner ? v * f : v / f, a = Math.min(i, j), b = Math.max(i, j);
  const weg = kleiner ? [gr(F, v, i) + " = " + fz(v) + " · " + fz(f) + " " + F.e[j], "= " + gr(F, w, j)]
    : [gr(F, v, i) + " = " + fz(w) + " · " + fz(f) + " " + F.e[i], "= " + gr(F, w, j)];
  const bild = { art: "treppe", fam: key, von: i, bis: j };
  return aufg({ lbl, frage: gr(F, v, i) + " = ■ " + F.e[j], teile: [tZahl(null, w, F.e[j], { diagnose: x => umDiag(F, v, i, j, x) })],
    loesungText: gr(F, v, i) + " = " + gr(F, w, j), weg, bild, sek: b - a > 1 ? 30 : 20,
    tipp: "1 " + F.e[a] + " = " + fz(f) + " " + F.e[b] + ". " + richtungText(kleiner, f),
    schritte: () => b - a > 1 ? schritte("Geh die Treppe Stufe für Stufe:", treppe(key, v, i, j), bild)
      : schritte("So rechnest Du in zwei kleinen Schritten:", [
        tZahl("1 " + F.e[a] + " = ■ " + F.e[b], f, F.e[b], { erklaerung: "Das ist die Umrechnungszahl." }),
        tZahl(kleiner ? fz(v) + " · " + fz(f) + " = ■" : fz(v) + " : " + fz(f) + " = ■", w, "", { erklaerung: richtungText(kleiner, f) })], bild) });
}
function vergleich(key) { // „Was ist länger: 3 km oder 2953 m?“
  const F = FAM[key], n = F.e.length;
  const i = zr(0, n - 2), j = Math.min(n - 1, i + (key === "L" && i <= n - 3 && Math.random() < 0.4 ? 2 : 1));
  const fi = fak(F, i, n - 1), fj = fak(F, j, n - 1), v = zr(2, 9), A0 = v * fi;
  let B0 = A0;
  if (Math.random() >= 0.25) { const m = Math.max(1, Math.round(A0 * (0.02 + Math.random() * 0.12) / fj)); B0 = A0 + (Math.random() < 0.5 ? -m : m) * fj; }
  const A = gr(F, v, i), B = gr(F, B0 / fj, j), Aj = gr(F, A0 / fj, j), links = Math.random() < 0.5;
  const opts = links ? [A, B, F.gleich] : [B, A, F.gleich], r = A0 === B0 ? 2 : ((A0 > B0) === links ? 0 : 1);
  const zeichen = A0 > B0 ? ">" : A0 < B0 ? "<" : "=", bild = { art: "treppe", fam: key, von: i, bis: j };
  return aufg({ lbl: "Vergleiche.", frage: F.frage + ": " + opts[0] + " oder " + opts[1] + "?", teile: [tFest(null, opts, r)],
    weg: [A + " = " + Aj, Aj + " " + zeichen + " " + B], tipp: "Rechne zuerst beide Größen in dieselbe Einheit um.", bild, sek: 25,
    schritte: () => schritte("Erst in dieselbe Einheit umrechnen, dann vergleichen:", [
      tZahl(A + " = ■ " + F.e[j], A0 / fj, F.e[j], { erklaerung: "Jetzt haben beide Größen dieselbe Einheit: " + Aj + " und " + B + "." }),
      tFest(F.frage + "?", opts, r)], bild) });
}

/* ---------- 1. Längen, Gewichte und Geld umrechnen ---------- */
function einheitGesucht() { // „3 dm = 30 ■“
  const key = wahl(["L", "L", "G"]), F = FAM[key];
  const i = zr(0, F.e.length - 2), sp = key === "L" && i <= F.e.length - 3 && Math.random() < 0.4 ? 2 : 1, j = i + sp;
  const v = zr(2, 30), f = fak(F, i, j), w = v * f, linksGross = Math.random() < 0.5;
  const frage = linksGross ? gr(F, v, i) + " = " + fz(w) + " ■" : gr(F, w, j) + " = " + fz(v) + " ■", r = linksGross ? j : i;
  return aufg({ lbl: "Welche Einheit gehört in die Lücke?", frage, teile: [tFest(null, F.e.slice(), r)], loesungText: frage.replace("■", F.e[r]),
    weg: [linksGross ? gr(F, v, i) + " = " + fz(v) + " · " + fz(f) + " " + F.e[j] + " = " + gr(F, w, j) : gr(F, w, j) + " = " + fz(v) + " · " + fz(f) + " " + F.e[j] + " = " + gr(F, v, i)],
    tipp: "Wird die Zahl größer, ist die Einheit kleiner – und umgekehrt.", bild: { art: "treppe", fam: key, von: i, bis: j }, sek: 15 });
}
function umrechnen(st) {
  if (st === 1 && Math.random() < 0.15) return schaetzen(wahl(["L", "G"]));
  if (st <= 2) {
    const key = wahl(["L", "L", "G", "M"]), F = FAM[key], i = zr(0, F.e.length - 2), k = Math.random() < 0.75 ? zr(2, 30) : zr(31, 450);
    return st === 1 ? umAufgabe(key, k, i, i + 1, "Rechne in die nächstkleinere Einheit um.") : umAufgabe(key, k * F.z[i], i + 1, i, "Rechne in die nächstgrößere Einheit um.");
  }
  if (st === 3) {
    const r = Math.random(); if (r < 0.3) return einheitGesucht(); if (r < 0.55) return mitGroessen(); if (r < 0.7) return halbeGroesse();
    const key = wahl(["L", "L", "G"]), F = FAM[key], i = zr(0, F.e.length - 3), j = i + 2, f = fak(F, i, j), k = key === "G" ? zr(2, 12) : zr(2, 40);
    return Math.random() < 0.6 ? umAufgabe(key, k, i, j, "Ergänze die Lücke.") : umAufgabe(key, k * f, j, i, "Ergänze die Lücke.");
  }
  if (st === 4) {
    const key = Math.random() < 0.7 ? "L" : "G", F = FAM[key];
    const [i, j] = key === "L" ? wahl([[0, 3], [0, 4], [1, 4], [0, 3]]) : wahl([[0, 2], [1, 3]]);
    const k = key === "L" && i === 1 ? zr(2, 40) : zr(1, 9), f = fak(F, i, j);
    return Math.random() < 0.6 ? umAufgabe(key, k, i, j, "Rechne um.") : umAufgabe(key, k * f, j, i, "Rechne um.");
  }
  const r = Math.random(); return r < 0.25 ? vergleich(wahl(["L", "L", "G", "M"])) : r < 0.5 ? ordnen() : r < 0.7 ? gleichGross() : sachGroessen();
}

/* ---------- 2. Zeiten umrechnen, Zeitpunkt und Zeitspanne ---------- */
const BRUCH = [["eine halbe Stunde", 30, "min", "1 h = 60 min. Die Hälfte von 60 min sind 30 min."], ["eine Viertelstunde", 15, "min", "Ein Viertel von 60 min sind 15 min."],
  ["eine Dreiviertelstunde", 45, "min", "Drei Viertel von 60 min: 3 · 15 min = 45 min."], ["eineinhalb Stunden", 90, "min", "60 min + 30 min = 90 min."],
  ["zweieinhalb Stunden", 150, "min", "2 · 60 min + 30 min = 150 min."], ["eine halbe Minute", 30, "s", "1 min = 60 s. Die Hälfte sind 30 s."],
  ["eineinhalb Minuten", 90, "s", "60 s + 30 s = 90 s."], ["ein halber Tag", 12, "h", "1 d = 24 h. Die Hälfte sind 12 h."],
  ["eineinhalb Tage", 36, "h", "24 h + 12 h = 36 h."], ["zwei Tage", 48, "h", "2 · 24 h = 48 h."],
  ["eine Stunde", 3600, "s", "1 h = 60 min = 60 · 60 s = 3600 s."], ["zehn Minuten", 600, "s", "10 · 60 s = 600 s."]];
function zeitBruch() {
  const [t, w, e, weg] = wahl(BRUCH);
  return aufg({ lbl: "Rechne in die angegebene Einheit um.", frage: gross1(t) + " = ■ " + e, teile: [tZahl(null, w, e)], weg: [weg],
    tipp: "1 d = 24 h · 1 h = 60 min · 1 min = 60 s", sek: 18 });
}
function zeitGemischt() { // „2 h 15 min = ■ min“
  const art = wahl(["h", "h", "min", "d"]), F = FAM.Z;
  const [i, a, b] = art === "h" ? [1, zr(1, 4), zr(1, 11) * 5] : art === "min" ? [2, zr(1, 5), zr(1, 11) * 5] : [0, zr(1, 3), zr(1, 23)];
  const f = F.z[i], w = a * f + b, gross = F.e[i], klein = F.e[i + 1];
  return aufg({ lbl: "Rechne in die kleinere Einheit um.", frage: a + " " + gross + " " + b + " " + klein + " = ■ " + klein,
    teile: [tZahl(null, w, klein, { diagnose: x => gl(x, a * 100 + b) && f !== 100 ? "Achtung: 1 " + gross + " hat " + f + " " + klein + " – nicht 100!" : null })],
    weg: [a + " " + gross + " = " + a + " · " + f + " " + klein + " = " + (a * f) + " " + klein, (a * f) + " " + klein + " + " + b + " " + klein + " = " + w + " " + klein],
    tipp: "1 " + gross + " = " + f + " " + klein + ". Rechne erst die " + gross + " um, dann zählst Du die " + klein + " dazu.", sek: 25,
    schritte: () => schritte("Erst die große Einheit umrechnen, dann zusammenzählen:", [
      tZahl(a + " " + gross + " = ■ " + klein, a * f, klein, { erklaerung: "1 " + gross + " = " + f + " " + klein }),
      tZahl((a * f) + " " + klein + " + " + b + " " + klein + " = ■ " + klein, w, klein)]) });
}
const PUNKT_SPANNE = [["Der Bus kommt um 7:42 Uhr.", 0], ["Die große Pause dauert 20 Minuten.", 1], ["Das Fußballspiel beginnt um 15:30 Uhr.", 0],
  ["Für die Hausaufgaben habe ich eine Stunde gebraucht.", 1], ["Der Laden öffnet um 9 Uhr.", 0], ["Die Sommerferien dauern sechs Wochen.", 1],
  ["Wir treffen uns um halb vier.", 0], ["Der Film läuft 95 Minuten.", 1], ["Mein Wecker klingelt um 6:45 Uhr.", 0], ["Die Fahrt zu Oma dauert zwei Stunden.", 1],
  ["Die Schule ist um 13:05 Uhr aus.", 0], ["Ein Tag hat 24 Stunden.", 1], ["Das Training geht von 17 Uhr bis 18 Uhr.", 1], ["Um Mitternacht beginnt ein neuer Tag.", 0]];
function punktOderSpanne() {
  const [s, r] = wahl(PUNKT_SPANNE);
  return aufg({ lbl: "Zeitpunkt oder Zeitspanne?", frage: s, teile: [tFest(null, ["Zeitpunkt", "Zeitspanne"], r)],
    weg: [r === 0 ? "Hier geht es um das Wann? – also um einen Zeitpunkt." : "Hier geht es um das Wie lange? – also um eine Zeitspanne."],
    tipp: "Zeitpunkt: Wann? (eine Uhrzeit) · Zeitspanne: Wie lange? (eine Dauer zwischen zwei Zeitpunkten)", sek: 10 });
}
function spanneTeile(sh, sm, eh, em) { // Lernschritte: bis zur vollen Stunde, volle Stunden, Rest
  const dauer = eh * 60 + em - (sh * 60 + sm), teile = [];
  if (sh === eh) return [tZahl(em + " − " + sm + " = ■", dauer, "min", { erklaerung: "Beide Uhrzeiten liegen in derselben Stunde." })];
  let h1 = sh;
  if (sm > 0) { teile.push(tZahl("Von " + uhrT(sh, sm) + " bis " + uhrT(sh + 1, 0) + ": ■", 60 - sm, "min", { erklaerung: "Erst bis zur nächsten vollen Stunde." })); h1 = sh + 1; }
  if (eh > h1) teile.push(tZahl("Von " + uhrT(h1, 0) + " bis " + uhrT(eh, 0) + ": ■", eh - h1, "h", { erklaerung: "Dann die vollen Stunden." }));
  if (em > 0) teile.push(tZahl("Von " + uhrT(eh, 0) + " bis " + uhrT(eh, em) + ": ■", em, "min", { erklaerung: "Dann die restlichen Minuten." }));
  if (teile.length > 1) teile.push(tZwei("Zusammen sind das ■ h ■ min", [Math.floor(dauer / 60), dauer % 60], ["h", "min"], { erklaerung: "60 min sind 1 h." }));
  return teile;
}
function zeitspanne() { // „Wie lange dauert es von 7:50 Uhr bis 12:55 Uhr?“
  const r = Math.random();
  let sh = zr(6, 17), sm = zr(0, 11) * 5, dauer;
  if (r < 0.3) { sm = zr(0, 8) * 5; dauer = zr(3, 59 - sm); }
  else if (r < 0.45) { sm = 0; dauer = zr(1, 6) * 60; }
  else dauer = zr(40, 330);
  if (sh * 60 + sm + dauer > 23 * 60 + 55) sh = 8;
  const ende = sh * 60 + sm + dauer, eh = Math.floor(ende / 60), em = ende % 60, H = Math.floor(dauer / 60), M = dauer % 60;
  const von = sm ? uhrT(sh, sm) : sh + " Uhr", bis = em ? uhrT(eh, em) : eh + " Uhr";
  const dez = (eh * 100 + em) - (sh * 100 + sm); // typischer Fehler: wie mit Dezimalzahlen gerechnet (8:20 − 7:50 = 70)
  const teil = tZwei("■ h ■ min", [H, M], ["h", "min"], {
    gleichwertig: x => x[0] * 60 + x[1] === dauer && x[1] >= 60 ? "Richtig gerechnet! Aber " + x[1] + " min sind mehr als 1 h. Schreib besser: " + H + " h " + M + " min." : null,
    diagnose: x => (x[0] === Math.floor(dez / 100) && x[1] === dez % 100) || (x[0] === 0 && x[1] === dez) ? "Achtung: Eine Stunde hat 60 Minuten, nicht 100. Rechne lieber in Schritten bis zur vollen Stunde." :
      Math.abs(x[0] * 60 + x[1] - dauer) === 60 ? "Fast! Zähl die vollen Stunden noch einmal." : null });
  const st = spanneTeile(sh, sm, eh, em);
  return aufg({ lbl: "Berechne die Zeitspanne.", frage: "Wie lange dauert es von " + von + " bis " + bis + "?", teile: [teil],
    weg: st.map(t => t.loesungText).concat(st.length > 1 ? [] : ["= " + dauerT(dauer)]),
    tipp: "Rechne in Schritten: bis zur nächsten vollen Stunde, dann die vollen Stunden, dann die restlichen Minuten.", sek: 45,
    schritte: () => schritte("Rechne in kleinen Schritten:", spanneTeile(sh, sm, eh, em)) });
}
const TUN = [["Das Training", "es"], ["Der Film", "er"], ["Die Busfahrt", "sie"], ["Der Ausflug", "er"], ["Das Konzert", "es"], ["Die Radtour", "sie"], ["Die Probe im Chor", "sie"]];
function zeitpunkt() { // „Das Training beginnt um 17:30 Uhr und dauert 1 h 45 min. Wann endet es?“
  const [wer, es] = wahl(TUN), dh = zr(0, 3), dm = Math.random() < 0.7 ? zr(1, 11) * 5 : zr(1, 59), dauer = Math.max(15, dh * 60 + dm);
  let sh = zr(7, 17), sm = zr(0, 11) * 5;
  if (sh * 60 + sm + dauer > 23 * 60 + 55) sh = 9;
  const ende = sh * 60 + sm + dauer, eh = Math.floor(ende / 60), em = ende % 60, D = Math.floor(dauer / 60), Dm = dauer % 60, vor = Math.random() < 0.6;
  const teile = [];
  if (vor) {
    let h = sh, m = sm;
    if (D) { teile.push(tUhr(uhrT(h, m) + " + " + D + " h = ■", [h + D, m], { erklaerung: "Erst die vollen Stunden dazu." })); h += D; }
    if (Dm) {
      if (m > 0 && m + Dm > 60) { teile.push(tUhr(uhrT(h, m) + " + " + (60 - m) + " min = ■", [h + 1, 0], { erklaerung: "Dann bis zur vollen Stunde." })); teile.push(tUhr(uhrT(h + 1, 0) + " + " + (m + Dm - 60) + " min = ■", [eh, em], { erklaerung: "Dann die restlichen Minuten." })); }
      else teile.push(tUhr(uhrT(h, m) + " + " + Dm + " min = ■", [eh, em], { erklaerung: "Dann die Minuten dazu." }));
    }
  } else {
    let h = eh, m = em;
    if (D) { teile.push(tUhr(uhrT(h, m) + " − " + D + " h = ■", [h - D, m], { erklaerung: "Erst die vollen Stunden zurück." })); h -= D; }
    if (Dm) {
      if (Dm > m && m > 0) { teile.push(tUhr(uhrT(h, m) + " − " + m + " min = ■", [h, 0], { erklaerung: "Dann zurück bis zur vollen Stunde." })); teile.push(tUhr(uhrT(h, 0) + " − " + (Dm - m) + " min = ■", [sh, sm], { erklaerung: "Dann die restlichen Minuten zurück." })); }
      else teile.push(tUhr(uhrT(h, m) + " − " + Dm + " min = ■", [sh, sm], { erklaerung: "Dann die Minuten zurück." }));
    }
  }
  const loes = vor ? [eh, em] : [sh, sm];
  const frage = vor ? wer + " beginnt um " + uhrT(sh, sm) + " und dauert " + dauerT(dauer) + ". Wann endet " + es + "?"
    : wer + " endet um " + uhrT(eh, em) + ". " + gross1(es) + " hat " + dauerT(dauer) + " gedauert. Wann hat " + es + " begonnen?";
  return aufg({ lbl: vor ? "Berechne den Zeitpunkt (Ende)." : "Berechne den Zeitpunkt (Anfang).", frage,
    teile: [tUhr("■", loes, { diagnose: x => x[1] >= 60 ? "Achtung: Minuten gehen nur bis 59. " + x[1] + " min = 1 h " + (x[1] - 60) + " min." : Math.abs((x[0] * 60 + x[1]) - (loes[0] * 60 + loes[1])) === 60 ? "Fast! Die Minuten stimmen – prüf die Stunde noch einmal." : null })],
    weg: teile.map(t => t.loesungText), tipp: vor ? "Erst die Stunden dazuzählen, dann die Minuten – über die volle Stunde in zwei Schritten." : "Rückwärts rechnen: erst die Stunden abziehen, dann die Minuten.",
    sek: 50, schritte: () => schritte("Rechne in kleinen Schritten:", teile.map(t => Object.assign({}, t))) });
}
function zeit(st) {
  if (st === 1 && Math.random() < 0.15) return schaetzen("Z");
  if (st === 1) { const i = zr(0, 2), v = i === 0 ? zr(2, 7) : i === 1 ? zr(2, 12) : zr(2, 15); return umAufgabe("Z", v, i, i + 1, "Rechne in die nächstkleinere Einheit um."); }
  if (st === 2) { const i = zr(0, 2), k = i === 0 ? zr(2, 7) : zr(2, 10); return umAufgabe("Z", k * FAM.Z.z[i], i + 1, i, "Rechne in die nächstgrößere Einheit um."); }
  if (st === 3) { const r = Math.random(); return r < 0.3 ? zeitBruch() : r < 0.6 ? zeitGemischt() : r < 0.8 ? vergleich("Z") : punktOderSpanne(); }
  if (st === 4) return Math.random() < 0.85 ? zeitspanne() : punktOderSpanne();
  return zeitpunkt();
}

/* ---------- 3. Kommaschreibweise und Einheitentafel ---------- */
const KPAARE = { L: [[0, 1], [1, 3], [3, 4], [1, 4], [2, 3], [0, 1]], G: [[0, 1], [1, 2], [2, 3], [1, 2]] };
function kommaWert(f) { // Kommazahl, die sich mit der Umrechnungszahl f ohne Komma schreiben lässt (6,7 km → 6700 m)
  const maxd = Math.round(Math.log10(f)), d = zr(1, maxd), ganz = Math.random() < 0.25 ? 0 : zr(1, 25), p = Math.pow(10, d);
  let rest; do { rest = zr(1, p - 1); } while (rest % 10 === 0);
  return { ganz, wert: r6(ganz + rest / p), klein: ganz * f + rest * f / p, restKlein: rest * f / p };
}
function tafel(key, text, wert, von, bis) { return { art: "tafel", fam: key, zeilen: [{ text, wert, von, bis }] }; }
function stellenText(f) { const s = Math.round(Math.log10(f)); return s === 1 ? "1 Stelle" : s + " Stellen"; }
function kommaWeg() { // 6,7 km = ■ m
  const key = Math.random() < 0.6 ? "L" : "G", F = FAM[key], [i, j] = wahl(KPAARE[key]), f = fak(F, i, j), K = kommaWert(f);
  const q = fz(K.wert) + " " + F.e[i], bild = tafel(key, q, K.klein, i, j);
  return aufg({ lbl: "Schreibe ohne Komma.", frage: q + " = ■ " + F.e[j],
    teile: [tZahl(null, K.klein, F.e[j], { diagnose: x => { const z = zehner(K.klein, x); return z ? z + " Von " + F.e[i] + " zu " + F.e[j] + " wandert das Komma " + stellenText(f) + " nach rechts." : null; } })],
    weg: [q + " = " + fz(K.ganz) + " " + F.e[i] + " " + fz(K.restKlein) + " " + F.e[j], "= " + fz(K.klein) + " " + F.e[j]],
    tipp: "1 " + F.e[i] + " = " + fz(f) + " " + F.e[j] + ": Das Komma wandert " + stellenText(f) + " nach rechts. Fehlende Stellen füllst Du mit 0.", bild, sek: 28,
    schritte: () => schritte("Lies in der Einheitentafel ab:", [
      tZahl(q + " = " + fz(K.ganz) + " " + F.e[i] + " ■ " + F.e[j], K.restKlein, F.e[j], { erklaerung: "Die Ziffern hinter dem Komma gehören zu " + F.e[j] + " – fehlende Stellen sind Nullen." }),
      tZahl(fz(K.ganz) + " " + F.e[i] + " " + fz(K.restKlein) + " " + F.e[j] + " = ■ " + F.e[j], K.klein, F.e[j], { erklaerung: fz(K.ganz) + " " + F.e[i] + " = " + fz(K.ganz * f) + " " + F.e[j] + "." })], bild) });
}
function kommaHin() { // 250 cm = ■ m
  const key = Math.random() < 0.6 ? "L" : "G", F = FAM[key], [i, j] = wahl(KPAARE[key]), f = fak(F, i, j), K = kommaWert(f);
  const q = fz(K.klein) + " " + F.e[j], bild = tafel(key, q, K.klein, i, j);
  return aufg({ lbl: "Schreibe mit Komma.", frage: q + " = ■ " + F.e[i],
    teile: [tZahl(null, K.wert, F.e[i], { diagnose: x => { const z = zehner(K.wert, x); return z ? z + " Das Komma steht direkt rechts neben der Spalte " + F.e[i] + "." : null; } })],
    weg: [q + " = " + fz(K.ganz) + " " + F.e[i] + " " + fz(K.restKlein) + " " + F.e[j], "= " + fz(K.wert) + " " + F.e[i]],
    tipp: "1 " + F.e[i] + " = " + fz(f) + " " + F.e[j] + ": Das Komma rückt " + stellenText(f) + " nach links.", bild, sek: 30,
    schritte: () => schritte("Lies in der Einheitentafel ab:", [
      tZwei(q + " = ■ " + F.e[i] + " ■ " + F.e[j], [K.ganz, K.restKlein], [F.e[i], F.e[j]], { erklaerung: fz(f) + " " + F.e[j] + " sind 1 " + F.e[i] + "." }),
      tZahl(fz(K.ganz) + " " + F.e[i] + " " + fz(K.restKlein) + " " + F.e[j] + " = ■ " + F.e[i], K.wert, F.e[i], { erklaerung: "Das Komma steht rechts neben der Spalte " + F.e[i] + "." })], bild) });
}
function kommaGemischt() { // 6 km 700 m = ■ km  ·  6,7 km = ■ km ■ m  ·  3 cm 8 mm = ■ mm
  const key = Math.random() < 0.6 ? "L" : "G", F = FAM[key], [i, j] = wahl(KPAARE[key]), f = fak(F, i, j);
  let K; do { K = kommaWert(f); } while (K.ganz === 0);
  const zwei = fz(K.ganz) + " " + F.e[i] + " " + fz(K.restKlein) + " " + F.e[j], komma = fz(K.wert) + " " + F.e[i], ohne = fz(K.klein) + " " + F.e[j];
  const art = zr(0, 2), bild = tafel(key, komma, K.klein, i, j);
  const weg = [komma + " = " + zwei + " = " + ohne];
  const tipp = "1 " + F.e[i] + " = " + fz(f) + " " + F.e[j] + ". " + komma + ", " + zwei + " und " + ohne + " sind dieselbe Größe.";
  if (art === 0) return aufg({ lbl: "Schreibe mit Komma.", frage: zwei + " = ■ " + F.e[i], teile: [tZahl(null, K.wert, F.e[i])], weg, tipp, bild, sek: 25 });
  if (art === 1) return aufg({ lbl: "Schreibe in zwei Einheiten.", frage: komma + " = ■ " + F.e[i] + " ■ " + F.e[j], teile: [tZwei("■ " + F.e[i] + " ■ " + F.e[j], [K.ganz, K.restKlein], [F.e[i], F.e[j]])], weg, tipp, bild, sek: 25 });
  return aufg({ lbl: "Schreibe ohne Komma.", frage: zwei + " = ■ " + F.e[j], teile: [tZahl(null, K.klein, F.e[j])], weg, tipp, bild, sek: 22,
    schritte: () => schritte("In zwei Schritten:", [tZahl(fz(K.ganz) + " " + F.e[i] + " = ■ " + F.e[j], K.ganz * f, F.e[j]), tZahl(fz(K.ganz * f) + " " + F.e[j] + " + " + fz(K.restKlein) + " " + F.e[j] + " = ■ " + F.e[j], K.klein, F.e[j])], bild) });
}
function geld() { // 2,79 € = ■ Cent · 465 Cent = ■ € · 7 € 5 Cent = ■ €
  const euro = zr(0, 60), cent = Math.random() < 0.3 ? zr(1, 9) : zr(10, 99), ct = euro * 100 + cent, art = wahl(["ec", "ec", "ce", "ce", "gem"]);
  const bild = tafel("M", geldT(ct), ct, 0, 1), weg = [geldT(ct) + " = " + euro + " € " + cent + " Cent", "= " + fz(euro * 100) + " Cent + " + cent + " Cent = " + fz(ct) + " Cent"];
  const tipp = "1 € = 100 Cent. Hinter dem Komma stehen immer zwei Stellen für die Cent: 0,05 € = 5 Cent, 0,50 € = 50 Cent.";
  const nullFalle = x => cent < 10 && gl(x, euro * 10 + cent) && euro > 0 ? "Achtung, Null-Falle: " + geldT(ct) + " sind " + euro + " € und " + cent + " Cent – also " + fz(euro * 100) + " Cent + " + cent + " Cent." : null;
  if (art === "ec") return aufg({ lbl: "Rechne in Cent um.", frage: geldT(ct) + " = ■ Cent", teile: [tZahl(null, ct, "Cent", { diagnose: nullFalle })], weg, tipp, bild, sek: 22,
    schritte: () => schritte("Euro und Cent getrennt:", [tZwei(geldT(ct) + " = ■ € ■ Cent", [euro, cent], ["€", "Cent"]), tZahl(euro + " € " + cent + " Cent = ■ Cent", ct, "Cent", { erklaerung: euro + " € = " + fz(euro * 100) + " Cent" })], bild) });
  const eurT = { loesungText: geldT(ct) };
  const kommaFalle = x => cent < 10 && gl(x, euro + cent / 10) ? "Achtung: " + cent + " Cent sind 0,0" + cent + " € – nicht 0," + cent + "0 €." : null;
  if (art === "ce") return aufg({ lbl: "Rechne in Euro um.", frage: fz(ct) + " Cent = ■ €", teile: [tZahl(null, r6(ct / 100), "€", Object.assign({ diagnose: kommaFalle }, eurT))],
    weg: [fz(ct) + " Cent = " + euro + " € " + cent + " Cent", "= " + geldT(ct)], tipp, bild, sek: 22,
    schritte: () => schritte("Euro und Cent getrennt:", [tZwei(fz(ct) + " Cent = ■ € ■ Cent", [euro, cent], ["€", "Cent"], { erklaerung: "100 Cent sind 1 €." }), tZahl(euro + " € " + cent + " Cent = ■ €", r6(ct / 100), "€", Object.assign({ erklaerung: "Die Cent stehen mit zwei Stellen hinter dem Komma." }, eurT))], bild) });
  return aufg({ lbl: "Schreibe mit Komma.", frage: euro + " € " + cent + " Cent = ■ €", teile: [tZahl(null, r6(ct / 100), "€", Object.assign({ diagnose: kommaFalle }, eurT))], weg: [euro + " € " + cent + " Cent = " + geldT(ct)], tipp, bild, sek: 18 });
}
function kommaVergleich() {
  if (Math.random() < 0.6) { // „Was ist schwerer: 2,7 kg oder 2650 g?“
    const key = Math.random() < 0.6 ? "L" : "G", F = FAM[key], [i, j] = wahl(KPAARE[key]), f = fak(F, i, j), K = kommaWert(f);
    let wB = K.klein;
    if (Math.random() >= 0.3) { const d = wahl([1, 2, 5, 10, 20, 50, 100].filter(x => x < K.klein)) || 1; wB = K.klein + (Math.random() < 0.5 && K.klein - d > 0 ? -d : d); }
    const A = fz(K.wert) + " " + F.e[i], B = fz(wB) + " " + F.e[j], Aj = fz(K.klein) + " " + F.e[j], links = Math.random() < 0.5;
    const opts = links ? [A, B, F.gleich] : [B, A, F.gleich], r = K.klein === wB ? 2 : ((K.klein > wB) === links ? 0 : 1);
    const bild = tafel(key, A, K.klein, i, j);
    return aufg({ lbl: "Vergleiche.", frage: F.frage + ": " + opts[0] + " oder " + opts[1] + "?", teile: [tFest(null, opts, r)],
      weg: [A + " = " + Aj, Aj + " " + (K.klein > wB ? ">" : K.klein < wB ? "<" : "=") + " " + B], tipp: "Schreib beide Größen ohne Komma in derselben Einheit.", bild, sek: 25,
      schritte: () => schritte("Erst ohne Komma in dieselbe Einheit, dann vergleichen:", [tZahl(A + " = ■ " + F.e[j], K.klein, F.e[j]), tFest(F.frage + "?", opts, r)], bild) });
  }
  const F = FAM.L, b = zr(11, 99) * 10, werte = mische([b * 10, b, b / 10, b + 10 * zr(1, 9)]);
  const texte = werte.map(v => { const u = wahl([1, 2, 3, 4]); return fz(v / fak(F, u, 4)) + " " + F.e[u]; });
  const r = texte[werte.indexOf(b * 10)];
  return aufg({ lbl: "Welche Angabe ist am größten?", frage: texte.join("  ·  "), teile: [tWahl(null, r, texte)],
    weg: texte.map((t, k) => t + " = " + fz(werte[k]) + " mm"), tipp: "Rechne alle Längen in dieselbe Einheit um, zum Beispiel in mm.", sek: 40,
    schritte: () => schritte("Rechne alle in mm um, dann vergleichen:", texte.map((t, k) => tZahl(t + " = ■ mm", werte[k], "mm")).concat([tWahl("Welche Angabe ist am größten?", r, texte)])) });
}
function komma(st) { return st === 1 ? kommaWeg() : st === 2 ? kommaHin() : st === 3 ? kommaGemischt() : st === 4 ? geld() : (r => r < 0.35 ? ordnen() : r < 0.6 ? gleichGross() : kommaVergleich())(Math.random()); }

/* ---------- 4. Addieren und Subtrahieren im Kopf, Fachbegriffe ---------- */
function kopfPM(mitUebergang) {
  const plus = Math.random() < 0.5;
  let at, ae, bt, be;
  for (;;) {
    at = zr(1, 8); bt = zr(1, 8); ae = zr(0, 9); be = zr(1, 9);
    if (plus && at + bt > (mitUebergang ? 8 : 9)) continue;
    if (!plus && at <= bt) continue;
    if (plus && (ae + be >= 10) !== mitUebergang) continue;
    if (!plus && (ae < be) !== mitUebergang) continue;
    break;
  }
  const a = 10 * at + ae, b = 10 * bt + be, rund = mitUebergang && be >= 8, aus = 10 - be, b2 = b + aus;
  if (plus) {
    const w = a + b, weg = rund ? [a + " + " + b + " = " + a + " + " + b2 + " − " + aus + " = " + (a + b2) + " − " + aus + " = " + w] : [a + " + " + b + " = " + a + " + " + (10 * bt) + " + " + be + " = " + (a + 10 * bt) + " + " + be + " = " + w];
    return aufg({ lbl: "Rechne im Kopf.", frage: a + " + " + b, teile: [tZahl(null, w, "", { diagnose: x => x === w - 10 ? "Fast! Hast Du beim Zehnerübergang den Zehner vergessen?" : null })], weg,
      tipp: rund ? "Rechne erst + " + b2 + " und dann wieder − " + aus + "." : "Zerlege " + b + " in " + (10 * bt) + " + " + be + ".", sek: 15,
      schritte: () => schritte(rund ? "Erst mit der runden Zahl rechnen, dann ausgleichen:" : "Zerlege in Zehner und Einer:", rund
        ? [tZahl(a + " + " + b2 + " = ■", a + b2), tZahl((a + b2) + " − " + aus + " = ■", w, "", { erklaerung: "Du hast " + aus + " zu viel addiert – also wieder abziehen." })]
        : [tZahl(a + " + " + (10 * bt) + " = ■", a + 10 * bt), tZahl((a + 10 * bt) + " + " + be + " = ■", w)]) });
  }
  const w = a - b, weg = rund ? [a + " − " + b + " = " + a + " − " + b2 + " + " + aus + " = " + (a - b2) + " + " + aus + " = " + w] : [a + " − " + b + " = " + a + " − " + (10 * bt) + " − " + be + " = " + (a - 10 * bt) + " − " + be + " = " + w];
  const vertauscht = 10 * (at - bt) + Math.abs(ae - be);
  return aufg({ lbl: "Rechne im Kopf.", frage: a + " − " + b, teile: [tZahl(null, w, "", { diagnose: x => x === a + b ? "Achtung: Hier wird subtrahiert (minus)." : mitUebergang && x === vertauscht ? "Achtung: " + ae + " − " + be + " geht nicht, also hast Du " + be + " − " + ae + " gerechnet. Zerlege lieber: " + a + " − " + (10 * bt) + " − " + be + "." : null })], weg,
    tipp: rund ? "Rechne erst − " + b2 + " und dann wieder + " + aus + "." : "Zerlege " + b + " in " + (10 * bt) + " + " + be + ".", sek: 15,
    schritte: () => schritte(rund ? "Erst mit der runden Zahl rechnen, dann ausgleichen:" : "Zerlege in Zehner und Einer:", rund
      ? [tZahl(a + " − " + b2 + " = ■", a - b2), tZahl((a - b2) + " + " + aus + " = ■", w, "", { erklaerung: "Du hast " + aus + " zu viel abgezogen – also wieder addieren." })]
      : [tZahl(a + " − " + (10 * bt) + " = ■", a - 10 * bt), tZahl((a - 10 * bt) + " − " + be + " = ■", w)]) });
}
function grossPM() { // dreistellig: 524 + 198, 538 − 291
  const plus = Math.random() < 0.5, rund = Math.random() < 0.45;
  let a, b;
  if (rund) { const hb = zr(1, 4), aus = zr(1, 3); b = hb * 100 - aus; a = plus ? zr(110, 690) : zr(b + 20, 990); }
  else { a = zr(110, 690); b = zr(101, 399); if (!plus) { a = zr(400, 990); b = zr(101, a - 50); } }
  const w = plus ? a + b : a - b, op = plus ? " + " : " − ";
  if (rund) {
    const b2 = Math.ceil(b / 100) * 100, aus = b2 - b, z = plus ? a + b2 : a - b2;
    return aufg({ lbl: "Rechne geschickt im Kopf.", frage: a + op + b, teile: [tZahl(null, w)], weg: [a + op + b + " = " + a + op + b2 + (plus ? " − " : " + ") + aus + " = " + z + (plus ? " − " : " + ") + aus + " = " + w],
      tipp: b + " liegt nah bei " + b2 + ": Rechne mit " + b2 + " und gleiche dann aus.", sek: 25,
      schritte: () => schritte("Erst mit der runden Zahl rechnen, dann ausgleichen:", [tZahl(a + op + b2 + " = ■", z), tZahl(z + (plus ? " − " : " + ") + aus + " = ■", w, "", { erklaerung: plus ? "Du hast " + aus + " zu viel addiert." : "Du hast " + aus + " zu viel abgezogen." })]) });
  }
  const h = Math.floor(b / 100) * 100, z = Math.floor((b % 100) / 10) * 10, e = b % 10, s1 = plus ? a + h : a - h, s2 = plus ? s1 + z : s1 - z;
  const teile = [tZahl(a + op + h + " = ■", s1)]; if (z) teile.push(tZahl(s1 + op + z + " = ■", s2)); if (e) teile.push(tZahl(s2 + op + e + " = ■", w));
  return aufg({ lbl: "Rechne im Kopf.", frage: a + op + b, teile: [tZahl(null, w)], weg: [a + op + b + " = " + a + op + h + (z ? op + z : "") + (e ? op + e : "") + " = " + w],
    tipp: "Zerlege " + b + " in Hunderter, Zehner und Einer.", sek: 25, schritte: () => schritte("Zerlege in Hunderter, Zehner und Einer:", teile.map(t => Object.assign({}, t))) });
}
function dreiZahlen() { // 75 + 25 − 30: von links nach rechts
  for (;;) {
    const ops = wahl([["+", "−"], ["+", "+"], ["−", "−"], ["−", "+"]]), a = zr(20, 160), b = zr(10, 99), c = zr(10, 99);
    const ab = ops[0] === "+" ? a + b : a - b, w = ops[1] === "+" ? ab + c : ab - c;
    if (ab < 0 || w < 0) continue;
    const t = a + " " + ops[0] + " " + b + " " + ops[1] + " " + c;
    return aufg({ lbl: "Rechne von links nach rechts.", frage: t, teile: [tZahl(null, w)], weg: [a + " " + ops[0] + " " + b + " = " + ab, ab + " " + ops[1] + " " + c + " = " + w],
      tipp: "Rechne von links nach rechts: erst " + a + " " + ops[0] + " " + b + ".", sek: 25,
      schritte: () => schritte("Von links nach rechts:", [tZahl(a + " " + ops[0] + " " + b + " = ■", ab), tZahl(ab + " " + ops[1] + " " + c + " = ■", w)]) });
  }
}
function nullPM() {
  const a = zr(12, 650), b = zr(3, 99), art = zr(0, 3);
  const [t, w, weg] = art === 0 ? [a + " + 0 + " + b, a + b, "+ 0 ändert nichts: " + a + " + " + b + " = " + (a + b)]
    : art === 1 ? [a + " − " + a + " + " + b, b, a + " − " + a + " = 0, und 0 + " + b + " = " + b]
    : art === 2 ? [a + " + " + b + " − " + b, a, "+ " + b + " und − " + b + " heben sich auf: Es bleibt " + a]
    : [a + " − 0", a, "− 0 ändert nichts."];
  return aufg({ lbl: "Rechne geschickt.", frage: t, teile: [tZahl(null, w)], weg: [weg], tipp: "Plus 0 oder minus 0 ändert nichts.", sek: 12 });
}
function begriffePM() { // „Wie nennt man die 7 in 15 − 7 = 8?“
  const plus = Math.random() < 0.5;
  let a, b, c;
  do { a = zr(4, 60); b = zr(2, 40); c = plus ? a + b : a - b; } while (a === b || c <= 0 || c === a || c === b);
  const glg = plus ? a + " + " + b + " = " + c : a + " − " + b + " = " + c;
  const wahlen = plus ? [["die " + a, "Summand", ["Summand", "Summe", "Minuend", "Subtrahend"]], ["die " + b, "Summand", ["Summand", "Summe", "Minuend", "Subtrahend"]],
    ["den Ausdruck " + a + " + " + b, "Summe", ["Summand", "Summe", "Minuend", "Subtrahend"]], ["die " + c, "Wert der Summe", ["Summand", "Wert der Summe", "Minuend", "Subtrahend"]]]
    : [["die " + a, "Minuend", ["Minuend", "Subtrahend", "Summand", "Differenz"]], ["die " + b, "Subtrahend", ["Minuend", "Subtrahend", "Summand", "Differenz"]],
      ["den Ausdruck " + a + " − " + b, "Differenz", ["Minuend", "Subtrahend", "Summand", "Differenz"]], ["die " + c, "Wert der Differenz", ["Minuend", "Subtrahend", "Summand", "Wert der Differenz"]]];
  const [teil, r, opts] = wahl(wahlen);
  return aufg({ lbl: "Fachbegriffe", frage: "Wie nennt man " + teil + " in " + glg + "?", teile: [tFest(null, opts, opts.indexOf(r))],
    weg: [plus ? "Summand + Summand: " + a + " + " + b + " ist eine Summe, " + c + " ist der Wert der Summe." : "Minuend − Subtrahend: " + a + " − " + b + " ist eine Differenz, " + c + " ist der Wert der Differenz."],
    tipp: "Summand + Summand → Summe · Minuend − Subtrahend → Differenz", sek: 12 });
}
function textPM() {
  const a = zr(40, 99), b = zr(11, a - 12), s = a + b;
  const T = wahl([
    ["Berechne die Differenz von " + a + " und " + b + ".", a - b, a + " − " + b, [a + " + " + b, b + " − " + a]],
    ["Berechne die Summe von " + a + " und " + b + ".", a + b, a + " + " + b, [a + " − " + b, b + " − " + a]],
    ["Die Summe zweier Zahlen ist " + s + ". Eine der Zahlen ist " + a + ". Berechne die zweite Zahl.", b, s + " − " + a, [s + " + " + a, a + " − " + b]],
    ["Wie viel musst Du von " + a + " subtrahieren, um " + b + " zu erhalten?", a - b, a + " − " + b, [a + " + " + b, b + " + " + a]],
    ["Der Minuend ist " + a + ", der Subtrahend ist " + b + ". Berechne den Wert der Differenz.", a - b, a + " − " + b, [b + " − " + a, a + " + " + b]],
    ["Ein Summand ist " + a + ", der Wert der Summe ist " + s + ". Wie heißt der andere Summand?", b, s + " − " + a, [s + " + " + a, a + " + " + b]],
    ["Welche Zahl musst Du zu " + b + " addieren, um " + s + " zu erhalten?", a, s + " − " + b, [s + " + " + b, b + " − " + s]]]);
  const [text, w, term, falsch] = T;
  return aufg({ lbl: "Fachbegriffe in Textaufgaben", frage: text, teile: [tZahl(null, w)], weg: [term + " = " + w],
    tipp: "Summe heißt plus (+), Differenz heißt minus (−).", sek: 30,
    schritte: () => schritte("Erst die passende Rechnung finden:", [tWahl("Welche Rechnung passt?", term, ablenker(term, falsch.concat(opVarianten(term), zahlVarianten(text)))), tZahl(term + " = ■", w)]) });
}
function plusminus(st) {
  if (st === 1) return kopfPM(false);
  if (st === 2) return kopfPM(true);
  if (st === 3) { const r = Math.random(); return r < 0.35 ? grossPM() : r < 0.8 ? dreiZahlen() : nullPM(); }
  return Math.random() < 0.5 ? begriffePM() : textPM();
}

/* ---------- 5. Umkehrrechnungen bei Plus und Minus ---------- */
function pfeil(a, op, b, c) { return { art: "pfeil", a, op, b, c }; }
function probeMachenPM() { // „Prüfe mit einer Probe: 67 − 42 = 25“
  const a = zr(45, 900), b = zr(12, a - 15), c = a - b, falsch = Math.random() < 0.5;
  let g = c; if (falsch) do { g = c + wahl([10, -10, 1, -1, 100, 2]); } while (g <= 0 || g === c);
  const probeFalle = x => g + b !== a && x === a ? "Bei der Probe rechnest Du aus, was wirklich herauskommt: " + g + " + " + b + " = " + (g + b) + ". Erst danach vergleichst Du mit " + a + "." : null;
  const teile = [tZahl("Rechne die Probe aus: " + g + " + " + b + " = ■", g + b, "", { erklaerung: "Die Probe zur Minusaufgabe ist eine Plusaufgabe.", diagnose: probeFalle }),
    tFest("Kommt wieder " + a + " heraus? Stimmt also " + a + " − " + b + " = " + g + "?", ["Ja, stimmt", "Nein, stimmt nicht"], falsch ? 1 : 0)];
  if (falsch) teile.push(tZahl("Berichtige: " + a + " − " + b + " = ■", c, "", { erklaerung: "Probe: " + c + " + " + b + " = " + a + " ✓" }));
  return aufg({ lbl: "Probe machen", frage: "Prüfe mit einer Probe: " + a + " − " + b + " = " + g, teile,
    weg: ["Probe: " + g + " + " + b + " = " + (g + b), falsch ? (g + b) + " ist nicht " + a + " – das Ergebnis ist falsch. Richtig: " + a + " − " + b + " = " + c + "." : (g + b) + " = " + a + " – das Ergebnis stimmt."],
    tipp: "Probe zu einer Minusaufgabe: Ergebnis + Subtrahend = Minuend.", bild: pfeil(c, "+", b, a), sek: 35 });
}
function luecke(minus, mal) { // ■ einsetzen: 12 + ■ = 40, 25 − ■ = 18, 8 · ■ = 64, 60 : ■ = 5
  let frage, x, term, falsch, diag, probe;
  if (!mal) {
    if (!minus) {
      const a = zr(12, 400), x0 = zr(11, 300), c = a + x0, links = Math.random() < 0.5;
      x = x0; frage = links ? a + " + ■ = " + c : "■ + " + a + " = " + c; term = c + " − " + a; falsch = [c + " + " + a, a + " − " + c];
      diag = v => v === a + c ? "Achtung: Rechne rückwärts – " + c + " − " + a + "." : null; probe = links ? a + " + " + x + " = " + c : x + " + " + a + " = " + c;
    } else if (Math.random() < 0.45) { // ■ − b = c
      const b = zr(8, 150), c = zr(11, 400); x = b + c; frage = "■ − " + b + " = " + c; term = c + " + " + b; falsch = [c + " − " + b, b + " − " + c];
      diag = v => v === c - b ? "Achtung: Von der gesuchten Zahl wird " + b + " abgezogen und es bleiben " + c + ". Sie muss also größer sein: " + c + " + " + b + "." : null;
      probe = x + " − " + b + " = " + c;
    } else { // a − ■ = c
      const a = zr(25, 1000), c = zr(5, a - 5); x = a - c; frage = a + " − ■ = " + c; term = a + " − " + c; falsch = [a + " + " + c, c + " − " + a];
      diag = v => v === a + c ? "Achtung: Die gesuchte Zahl wird abgezogen. Frag Dich: " + a + " minus wie viel ergibt " + c + "? Rechne " + a + " − " + c + "." : null;
      probe = a + " − " + x + " = " + c;
    }
  } else {
    if (!minus) { // Mal
      const a = zr(2, 12), x0 = Math.random() < 0.15 ? zr(100, 3000) : zr(2, 25), c = a * x0, links = Math.random() < 0.5;
      const a2 = Math.random() < 0.15 ? 1 : a;
      x = a2 === 1 ? c : x0; const cc = a2 * x;
      frage = links ? a2 + " · ■ = " + fz(cc) : "■ · " + a2 + " = " + fz(cc); term = fz(cc) + " : " + a2; falsch = [fz(cc) + " · " + a2, a2 + " : " + fz(cc)];
      diag = v => v === cc * a2 && a2 > 1 ? "Achtung: Rechne rückwärts – " + fz(cc) + " : " + a2 + "." : null; probe = links ? a2 + " · " + fz(x) + " = " + fz(cc) : fz(x) + " · " + a2 + " = " + fz(cc);
    } else if (Math.random() < 0.5) { // ■ : b = c
      const b = wahl([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]), c = zr(2, 45); x = b * c; frage = "■ : " + b + " = " + c; term = c + " · " + b; falsch = [c + " : " + b, b + " : " + c];
      diag = v => gl(v, c / b) ? "Achtung: Die gesuchte Zahl wird durch " + b + " geteilt und es kommt " + c + " heraus. Sie ist also größer: " + c + " · " + b + "." : null;
      probe = x + " : " + b + " = " + c;
    } else { // a : ■ = c
      const x0 = wahl([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), c = Math.random() < 0.1 ? 1 : zr(2, 51), a = x0 * c; x = x0;
      frage = a + " : ■ = " + c; term = a + " : " + c; falsch = [a + " · " + c, c + " : " + a];
      diag = v => v === a * c ? "Achtung: Gesucht ist die Zahl, durch die man " + a + " teilt. Rechne " + a + " : " + c + "." : null;
      probe = a + " : " + x + " = " + c;
    }
  }
  return aufg({ lbl: "Setze für ■ eine Zahl ein.", frage, teile: [tZahl(null, x, "", { diagnose: diag })],
    weg: ["Umkehraufgabe: ■ = " + term + " = " + fz(x), "Probe: " + probe + " ✓"], tipp: "Rechne mit der Umkehraufgabe rückwärts.", sek: 22,
    schritte: () => schritte("Mit der Umkehraufgabe findest Du ■:", [tWahl("Mit welcher Rechnung findest Du ■ in " + frage + "?", term, ablenker(term, falsch.concat(opVarianten(term), zahlVarianten(frage)))), tZahl(term + " = ■", x)]) });
}
function rechnenUndProbe(mal) {
  let a, b, op, inv, w;
  if (!mal) { if (Math.random() < 0.6) { a = zr(120, 900); b = zr(25, a - 20); op = "−"; inv = "+"; w = a - b; } else { a = zr(120, 600); b = zr(25, 390); op = "+"; inv = "−"; w = a + b; } }
  else if (Math.random() < 0.6) { b = zr(3, 9); w = zr(11, 40); a = b * w; op = ":"; inv = "·"; }
  else { a = zr(12, 60); b = zr(3, 9); op = "·"; inv = ":"; w = a * b; }
  return aufg({ lbl: "Rechne und mache die Probe.", frage: "Berechne " + a + " " + op + " " + b + " und mache die Probe.",
    teile: [tZahl(a + " " + op + " " + b + " = ■", w), tZahl("Probe: " + w + " " + inv + " " + b + " = ■", a, "", { erklaerung: "Kommt wieder " + a + " heraus, hast Du richtig gerechnet." })],
    weg: [a + " " + op + " " + b + " = " + w, "Probe: " + w + " " + inv + " " + b + " = " + a + " ✓"], tipp: "Die Probe ist die Umkehraufgabe: " + (op === "−" ? "Minus ↔ Plus" : op === "+" ? "Plus ↔ Minus" : op === ":" ? "Durch ↔ Mal" : "Mal ↔ Durch") + ".", sek: 35 });
}
function probePM(st) { return st === 1 ? probeMachenPM() : st === 2 ? (Math.random() < 0.2 ? zeichenEins() : luecke(false, false)) : st === 3 ? luecke(true, false) : rechnenUndProbe(false); }

/* ---------- 6. Multiplizieren und Dividieren im Kopf, Fachbegriffe ---------- */
function malKopf(gross) {
  const v = gross ? wahl(["rund", "rund", "zwei", "drei"]) : "zerlegen";
  if (v === "zerlegen") {
    const t = zr(1, 4), e = zr(1, 7), a = 10 * t + e, b = zr(2, 9), w = a * b, vorne = Math.random() < 0.5, frage = vorne ? b + " · " + a : a + " · " + b;
    return aufg({ lbl: "Rechne im Kopf.", frage, teile: [tZahl(null, w, "", { diagnose: x => x === b * 10 * t + e ? "Achtung: Beide Teile müssen mal " + b + " genommen werden: " + b + " · " + (10 * t) + " und " + b + " · " + e + "." : null })],
      weg: [frage + " = " + b + " · " + (10 * t) + " + " + b + " · " + e + " = " + (b * 10 * t) + " + " + (b * e) + " = " + w], tipp: "Zerlege " + a + " in " + (10 * t) + " + " + e + " und nimm beide Teile mal " + b + ".", sek: 20,
      schritte: () => schritte("Zerlege in Zehner und Einer:", [tZahl(b + " · " + (10 * t) + " = ■", b * 10 * t), tZahl(b + " · " + e + " = ■", b * e), tZahl((b * 10 * t) + " + " + (b * e) + " = ■", w)]) });
  }
  if (v === "rund") { // 29 · 6 = 30 · 6 − 6
    const t = zr(1, 8), e = wahl([8, 9]), a = 10 * t + e, a2 = a + (10 - e), aus = 10 - e, b = zr(3, 9), w = a * b;
    return aufg({ lbl: "Rechne geschickt im Kopf.", frage: a + " · " + b, teile: [tZahl(null, w)],
      weg: [a + " · " + b + " = " + a2 + " · " + b + " − " + aus + " · " + b + " = " + (a2 * b) + " − " + (aus * b) + " = " + w], tipp: "Rechne mit " + a2 + " statt " + a + " und zieh danach " + aus + " · " + b + " wieder ab.", sek: 28,
      schritte: () => schritte("Erst mit der runden Zahl rechnen, dann ausgleichen:", [tZahl(a2 + " · " + b + " = ■", a2 * b), tZahl(aus + " · " + b + " = ■", aus * b), tZahl((a2 * b) + " − " + (aus * b) + " = ■", w, "", { erklaerung: "Du hast " + aus + " · " + b + " zu viel gerechnet." })]) });
  }
  if (v === "zwei") { // 12 · 41 = 12 · 40 + 12 · 1  ·  29 · 13 = 30 · 13 − 13
    const b = zr(11, 19), plus = Math.random() < 0.5, t = zr(2, 6), a = plus ? 10 * t + 1 : 10 * t - 1, w = a * b;
    return aufg({ lbl: "Rechne geschickt im Kopf.", frage: (Math.random() < 0.5 ? a + " · " + b : b + " · " + a), teile: [tZahl(null, w)],
      weg: [a + " · " + b + " = " + (10 * t) + " · " + b + (plus ? " + " : " − ") + b + " = " + (10 * t * b) + (plus ? " + " : " − ") + b + " = " + w], tipp: a + " liegt nah bei " + (10 * t) + ".", sek: 30,
      schritte: () => schritte("Mit der runden Zahl rechnen, dann ausgleichen:", [tZahl((10 * t) + " · " + b + " = ■", 10 * t * b), tZahl((10 * t * b) + (plus ? " + " : " − ") + b + " = ■", w, "", { erklaerung: plus ? "Es fehlt noch einmal " + b + "." : "Einmal " + b + " war zu viel." })]) });
  }
  const a = wahl([110, 120, 130, 150, 210, 220, 230, 250]), b = zr(2, 9), w = a * b, h = Math.floor(a / 100) * 100, r = a - h; // 6 · 120
  return aufg({ lbl: "Rechne im Kopf.", frage: b + " · " + a, teile: [tZahl(null, w)], weg: [b + " · " + a + " = " + b + " · " + h + " + " + b + " · " + r + " = " + (b * h) + " + " + (b * r) + " = " + fz(w)],
    tipp: "Zerlege " + a + " in " + h + " + " + r + ".", sek: 22, schritte: () => schritte("Zerlegen:", [tZahl(b + " · " + h + " = ■", b * h), tZahl(b + " · " + r + " = ■", b * r), tZahl((b * h) + " + " + (b * r) + " = ■", w)]) });
}
function durchKopf(gross) {
  const b = gross ? wahl([3, 4, 6, 7, 8, 9, 12, 14]) : zr(2, 9);
  const minus = gross && Math.random() < 0.5;
  let q, a;
  if (minus) { q = 10 * zr(1, 2) + wahl([8, 9]); } else q = zr(11, gross ? 29 : 25);
  if (b >= 12) q = zr(11, 19);
  a = b * q;
  if (minus && b < 12) { const q2 = q + (10 - q % 10), aus = q2 - q;
    return aufg({ lbl: "Rechne geschickt im Kopf.", frage: a + " : " + b, teile: [tZahl(null, q)],
      weg: [a + " : " + b + " = " + (b * q2) + " : " + b + " − " + (b * aus) + " : " + b + " = " + q2 + " − " + aus + " = " + q], tipp: "Schreib " + a + " als " + (b * q2) + " − " + (b * aus) + " und teile beide Zahlen durch " + b + ".", sek: 30,
      schritte: () => schritte("Zerlege den Dividenden in eine Differenz:", [tZahl((b * q2) + " : " + b + " = ■", q2), tZahl((b * aus) + " : " + b + " = ■", aus), tZahl(q2 + " − " + aus + " = ■", q)]) }); }
  const zt = Math.floor(q / 10) * 10, re = q - zt;
  return aufg({ lbl: "Rechne im Kopf.", frage: a + " : " + b, teile: [tZahl(null, q, "", { diagnose: x => gl(x, a * b) ? "Achtung: Hier wird geteilt (durch), nicht malgenommen." : null })],
    weg: [a + " : " + b + " = " + (b * zt) + " : " + b + " + " + (b * re) + " : " + b + " = " + zt + " + " + re + " = " + q], tipp: "Zerlege " + a + " in " + (b * zt) + " + " + (b * re) + " – beide Zahlen lassen sich gut durch " + b + " teilen.", sek: 25,
    schritte: () => schritte("Zerlege den Dividenden in zwei Summanden:", [tZahl((b * zt) + " : " + b + " = ■", zt), tZahl((b * re) + " : " + b + " = ■", re), tZahl(zt + " + " + re + " = ■", q)]) });
}
function begriffeMD() {
  if (Math.random() < 0.3) { // „Schreibe als Produkt: 7 + 7 + 7 + 7 + 7“
    const k = zr(3, 19), n = zr(3, 6), t = Array(n).fill(k).join(" + ");
    return aufg({ lbl: "Schreibe als Produkt und berechne.", frage: t, teile: [tWahl("Welches Produkt passt?", n + " · " + k, [k + " · " + k, n + " + " + k, k + " · " + (n + 1)]), tZahl(n + " · " + k + " = ■", n * k)],
      weg: [t + " = " + n + " · " + k + " = " + (n * k)], tipp: "Zähle, wie oft die " + k + " addiert wird.", sek: 20 });
  }
  const mal = Math.random() < 0.5;
  let a, b, c;
  do { a = zr(3, 12); b = zr(2, 12); c = a * b; } while (a === b || c === a || c === b);
  const glg = mal ? a + " · " + b + " = " + c : c + " : " + b + " = " + a;
  const W = mal ? [["die " + a, "Faktor", ["Faktor", "Produkt", "Dividend", "Divisor"]], ["den Ausdruck " + a + " · " + b, "Produkt", ["Faktor", "Produkt", "Dividend", "Divisor"]], ["die " + c, "Wert des Produkts", ["Faktor", "Wert des Produkts", "Dividend", "Divisor"]]]
    : [["die " + c, "Dividend", ["Dividend", "Divisor", "Faktor", "Quotient"]], ["die " + b, "Divisor", ["Dividend", "Divisor", "Faktor", "Quotient"]], ["den Ausdruck " + c + " : " + b, "Quotient", ["Dividend", "Divisor", "Faktor", "Quotient"]], ["die " + a, "Wert des Quotienten", ["Dividend", "Divisor", "Faktor", "Wert des Quotienten"]]];
  const [teil, r, opts] = wahl(W);
  return aufg({ lbl: "Fachbegriffe", frage: "Wie nennt man " + teil + " in " + glg + "?", teile: [tFest(null, opts, opts.indexOf(r))],
    weg: [mal ? "Faktor · Faktor: " + a + " · " + b + " ist ein Produkt, " + c + " ist der Wert des Produkts." : "Dividend : Divisor: " + c + " : " + b + " ist ein Quotient, " + a + " ist der Wert des Quotienten."],
    tipp: "Faktor · Faktor → Produkt · Dividend : Divisor → Quotient", sek: 12 });
}
function textMD() {
  const a = zr(3, 15), b = zr(3, 12), p = a * b;
  const [text, w, term, falsch, T5] = wahl([
    ["Berechne das Produkt von " + a + " und " + b + ".", p, a + " · " + b, [a + " + " + b, a + " : " + b]],
    ["Berechne den Quotienten von " + p + " und " + b + ".", a, p + " : " + b, [p + " · " + b, p + " − " + b]],
    ["Ein Faktor ist " + a + ", der Wert des Produkts ist " + p + ". Wie heißt der andere Faktor?", b, p + " : " + a, [p + " · " + a, p + " − " + a]],
    ["Der Dividend ist " + p + ", der Wert des Quotienten ist " + a + ". Wie heißt der Divisor?", b, p + " : " + a, [p + " · " + a, a + " : " + p]],
    ["Der Divisor ist " + b + ", der Wert des Quotienten ist " + a + ". Wie heißt der Dividend?", p, a + " · " + b, [a + " : " + b, a + " + " + b]],
    ["Mit welcher Zahl musst Du " + a + " multiplizieren, um " + p + " zu erhalten?", b, p + " : " + a, [p + " · " + a], "Zahlenrätsel"],
    ["Mit welcher Zahl ist " + a + " zu multiplizieren, um " + p + " zu erhalten?", b, p + " : " + a, [p + " · " + a], "Zahlenrätsel"],
    ["Mit welcher Zahl ist " + a + " zu vervielfachen, um " + p + " zu erhalten?", b, p + " : " + a, [p + " · " + a], "Zahlenrätsel"],
    ["Durch welche Zahl musst Du " + p + " teilen, um " + a + " zu erhalten?", b, p + " : " + a, [p + " · " + a], "Zahlenrätsel"],
    ["Durch welche Zahl ist " + p + " zu dividieren, um " + a + " zu erhalten?", b, p + " : " + a, [a + " : " + p], "Zahlenrätsel"],
    ["Verdopple " + p + ".", 2 * p, "2 · " + p, [p + " : 2"], "Zahlenrätsel"], ["Verdreifache " + p + ".", 3 * p, "3 · " + p, [p + " + 3"], "Zahlenrätsel"],
    ["Vervierfache " + a + ".", 4 * a, "4 · " + a, [a + " + 4"], "Zahlenrätsel"], ["Halbiere " + (2 * p) + ".", p, (2 * p) + " : 2", [(2 * p) + " · 2"], "Zahlenrätsel"],
    ["Multipliziere " + a + " mit " + b + ".", p, a + " · " + b, [a + " + " + b], "Zahlenrätsel"], ["Dividiere " + p + " durch " + b + ".", a, p + " : " + b, [p + " − " + b], "Zahlenrätsel"]]);
  return aufg({ lbl: T5 || "Fachbegriffe in Textaufgaben", frage: text, teile: [tZahl(null, w)], weg: [term + " = " + w], tipp: "Produkt heißt mal (·), Quotient heißt durch (:).", sek: 30,
    schritte: () => schritte("Erst die passende Rechnung finden:", [tWahl("Welche Rechnung passt?", term, ablenker(term, falsch.concat(opVarianten(term), zahlVarianten(text)))), tZahl(term + " = ■", w)]) });
}
function maldurch(st) {
  if (st === 1) return Math.random() < 0.6 ? malKopf(false) : durchKopf(false);
  if (st === 2) return Math.random() < 0.55 ? malKopf(true) : durchKopf(true);
  const r = Math.random(); return r < 0.25 ? begriffeMD() : r < 0.6 ? textMD() : r < 0.85 ? sachMalDurch() : aufeinander();
}

/* ---------- 7. Umkehrrechnungen bei Mal und Durch ---------- */
function probeMachenMD() { // „Prüfe mit einer Probe: 105 : 7 = 14“
  const b = zr(3, 13), c = zr(4, 25), a = b * c, falsch = Math.random() < 0.5;
  let g = c; if (falsch) do { g = c + wahl([1, -1, 2, -2, 10]); } while (g <= 1 || g === c);
  const probeFalle = x => g * b !== a && x === a ? "Bei der Probe rechnest Du aus, was wirklich herauskommt: " + g + " · " + b + " = " + (g * b) + ". Erst danach vergleichst Du mit " + a + "." : null;
  const teile = [tZahl("Rechne die Probe aus: " + g + " · " + b + " = ■", g * b, "", { erklaerung: "Die Probe zur Divisionsaufgabe ist eine Malaufgabe.", diagnose: probeFalle }),
    tFest("Kommt wieder " + a + " heraus? Stimmt also " + a + " : " + b + " = " + g + "?", ["Ja, stimmt", "Nein, stimmt nicht"], falsch ? 1 : 0)];
  if (falsch) teile.push(tZahl("Berichtige: " + a + " : " + b + " = ■", c, "", { erklaerung: "Probe: " + c + " · " + b + " = " + a + " ✓" }));
  return aufg({ lbl: "Probe machen", frage: "Prüfe mit einer Probe: " + a + " : " + b + " = " + g, teile,
    weg: ["Probe: " + g + " · " + b + " = " + (g * b), falsch ? (g * b) + " ist nicht " + a + " – das Ergebnis ist falsch. Richtig: " + a + " : " + b + " = " + c + "." : (g * b) + " = " + a + " – das Ergebnis stimmt."],
    tipp: "Probe zu einer Divisionsaufgabe: Ergebnis · Divisor = Dividend.", bild: pfeil(c, "·", b, a), sek: 35 });
}
function probeMD(st) { return st === 1 ? probeMachenMD() : st === 2 ? (Math.random() < 0.3 ? zeichenEins() : luecke(false, true)) : st === 3 ? luecke(true, true) : rechnenUndProbe(true); }

/* ---------- 8. Rechnen mit der Null ---------- */
function nullRechnen(st) {
  const a = zr(2, 99), b = zr(2, 30);
  let t, w;
  if (st === 1) [t, w] = wahl([[a + " · 0", 0], ["0 · " + a, 0], ["0 : " + a, 0], [a + " · 0 · " + b, 0], [a + " · " + b + " · 0", 0], [a + " · 1", a], [a + " : 1", a], ["1 · " + a, a]]);
  else if (st === 2) [t, w] = wahl([[a + " : 0", null], [a + " : 0", null], ["0 : " + a, 0], [a + " · 0", 0], ["0 · " + a, 0]]);
  else { const q = zr(2, 12), d = zr(2, 9), c = zr(2, 20); [t, w] = wahl([[(q * d) + " : " + d, q], [a + " : 0", null], ["0 : " + a, 0], [a + " : (" + c + " − " + c + ")", null], ["(" + c + " − " + c + ") : " + a, 0], [(q * d) + " : " + q, d], ["(" + c + " − " + c + ") · " + a, 0]]); }
  const durchNull = w === null;
  const diag = x => {
    if (durchNull) return "Durch 0 kann man nicht teilen: Es gibt keine Zahl, die mal 0 wieder " + a + " ergibt (0 · ■ ist immer 0). Merke: „Mal null“ ergibt null, „durch null“ geht nicht.";
    if (x === "nicht") return w === 0 ? "Das geht: 0 durch eine andere Zahl ergibt 0. Nur durch 0 teilen geht nicht." : "Das geht – hier wird nicht durch 0 geteilt.";
    if (w === 0) return "Ist ein Faktor 0, ist das Ergebnis immer 0 – und 0 durch eine Zahl ist auch 0.";
    return null;
  };
  return aufg({ lbl: st === 1 ? "Rechne." : "Berechne, wenn es geht.", frage: t, teile: [tNull(null, w, { diagnose: diag })],
    weg: [durchNull ? t + ": Durch 0 kann man nicht teilen – das geht nicht." : t + " = " + w], tipp: "„Mal null“ ergibt null, „durch null“ geht nicht.", sek: 12,
    schritte: durchNull ? () => schritte("Denk an die Umkehraufgabe:", [tFest(a + " : 0 = ■ würde heißen: 0 · ■ = " + a + ". Gibt es so eine Zahl?", ["Ja", "Nein"], 1, { erklaerung: "0 mal irgendeine Zahl ist immer 0 – nie " + a + "." }),
      tFest("Also: " + a + " : 0 …", ["… ist 0", "… ist " + a, "… geht nicht"], 2)]) : null });
}

/* ---------- 9. Vorrangregeln (KLAPS), Terme in Worten ---------- */
// Ausdrucksbaum: Zahl oder { op, l, r, k } mit k = "(" oder "[" für geschriebene Klammern
function N(op, l, r, k) { return { op, l, r, k: k || "" }; }
function wertVon(t) { if (typeof t === "number") return t; const a = wertVon(t.l), b = wertVon(t.r); return t.op === "+" ? a + b : t.op === "−" ? a - b : t.op === "·" ? a * b : a / b; }
function txt(t) { if (typeof t === "number") return fz(t); const s = txt(t.l) + " " + t.op + " " + txt(t.r); return t.k === "(" ? "(" + s + ")" : t.k === "[" ? "[" + s + "]" : s; }
function gueltig(t) { // alle Zwischenergebnisse ganz, nicht negativ, nicht zu groß; nie durch 0
  if (typeof t === "number") return true;
  if (!gueltig(t.l) || !gueltig(t.r)) return false;
  const b = wertVon(t.r), w = wertVon(t);
  if (t.op === ":" && (b === 0 || !Number.isInteger(w))) return false;
  return Number.isInteger(w) && w >= 0 && w <= 1500;
}
function tokens(t, out) {
  if (typeof t === "number") { out.push({ typ: "z", v: t }); return out; }
  if (t.k) out.push({ typ: "k", v: t.k === "(" ? "(" : "[" });
  tokens(t.l, out); out.push({ typ: "op", v: t.op, knoten: t }); tokens(t.r, out);
  if (t.k) out.push({ typ: "k", v: t.k === "(" ? ")" : "]" });
  return out;
}
const rechenbar = t => typeof t !== "number" && typeof t.l === "number" && typeof t.r === "number";
const punkt = op => op === "·" || op === ":";
function ersterSchritt(t) { // KLAPS: erst rechenbare Klammern (innen), dann Punkt, sonst von links
  const ops = tokens(t, []).filter(x => x.typ === "op" && rechenbar(x.knoten)).map(x => x.knoten);
  return ops.find(k => k.k) || ops.find(k => punkt(k.op)) || ops[0];
}
function paare(t) { // sichtbare „Zahl Rechenzeichen Zahl“-Paare (auch über eine Klammer hinweg = typischer Fehler)
  const tk = tokens(t, []), out = [];
  tk.forEach((x, i) => {
    if (x.typ !== "op") return;
    const l = tk[i - 1] && tk[i - 1].typ === "z" ? tk[i - 1] : (tk[i - 1] && /[)\]]/.test(tk[i - 1].v) && tk[i - 2] && tk[i - 2].typ === "z" ? tk[i - 2] : null);
    const r = tk[i + 1] && tk[i + 1].typ === "z" ? tk[i + 1] : (tk[i + 1] && /[([]/.test(tk[i + 1].v) && tk[i + 2] && tk[i + 2].typ === "z" ? tk[i + 2] : null);
    if (l && r) out.push({ text: fz(l.v) + " " + x.v + " " + fz(r.v), knoten: x.knoten, ok: rechenbar(x.knoten) && tk[i - 1].typ === "z" && tk[i + 1].typ === "z" });
  });
  return out;
}
function ersetze(t, k, w) { if (t === k) return w; if (typeof t === "number") return t; return { op: t.op, l: ersetze(t.l, k, w), r: ersetze(t.r, k, w), k: t.k }; }
function hatStrich(t) { return typeof t !== "number" && (t.op === "+" || t.op === "−" || hatStrich(t.l) || hatStrich(t.r)); }
function grund(t, k) { if (k.k) return "Klammer zuerst!"; if (punkt(k.op) && hatStrich(t)) return "Punkt vor Strich!"; return "Von links nach rechts!"; }
function klapsTeile(baum) {
  const teile = []; let t = baum;
  for (let n = 0; typeof t !== "number" && n < 12; n++) {
    const k = ersterSchritt(t), w = wertVon(k), text = fz(k.l) + " " + k.op + " " + fz(k.r), regel = grund(t, k);
    const falsche = paare(t).filter(p => !p.ok).map(p => p.text).filter(x => x !== text);
    if (falsche.length) teile.push(tWahl("Was rechnest Du zuerst? " + txt(t), text, falsche.slice(0, 2), { erklaerung: regel }));
    teile.push(tZahl(text + " = ■", w, "", { erklaerung: falsche.length ? null : regel }));
    t = ersetze(t, k, w);
  }
  return teile;
}
function ohneRegeln(baum, mitKlammer) { // Wert, wenn man die Regeln falsch anwendet (für gezielte Rückmeldung)
  const tk = tokens(baum, []).filter(x => x.typ !== "k");
  if (mitKlammer === "links") { let w = tk[0].v; for (let i = 1; i < tk.length; i += 2) { const b = tk[i + 1].v, o = tk[i].v; w = o === "+" ? w + b : o === "−" ? w - b : o === "·" ? w * b : w / b; } return w; }
  const z = [tk[0].v], o = []; // Punkt vor Strich, aber Klammern übersehen
  for (let i = 1; i < tk.length; i += 2) { const op = tk[i].v, b = tk[i + 1].v; if (punkt(op)) z[z.length - 1] = op === "·" ? z[z.length - 1] * b : z[z.length - 1] / b; else { o.push(op); z.push(b); } }
  return z.reduce((w, b, i) => i === 0 ? b : (o[i - 1] === "+" ? w + b : w - b), 0);
}
function klapsBaum(st) {
  const T = {
    1: [() => N("+", zr(2, 60), N("·", zr(2, 12), zr(2, 12))), () => { const b = zr(2, 9), c = zr(2, 9); return N("−", b * c + zr(1, 60), N("·", b, c)); },
      () => N("+", N("·", zr(2, 12), zr(2, 12)), zr(1, 50)), () => N("−", N("·", zr(5, 12), zr(5, 12)), N("·", zr(2, 5), zr(2, 5))),
      () => { const c = zr(2, 9); return N("+", zr(5, 80), N(":", c * zr(2, 12), c)); }, () => N("+", N("·", zr(2, 15), zr(2, 9)), N("·", zr(2, 15), zr(2, 9)))],
    2: [() => N("·", N("+", zr(2, 15), zr(2, 15), "("), zr(2, 9)), () => N("−", zr(40, 99), N("+", zr(2, 20), zr(2, 20), "(")),
      () => N("·", zr(2, 9), N("−", zr(15, 40), zr(2, 14), "(")), () => { const c = zr(2, 9), q = zr(2, 12), b = zr(2, 30); return N(":", N("−", c * q + b, b, "("), c); },
      () => N("−", zr(30, 99), N("−", zr(15, 30), zr(2, 14), "(")), () => { const c = zr(2, 9), s = c * zr(2, 12), a = zr(1, s - 1); return N(":", N("+", a, s - a, "("), c); }],
    3: [() => N("−", N("−", zr(40, 99), zr(5, 25)), zr(2, 15)), () => { const b = zr(2, 9); return N("·", N(":", b * zr(2, 12), b), zr(2, 9)); },
      () => N("+", N("−", zr(30, 99), zr(5, 29)), zr(2, 40)), () => N("−", N("+", zr(5, 60), N("·", zr(2, 9), zr(2, 9))), zr(2, 30)),
      () => N("+", N("−", zr(70, 140), N("·", zr(2, 9), zr(2, 9))), zr(2, 40)), () => { const d = zr(2, 9); return N("+", N("−", zr(40, 99), zr(5, 30)), N(":", d * zr(2, 12), d)); },
      () => { const c = zr(2, 9); return N(":", N("·", c * zr(1, 6), zr(2, 9)), c); }],
    4: [() => N("·", zr(2, 9), N("+", zr(2, 20), N("−", zr(10, 30), zr(1, 9), "("), "[")), () => N("·", N("−", zr(30, 60), N("+", zr(2, 12), zr(2, 12), "("), "["), zr(2, 6)),
      () => N("·", zr(2, 9), N("−", zr(25, 40), N("+", zr(2, 10), zr(2, 10), "("), "[")), () => { const q = zr(2, 6), c = zr(2, 9), d = zr(2, 9); return N(":", q * zr(2, 12), N("−", c + d + q, N("+", c, d, "("), "[")); },
      () => N("−", zr(80, 200), N("·", N("+", zr(2, 8), zr(2, 8), "("), zr(2, 6), "["))]
  };
  for (;;) { const b = wahl(T[st])(); if (gueltig(b)) return b; }
}
function klapsAufgabe(st) {
  const baum = klapsBaum(st), w = wertVon(baum), links = ohneRegeln(baum, "links"), ohneK = ohneRegeln(baum, "punkt"), tl = klapsTeile(baum);
  return aufg({ lbl: "Beachte die Vorrangregeln (KLAPS).", frage: txt(baum),
    teile: [tZahl(null, w, "", { diagnose: x => gl(x, links) && !gl(links, w) ? "Du hast einfach von links nach rechts gerechnet. Denk an KLAPS: erst Klammern, dann Punkt (· und :), dann Strich (+ und −)."
      : gl(x, ohneK) && !gl(ohneK, w) ? "Achtung, die Klammer! Was in Klammern steht, rechnest Du zuerst." : null })],
    weg: tl.filter(t => t.eingabe.typ === "zahl").map(t => t.loesungText).concat(["Ergebnis: " + fz(w)]),
    tipp: "KLAPS: Klammer vor Punkt (· :) vor Strich (+ −). Sonst von links nach rechts.", sek: st >= 3 ? 40 : 32,
    schritte: () => schritte("Schritt für Schritt nach KLAPS:", klapsTeile(baum)) });
}
function termWorte() { // Terme in Textform ↔ Rechenausdruck
  const V = [
    () => { const c = zr(2, 9), a = c * zr(1, 4), b = zr(2, 12); return { text: "Multipliziere die Zahlen " + a + " und " + b + " und dividiere das Produkt durch " + c + ".", baum: N(":", N("·", a, b, "("), c), falsch: [a + " · " + b + " · " + c, a + " + " + b + " : " + c, c + " : (" + a + " · " + b + ")"] }; },
    () => { const c = zr(2, 9), s = c * zr(2, 12), a = zr(1, s - 1); return { text: "Dividiere die Summe aus " + a + " und " + (s - a) + " durch " + c + ".", baum: N(":", N("+", a, s - a, "("), c), falsch: [a + " + " + (s - a) + " : " + c, c + " : (" + a + " + " + (s - a) + ")", "(" + a + " − " + (s - a) + ") : " + c] }; },
    () => { const b = zr(2, 9), q = zr(2, 12), c = q + zr(2, 40); return { text: "Subtrahiere den Quotienten aus " + (b * q) + " und " + b + " von " + c + ".", baum: N("−", c, N(":", b * q, b)), falsch: [(b * q) + " : " + b + " − " + c, "(" + c + " − " + (b * q) + ") : " + b, c + " − " + (b * q) + " · " + b] }; },
    () => { const a = zr(2, 15), b = zr(2, 15), c = zr(2, 9); return { text: "Multipliziere die Summe aus " + a + " und " + b + " mit " + c + ".", baum: N("·", N("+", a, b, "("), c), falsch: [a + " + " + b + " · " + c, a + " · (" + b + " + " + c + ")", a + " + " + b + " + " + c] }; },
    () => { const a = zr(2, 20), b = zr(2, 20), c = a + b + zr(2, 50); return { text: "Subtrahiere die Summe aus " + a + " und " + b + " von " + c + ".", baum: N("−", c, N("+", a, b, "(")), falsch: [c + " − " + a + " + " + b, "(" + a + " + " + b + ") − " + c, c + " + " + a + " − " + b] }; },
    () => { const a = zr(2, 9), b = zr(2, 9), d = zr(2, 20), c = d + zr(2, 40); return { text: "Addiere das Produkt von " + a + " und " + b + " zur Differenz aus " + c + " und " + d + ".", baum: N("+", N("−", c, d, "("), N("·", a, b)), falsch: ["(" + c + " − " + d + " + " + a + ") · " + b, c + " − (" + d + " + " + a + " · " + b + ")", c + " · " + d + " + " + a + " − " + b] }; },
    () => { const b = zr(2, 9), a = b + zr(1, 9); return { text: "Multipliziere die Differenz der Zahlen " + a + " und " + b + " mit ihrer Summe.", baum: N("·", N("−", a, b, "("), N("+", a, b, "(")), falsch: [a + " − " + b + " · " + a + " + " + b, "(" + a + " − " + b + ") + (" + a + " + " + b + ")", "(" + a + " + " + b + ") · " + b] }; },
    () => { const c = zr(2, 30), b = c + zr(2, 40), a = zr(2, 30); return { text: "Addiere " + a + " zur Differenz aus " + b + " und " + c + ".", baum: N("+", N("−", b, c, "("), a), falsch: [b + " − (" + c + " + " + a + ")", a + " + " + c + " − " + b, b + " + " + c + " + " + a] }; }];
  for (;;) {
    const v = wahl(V)(); if (!gueltig(v.baum)) continue;
    const term = txt(v.baum), w = wertVon(v.baum), falsch = ablenker(term, v.falsch.concat(mische(opVarianten(term))), 3);
    return aufg({ lbl: "Terme in Worten", frage: v.text, teile: [tWahl("Welcher Rechenausdruck passt?", term, falsch), tZahl("Berechne: " + term + " = ■", w)],
      weg: [term + " = " + fz(w)], tipp: "Summe → +, Differenz → −, Produkt → ·, Quotient → :. Was zuerst gebildet wird, kommt in Klammern.", sek: 50,
      schritte: () => schritte("Erst den Ausdruck aufschreiben, dann nach KLAPS rechnen:", [tWahl("Welcher Rechenausdruck passt zu: " + v.text, term, falsch, { erklaerung: "Summe → +, Differenz → −, Produkt → ·, Quotient → :" })].concat(klapsTeile(v.baum))) });
  }
}
function klaps(st) {
  if (st === 3 && Math.random() < 0.25) return zeichenDrei();
  if (st === 5 && Math.random() < 0.3) return sachGeld();
  return st <= 4 ? klapsAufgabe(st) : termWorte();
}

/* ---------- 10. Rechengesetze (Kommutativ- und Assoziativgesetz) ---------- */
function partner(a) { const z = Math.ceil((a + zr(5, 40)) / 10) * 10; return z - a; } // b mit a + b = Zehnerzahl
function geschicktPlus() {
  let a, b, c, d, e, zahlen, paareL;
  const vier = Math.random() < 0.45, zehn = x => x % 10 === 0;
  // alle Zahlen verschieden; die falschen Paare (a+c, c+b, c+d) dürfen keine Zehnerzahl ergeben
  do { a = zr(11, 79); b = partner(a); c = zr(11, 89); d = zr(11, 79); e = partner(d); }
  while (zehn(a) || zehn(c) || a === b || c === a || c === b || zehn(a + c) || zehn(b + c) ||
    (vier && (zehn(d) || new Set([a, b, c, d, e]).size < 5 || zehn(c + d))));
  if (vier) { zahlen = [a, c, d, b, e]; paareL = [[a, b], [d, e]]; }
  else { zahlen = [a, c, b]; paareL = [[a, b]]; }
  const sum = zahlen.reduce((x, y) => x + y, 0), t = zahlen.join(" + ");
  const p1 = paareL[0], rest = vier ? [paareL[1]] : [];
  const weg = vier ? ["= (" + a + " + " + b + ") + (" + d + " + " + e + ") + " + c, "= " + (a + b) + " + " + (d + e) + " + " + c + " = " + sum] : ["= (" + a + " + " + b + ") + " + c, "= " + (a + b) + " + " + c + " = " + sum];
  const falschePaare = [a + " und " + c, c + " und " + b].concat(vier ? [c + " und " + d] : []);
  const teile = [tWahl("Welche zwei Zahlen ergeben zusammen eine Zehnerzahl?", p1[0] + " und " + p1[1], falschePaare, { erklaerung: p1[0] + " + " + p1[1] + " = " + (p1[0] + p1[1]) }), tZahl(p1[0] + " + " + p1[1] + " = ■", p1[0] + p1[1])];
  rest.forEach(p => teile.push(tZahl(p[0] + " + " + p[1] + " = ■", p[0] + p[1])));
  teile.push(tZahl((vier ? (a + b) + " + " + (d + e) + " + " + c : (a + b) + " + " + c) + " = ■", sum));
  return aufg({ lbl: "Rechne geschickt.", frage: t, teile: [tZahl(null, sum)], weg, tipp: "Vertausche die Summanden so, dass zwei zusammen eine Zehnerzahl ergeben.", sek: 30,
    schritte: () => schritte("Erst passende Partner suchen (Vertauschungsgesetz), dann zusammenfassen:", teile.map(x => Object.assign({}, x))) });
}
const MALPAARE = [[2, 5], [5, 2], [4, 25], [25, 4], [2, 50], [50, 2], [8, 125], [125, 8], [5, 20], [20, 5], [4, 250]];
function geschicktMal() {
  const [p, q] = wahl(MALPAARE), vier = Math.random() < 0.3, y = zr(2, 9);
  let x; do { x = zr(3, 19); } while (x === p || x === q || [10, 100, 1000].includes(x * p) || [10, 100, 1000].includes(x * q)); // x darf kein zweiter Partner sein
  const zahlen = vier ? [p, x, q, y] : [p, x, q], prod = zahlen.reduce((a, b) => a * b, 1), t = zahlen.join(" · ");
  const pq = p * q, xy = vier ? x * y : x;
  const teile = [tWahl("Welche zwei Zahlen ergeben zusammen 10, 100 oder 1000?", p + " und " + q, [p + " und " + x, x + " und " + q], { erklaerung: p + " · " + q + " = " + fz(pq) }),
    tZahl(p + " · " + q + " = ■", pq)];
  if (vier) teile.push(tZahl(x + " · " + y + " = ■", xy));
  teile.push(tZahl(fz(pq) + " · " + xy + " = ■", prod));
  return aufg({ lbl: "Rechne geschickt.", frage: t, teile: [tZahl(null, prod)],
    weg: ["= (" + p + " · " + q + ") · " + (vier ? "(" + x + " · " + y + ")" : x), "= " + fz(pq) + " · " + xy + " = " + fz(prod)], tipp: "Vertausche die Faktoren: Such zwei, die zusammen 10, 100 oder 1000 ergeben.", sek: 30,
    schritte: () => schritte("Erst passende Partner suchen, dann zusammenfassen:", teile.map(x => Object.assign({}, x))) });
}
function stufenzahl() {
  if (Math.random() < 0.6) { // 6 · 400 = 6 · 4 · 100
    const d1 = Math.random() < 0.2 ? zr(11, 19) : zr(2, 9), d2 = zr(2, 9), m1 = zr(0, 3), m2 = zr(m1 === 0 ? 1 : 0, 3 - (m1 === 3 ? 1 : 0)), s = Math.pow(10, m1 + m2);
    const x = d1 * Math.pow(10, m1), y = d2 * Math.pow(10, m2), w = d1 * d2 * s;
    return aufg({ lbl: "Rechne geschickt mit Stufenzahlen.", frage: fz(x) + " · " + fz(y), teile: [tZahl(null, w)],
      weg: [fz(x) + " · " + fz(y) + " = (" + d1 + " · " + d2 + ") · " + fz(s), "= " + (d1 * d2) + " · " + fz(s) + " = " + fz(w)], tipp: "Rechne erst " + d1 + " · " + d2 + " und häng dann die " + (m1 + m2) + " Nullen an.", sek: 22,
      schritte: () => schritte("Erst ohne die Nullen rechnen, dann die Stufenzahl:", [tZahl(d1 + " · " + d2 + " = ■", d1 * d2), tZahl((d1 * d2) + " · " + fz(s) + " = ■", w, "", { erklaerung: "Mal " + fz(s) + ": " + (m1 + m2) + " Nullen anhängen." })]) });
  }
  const [p, q] = wahl([[25, 4], [50, 2], [125, 8], [25, 40], [5, 20]]), k = zr(2, 9), A = k * p, w = A * q;
  return aufg({ lbl: "Zerlege einen Faktor geschickt.", frage: A + " · " + q, teile: [tZahl(null, w)],
    weg: [A + " · " + q + " = (" + k + " · " + p + ") · " + q, "= " + k + " · (" + p + " · " + q + ") = " + k + " · " + fz(p * q) + " = " + fz(w)], tipp: A + " = " + k + " · " + p + ", und " + p + " · " + q + " = " + fz(p * q) + ".", sek: 28,
    schritte: () => schritte("Zerlege " + A + " = " + k + " · " + p + ":", [tZahl(p + " · " + q + " = ■", p * q), tZahl(k + " · " + fz(p * q) + " = ■", w)]) });
}
function gesetzErkennen() {
  const a = zr(3, 40), b = zr(3, 40), c = zr(2, 20), K = "Vertauschungsgesetz (Kommutativgesetz)", A = "Verbindungsgesetz (Assoziativgesetz)";
  const art = zr(0, 6);
  if (art <= 3) {
    const [t, r] = [[a + " + " + b + " = " + b + " + " + a, 0], [a + " · " + b + " · " + c + " = " + a + " · " + c + " · " + b, 0], ["(" + a + " + " + b + ") + " + c + " = " + a + " + (" + b + " + " + c + ")", 1], ["(" + a + " · " + b + ") · " + c + " = " + a + " · (" + b + " · " + c + ")", 1]][art];
    return aufg({ lbl: "Welches Rechengesetz wurde benutzt?", frage: t, teile: [tFest(null, [K, A], r)],
      weg: [r === 0 ? "Hier wurden Zahlen vertauscht → " + K + "." : "Hier wurden die Klammern anders gesetzt → " + A + "."], tipp: "Vertauscht? → Vertauschungsgesetz. Klammern verschoben? → Verbindungsgesetz.", sek: 15 });
  }
  if (art === 4) { const x = Math.max(a, b + c), y = Math.max(b, c), z = Math.min(b, c); const l = (x - y) - z, rr = x - (y - z);
    return aufg({ lbl: "Gilt das Rechengesetz auch hier?", frage: "Stimmt (" + x + " − " + y + ") − " + z + " = " + x + " − (" + y + " − " + z + ")?", teile: [tFest(null, ["Ja", "Nein"], l === rr ? 0 : 1)],
      weg: ["(" + x + " − " + y + ") − " + z + " = " + l + ", aber " + x + " − (" + y + " − " + z + ") = " + rr + ".", "Bei Minus darf man die Klammern nicht einfach verschieben."], tipp: "Rechne beide Seiten aus.", sek: 30 }); }
  if (art === 5) { const z = zr(2, 4), n = z * zr(2, 3), x = n * z * zr(1, 3), l = (x / n) / z, rr = x / (n / z);
    return aufg({ lbl: "Gilt das Rechengesetz auch hier?", frage: "Stimmt (" + x + " : " + n + ") : " + z + " = " + x + " : (" + n + " : " + z + ")?", teile: [tFest(null, ["Ja", "Nein"], l === rr ? 0 : 1)],
      weg: ["(" + x + " : " + n + ") : " + z + " = " + fz(l) + ", aber " + x + " : (" + n + " : " + z + ") = " + fz(rr) + ".", "Bei Durch darf man die Klammern nicht einfach verschieben."], tipp: "Rechne beide Seiten aus.", sek: 30 }); }
  return aufg({ lbl: "Rechengesetze", frage: "Für welche Rechenarten gelten das Vertauschungs- und das Verbindungsgesetz?", teile: [tWahl(null, "Nur für Plus und Mal", ["Für alle vier Rechenarten", "Nur für Minus und Durch", "Nur für Plus"])],
    weg: ["Die beiden Gesetze gelten nur für die Addition und die Multiplikation – nicht für Subtraktion und Division."], tipp: "Probier es aus: 7 − 3 ist nicht 3 − 7.", sek: 12 });
}
function gesetze(st) { return st === 1 ? geschicktPlus() : st === 2 ? geschicktMal() : st === 3 ? stufenzahl() : gesetzErkennen(); }

/* ---------- Neu aus dem Arbeitsheft (S. 8–11 und 18–21, Fotos in Mathe/Neue Fotos): Größen ordnen, gleich große finden,
   mit Größen rechnen, halbe Größen, Größen schätzen, Sachaufgaben, Zahlenrätsel und fehlende Rechenzeichen ---------- */
function alsText(key, w, i) { // Wert w (in kleinster Einheit) in Einheit i – höchstens 3 Nachkommastellen, sonst null
  const F = FAM[key], f = fak(F, i, F.e.length - 1), v = r6(w / f);
  if (Math.abs(Math.round(v * 1000) - v * 1000) > 1e-6 || v < 0.01 || v >= 100000) return null;
  if (key === "M" && i === 0) return Math.abs(Math.round(v * 100) - v * 100) > 1e-6 ? null : geldT(Math.round(w));
  return fz(v) + " " + F.e[i];
}
function alsZwei(key, w, i) { // „54 t 540 kg“
  const F = FAM[key]; if (i >= F.e.length - 1) return null;
  const fi = fak(F, i, F.e.length - 1), fj = fak(F, i + 1, F.e.length - 1), g = Math.floor(w / fi), rest = (w - g * fi) / fj;
  if (!g || !rest || !Number.isInteger(rest)) return null;
  return fz(g) + " " + F.e[i] + " " + fz(rest) + " " + F.e[i + 1];
}
function irgendwie(key, w, mitZwei) { // zufällige, gut lesbare Schreibweise eines Werts
  const F = FAM[key], moeglich = [];
  for (let i = 0; i < F.e.length; i++) { const t = alsText(key, w, i); if (t) moeglich.push(t); }
  if (mitZwei) for (let i = 0; i < F.e.length - 1; i++) { const t = alsZwei(key, w, i); if (t) moeglich.push(t, t); }
  return moeglich.length ? wahl(moeglich) : null;
}
function gemeinsameEinheit(key, werte) { // größte Einheit, in der alle Werte ganze Zahlen sind
  const F = FAM[key];
  for (let i = 0; i < F.e.length; i++) { const f = fak(F, i, F.e.length - 1); if (werte.every(w => Number.isInteger(r6(w / f)))) return i; }
  return F.e.length - 1;
}
function tReihe(frage, optionen, loesung, x) {
  return Object.assign({ frage, eingabe: { typ: "reihe", optionen }, loesung, loesungText: loesung.map(i => optionen[i]).join(" < ") }, x || {});
}
function ordnen(key) { // „Ordne der Größe nach. Beginne mit der kleinsten.“ (Arbeitsheft S. 9/6 und 11/6)
  key = key || wahl(["L", "L", "G"]);
  for (;;) {
    const k = key === "L" ? zr(2, 6) : zr(4, 9), B = zr(11, 99) * Math.pow(10, k - 2), klein = Math.pow(10, Math.max(0, k - 3));
    let werte = [...new Set([B, B * 10, B / 10, B + zr(1, 9) * klein, B - zr(1, 9) * klein, B + zr(1, 9) * klein * 10])].filter(w => w > 0 && Number.isInteger(w));
    werte = mische(werte).slice(0, zr(4, 5));
    const texte = werte.map(w => irgendwie(key, w, true));
    if (texte.some(t => !t) || new Set(texte).size !== texte.length) continue;
    const loes = werte.map((w, i) => i).sort((a, b) => werte[a] - werte[b]);
    const u = gemeinsameEinheit(key, werte), F = FAM[key], fu = fak(F, u, F.e.length - 1);
    return aufg({ lbl: "Ordne der Größe nach.", frage: "Beginne mit der kleinsten Angabe.", teile: [tReihe(null, texte, loes)],
      weg: [loes.map(i => texte[i]).join(" < "), "In " + F.e[u] + ": " + loes.map(i => fz(r6(werte[i] / fu)) + " " + F.e[u]).join(" < ")],
      tipp: "Rechne alle Angaben in dieselbe Einheit um, zum Beispiel in " + F.e[u] + ".", sek: 45,
      schritte: () => schritte("Erst alle in dieselbe Einheit umrechnen, dann ordnen:", texte.map((t, i) => tZahl(t + " = ■ " + F.e[u], r6(werte[i] / fu), F.e[u])).concat([tReihe("Jetzt ordnen – die kleinste zuerst:", texte, loes)])) });
  }
}
function gleichGross(key) { // „Welche Angabe ist genauso groß wie 0,62 kg?“ (Arbeitsheft S. 8/1 und 10/4)
  key = key || wahl(["L", "L", "G", "M"]);
  for (;;) {
    const k = key === "M" ? zr(3, 4) : key === "L" ? zr(2, 6) : zr(4, 9), B = zr(11, 99) * Math.pow(10, k - 2);
    const ziel = irgendwie(key, B, false), richtig = irgendwie(key, B, true);
    const fallen = [B * 10, B / 10, B * 100].filter(w => Number.isInteger(w)).map(w => irgendwie(key, w, false));
    if (!ziel || !richtig || ziel === richtig || fallen.some(t => !t) || new Set(fallen.concat([richtig, ziel])).size !== fallen.length + 2) continue;
    const F = FAM[key], u = gemeinsameEinheit(key, [B]);
    return aufg({ lbl: "Gleich groß?", frage: "Welche Angabe ist genauso groß wie " + ziel + "?", teile: [tWahl(null, richtig, fallen)],
      weg: [ziel + " = " + richtig, "Beide sind " + fz(r6(B / fak(F, u, F.e.length - 1))) + " " + F.e[u] + "."], tipp: "Rechne beide Angaben in dieselbe Einheit um. Achte auf das Komma und die Nullen.", sek: 25,
      schritte: () => schritte("Erst in dieselbe Einheit umrechnen:", [tZahl(ziel + " = ■ " + F.e[u], r6(B / fak(F, u, F.e.length - 1)), F.e[u]), tWahl("Welche Angabe ist genauso groß wie " + ziel + "?", richtig, fallen)]) });
  }
}
function mitGroessen() { // „120 kg + 800 g = ■ g“ (Arbeitsheft S. 11/5)
  const v = wahl([["L", 1, 3, zr(2, 30), zr(5, 95), "+"], ["L", 0, 1, zr(2, 40), zr(50, 950), "+"], ["L", 1, 3, zr(3, 20), zr(5, 95), "−"], ["L", 3, 4, zr(2, 60), zr(1, 9), "+"],
    ["G", 1, 2, zr(2, 150), zr(50, 950), "+"], ["G", 0, 1, zr(2, 90), zr(50, 950), "+"], ["G", 2, 3, zr(2, 90), zr(5, 950), "+"], ["G", 1, 2, zr(2, 9), zr(50, 950), "−"], ["M", 0, 1, zr(2, 40), zr(5, 95), "+"]]);
  let [key, i, j, a, b, op] = v; const F = FAM[key], f = fak(F, i, j), halb = key === "G" && i === 1 && op === "+" && Math.random() < 0.15;
  const aJ = halb ? (a + 0.5) * f : a * f, w = op === "+" ? aJ + b : aJ - b, aText = halb ? a + " ½ " + F.e[i] : gr(F, a, i);
  return aufg({ lbl: "Gib das Ergebnis in der kleineren Einheit an.", frage: aText + " " + op + " " + gr(F, b, j) + " = ■ " + F.e[j],
    teile: [tZahl(null, w, F.e[j], { diagnose: x => gl(x, op === "+" ? a + b : a - b) ? "Achtung: Du hast " + F.e[i] + " und " + F.e[j] + " einfach " + (op === "+" ? "zusammengezählt" : "abgezogen") + ". Erst umrechnen: " + aText + " = " + fz(aJ) + " " + F.e[j] + "." : null })],
    weg: [aText + " = " + fz(aJ) + " " + F.e[j], fz(aJ) + " " + F.e[j] + " " + op + " " + gr(F, b, j) + " = " + fz(w) + " " + F.e[j]],
    tipp: "Rechne erst alles in dieselbe Einheit um (1 " + F.e[i] + " = " + fz(f) + " " + F.e[j] + "), dann " + (op === "+" ? "addieren" : "subtrahieren") + ".", sek: 30,
    schritte: () => schritte("Erst in dieselbe Einheit umrechnen, dann rechnen:", [tZahl(aText + " = ■ " + F.e[j], aJ, F.e[j], { erklaerung: "1 " + F.e[i] + " = " + fz(f) + " " + F.e[j] }), tZahl(fz(aJ) + " " + F.e[j] + " " + op + " " + gr(F, b, j) + " = ■ " + F.e[j], w, F.e[j])]) });
}
const HALB = [["Ein halber Meter", 50, "cm", "1 m = 100 cm. Die Hälfte sind 50 cm."], ["Ein halber Kilometer", 500, "m", "1 km = 1000 m. Die Hälfte sind 500 m."],
  ["Ein halber Zentimeter", 5, "mm", "1 cm = 10 mm. Die Hälfte sind 5 mm."], ["Ein halbes Kilogramm", 500, "g", "1 kg = 1000 g. Die Hälfte sind 500 g."],
  ["Eine halbe Tonne", 500, "kg", "1 t = 1000 kg. Die Hälfte sind 500 kg."], ["1 ½ m", 150, "cm", "1 m = 100 cm, ½ m = 50 cm, zusammen 150 cm."],
  ["1 ½ kg", 1500, "g", "1 kg = 1000 g, ½ kg = 500 g, zusammen 1500 g."], ["2 ½ km", 2500, "m", "2 km = 2000 m, ½ km = 500 m, zusammen 2500 m."],
  ["1 ½ t", 1500, "kg", "1 t = 1000 kg, ½ t = 500 kg, zusammen 1500 kg."], ["3 ½ kg", 3500, "g", "3 kg = 3000 g, ½ kg = 500 g, zusammen 3500 g."]];
function halbeGroesse() {
  const [t, w, e, weg] = wahl(HALB);
  return aufg({ lbl: "Rechne in die angegebene Einheit um.", frage: t + " = ■ " + e, teile: [tZahl(null, w, e)], weg: [weg], tipp: "Ein halber … ist die Hälfte der Umrechnungszahl: ½ kg = 1000 g : 2.", sek: 15 });
}
// Größen schätzen: gleiche Zahl, verschiedene Einheiten – nur eine passt (Arbeitsheft S. 9/5, 9/8 und 10/1)
const SCHAETZ = { L: [["Wie lang ist ungefähr ein Bleistift?", 17, 3], ["Wie hoch ist ungefähr eine Tür?", 2, 1], ["Wie breit ist ungefähr eine Tür?", 90, 3], ["Wie breit ist ein DIN-A4-Blatt?", 21, 3],
    ["Wie lang ist ungefähr ein Lkw?", 18, 1], ["Wie lang ist ungefähr ein Fußballfeld?", 100, 1], ["Wie lang ist ungefähr eine Ameise?", 5, 4], ["Wie lang ist ungefähr ein Klassenzimmer?", 9, 1],
    ["Wie hoch ist ungefähr ein Tisch?", 75, 3], ["Wie groß ist ungefähr eine Giraffe?", 5, 1], ["Wie breit ist ungefähr ein Fingernagel?", 1, 3], ["Wie weit ist es ungefähr von Frankfurt nach Berlin?", 550, 0]],
  G: [["Wie schwer ist ungefähr eine Katze?", 4, 1], ["Wie schwer ist ungefähr ein Elefant?", 5, 0], ["Wie schwer ist ungefähr ein Apfel?", 150, 2], ["Wie schwer ist ungefähr eine Mücke?", 2, 3],
    ["Wie schwer ist ungefähr eine Tafel Schokolade?", 100, 2], ["Wie schwer ist ungefähr ein gepackter Schulranzen?", 5, 1], ["Wie schwer ist ungefähr ein Auto?", 1500, 1],
    ["Wie schwer ist ungefähr eine Maus?", 20, 2], ["Wie schwer ist ungefähr ein Blatt Papier?", 5, 2], ["Wie schwer ist ungefähr ein Wildschwein?", 80, 1]],
  Z: [["Wie lange dauert eine Schulstunde?", 45, 2], ["Wie lange putzt man ungefähr Zähne?", 3, 2], ["Wie lange dauert ein Fußballspiel ohne Pause?", 90, 2],
    ["Wie lange schläft ein Kind ungefähr in der Nacht?", 10, 1], ["Wie lange dauert ungefähr ein Lied im Radio?", 3, 2], ["Wie lange dauert ungefähr einmal in die Hände klatschen?", 1, 3],
    ["Wie lange dauert ein Wochenende?", 2, 0], ["Wie lange dauern die Sommerferien ungefähr?", 42, 0]] };
function schaetzen(key) {
  const [q, z, r] = wahl(SCHAETZ[key]), F = FAM[key], idx = F.e.map((e, i) => i).reverse(), opts = idx.map(i => fz(z) + " " + F.e[i]);
  return aufg({ lbl: "Welche Angabe passt?", frage: q, teile: [tFest(null, opts, idx.indexOf(r))], weg: ["Passend ist " + fz(z) + " " + F.e[r] + "."],
    tipp: key === "Z" ? "Stell es Dir vor: Eine Schulstunde dauert 45 min, ein Tag hat 24 h." : key === "G" ? "Stell es Dir vor: Ein Apfel wiegt etwa 150 g, eine Katze etwa 4 kg." : "Stell es Dir vor: Ein Lineal ist 30 cm lang, eine Tür etwa 2 m hoch.", sek: 10 });
}
const NAMEN = ["Tim", "Lea", "Mia", "Ben", "Emma", "Paul", "Lina", "Noah"];
function sachGroessen() { // Sachaufgaben mit Größen (Arbeitsheft S. 9/7)
  const art = zr(0, 3), name = wahl(NAMEN);
  if (art === 0) { // Fahrrad
    const n = zr(4, 15) * 100, w = n * 2, km = Math.floor(w / 1000), m = w % 1000;
    return aufg({ lbl: "Sachaufgabe", frage: "Wenn sich das Vorderrad von " + name + "s Fahrrad einmal dreht, fährt " + name + " 2 m weit. Auf dem Schulweg dreht es sich " + fz(n) + "-mal. Wie lang ist der Schulweg?",
      teile: [tZahl("Der Schulweg ist ■ m lang.", w, "m"), tZwei(fz(w) + " m = ■ km ■ m", [km, m], ["km", "m"])], weg: [fz(n) + " · 2 m = " + fz(w) + " m", fz(w) + " m = " + km + " km " + m + " m"],
      tipp: "Jede Umdrehung sind 2 m – also " + fz(n) + "-mal 2 m.", sek: 45,
      schritte: () => schritte("Erst die Rechnung finden, dann umrechnen:", [tWahl("Welche Rechnung passt?", fz(n) + " · 2", ablenker(fz(n) + " · 2", [fz(n) + " + 2", fz(n) + " : 2", fz(n) + " − 2"])), tZahl(fz(n) + " · 2 = ■", w, "m"), tZwei(fz(w) + " m = ■ km ■ m", [km, m], ["km", "m"])]) });
  }
  if (art === 1) { // Schlange und Ameisen
    const L = zr(2, 6), a = wahl([4, 5, 8, 10]), mm = L * 1000, n = mm / a;
    return aufg({ lbl: "Sachaufgabe", frage: "Eine Python-Schlange ist " + L + " m lang, eine Ameise " + a + " mm. Wie viele Ameisen hintereinander sind so lang wie die Schlange?",
      teile: [tZahl(L + " m = ■ mm", mm, "mm"), tZahl(fz(mm) + " mm : " + a + " mm = ■", n)], weg: [L + " m = " + fz(mm) + " mm", fz(mm) + " mm : " + a + " mm = " + fz(n)],
      tipp: "Rechne erst beide Längen in dieselbe Einheit um (mm), dann teilen.", sek: 40 });
  }
  if (art === 2) { // Zuladung
    let Z, P, w; do { Z = wahl([350, 400, 450, 500]); P = zr(2, 4); w = zr(12, 16) * 5; } while (Z - P * w < 20);
    const r = Z - P * w;
    return aufg({ lbl: "Sachaufgabe", frage: "In ein Auto dürfen noch " + Z + " kg zugeladen werden. Es fahren " + P + " Personen mit je " + w + " kg mit. Wie viel kg Gepäck dürfen noch in den Kofferraum?",
      teile: [tZahl(null, r, "kg", { diagnose: x => x === Z - w ? "Achtung: Es sind " + P + " Personen – also " + P + " · " + w + " kg." : null })], weg: [P + " · " + w + " kg = " + (P * w) + " kg", Z + " kg − " + (P * w) + " kg = " + r + " kg"],
      tipp: "Rechne erst aus, wie schwer alle Personen zusammen sind.", sek: 40,
      schritte: () => schritte("In zwei Schritten:", [tZahl(P + " · " + w + " = ■", P * w, "kg", { erklaerung: "So schwer sind alle Personen zusammen." }), tZahl(Z + " − " + (P * w) + " = ■", r, "kg")]) });
  }
  const bahn = wahl([25, 50]), b = zr(6, bahn === 25 ? 36 : 18), s = b * bahn, r = 1000 - s; // Schwimmen
  return aufg({ lbl: "Sachaufgabe", frage: name + " schwimmt " + b + " Bahnen. Eine Bahn ist " + bahn + " m lang. Wie viele Meter fehlen noch bis 1 km?",
    teile: [tZahl("Wie viele Meter ist " + name + " schon geschwommen? ■", s, "m"), tZahl("Wie viele Meter fehlen noch bis 1 km? ■", r, "m")],
    weg: [b + " · " + bahn + " m = " + s + " m", "1 km = 1000 m", "1000 m − " + s + " m = " + r + " m"], tipp: "1 km = 1000 m. Rechne erst aus, wie weit " + name + " schon geschwommen ist.", sek: 40,
    schritte: () => schritte("In zwei Schritten:", [tZahl(b + " · " + bahn + " = ■", s, "m", { erklaerung: "So weit ist " + name + " schon geschwommen." }), tZahl("1000 − " + s + " = ■", r, "m", { erklaerung: "1 km = 1000 m" })]) });
}
function sachMalDurch() { // Sachaufgaben zu Mal und Durch (Arbeitsheft S. 19/8)
  const art = zr(0, 2);
  if (art === 0) { // Flugzeuge
    const F = zr(3, 9), P = wahl([150, 180, 200, 250, 300, 350]), k = zr(2, 9), gesamt = F * P * k;
    let B; do { B = gesamt + (Math.random() < 0.5 ? -1 : 1) * zr(1, 40) * 10; } while (B <= 0 || B === gesamt);
    const reicht = gesamt >= B;
    return aufg({ lbl: "Sachaufgabe", frage: "Eine Fluggesellschaft hat " + fz(B) + " Buchungen. Sie setzt " + F + " Flugzeuge mit je " + P + " Plätzen ein. Jedes Flugzeug fliegt " + k + "-mal. Reichen die Plätze?",
      teile: [tZahl("Plätze insgesamt: " + F + " · " + P + " · " + k + " = ■", gesamt), tFest("Reichen die Plätze für " + fz(B) + " Buchungen?", ["Ja", "Nein"], reicht ? 0 : 1),
        tZahl(reicht ? "Wie viele Plätze bleiben frei? ■" : "Wie viele Plätze fehlen? ■", Math.abs(gesamt - B))],
      weg: [F + " · " + P + " · " + k + " = " + fz(gesamt) + " Plätze", reicht ? fz(gesamt) + " − " + fz(B) + " = " + fz(gesamt - B) + " Plätze bleiben frei." : fz(B) + " − " + fz(gesamt) + " = " + fz(B - gesamt) + " Plätze fehlen."],
      tipp: "Rechne erst alle Plätze aus: Flugzeuge · Plätze · Flüge. Rechne geschickt, zum Beispiel erst " + P + " · " + k + ".", sek: 60,
      schritte: () => schritte("Geschickt rechnen:", [tZahl(P + " · " + k + " = ■", P * k, "", { erklaerung: "So viele Plätze hat ein Flugzeug bei allen Flügen." }), tZahl(F + " · " + fz(P * k) + " = ■", gesamt)]) });
  }
  if (art === 1) { const n = zr(20, 30), e = zr(5, 12) * 5, w = n * e; // Klassenfahrt
    return aufg({ lbl: "Sachaufgabe", frage: "In der Klasse sind " + n + " Kinder. Jedes Kind zahlt " + e + " € für die Klassenfahrt. Wie viel Geld ist das zusammen?",
      teile: [tZahl(null, w, "€")], weg: [n + " · " + e + " € = " + fz(w) + " €"], tipp: "Jedes Kind zahlt gleich viel – also mal.", sek: 30,
      schritte: () => schritte("Erst die Rechnung finden:", [tWahl("Welche Rechnung passt?", n + " · " + e, ablenker(n + " · " + e, [n + " + " + e, e + " : " + n, n + " − " + e])), tZahl(n + " · " + e + " = ■", w, "€")]) }); }
  const g = wahl([4, 6, 8, 10, 12]), q = zr(8, 25), N = g * q, ding = wahl([["Brötchen", "Tüten"], ["Eier", "Kartons"], ["Stifte", "Packungen"]]); // Verpacken
  return aufg({ lbl: "Sachaufgabe", frage: "Ein Laden packt " + N + " " + ding[0] + " in " + ding[1] + " zu je " + g + " Stück. Wie viele " + ding[1] + " werden voll?",
    teile: [tZahl(null, q)], weg: [N + " : " + g + " = " + q], tipp: "Gleich viele in jede Packung – also teilen.", sek: 30,
    schritte: () => schritte("Erst die Rechnung finden:", [tWahl("Welche Rechnung passt?", N + " : " + g, ablenker(N + " : " + g, [N + " · " + g, N + " − " + g, g + " : " + N])), tZahl(N + " : " + g + " = ■", q)]) });
}
function euro(ct) { return ct % 100 ? Math.floor(ct / 100) + "," + pad2(ct % 100) : String(ct / 100); }
function sachGeld() { // Wechselgeld – mit Klammern (KLAPS)
  const name = wahl(NAMEN);
  let n, p, s, S; do { n = zr(2, 4); p = zr(6, 15) * 10; s = zr(9, 29) * 10; S = wahl([10, 20]); } while (n * p + s >= S * 100 - 50);
  const r = S * 100 - n * p - s, term = S + " − (" + n + " · " + euro(p) + " + " + euro(s) + ")";
  const falsch = [S + " − " + n + " · " + euro(p) + " + " + euro(s), "(" + S + " − " + n + ") · " + euro(p) + " + " + euro(s), S + " − " + n + " · (" + euro(p) + " + " + euro(s) + ")"];
  return aufg({ lbl: "Sachaufgabe mit Geld", frage: name + " kauft " + n + " Hefte zu je " + geldT(p) + " und einen Stift für " + geldT(s) + ". " + name + " bezahlt mit einem " + S + "-€-Schein. Wie viel Wechselgeld gibt es?",
    teile: [tWahl("Welcher Rechenausdruck passt?", term, ablenker(term, falsch.concat(opVarianten(term)), 3)), tZahl("Wechselgeld: ■", r6(r / 100), "€", { loesungText: "Wechselgeld: " + geldT(r) })],
    weg: [n + " · " + geldT(p) + " = " + geldT(n * p), geldT(n * p) + " + " + geldT(s) + " = " + geldT(n * p + s), S + " € − " + geldT(n * p + s) + " = " + geldT(r)],
    tipp: "Was zusammen bezahlt wird, kommt in Klammern: Schein − (alles, was gekauft wird).", sek: 60 });
}
function aufeinander() { // „Das Produkt welcher drei aufeinanderfolgenden Zahlen ist 60?“ (Arbeitsheft S. 19/7)
  const n = zr(2, 9), P = n * (n + 1) * (n + 2), r = n + " · " + (n + 1) + " · " + (n + 2);
  const andere = [(n + 1) + " · " + (n + 2) + " · " + (n + 3), (n - 1) + " · " + n + " · " + (n + 1), "1 · " + n + " · " + ((n + 1) * (n + 2))].filter(t => !/^0 /.test(t));
  return aufg({ lbl: "Zahlenrätsel", frage: "Das Produkt welcher drei aufeinanderfolgenden Zahlen ist " + fz(P) + "?", teile: [tWahl(null, r, andere)],
    weg: [r + " = " + fz(P)], tipp: "Aufeinanderfolgend heißt: direkt hintereinander, zum Beispiel 3, 4, 5. Probier ein paar aus.", sek: 25 });
}
const OPS = ["+", "−", "·", ":"];
function zeichenEins() { // „10 □ 5 = 50“ (Arbeitsheft S. 19/6)
  for (;;) {
    const op = wahl(OPS); let a, b;
    if (op === ":") { b = zr(2, 12); a = b * zr(2, 15); } else if (op === "·") { a = zr(2, 15); b = zr(2, 12); } else if (op === "+") { a = zr(10, 99); b = zr(3, 60); } else { a = zr(20, 120); b = zr(3, a - 5); }
    const c = rechne(a + " " + op + " " + b), pass = OPS.filter(o => Math.abs(rechne(a + " " + o + " " + b) - c) < 1e-9);
    if (pass.length !== 1) continue;
    return aufg({ lbl: "Welches Rechenzeichen fehlt?", frage: a + " □ " + b + " = " + fz(c), teile: [tFest(null, OPS.slice(), OPS.indexOf(op))], weg: [a + " " + op + " " + b + " = " + fz(c)],
      tipp: "Probier die Rechenzeichen aus: Welche Rechnung ergibt " + fz(c) + "?", sek: 12 });
  }
}
function baumAus(s) { // „55 : 5 − 25 : 5“ → Ausdrucksbaum (Punkt vor Strich, ohne Klammern)
  const tk = s.split(" "); let i = 0;
  const zahl = () => Number(tk[i++]);
  const produkt = () => { let v = zahl(); while (tk[i] === "·" || tk[i] === ":") { const o = tk[i++]; v = N(o, v, zahl()); } return v; };
  let v = produkt(); while (tk[i] === "+" || tk[i] === "−") { const o = tk[i++]; v = N(o, v, produkt()); }
  return v;
}
function zeichenDrei() { // „55 □ 5 □ 25 □ 5 = 6“ (Arbeitsheft S. 21/6) – mit KLAPS ausprobieren
  const alle = []; OPS.forEach(a => OPS.forEach(b => OPS.forEach(c => alle.push([a, b, c]))));
  const setzen = (z, o) => z[0] + " " + o[0] + " " + z[1] + " " + o[1] + " " + z[2] + " " + o[2] + " " + z[3];
  for (;;) {
    const z = [zr(10, 60), zr(2, 12), zr(2, 40), zr(2, 12)], o = wahl(alle), term = setzen(z, o), baum = baumAus(term);
    if (!gueltig(baum)) continue;
    const w = wertVon(baum);
    if (w > 300 || alle.filter(x => Math.abs(rechne(setzen(z, x)) - w) < 1e-9).length !== 1) continue; // nur eine Lösung
    const falsch = mische(alle.filter(x => x.join() !== o.join() && gueltig(baumAus(setzen(z, x))))).slice(0, 3);
    if (falsch.length < 3) continue;
    const optionen = mische([o].concat(falsch)), texte = optionen.map(x => x.join(" ")), r = optionen.indexOf(o);
    return aufg({ lbl: "Welche Rechenzeichen fehlen?", frage: z[0] + " □ " + z[1] + " □ " + z[2] + " □ " + z[3] + " = " + fz(w), teile: [tFest(null, texte, r)],
      weg: [term + " = " + fz(w)].concat(klapsTeile(baum).filter(t => t.eingabe.typ === "zahl").map(t => t.loesungText)),
      tipp: "Setz die Zeichen ein und rechne nach KLAPS: Punkt vor Strich, sonst von links nach rechts.", sek: 60,
      schritte: () => schritte("Rechne jede Möglichkeit nach KLAPS aus:", optionen.map(x => tZahl("Rechne: " + setzen(z, x) + " = ■", wertVon(baumAus(setzen(z, x))))).concat([tFest("Welche Zeichen ergeben " + fz(w) + "?", texte, r)])) });
  }
}

/* ---------- Die zehn „Ich kann …“-Zeilen des Selbsteinschätzungsbogens ---------- */
const FERTIGKEITEN = [
  { id: "umrechnen", ico: "📏", kurz: "Umrechnen", text: "Längen, Gewichte und Geld in verschiedene Einheiten umrechnen.", hilfe: "S. 28, Beispiel 1", aehnlich: "28/1; 28/2; 29/3; 29/4; 29/5; 30/13", pruefe: "40/7; 41/13", testStufe: 4, gen: umrechnen,
    stufen: [{ name: "Eine Stufe kleiner", merke: "Zur kleineren Einheit rechnest Du mal die Umrechnungszahl. Kleinere Einheit heißt größere Zahl." },
      { name: "Eine Stufe größer", merke: "Zur größeren Einheit rechnest Du geteilt durch die Umrechnungszahl. Größere Einheit heißt kleinere Zahl." },
      { name: "Lücken und zwei Stufen", merke: "Über zwei Stufen nimmst Du beide Umrechnungszahlen mal, zum Beispiel m → cm: · 10 · 10 = · 100." },
      { name: "Über viele Stufen", merke: "Geh die Treppe Stufe für Stufe: km → m (· 1000) → dm (· 10) → cm (· 10) → mm (· 10)." },
      { name: "Vergleichen", merke: "Zum Vergleichen rechnest Du zuerst beide Größen in dieselbe Einheit um." }] },
  { id: "zeit", ico: "⏰", kurz: "Zeiten und Uhrzeiten", text: "Zeiten in verschiedene Einheiten umrechnen und mit Uhrzeiten rechnen (Zeitpunkt und Zeitspanne).", hilfe: "S. 29, Beispiel 2", aehnlich: "29/6; 29/7; 30/9; 30/10; 30/11", pruefe: "40/7; 41/10; 41/13", testStufe: 4, gen: zeit,
    stufen: [{ name: "Eine Stufe kleiner", merke: "1 d = 24 h · 1 h = 60 min · 1 min = 60 s. Zur kleineren Einheit rechnest Du mal." },
      { name: "Eine Stufe größer", merke: "Zur größeren Einheit rechnest Du geteilt durch 60 – bei Stunden in Tage geteilt durch 24." },
      { name: "Halbe Stunden, gemischte Angaben, vergleichen", merke: "Eine halbe Stunde sind 30 min, eine Viertelstunde 15 min. Achtung: 1 h hat 60 min, nicht 100!" },
      { name: "Zeitspanne zwischen zwei Uhrzeiten", merke: "Rechne in Schritten: bis zur nächsten vollen Stunde, dann die vollen Stunden, dann die restlichen Minuten." },
      { name: "Anfang oder Ende berechnen", merke: "Erst die Stunden dazuzählen (oder abziehen), dann die Minuten – über die volle Stunde in zwei Schritten." }] },
  { id: "komma", ico: "🗂️", kurz: "Kommaschreibweise", text: "Längen, Gewichte und Geld in Kommaschreibweise darstellen sowie mit und ohne Einheitentafel Größen ohne Komma schreiben.", hilfe: "S. 32, Beispiel 1", aehnlich: "32/1; 32/2; 33/3; 33/4; 33/5", pruefe: "40/8", testStufe: 3, gen: komma,
    stufen: [{ name: "Komma weg: in die kleinere Einheit", merke: "In der Einheitentafel steht die Zahl vor dem Komma in der Spalte der Einheit, die Ziffern dahinter rechts daneben. Fehlende Stellen füllst Du mit 0." },
      { name: "Mit Komma: in die größere Einheit", merke: "Das Komma steht direkt rechts neben der Spalte der neuen Einheit: 250 cm = 2 m 50 cm = 2,5 m." },
      { name: "Gemischte Schreibweise", merke: "6 km 700 m = 6,7 km = 6700 m – das ist dreimal dieselbe Länge." },
      { name: "Geld mit Komma", merke: "1 € = 100 Cent. Hinter dem Komma stehen zwei Stellen für die Cent: 2,79 € = 279 Cent, 0,05 € = 5 Cent." },
      { name: "Vergleichen und Ordnen", merke: "Zum Vergleichen schreibst Du alle Größen in dieselbe Einheit." }] },
  { id: "plusminus", ico: "➕", kurz: "Plus und Minus im Kopf", text: "Die Fachbegriffe der Addition und Subtraktion verwenden sowie Zahlen geschickt im Kopf addieren und subtrahieren.", hilfe: "S. 46, Beispiel 1", aehnlich: "46/1; 46/2; 46/3; 47/4", pruefe: "78/1", testStufe: 3, gen: plusminus,
    stufen: [{ name: "Im Kopf ohne Übergang", merke: "Zerlege eine Zahl in Zehner und Einer: 25 + 32 = 25 + 30 + 2 = 57." },
      { name: "Im Kopf mit Übergang", merke: "Rechne mit einer runden Zahl und gleiche aus: 27 + 29 = 27 + 30 − 1 = 56 und 52 − 18 = 52 − 20 + 2 = 34." },
      { name: "Große Zahlen, mehrere Zahlen, die Null", merke: "Bei mehreren Zahlen rechnest Du von links nach rechts. Plus 0 oder minus 0 ändert nichts." },
      { name: "Fachbegriffe", merke: "Summand + Summand: Das ist eine Summe, das Ergebnis heißt Wert der Summe. Minuend − Subtrahend: Das ist eine Differenz, das Ergebnis heißt Wert der Differenz." }] },
  { id: "probe-pm", ico: "🔁", kurz: "Probe bei Plus und Minus", text: "Umkehrrechnungen der Addition und Subtraktion durchführen (Probe).", hilfe: "S. 47, Beispiel 2", aehnlich: "47/5; 47/6; 47/7; 47/8", pruefe: "78/2", testStufe: 3, gen: probePM,
    stufen: [{ name: "Probe machen", merke: "Plus und Minus heben sich auf. Probe zu 67 − 42 = 25: 25 + 42 = 67 ✓." },
      { name: "Lücke bei Plus", merke: "12 + ■ = 40: Rechne rückwärts, ■ = 40 − 12 = 28." },
      { name: "Lücke bei Minus", merke: "■ − 8 = 18: ■ = 18 + 8 = 26. Aber 25 − ■ = 18: ■ = 25 − 18 = 7." },
      { name: "Rechnen und Probe", merke: "Erst rechnen, dann mit der Umkehraufgabe prüfen. Kommt die Ausgangszahl heraus, stimmt es." }] },
  { id: "maldurch", ico: "✖️", kurz: "Mal und Durch im Kopf", text: "Die Fachbegriffe der Multiplikation und Division verwenden sowie Zahlen geschickt im Kopf multiplizieren und dividieren.", hilfe: "S. 50, Beispiel 1", aehnlich: "50/1; 50/2; 50/3", pruefe: "78/1", testStufe: 2, gen: maldurch,
    stufen: [{ name: "Im Kopf: zerlegen", merke: "Zerlege in Zehner und Einer und nimm beide Teile mal: 4 · 16 = 4 · 10 + 4 · 6 = 40 + 24 = 64." },
      { name: "Im Kopf: geschickt vereinfachen", merke: "29 · 13 = 30 · 13 − 13 = 377. Beim Teilen: 114 : 6 = 120 : 6 − 6 : 6 = 20 − 1 = 19." },
      { name: "Fachbegriffe", merke: "Faktor · Faktor: Das ist ein Produkt, das Ergebnis heißt Wert des Produkts. Dividend : Divisor: Das ist ein Quotient, das Ergebnis heißt Wert des Quotienten." }] },
  { id: "probe-md", ico: "🔄", kurz: "Probe bei Mal und Durch", text: "Umkehrrechnungen der Multiplikation und Division durchführen (Probe).", hilfe: "S. 51, Beispiel 2", aehnlich: "51/4; 51/6", pruefe: "78/2", testStufe: 3, gen: probeMD,
    stufen: [{ name: "Probe machen", merke: "Mal und Durch heben sich auf. Probe zu 104 : 8 = 13: 13 · 8 = 104 ✓." },
      { name: "Lücke bei Mal", merke: "8 · ■ = 64: ■ = 64 : 8 = 8." },
      { name: "Lücke bei Durch", merke: "■ : 6 = 12: ■ = 12 · 6 = 72. Aber 60 : ■ = 5: ■ = 60 : 5 = 12." },
      { name: "Rechnen und Probe", merke: "Erst rechnen, dann mit der Umkehraufgabe prüfen." }] },
  { id: "null", ico: "0️⃣", kurz: "Rechnen mit der Null", text: "Multiplizieren und dividieren mit der Null.", hilfe: "S. 51, Wissen", aehnlich: "51/5", pruefe: "78/3", testStufe: 2, gen: nullRechnen,
    stufen: [{ name: "Mal null", merke: "Ist ein Faktor 0, ist das Ergebnis 0. Und 0 : 3 = 0." },
      { name: "Durch null?", merke: "Durch 0 kann man nicht teilen: „Mal null“ ergibt null, „durch null“ geht nicht." },
      { name: "Gemischt", merke: "Erst schauen: Wird durch 0 geteilt? Dann geht es nicht. Sonst ganz normal rechnen." }] },
  { id: "klaps", ico: "🧱", kurz: "KLAPS und Terme", text: "Vorrangregeln (KLAPS) beim Rechnen mit allen Grundrechenarten anwenden sowie Terme in Textform und umgekehrt formulieren.", hilfe: "S. 53, Beispiel 1", aehnlich: "53/1; 53/2; 54/3; 54/4; 55/12; 55/13", pruefe: "78/4; 78/5; 78/6", testStufe: 3, gen: klaps,
    stufen: [{ name: "Punkt vor Strich", merke: "Erst · und :, dann + und −: 12 + 8 · 11 = 12 + 88 = 100." },
      { name: "Klammern zuerst", merke: "Was in Klammern steht, rechnest Du zuerst: 28 − (6 + 14) = 28 − 20 = 8." },
      { name: "Von links nach rechts", merke: "Gleich starke Rechenzeichen rechnest Du von links nach rechts: 36 − 16 − 6 = 20 − 6 = 14." },
      { name: "Klammern in Klammern", merke: "Bei mehreren Klammern beginnst Du innen: 2 · [3 + (5 − 1)] = 2 · [3 + 4] = 2 · 7 = 14." },
      { name: "Terme in Worten", merke: "Summe → +, Differenz → −, Produkt → ·, Quotient → :. Was zuerst gebildet wird, kommt in Klammern." }] },
  { id: "gesetze", ico: "🔀", kurz: "Rechengesetze", text: "Das Kommutativgesetz und das Assoziativgesetz der Addition und Multiplikation zur Vereinfachung von Rechnungen verwenden.", hilfe: "S. 56, Beispiel 1 und S. 57, Beispiel 2", aehnlich: "57/1; 57/2; 58/3; 58/4; 58/5", pruefe: "78/7; 78/8", testStufe: 2, gen: gesetze,
    stufen: [{ name: "Geschickt addieren", merke: "Bei Plus darfst Du vertauschen und Klammern setzen: Such Zahlen, die zusammen eine Zehnerzahl ergeben." },
      { name: "Geschickt multiplizieren", merke: "Bei Mal darfst Du vertauschen und Klammern setzen: 25 · 4 = 100, 5 · 2 = 10, 125 · 8 = 1000." },
      { name: "Stufenzahlen und Zerlegen", merke: "6 · 400 = 6 · 4 · 100 = 24 · 100 = 2400. Die Zahlen 10, 100, 1000 … heißen Stufenzahlen." },
      { name: "Gesetze erkennen", merke: "Vertauschungsgesetz (Kommutativgesetz): a + b = b + a. Verbindungsgesetz (Assoziativgesetz): (a + b) + c = a + (b + c). Beide gelten nur für Plus und Mal – nicht für Minus und Durch!" }] }
];

function aufgabe(id, stufe) {
  const def = FERTIGKEITEN.find(d => d.id === id);
  const st = Math.max(1, Math.min(def.stufen.length, stufe || 1));
  const A = def.gen(st);
  A.skill = id; A.stufe = st; A.lbl = A.lbl || def.stufen[st - 1].name;
  return A;
}
function sekunden(id, stufe) {
  const S = { umrechnen: [20, 20, 24, 30, 25], zeit: [20, 20, 22, 45, 50], komma: [28, 30, 25, 22, 32], plusminus: [15, 15, 22, 22], "probe-pm": [35, 22, 22, 35],
    maldurch: [22, 28, 22], "probe-md": [35, 22, 22, 35], null: [12, 12, 14], klaps: [32, 32, 40, 40, 50], gesetze: [30, 30, 25, 15] }[id] || [25];
  return S[Math.max(0, Math.min(S.length - 1, (stufe || 1) - 1))];
}

G.MATHE = { ARBEIT: "2. Mathearbeit am 1. Dezember 2026", FERTIGKEITEN: FERTIGKEITEN.map(d => Object.assign({}, d, { gen: undefined })),
  FAM, aufgabe, pruefe, sekunden, fz, zahlLesen, klapsTeile };
if (typeof module !== "undefined" && module.exports) module.exports = G.MATHE;
})(typeof window !== "undefined" ? window : globalThis);
