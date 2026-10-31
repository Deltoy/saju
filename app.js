/* app.js — UI for 사주 나침반. Data lives only in this browser (localStorage). */
'use strict';
const S = window.Saju;
const KEY = 'saju.v1';
const DEF = { yearBoundary: 'ipchun', sect: 1, theme: 'auto', hideMatch: false, hourPick: {}, wedding: '', areas: {}, focus: {}, activeId: null, partnerId: null, tarotMethod: 'rws' };
const AREA_DEF = { move: '이동·정착', career: '진로·공부', money: '돈·투자', family: '가정·관계' };
const FOCUS_DEF = { move: '이동 준비', career: '공부', money: '비상금·지출 관리', family: '관계' };
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sgn = x => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(1);

// ── 조사: 받침 따라 을/를 · 이/가 · 은/는 · 과/와 · 으로/로 (영문·숫자는 읽는 소리 기준) ──
function batchim(w) {
  let c = String(w).trim().replace(/\s*\([^)]*\)\s*$/, '').replace(/[\s\]」'"·.]+$/, '').slice(-1);
  if (S && S.STEMS.includes(c)) c = S.STEM_KO[S.si(c)]; else if (S && S.BRANCHES.includes(c)) c = S.BRANCH_KO[S.bi(c)];   // 한자 간지는 읽는 소리로
  if (!c) return false;
  const k = c.charCodeAt(0);
  if (k >= 0xAC00 && k <= 0xD7A3) return (k - 0xAC00) % 28 ? ((k - 0xAC00) % 28 === 8 ? 'ㄹ' : true) : false;
  if (/[0-9]/.test(c)) return '0136789'.includes(c) ? (c === '1' || c === '7' || c === '8' ? 'ㄹ' : true) : false;
  if (/[a-z]/i.test(c)) return /[lmnr]/i.test(c) ? (/[lr]/i.test(c) ? 'ㄹ' : true) : false;
  return false;
}
const J = { '을/를': ['을', '를'], '이/가': ['이', '가'], '은/는': ['은', '는'], '과/와': ['과', '와'], '이에요/예요': ['이에요', '예요'] };
function josa(w, p) { const b = batchim(w); if (p === '으로/로') return w + (b && b !== 'ㄹ' ? '으로' : '로'); return w + J[p][b ? 0 : 1]; }

function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.profiles)) return { profiles: d.profiles, settings: { ...DEF, ...d.settings }, plans: d.plans || {}, tarot: d.tarot || { daily: {}, history: [] } }; } catch (e) { /* 저장소 막힘 → 빈 상태 */ }
  return { profiles: [], settings: { ...DEF }, plans: {}, tarot: { daily: {}, history: [] } };
}
let db = load();
/** true = 저장됨. 실패하면 알리고 false */
function save() {
  memo.clear();
  try { localStorage.setItem(KEY, JSON.stringify(db)); return true; } catch (e) { toast('이 브라우저에 저장하지 못했어요. 개인 정보 보호 모드인지 확인해 주세요'); return false; }
}

// ── 아이콘 (lucide, stroke 1.5) ──
const P = {
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  scroll: '<path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  flag: '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  hand: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  download: '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  pen: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>', shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  sprout: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
  chartBar: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16h8"/><path d="M7 11h12"/><path d="M7 6h3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  sparkle: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  sword: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="m12 6.5 1.6 3.4 3.7.4-2.8 2.5.8 3.6L12 14.6l-3.3 1.8.8-3.6-2.8-2.5 3.7-.4z"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  chev: '<path d="m9 18 6-6-6-6"/>'
};
const I = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
const CLS_ICON = { push: 'arrowUp', guard: 'shield', prep: 'sprout', rest: 'moon' };
const CLS_SHORT = { push: '밀기', guard: '지킴', prep: '준비', rest: '쉬기' };
const clsPill = k => `<span class="cls k-${k}">${I(CLS_ICON[k])}${S.CLASSES[k].name}</span>`;

// ── 쉬운 말 (쉬운 뜻을 먼저, 용어는 괄호) ──
const GOD_GL = { 비견: '동료·경쟁 기운', 겁재: '경쟁·나눠 갖는 기운', 식신: '표현·실력 기운', 상관: '말·재주가 튀는 기운', 편재: '큰돈·사업 기운', 정재: '꾸준한 돈 기운', 편관: '압박·책임 기운', 정관: '규칙·직장 기운', 편인: '아이디어·특수 공부 기운', 정인: '공부·문서 기운' };
const REL_GL = { 육합: '서로 끌어당김', 반합: '힘을 모음', 삼합: '크게 뭉침', 방합: '같은 계절로 뭉침', '방합 완성': '같은 계절이 다 모임', 충: '부딪힘', 형: '어긋남', 해: '작은 엇박자', '같은 글자': '같은 글자' };
const STAGE_GL = { 장생: '새로 시작하는 힘', 목욕: '꾸미고 드러내는 힘', 관대: '자리를 갖춰 가는 힘', 건록: '스스로 서는 힘', 제왕: '가장 힘이 센 자리', 쇠: '힘을 아끼며 노련해지는 자리', 병: '쉬어 가며 살피는 자리', 사: '한 단계를 마무리하는 자리', 묘: '안으로 모으는 자리', 절: '끊고 새로 잇는 자리', 태: '새 씨앗을 품는 자리', 양: '조용히 길러지는 자리' };
const godTxt = g => GOD_GL[g.name] ? `${GOD_GL[g.name]}(${g.name})` : g.name;
const relTxt = r => r.type === '같은 글자' ? r.name : r.name.replace(new RegExp(r.type.replace(' ', '\\s') + '$'), `${REL_GL[r.type]}(${r.type})`);
const stageTxt = s => `${STAGE_GL[s]}(${s})`;
const TEN_W = D => D >= 1 ? '좋음' : D >= 0 ? '보통' : '버거움';
const YEAR_W = Y => Y >= 1 ? '좋음' : Y >= 0 ? '무난' : '엇갈림';
const NEXT_W = Y => Y >= 1 ? '좋음' : Y >= -2 ? '보통' : '조심';
// 1031 MJ "말이 너무 어려워" → 쉬운 뜻 먼저, 용어는 괄호. 한 문장에 한 가지.
const SUB = (cls, base) => cls === 'prep' && base !== 'prep' ? { guard: '올해는 지키고, 내년을 준비해요.', push: '올해는 밀고 가되, 내년을 준비해요.', rest: '쉬면서 내년을 준비해요.' }[base]
  : { push: '미뤄 둔 일을 시작해 보세요.', guard: '새 일보다 가진 것을 지켜요.', prep: '정리하고 실력을 쌓아 두세요.', rest: '무리하지 말고 쉬어 가요.' }[cls];
/** 모든 탭이 같은 낱말을 씀: 10년 흐름 · 올해 · 다음 해 → 분류 */
function readingChips(D, Y, N) {
  const c = (k, w, v) => `<span class="rd rd-${v}"><span class="rk">${k}</span>${w}</span>`;
  return `<div class="reading">${c('10년 흐름', TEN_W(D), D >= 1 ? 'g' : D >= 0 ? 'n' : 'b')}${c('올해', YEAR_W(Y), Y >= 1 ? 'g' : Y >= 0 ? 'n' : 'b')}${c('다음 해', NEXT_W(N), N >= 1 ? 'g' : N >= -2 ? 'n' : 'b')}</div>`;
}

// ── 글자 표시 ──
const ELC = ['wood', 'fire', 'earth', 'metal', 'water'];
const EL_PLAIN = ['나무', '불', '흙', '쇠', '물'];
const elName = e => `${EL_PLAIN[e]}(${S.EL_HANJA[e]})`;
/** 계산 엔진 문장의 "금(金)이" → "쇠(金)가" (조사도 다시 붙임) */
const JP = { 이: '이/가', 가: '이/가', 은: '은/는', 는: '은/는', 을: '을/를', 를: '을/를', 과: '과/와', 와: '과/와' };
const pl = s => String(s).replace(/([목화토금수])\(([木火土金水])\)(이|가|은|는|을|를|과|와)?/g, (_, k, h, j) => { const w = `${EL_PLAIN[S.EL.indexOf(k)]}(${h})`; return j ? josa(w, JP[j]) : w; });
// 기둥 자리를 쉬운 말로: 년지 → 태어난 해 자리
const SPOT = { 년: '해', 월: '달', 일: '날', 시: '시간' };
const spot = k => `${SPOT[k]} 자리(${S.PALACE_AREA[k]})`;
const elTag = (e, kind) => `<span class="tag el e-${ELC[e]}${kind ? ' ' + kind : ''}"><i></i>${elName(e)}</span>`;
const hz = c => { const e = S.STEMS.includes(c) ? S.stemEl(S.si(c)) : S.BR_EL[S.bi(c)]; return `<span class="hz ce e-${ELC[e]}">${c}</span>`; };
const hz2 = gz => `<span class="pairhz">${hz(gz[0])}${hz(gz[1])}</span>`;
const gzKo = gz => `${gz}(${S.ko(gz)})`;
const uniq = a => [...new Set(a)];
const uniqRels = rels => [...new Map(rels.map(r => [r.name, r])).values()];
const relTags = rels => uniqRels(rels).map(r => `<span class="tag ${r.s > 0 ? 'good' : r.s < 0 ? 'bad' : ''}">${esc(relTxt(r))}</span>`).join('');
const noteTags = notes => uniq(notes.map(n => n.k + '|' + n.t)).map(x => { const [k, t] = x.split('|'); return `<span class="tag ${k === 'need' ? 'good' : 'bad'}">${esc(pl(t))}</span>`; }).join('');

// ── 상태 ──
const memo = new Map();
/** 계산 실패(잘못된 날짜 등)는 null — 화면은 안내 카드로 */
function chartOf(p) {
  const o = { yearBoundary: db.settings.yearBoundary, sect: db.settings.sect, hour: db.settings.hourPick[p.id] };
  const k = JSON.stringify([p, o]);
  if (!memo.has(k)) { try { memo.set(k, S.computeChart(p, o)); } catch (e) { memo.set(k, null); } }
  return memo.get(k);
}
const me = () => db.profiles.find(p => p.id === db.settings.activeId) || db.profiles.find(p => p.role === 'me') || db.profiles[0];
const partner = () => { const m = me(); return db.profiles.find(p => p.id === db.settings.partnerId && p !== m) || db.profiles.find(p => p.role === 'partner' && p !== m) || db.profiles.find(p => p !== m); };
const today = () => new Date();
const opts = () => ({ yearBoundary: db.settings.yearBoundary });
const area = k => db.settings.areas[k] || AREA_DEF[k];
const focus = k => (db.settings.focus || {})[k] || FOCUS_DEF[k];
const fmtDate = d => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
const kst = dt => { const t = new Date(dt.getTime() + 9 * 3600e3); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const md = dt => { const k = kst(dt); return `${k.m}월 ${k.d}일`; };
const wk = ymd => '일월화수목금토'[new Date(ymd + 'T12:00:00').getDay()];
const errCard = (p, msg) => `<div class="head"><h1>계산하지 못했어요</h1></div><section class="card"><div class="ch"><h2>${esc(p ? josa(p.name, '은/는') : '')} 프로필을 읽지 못했어요</h2></div><p class="lead">${esc(msg || '생년월일이나 음력 윤달이 맞는지 설정에서 확인해 주세요.')}</p><div class="btns gap-t"><a class="btn pri" href="#/settings">${I('gear')}설정으로 가기</a></div></section>`;

// ── 가져오기 링크 (#import=…) — 서버로 가지 않는 해시, 저장 후 즉시 지움 ──
function importFrom(hash) {
  let d;
  try { d = S.decodeImport(hash); } catch (e) { return '가져오기 링크를 읽지 못했어요'; }
  if (!d) return '가져오기 링크가 아니에요';
  for (const p of d.profiles) { try { S.computeChart(p); } catch (e) { return `${josa(p.name, '은/는')} 날짜가 맞지 않아 가져오지 않았어요 (음력 윤달을 확인해 주세요)`; } }
  for (const p of d.profiles) { const i = db.profiles.findIndex(x => x.id === p.id); if (i >= 0) db.profiles[i] = p; else db.profiles.push(p); }
  const { areas, focus: fc, ...rest } = d.settings;
  Object.assign(db.settings, rest);
  if (areas) db.settings.areas = { ...db.settings.areas, ...areas };
  if (fc) db.settings.focus = { ...db.settings.focus, ...fc };
  const m = d.profiles.find(p => p.role === 'me'), pt = d.profiles.find(p => p.role === 'partner');
  if (m) db.settings.activeId = m.id;
  if (pt) db.settings.partnerId = pt.id;
  return save() ? '' : 'fail';
}
function handleImport() {
  if (!/[#&]import=/.test(location.hash)) return;
  const err = importFrom(location.hash);
  history.replaceState(null, '', location.pathname + location.search);
  if (err !== 'fail') setTimeout(() => toast(err || '정보를 이 기기에만 저장했어요'), 50);
}

// ── 라우팅 ──
const TABS = [['home', '나침반', 'compass'], ['flow', '흐름', 'activity'], ['chart', '내 사주', 'scroll'], ['match', '궁합·결혼일', 'heart'], ['settings', '설정', 'gear']];
function route() {
  const t = (location.hash.match(/^#\/(\w+)/) || [])[1] || 'home';
  if (t === 'match' && (db.settings.hideMatch || !partner())) return 'home';
  return TABS.some(x => x[0] === t) ? t : 'home';
}
function applyTheme() {
  const t = db.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
}
function renderNav(cur) {
  $('#nav').innerHTML = `<div class="brand">${I('compass')}사주 나침반</div>` +
    TABS.filter(([k]) => k !== 'match' || (!db.settings.hideMatch && partner())).map(([k, l, ic]) => `<a href="#/${k}"${k === cur ? ' aria-current="page"' : ''}>${I(ic)}<span>${l}</span></a>`).join('') +
    `<p class="side-note">명리는 흐름을 보는 참고예요. 결정은 직접 해요. 투자 판단의 근거로 쓰지 마세요.</p>`;
}
// 1031 MJ "프로필을 바로바로 바꿀 수가 없어" → 맨 위 이름 버튼으로 바로 바꾸기
function topBar(t) {
  if (t === 'settings' || !db.profiles.length) return '';
  const cur = me();
  const who = db.profiles.length > 1 ? `<div class="whobar" role="group" aria-label="${t === 'match' ? '궁합을 볼 기준 사람' : '누구 사주를 볼까요'}"><span class="wl">${t === 'match' ? '기준 사람' : '보는 사람'}</span><div class="wseg">${db.profiles.map(p => `<button data-act="who" data-id="${esc(p.id)}" aria-pressed="${p === cur}">${esc(p.name)}</button>`).join('')}</div></div>` : '';
  return who;
}
const hintHtml = t => db.settings.termSeen ? '' : `<p class="hint">${I('book')}<span>점선 밑줄이 있는 말을 누르면 쉬운 뜻이 나와요${t === 'chart' ? '' : ' · <a href="#/chart#gloss">어려운 말 사전</a>'}</span></p>`;
function render() {
  applyTheme();
  if (!window.Solar || !window.Lunar || !S) {
    $('#main').innerHTML = `<div class="head"><h1>사주 나침반</h1></div><section class="card"><div class="ch"><h2>계산 도구를 불러오지 못했어요</h2></div><p class="lead">lunar.js 파일이 없어서 계산할 수 없어요. 인터넷에 연결된 상태에서 새로고침해 주세요.</p></section>`;
    return;
  }
  const t = db.profiles.length ? route() : (route() === 'settings' ? 'settings' : 'home');
  renderNav(t);
  FLOW = null;
  $('#main').innerHTML = topBar(t) + PAGES[t]();
  const hd = $('#main .head'); if (hd && t !== 'settings') hd.insertAdjacentHTML('afterend', hintHtml(t));
  drawCharts();
  linkTerms($('#main'));
  const on = $('.whobar [aria-pressed="true"]'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
  document.title = (TABS.find(x => x[0] === t) || TABS[0])[1] + ' · 사주 나침반';
  const anchor = location.hash.split('#')[2];
  if (anchor && document.getElementById(anchor)) requestAnimationFrame(() => document.getElementById(anchor).scrollIntoView({ block: 'start' }));
}

// ── 이번 달 할 일 · 피할 일 템플릿 (십성 무리 → 문장) ──
const TPL = {
  move: {
    비겁: [['같은 길을 먼저 간 사람에게 정착 경험 물어보기', '남과 비교하며 일정 서두르기'], ['준비 목록을 함께 나눠 맡기', '보증·공동명의 같은 큰 약속']],
    식상: [['이력서·자기소개처럼 나를 보여 줄 자료 다듬기', '말로만 정한 약속 믿기'], ['현지 모임·커뮤니티에 먼저 말 걸기', '기분 따라 일정 바꾸기']],
    재성: [['정착 비용(집·생활비)을 숫자로 계산하기', '목돈·환전을 한 번에 옮기기'], ['일자리·소득 경로를 구체적으로 적기', '확인 안 된 집 계약하기']],
    관성: [['비자·체류 서류 마감일을 달력에 적기', '규정을 짐작으로 처리하기'], ['기관 안내문을 원문으로 다시 확인하기', '마감 직전에 제출하기']],
    인성: [['필요한 증명서를 미리 발급해 두기', '정보만 모으고 결정 미루기'], ['이주 정보를 한 문서로 정리하기', '출처 모를 후기만 믿기']]
  },
  career: {
    비겁: [['스터디·동기와 진도 맞추기', '남의 속도에 휘둘리기'], ['같은 목표를 가진 사람 찾기', '경쟁심에 과목 욕심 내기']],
    식상: [['손으로 하는 실습·회로 연습 늘리기', '이론만 붙잡고 실습 미루기'], ['배운 것을 남에게 설명해 보기', '여러 과정을 한꺼번에 시작하기']],
    재성: [['자격·과정이 소득으로 이어지는 길 점검하기', '당장 돈 되는 일에 공부 시간 다 쓰기'], ['학비·시간 예산 세우기', '비싼 과정을 서둘러 결제하기']],
    관성: [['시험·지원 일정을 확정하고 거꾸로 계획하기', '마감 직전에 몰아서 하기'], ['요건·자격 기준을 공식 자료로 확인하기', '규칙을 건너뛰는 지름길']],
    인성: [['기초 수학·이론 복습하기', '자료만 쌓고 문제는 안 풀기'], ['강의·교재 하나를 끝까지 보기', '생각만 하고 시작 미루기']]
  },
  money: {
    비겁: [['지출 기록을 보며 새는 돈 막기', '돈 빌려주기·공동 투자'], ['돈 거래는 글로 남기기', '남 따라 사고팔기']],
    식상: [['작은 부수입 아이디어를 시험해 보기', '기분 따라 하는 소비'], ['나만의 돈 원칙을 글로 적기', '확인 안 된 정보로 움직이기']],
    재성: [['수입·자산을 한 장으로 정리하기', '한 번에 큰돈 옮기기'], ['비상금부터 채우기', '빚을 늘려 규모 키우기']],
    관성: [['세금·신고 일정 챙기기', '압박감에 서두른 결정'], ['고정비 점검하기', '빚(레버리지) 쓰기']],
    인성: [['계약서·약관을 꼼꼼히 읽기', '남이 권한 상품에 그대로 가입하기'], ['공부한 만큼만 판단하기', '결정을 미루다 손해를 방치하기']]
  },
  family: {
    비겁: [['둘만의 시간을 따로 떼어 두기', '주변 말로 상대를 판단하기'], ['친구·가족 일정과 균형 맞추기', '돈 문제를 말없이 처리하기']],
    식상: [['고마운 점을 말로 표현하기', '농담처럼 던지는 날 선 말'], ['결혼 준비 역할 나누기', '상대 방식을 고치려 들기']],
    재성: [['예산·생활비를 함께 정하기', '큰 지출을 혼자 결정하기'], ['상대에게 필요한 것 먼저 묻기', '바쁘다는 이유로 연락 줄이기']],
    관성: [['양가 일정·약속을 미리 조율하기', '의무감만으로 밀어붙이기'], ['책임질 일 목록을 같이 만들기', '피곤할 때 중요한 대화하기']],
    인성: [['양가 어른께 조언 구하기', '생각만 하고 표현 안 하기'], ['함께 미래 계획 적어 보기', '결정을 상대에게 미루기']]
  }
};
const AREA_ICON = { move: 'plane', career: 'zap', money: 'wallet', family: 'house' };
/** 분류에 따른 한 줄 (영역별 '지금 하는 일'을 넣어 개인화). {f을} 같은 자리에 조사가 붙음 */
const AREA_LINE = {
  move: { push: '{f을} 실제로 움직이기 좋은 때예요.', guard: '이미 시작한 {f을} 차근차근 마무리해요.', prep: '{f을} 미리 갖춰 두세요. 다음 흐름에 바로 움직일 수 있어요.', rest: '큰 이동 결정은 미루고, {f은} 정보만 모아 두세요.' },
  career: { push: '{f에} 새 목표를 하나 더 붙여도 좋아요.', guard: '새로 시작하기보다 이미 시작한 {f을} 마무리해요.', prep: '이미 시작한 {f을} 마무리하며 내년을 준비해요.', rest: '{f은} 양을 줄여도 괜찮아요. 꾸준함만 지켜요.' },
  money: { push: '원칙 안에서 {f을} 넓혀 봐요.', guard: '새 투자보다 {f부터} 지켜요.', prep: '{f으로} 내년을 준비해요.', rest: '돈 결정은 미루고 {f만} 해 두세요.' },
  family: { push: '{f에서} 큰 결정을 함께 정하기 좋아요.', guard: '{f은} 정한 일정대로 가고, 새 약속은 줄여요.', prep: '{f} 목록을 미리 채워 두세요.', rest: '둘만의 쉬는 시간을 먼저 챙기고, {f은} 천천히 해요.' }
};
const fillF = (t, f) => t.replace(/\{f(을|은|으로)?([^}]*)\}/g, (_, j, rest) => (j ? josa(f, j === '을' ? '을/를' : j === '은' ? '은/는' : '으로/로') : f) + rest);
function lifeAdvice(c, M, cls) {
  const [gs, gb] = M.gods, bad = r => r.type === '충' || r.type === '형';
  const flags = {
    yeokma: M.yeokma,
    moveClash: M.rels.some(r => r.type === '충' && (r.palace === '년' || r.palace === '월')),
    spouseBad: M.rels.some(r => bad(r) && r.palace === '일'),
    spouseGood: M.rels.some(r => r.s > 0 && r.palace === '일')
  };
  return ['move', 'career', 'money', 'family'].map(k => {
    const a = TPL[k][gs.group][0], b = TPL[k][gb.group][1];
    const dos = [a[0], b[0]], donts = [a[1], b[1]];
    if (k === 'move' && flags.yeokma) dos[1] = '이동 기운(역마)의 달이에요. 답사·이동 일정을 잡기 좋아요';
    if (k === 'move' && flags.moveClash) donts[1] = '급한 이사·퇴사 결정은 한 달 미뤄 보기';
    if (k === 'family' && flags.spouseBad) donts[1] = '말다툼은 그날 결론 내지 말고 다음 날 차분히';
    if (k === 'family' && flags.spouseGood) dos[1] = '둘이 함께 정할 일을 이번 달에 정하기 좋아요';
    return { k, line: fillF(AREA_LINE[k][cls], focus(k)), dos, donts, ctx: areaContext(c, k) };
  });
}
function nextYears(pred, n = 2) {
  const out = [], from = today().getFullYear();
  for (let Y = from; Y <= from + 14 && out.length < n; Y++) { const gz = S.yearGz(Y); if (pred(gz)) out.push(`${Y} ${gz}`); }
  return out.join(' · ');
}
const yrs = s => s.split(' · ').map(x => x.split(' ')[0] + '년').join(', ');   // "2028 戊申 · 2040 庚申" → "2028년, 2040년"
function areaContext(c, k) {
  const day = c.pillars[2][0], A = c.analysis, female = (me() || {}).gender === 'F';
  if (k === 'move') { const y = nextYears(gz => gz[1] === A.yeokma); return y && { t: `이사·이동 운이 큰 해(역마): ${yrs(y)}` }; }
  if (k === 'career') { const y = nextYears(gz => S.godOfStem(day, gz[0]).group === '인성'); return y && { t: `공부·자격 운이 들어오는 해(인성): ${yrs(y)}` }; }
  if (k === 'money') return { t: '사주 흐름은 시장 가격과 맞지 않을 수 있어요. 이 방식을 만든 달수도 "선반영·후반영 때문에 딱 맞지 않는다"고 했어요. 그래서 특정 종목이나 사고팔 시점은 다루지 않아요.' };
  if (db.settings.wedding && partner()) return { t: `${db.settings.wedding.slice(0, 4)}년은 결혼이라는 큰일을 치르는 해예요. 같은 해에 이직·큰 투자 같은 다른 큰일은 겹치지 않게 하는 걸 권해요.`, link: ['#/match#wedCard', '결혼일 점검 보기'] };
  const g = female ? '관성' : '재성', y = nextYears(gz => S.godOfStem(day, gz[0]).group === g);
  return y && { t: `결혼·짝 운이 들어오는 해(${g}): ${yrs(y)}` };
}
// 계획 한 줄 → 지금 분류에 맞춘 규칙 문장 (자유 생성 아님)
const START = /시작|신청|지원|계약|투자|매수|이사|이직|퇴사|등록|가입|대출|구매|창업/, PAPER = /계약|서류|비자|신청|등록|접수/;
function planComment(text, cls, M, k) {
  if (!text || !text.trim()) return '';
  const st = START.test(text), clash = M.rels.some(r => r.type === '충' || r.type === '형');
  let out = {
    push: st ? '밀고 갈 때라 시작하기 좋은 계획이에요.' : '밀고 갈 때예요. 한 걸음 더 나가는 목표를 하나 붙여도 좋아요.',
    guard: st ? '지킬 때라 크게 벌이기보다 작게 나눠 시작해 보세요.' : '지킬 때와 잘 맞는 계획이에요.',
    prep: st ? '준비할 때라 실행은 다음 흐름에 두고, 이번 달엔 준비 단계까지만 해 보세요.' : '준비할 때와 잘 맞는 계획이에요. 꾸준히만 하면 돼요.',
    rest: st ? '쉬어갈 때라 큰 시작은 미루고 정보만 모아 보세요.' : '쉬어갈 때라 양을 줄여도 괜찮아요.'
  }[cls];
  if (PAPER.test(text) && clash) out += ' 이번 달은 부딪히는 글자가 있어 서류·날짜를 두 번 확인하세요.';
  if (k === 'money' && /매수|매도|종목|코인|주식|레버리지/.test(text)) out += ' 종목·매매 시점은 이 앱이 판단하지 않아요.';
  return out;
}

// ── 문장 ──
const relMeaning = t => ({ 충: '서로 밀어내는 관계예요. 변화·이동이 생기기 쉬워요.', 형: '어긋나기 쉬운 관계예요. 서류·약속을 한 번 더 확인하면 좋아요.', 해: '작은 엇박자예요. 오해가 없게 말로 확인해요.', 육합: '서로 끌어당기는 관계예요. 도움과 인연이 붙어요.', 반합: '같은 방향으로 힘을 모으는 관계예요.', 삼합: '세 글자가 모여 힘이 크게 뭉쳐요.', 방합: '같은 계절끼리 뭉치는 관계예요.', '방합 완성': '같은 계절 세 글자가 다 모여 힘이 커요.', '같은 글자': '같은 글자라 서로의 방식이 닮았어요.' }[t] || '');
const NOTE = {
  pyeongwan: '일반 명리로는 편관(칠살)을 무조건 나쁘게 보지 않아요. 식신이 눌러 주거나 인성으로 이어지면 오히려 힘이 되는 글자로 봐요.',
  bokeum: '일반 명리로는 비견·겁재가 기운이 약한 사주엔 도움이 되고, 같은 간지가 겹치는 복음도 "되풀이·정체" 정도로 가볍게 봐요.',
  yongsin: '일반 명리로는 일간의 힘(신강·신약)과 격국을 함께 따져 용신을 정해요. 이 방식은 계절 온도 맞추기(조후)와 빠진 오행만 봐서 결과가 다를 수 있어요.',
  samjae: '일반 명리에서는 삼재를 보조 참고로만 봐요. 이 방식에서도 감점은 해마다 −1로 작아요.'
};
const note = t => `<p class="note">${I('info')}<span><b>일반 명리로는</b> ${esc(t.replace(/^일반 명리로는 /, ''))}</span></p>`;

function whyText(c, v) {
  const A = c.analysis, need = A.needed.map(elName).join('·');
  const d = v.daeun, nd = v.nextDaeun, Y = v.Y, dg = d ? `(대운 ${d.gz})` : '';
  const av = Y.notes.find(n => n.k === 'avoid'), br = Y.rels.find(r => r.s < 0);
  const yNeg = av ? `이미 많은 ${pl(av.t.replace('넘치는 ', ''))} 기운이 더 들어와서` : br ? `내 사주와 부딪히는 글자(${br.type})가 들어와서` : '기운이 엇갈려서';
  if (v.cls === 'prep' && v.prepBadge) return `10년 큰 흐름${dg}은 ${TEN_W(v.D.total) === '좋음' ? '좋아요' : '그대로예요'}. 그런데 내년(${v.nextY.gz}년) 운이 조금 거칠어요. 이 방식은 다음 해 운이 반년 전부터 미리 온다고 봐요. 그래서 지금은 새 일을 벌이기보다, 정리하고 점검하면서 내년을 준비할 때예요.`;
  switch (v.cls) {
    case 'push': return `${d ? d.startAge + '세부터 10년 동안 ' : ''}나에게 ${need ? `필요한 ${need}` : '맞는'} 기운이 들어와요${dg}. 올해 운(${Y.gz}년)도 잘 맞아요. 미뤄 둔 도전을 시작해 보세요. 결과는 ${v.year + 1}년에 더 또렷해져요.`;
    case 'guard': return `10년 큰 흐름${dg}은 좋아요. 하지만 올해(${Y.gz}년)는 ${yNeg} 무리하거나 부딪히기 쉬워요. 계약서·명의는 두 번 확인하세요. 새 일보다 지키는 쪽을 고르세요.`;
    case 'prep': return nd ? `${Math.max(1, nd.startYear - v.year)}년 뒤에 새 10년 흐름(대운 ${nd.gz})이 와요. 지금은 정리하고 실력을 쌓을 때예요. 안 쓰는 지출과 무리한 빚부터 줄여 두세요. 그러면 좋은 운을 먼저 받아요.` : '지금은 정리하고 실력을 쌓을 때예요.';
    default: return '10년 흐름과 올해 운이 모두 엇갈려요. 일을 넓히기보다 몸과 마음, 관계, 생활비를 먼저 챙기세요. 큰 결정은 조금 미뤄 보세요.';
  }
}
function daeunText(c, D, d) {
  const need = c.analysis.needed.map(elName).join('·');
  let t = D.total >= 1 ? `${d.startAge}세부터 10년 동안 나에게 ${need ? `필요한 ${need}` : '맞는'} 기운이 들어와요. 힘을 받기 좋은 10년이에요.` : D.total >= 0 ? `${d.startAge}세부터 10년은 크게 좋지도 나쁘지도 않은 무난한 시기예요.` : `${d.startAge}세부터 10년은 맞춰 가느라 힘이 드는 시기예요. 실력을 쌓는 시간으로 쓰면 좋아요.`;
  if (D.pyeongwan) t += ' 책임과 압박이 커지는 기운(편관)이 있어요. 예전 방식을 고집하기보다 내 자리와 역할을 새로 정해 보세요.';
  if (D.halfPeak) t += ` 다만 ${D.rels.find(r => r.type === '충').name.split(' ')[0]} 글자가 서로 부딪혀서(충) 성과에 잡음이 따를 수 있어요. 그래서 '반쪽 전성기'라고 불러요.`;
  return t;
}
function seunText(c, v) {
  const Y = v.Y, pos = uniqRels(Y.rels.filter(r => r.s > 0)), neg = uniqRels(Y.rels.filter(r => r.s < 0));
  const need = uniq(Y.notes.filter(n => n.k === 'need').map(n => pl(n.t.replace('필요한 ', '')))), over = uniq(Y.notes.filter(n => n.k === 'avoid').map(n => pl(n.t.replace('넘치는 ', ''))));
  const out = [Y.total >= 1 ? '나와 잘 맞는 해예요.' : Y.total >= 0 ? '무난한 해예요.' : '조금 까다로운 해예요.'];
  if (need.length) out.push(`나에게 필요한 ${need.join('·')} 기운이 들어와요.`);
  if (over.length) out.push(`이미 많은 ${over.join('·')} 기운이 더 들어와요. 한쪽으로 치우치지 않게 조심해요.`);
  if (pos.length) out.push(`내 사주와 힘을 모으는 글자가 있어요(${uniq(pos.map(r => r.type)).join('·')}).`);
  if (neg.length) out.push(`부딪히는 글자도 있어 조심할 부분이에요(${uniq(neg.map(r => r.type)).join('·')}).`);
  return out.join(' ') + ' 올해 한 일의 결과는 다음 해에 더 또렷해진다고 봐요.';
}
/** 다음 해 준비 배너: 남은 달과 다음 세운 시작일을 날짜로 계산 (입춘·설이 낀 달은 빼고 그 전 달까지) */
function prepBanner(v) {
  const now = kst(today()), end = kst(new Date(v.nextSeunStart.getTime() - 10 * 864e5)), a = [], b = [];
  for (let y = now.y, m = now.m; y < end.y || (y === end.y && m <= end.m); m === 12 ? (y++, m = 1) : m++) (y === now.y ? a : b).push(m);
  const span = l => l.length ? (l.length > 1 ? `${l[0]}–${l[l.length - 1]}월` : `${l[0]}월`) : '';
  const txt = [span(a), span(b)].filter(Boolean), months = txt.length > 1 ? `${josa(txt[0], '과/와')} ${txt[1]}` : txt[0];
  const st = md(v.nextSeunStart), how = db.settings.yearBoundary === 'seol' ? '설' : '입춘';
  return `<div class="banner flag">${I('flag')}<span><b>다음 해 준비</b> 남은 ${josa(months, '은/는')} 정리·점검 위주로 가요. 새해 운(${v.nextY.gz}년)은 ${st}(${how})부터예요.</span></div>`;
}
const calcBox = (rows, extra = '') => `<details class="calc"><summary>어떻게 계산했나요?</summary><div class="calc-b"><div class="parts num">${rows.map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</div>${extra}</div></details>`;

// ── 나침반 다이얼: 네 방향 = 네 가지 때, 바늘이 이번 달 쪽을 가리킴 ──
function dial(cls) {
  const C = 60, R = 53, ang = { push: 0, guard: 90, rest: 180, prep: 270 };
  const pt = (a, r) => [C + r * Math.sin(a * Math.PI / 180), C - r * Math.cos(a * Math.PI / 180)].map(n => n.toFixed(1));
  const arc = (a0, a1) => { const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R); return `M${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}`; };
  let s = `<svg class="dial" viewBox="0 0 120 120" role="img" aria-label="이번 달 나침반: ${S.CLASSES[cls].name}"><circle cx="${C}" cy="${C}" r="${R}" class="dial-ring"/>`;
  for (const k in ang) s += `<path d="${arc(ang[k] - 30, ang[k] + 30)}" class="dial-arc k-${k}${k === cls ? ' on' : ''}"/>`;
  for (const k in ang) { const [x, y] = pt(ang[k], 38); s += `<text x="${x}" y="${(+y + 3.8).toFixed(1)}" text-anchor="middle" class="dial-l k-${k}${k === cls ? ' on' : ''}">${CLS_SHORT[k]}</text>`; }
  return s + `<g class="needle k-${cls}" style="--a:${ang[cls]}deg"><path d="M60 37 L64.5 60 L55.5 60Z" class="n-hot"/><path d="M60 80 L64.5 60 L55.5 60Z" class="n-cold"/></g><circle cx="60" cy="60" r="3" class="n-hub"/></svg>`;
}

// ── 페이지: 나침반 ──
function emptyHome() {
  return `<div class="head"><h1>사주 나침반</h1><p>생년월일을 넣으면 지금의 흐름을 보여 드려요</p></div>
    <section class="card empty-state"><div class="ch"><h2>아직 저장된 정보가 없어요</h2></div>
    <p class="lead">정보는 이 기기에만 저장되고 어디로도 보내지 않아요. 홈 화면에 추가한 앱은 사파리와 저장 공간이 따로예요. 받은 가져오기 링크를 아래에 붙여 넣으면 바로 채워져요.</p>
    <form class="paste" id="pasteForm"><input type="url" id="pasteIn" placeholder="https://…/#import=…" aria-label="가져오기 링크 붙여넣기" autocomplete="off"><button class="btn" type="submit">${I('link')}가져오기</button></form>
    <button class="btn pri" data-act="add">${I('plus')}직접 입력하기</button></section>`;
}
const RD_K = (x, hi = 1, lo = 0) => x >= hi ? 'g' : x >= lo ? 'n' : 'b';
function periodsHtml(c, v) {
  const yv = S.yearView(c, v.year), Dd = v.D, d = v.daeun, nd = v.nextDaeun;
  return `<div class="periods">
    ${d ? `<section class="card period">
      <div class="ch"><h2>10년 흐름</h2><span class="sub num">${d.startYear}–${d.endYear} · ${d.startAge}–${d.endAge}세</span></div>
      <div class="pb"><div class="gz">${hz2(d.gz)}<span class="gzk">${S.ko(d.gz)} 대운</span><span class="rd rd-${RD_K(Dd.total)}">${TEN_W(Dd.total)}</span></div>
      <div class="pt"><p class="lead">${esc(daeunText(c, Dd, d))}</p>
      <details class="more"><summary>자세히</summary><p class="small gods">들어오는 기운: ${godTxt(Dd.gods[0])}, ${godTxt(Dd.gods[1])}</p>
        <div class="tags">${noteTags(Dd.notes)}${relTags(Dd.rels)}${nd ? `<span class="tag">다음 10년: ${nd.gz} ${nd.startYear}년부터</span>` : ''}</div>
        ${Dd.pyeongwan ? note(NOTE.pyeongwan) : ''}${Dd.bokeum ? note(NOTE.bokeum) : ''}</details></div></div>
    </section>` : ''}
    <section class="card period">
      <div class="ch"><h2>올해 흐름</h2><span class="sub num">${v.year}년</span>${clsPill(yv.cls)}</div>
      <div class="pb"><div class="gz">${hz2(v.Y.gz)}<span class="gzk">${S.ko(v.Y.gz)}년</span><span class="rd rd-${RD_K(v.Y.total)}">${YEAR_W(v.Y.total)}</span></div>
      <div class="pt"><p class="lead">${esc(seunText(c, yv))}</p>
      <details class="more"><summary>자세히</summary><p class="small gods">들어오는 기운: ${godTxt(v.Y.gods[0])}, ${godTxt(v.Y.gods[1])}</p>
        <div class="tags">${noteTags(v.Y.notes)}${relTags(v.Y.rels)}<span class="tag">다음 해 ${v.nextY.gz}: ${NEXT_W(v.nextY.total)}</span></div>
        ${v.Y.pyeongwan ? note(NOTE.pyeongwan) : v.Y.bokeum ? note(NOTE.bokeum) : ''}</details></div></div>
    </section>
  </div>`;
}
/** 지금 → 다음 바뀌는 때 한 줄 (12개월 분류에서 계산) */
function nextTurn(ms) {
  const a = ms[0], b = ms.find(m => m.cls !== a.cls), now = kst(today());
  if (!b) return `<b>지금은 ${S.CLASSES[a.cls].name}</b> · 앞으로 12개월 그대로예요`;
  const k = kst(b.start);
  return `<b>지금은 ${S.CLASSES[a.cls].name}</b> → ${k.y > now.y ? '내년 ' : ''}${k.m}월 ${k.d}일부터 ${S.CLASSES[b.cls].name}`;
}
const WEEKDAY = '일월화수목금토';
function areaRow(a, plans) {
  const plan = plans[a.k] || '';
  return `<button type="button" class="area" id="ar-${a.k}" data-act="area" data-k="${a.k}" aria-haspopup="dialog"><span class="aic">${I(AREA_ICON[a.k])}</span><span class="atx"><span class="an">${esc(area(a.k))}</span><span class="aline">${esc(a.line)}</span><span class="aplan" id="ap-${a.k}">${plan ? '내 계획: ' + esc(plan) : ''}</span></span><span class="chev" aria-hidden="true"></span></button>`;
}
/** 영역 한 줄을 누르면: 할 일 2 · 피할 일 2 · 참고 · 이번 달 내 계획 */
function openArea(k) {
  const p = me(), c = chartOf(p), v = S.now(c, today(), opts()), a = lifeAdvice(c, v.M, v.cls).find(x => x.k === k), plan = plansOf(v, p)[k] || '';
  sheet(`<div class="top"><div><p class="sub">이번 달 · ${S.CLASSES[v.cls].name}</p><h2 id="sheetTitle">${esc(area(k))}</h2></div>${closeBtn()}</div>
    <p class="lead area-l k-${v.cls}">${esc(a.line)}</p>
    <ul class="dos">${a.dos.map(t => `<li class="do">${I('check')}<span class="lbl">할 일</span><span>${esc(t)}</span></li>`).join('')}${a.donts.map(t => `<li class="dont">${I('x')}<span class="lbl">피할 일</span><span>${esc(t)}</span></li>`).join('')}</ul>
    ${a.ctx ? `<p class="note">${I('info')}<span>${esc(a.ctx.t)}</span></p>${a.ctx.link ? `<a class="btn sm" href="${a.ctx.link[0]}" data-act="close">${I('calendar')}${a.ctx.link[1]}</a>` : ''}` : ''}
    <label class="plan"><span>이번 달 내 계획</span><input type="text" maxlength="80" data-plan="${k}" value="${esc(plan)}" placeholder="예: ${esc(PLAN_EX[k])}"></label>
    <p class="plan-c" id="pc-${k}" aria-live="polite">${esc(planComment(plan, v.cls, v.M, k))}</p>`);
}
const verdictTags = v => [v.attack && `<span class="tag">${I('target')}공격 타이밍: 부딪쳐도 되는 해, 결과는 내년</span>`, v.D && v.D.halfPeak && '<span class="tag">반쪽 전성기</span>', v.Y.samjae && '<span class="tag bad">삼재 해</span>'].filter(Boolean);
/** 왜 이렇게 볼까요: 쉬운 이유 → (계산 보기) 점수 */
function openWhy() {
  const p = me(), c = chartOf(p), v = S.now(c, today(), opts()), M = v.M, Dd = v.D, tags = verdictTags(v);
  sheet(`<div class="top"><div><p class="sub">이번 달 ${md(v.monthStart)}–${md(new Date(v.monthEnd.getTime() - 864e5))} · ${gzKo(M.gz)}월</p><h2 id="sheetTitle">왜 ${S.CLASSES[v.cls].name}일까요</h2></div>${closeBtn()}</div>
    <p class="lead">${esc(whyText(c, v))}</p>${tags.length ? `<div class="tags">${tags.join('')}</div>` : ''}
    ${readingChips(Dd ? Dd.total : 0, v.Y.total, v.nextY.total)}
    ${calcBox([['대운(10년)', sgn(Dd ? Dd.total : 0)], ['세운(올해)', sgn(v.Y.total)], ['월운(이번 달)', sgn(M.total)], ['올해+이번 달', sgn(v.near)], ['합친 점수', sgn(v.S)]], '<p class="small">분류는 대운과 "올해+이번 달"(세운 0.35 : 월운 0.10)로 정해요. 흐름 탭의 해 점수는 올해 세운만 써서 숫자가 달라요. 합친 점수 = 대운 0.55 + 세운 0.35 + 월운 0.10.</p>')}`);
}
function pageHome() {
  const p = me();
  if (!p) return emptyHome();
  const c = chartOf(p); if (!c) return errCard(p);
  const v = S.now(c, today(), opts()), M = v.M, adv = lifeAdvice(c, M, v.cls), Dd = v.D;
  const ms = S.months(c, today(), 12, opts()), k = kst(today()), mEnd = new Date(v.monthEnd.getTime() - 864e5);
  const plans = plansOf(v, p);
  return `<div class="head"><h1>${esc(p.name)}의 나침반</h1><p>${k.m}월 ${k.d}일 ${WEEKDAY[new Date(k.y, k.m - 1, k.d).getDay()]}요일</p></div>
  <div class="hgrid">
  <section class="card verdict k-${v.cls}" aria-label="이번 달 흐름">
    <div class="compass"><div class="verdict-t"><p class="vk">이번 달은 <span class="num">${md(v.monthStart)}–${md(mEnd)}</span></p><h2>${S.CLASSES[v.cls].name}</h2><p class="vsub">${SUB(v.cls, v.base)}</p></div>${dial(v.cls)}</div>
    ${readingChips(Dd ? Dd.total : 0, v.Y.total, v.nextY.total)}
    ${v.prepBadge ? prepBanner(v) : ''}
    <button type="button" class="linkbtn" data-act="why" aria-haspopup="dialog">왜 이렇게 볼까요${I('chev', 'i chev-r')}</button>
  </section>
  <section class="card todo k-${v.cls}" aria-labelledby="actsT"><div class="ch"><h2 id="actsT">이번 달 이렇게 해요</h2></div>
    <div class="alist">${adv.map(a => areaRow(a, plans)).join('')}</div>
  </section>
  </div>
  <div class="hgrid">${todayCard(c, p)}${T ? tarotCard(c, p) : ''}</div>
  <details class="card fold"><summary class="ch"><h2>앞으로 12개월</h2><span class="bar strip" aria-hidden="true">${ms.map(m => `<i class="k-${m.cls}"></i>`).join('')}</span><span class="sub">${esc(monthsSentence(ms, v))}</span></summary>
    <div class="mlist">${ms.map(m => `<div><b class="num">${m.y % 100}.${String(m.m).padStart(2, '0')}</b>${hz2(m.gz)}${clsPill(m.cls)}</div>`).join('')}</div>
  </details>`;
}
const PLAN_EX = { move: '비자 서류 목록 만들기', career: '모의고사 2회 풀기', money: '고정비 3개 줄이기', family: '예식장 계약서 확인' };
const planKey = (v, p) => { const k = kst(v.monthStart), m = `${k.y}-${String(k.m).padStart(2, '0')}`; return p ? p.id + '|' + m : m; };
const plansOf = (v, p) => db.plans[planKey(v, p)] || (p.role === 'me' && db.plans[planKey(v)]) || {};
function monthsSentence(ms, v) {
  const runs = [];
  for (const m of ms) { const l = runs[runs.length - 1]; if (l && l.cls === m.cls) l.n++; else runs.push({ cls: m.cls, n: 1, start: m.start }); }
  const ys = uniq(ms.map(m => m.Y.total)), yw = ys.every(x => x < 0) ? '엇갈려서' : ys.every(x => x >= 1) ? '좋아서' : '섞여 있어서';
  const tw = TEN_W(v.D ? v.D.total : 0), why = `10년 흐름은 ${tw === '좋음' ? '좋고' : tw === '보통' ? '보통이고' : '버겁고'}, 올해·내년 운이 ${yw} 그래요.`;
  if (runs.length === 1) return `앞으로 12개월 모두 ${S.CLASSES[runs[0].cls].name}예요. ${why}`;
  return `${runs.slice(0, 3).map((r, i) => `${i ? md(r.start) + '부터는' : '지금은'} ${S.CLASSES[r.cls].name}`).join(', ')}${runs.length > 3 ? ' …' : ''}예요. ${why}`;
}

// ── 페이지: 흐름 ──
let FLOW = null;
function pageFlow() {
  const p = me(); if (!p) return emptyHome();
  const c = chartOf(p); if (!c) return errCard(p);
  const v = S.now(c, today(), opts());
  const years = []; for (let Y = 2024; Y <= 2040; Y++) years.push(S.yearView(c, Y));
  const ms = S.months(c, today(), 12, opts());
  FLOW = { years, ms, cur: v.year };
  const dl = c.daeun.list.slice(0, 8), dS = dl.map(d => S.component(c, d.gz, 'daeun').total), mx = Math.max(1, ...dS.map(Math.abs));
  const dk = s => s >= 1 ? 'push' : s >= 0 ? 'prep' : 'guard';
  const sjPush = years.filter(y => y.samjae && y.cls === 'push').map(y => y.year);
  const span = l => { const runs = []; for (const y of l) { const r = runs[runs.length - 1]; if (r && y === r[1] + 1) r[1] = y; else runs.push([y, y]); } return runs.map(([a, b]) => a === b ? String(a) : `${a}–${String(b).slice(2)}`).join('·'); };
  const best = years.reduce((a, y) => y.Y.total > a.Y.total ? y : a), worst = years.reduce((a, y) => y.Y.total < a.Y.total ? y : a), curY = years.find(y => y.year === v.year);
  const yAria = `해마다 올해 기운 선 그래프 2024–2040. 가장 좋은 해 ${best.year} ${best.Y.gz}, 가장 낮은 해 ${worst.year} ${worst.Y.gz}${curY ? `, 올해 ${curY.year} ${curY.Y.gz} ${S.CLASSES[curY.cls].name}` : ''}`;
  const mb = ms.reduce((a, m) => m.near > a.near ? m : a), mw = ms.reduce((a, m) => m.near < a.near ? m : a);
  const mAria = `앞으로 12개월 막대 그래프. 가장 좋은 달 ${mb.m}월 ${mb.gz}, 가장 낮은 달 ${mw.m}월 ${mw.gz}`;
  return `<div class="head"><h1>흐름</h1><p>10년 흐름부터 오늘까지 차례로 봐요</p></div>
  <p class="turn k-${ms[0].cls}">${I('compass')}<span>${nextTurn(ms)}</span></p>
  ${periodsHtml(c, v)}
  <section class="card"><div class="ch"><h2>10년마다 바뀌는 흐름</h2><span class="sub">${c.daeun.su}세부터 10년마다 바뀌어요(대운)</span></div>
    <div class="dae">${dl.map((d, i) => `<button data-act="daeun" data-i="${i}" class="k-${dk(dS[i])}" aria-label="${d.gz} 대운 ${d.startYear}년부터 ${d.startAge}세, 10년 흐름 ${TEN_W(dS[i])}"${v.daeun && v.daeun.gz === d.gz ? ' aria-current="true"' : ''}>${hz2(d.gz)}<span class="da num">${d.startAge}세</span><span class="bar"><i style="width:${Math.round(Math.abs(dS[i]) / mx * 100)}%"></i></span><span class="dw">${TEN_W(dS[i])}</span></button>`).join('')}</div>
    <details class="calc"><summary>어떻게 계산했나요?</summary><p class="small">대운이 바뀌는 나이(대운수) ${c.daeun.su}세 · ${c.daeun.forward ? '앞으로 도는 순서(순행)' : '거꾸로 도는 순서(역행)'} · 나이는 태어나자마자 1살로 세요(세는나이). 막대 길이는 그 10년의 점수예요.</p></details>
  </section>
  <section class="card"><div class="ch"><h2>해마다 흐름</h2><span class="sub">2024–2040년. 점이나 아래 해를 누르면 이유가 나와요</span></div>
    ${sjPush.length ? `<p class="note">${I('info')}<span>삼재(${span(sjPush)})는 참고만 해요. 그해엔 계약·서류만 한 번 더 확인하세요.</span></p>` : ''}
    <div class="chart" data-chart="years" role="img" aria-label="${esc(yAria)}"></div>
    <div class="legend">${['push', 'guard', 'prep', 'rest'].map(k => `<span class="k-${k}"><i></i>${S.CLASSES[k].name}</span>`).join('')}<span><i class="sj"></i>삼재</span><span class="lg-prep"><b class="lg-mk">준비</b>다음 해 준비 표시</span></div>
    <div class="years" role="list">${years.map(y => `<button class="yr k-${y.cls}" role="listitem" data-act="year" data-y="${y.year}" aria-label="${y.year}년 ${y.Y.gz} ${S.CLASSES[y.cls].name}, 올해 ${YEAR_W(y.Y.total)}${y.samjae ? ', 삼재' : ''}"${y.year === v.year ? ' aria-current="true"' : ''}><b class="num">${y.year}</b>${hz2(y.Y.gz)}<span class="yc">${CLS_SHORT[y.cls]}</span><span class="sj">${y.samjae ? '삼재' : ''}</span></button>`).join('')}</div>
  </section>
  <section class="card"><div class="ch"><h2>앞으로 12개월</h2><span class="sub">${esc(monthsSentence(ms, v))}</span></div>
    <div class="chart" data-chart="months" role="img" aria-label="${esc(mAria)}"></div>
    <div class="legend">${uniq(ms.map(m => m.cls)).map(k => `<span class="k-${k}"><i></i>${S.CLASSES[k].name}</span>`).join('')}</div>
    <details class="calc"><summary>어떻게 계산했나요?</summary><p class="small">막대는 그달의 기운이에요. 올해 운과 그달 운을 섞어서 계산해요(세운 0.35 : 월운 0.10). 달은 절기로 나눠요.</p></details>
  </section>
  ${weekStrip(c)}`;
}
function drawCharts() {
  if (!FLOW) return;
  for (const el of document.querySelectorAll('[data-chart]')) {
    const w = Math.max(280, el.clientWidth);
    el.innerHTML = el.dataset.chart === 'years' ? yearChart(w) : monthChart(w);
  }
  for (const el of document.querySelectorAll('.lg-prep')) el.hidden = (document.querySelector('[data-chart="years"]') || {}).clientWidth < 520;
}
const niceStep = (span, n) => [1, 2, 5, 10].find(x => span / x <= n) || 10;
function yearChart(w) {
  const ys = FLOW.years, h = 236, l = 34, r = 14, t = 22, b = 40, vals = ys.map(y => y.Y.total);
  const lo = Math.min(-1, Math.floor(Math.min(...vals))), hi = Math.max(1, Math.ceil(Math.max(...vals)));
  const pad = 16, X = i => l + pad + i * (w - l - r - 2 * pad) / (ys.length - 1), Yp = v => t + (hi - v) * (h - t - b) / (hi - lo), step = (w - l - r - 2 * pad) / (ys.length - 1);
  let s = `<svg viewBox="0 0 ${w} ${h}" height="${h}">`;
  ys.forEach((y, i) => { if (!y.samjae) return; const x0 = Math.max(l, X(i) - step / 2), x1 = Math.min(w - r, X(i) + step / 2); s += `<rect class="band" x="${x0}" y="${t}" width="${x1 - x0}" height="${h - t - b}"/>`; });
  const stp = niceStep(hi - lo, 4);
  for (let v = Math.ceil(lo / stp) * stp; v <= hi; v += stp) s += `<line class="grid-l" x1="${l}" x2="${w - r}" y1="${Yp(v)}" y2="${Yp(v)}"/><text class="ax" x="${l - 6}" y="${Yp(v) + 4}" text-anchor="end">${v}</text>`;
  s += `<line class="zero" x1="${l}" x2="${w - r}" y1="${Yp(0)}" y2="${Yp(0)}"/>`;
  s += `<path class="ln" d="${ys.map((y, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Yp(y.Y.total).toFixed(1)).join('')}"/>`;
  const every = w < 520 ? 4 : w < 820 ? 2 : 1;
  ys.forEach((y, i) => {
    const cur = y.year === FLOW.cur, cy = Yp(y.Y.total);
    s += `<g class="hit k-${y.cls}" data-act="year" data-y="${y.year}"><title>${y.year} ${y.Y.gz} · ${S.CLASSES[y.cls].name} · 올해 ${YEAR_W(y.Y.total)}${y.samjae ? ' · 삼재' : ''}</title><rect x="${Math.max(0, X(i) - step / 2)}" y="${t}" width="${step}" height="${h - t}" fill="transparent"/>`;
    s += `<circle class="dotc" cx="${X(i)}" cy="${cy}" r="${cur ? 7 : 5}" fill="var(--k)" stroke="var(--card)" stroke-width="2"/>`;
    if (cur) s += `<circle class="ring" cx="${X(i)}" cy="${cy}" r="11" fill="none" stroke="var(--k)" stroke-width="1.5"/>`;
    if (y.prepBadge && w >= 520) s += `<text class="mk" x="${X(i)}" y="${cy - (cur ? 16 : 11)}" text-anchor="middle">준비</text>`;
    if (i % every === 0 || cur) s += `<text class="ax" x="${X(i)}" y="${h - b + 16}" text-anchor="middle" font-weight="${cur ? 700 : 400}">${w < 520 ? "'" + String(y.year).slice(2) : y.year}</text>`;
    if (y.samjae && (i % every === 0 || w >= 520)) s += `<text class="ax" x="${X(i)}" y="${h - b + 31}" text-anchor="middle" font-size="10">삼재</text>`;
    s += '</g>';
  });
  return s + '</svg>';
}
function monthChart(w) {
  const ms = FLOW.ms, h = 214, l = 30, r = 6, t = 26, b = 40, vals = ms.map(m => m.near);
  const lo = Math.min(0, Math.floor(Math.min(...vals))), hi = Math.max(0, Math.ceil(Math.max(...vals)));
  const bw = (w - l - r) / ms.length, Yp = v => t + (hi - v) * (h - t - b) / ((hi - lo) || 1), small = bw < 40;
  let s = `<svg viewBox="0 0 ${w} ${h}" height="${h}">`;
  const stp = niceStep(hi - lo, 3);
  for (let v = Math.ceil(lo / stp) * stp; v <= hi; v += stp) s += `<line class="grid-l" x1="${l}" x2="${w - r}" y1="${Yp(v)}" y2="${Yp(v)}"/><text class="ax" x="${l - 6}" y="${Yp(v) + 4}" text-anchor="end">${v}</text>`;
  ms.forEach((m, i) => {
    const x = l + i * bw + 2, bwi = Math.max(4, bw - 4), cx = x + bwi / 2, y0 = Yp(0), y1 = Yp(m.near), top = Math.min(y0, y1), hh = Math.max(2, Math.abs(y1 - y0));
    s += `<g class="k-${m.cls}"><title>${m.y}.${m.m} ${m.gz} · ${S.CLASSES[m.cls].name}</title><rect x="${x}" y="${top}" width="${bwi}" height="${hh}" rx="4" fill="var(--k)"/></g>`;
    s += `<text class="cl k-${m.cls}" x="${cx}" y="${t - 8}" text-anchor="middle" fill="var(--k)"${small ? ' font-size="9.5"' : ''}>${CLS_SHORT[m.cls]}</text>`;
    s += `<text class="ax" x="${cx}" y="${h - b + 15}" text-anchor="middle">${small ? m.m : m.m + "월"}</text><text class="ax hzx" x="${cx}" y="${h - b + 30}" text-anchor="middle">${small ? m.gz[1] : m.gz}</text>`;   // 좁으면 월지만
  });
  return s + `<line class="zero" x1="${l}" x2="${w - r}" y1="${Yp(0)}" y2="${Yp(0)}"/></svg>`;
}

// ── 시트: 해 자세히 / 대운 자세히 ──
function relList(rels) {
  const u = uniqRels(rels);
  if (!u.length) return '<p class="small">내 사주와 특별히 얽히는 글자는 없어요.</p>';
  return `<ul class="rels">${u.map(r => `<li><b>${esc(relTxt(r))}</b><span>${esc(r.palace ? `내 ${josa(spot(r.palace), '과/와')} 만나요. ` : '')}${esc(relMeaning(r.type))}</span></li>`).join('')}</ul>`;
}
const PN = { element: '오행', relations: '지지 관계', tenGod: '십성', shinsal: '신살', stage: '12운성' };
const partsRows = x => Object.entries(x.parts).map(([k, v]) => [PN[k], sgn(v)]);
const godsLine = gs => `<p class="small gods">들어오는 기운: ${godTxt(gs[0])}, ${godTxt(gs[1])}</p>`;
function openYear(Y) {
  const c = chartOf(me()), y = S.yearView(c, Y), x = y.Y;
  sheet(`<div class="top"><div><p class="sub">${Y}년 · 10년 흐름 ${y.daeun ? y.daeun.gz : '-'}</p><h2 id="sheetTitle">${hz2(x.gz)} ${S.ko(x.gz)}년</h2></div>${closeBtn()}</div>
    <div class="tags">${clsPill(y.cls)}<span class="tag">${SUB(y.cls, y.base)}</span>${y.samjae ? '<span class="tag bad">삼재</span>' : ''}${y.attack ? `<span class="tag">${I('target')}공격 타이밍</span>` : ''}${y.prepBadge ? `<span class="tag">${I('flag')}7월부터 다음 해 준비</span>` : ''}</div>
    ${readingChips(y.D ? y.D.total : 0, x.total, y.nextY.total)}
    <p class="lead">${esc(seunText(c, y))}</p>
    ${godsLine(x.gods)}<div class="tags">${noteTags(x.notes)}</div>
    <h3>내 사주와 만나는 글자</h3>${relList(x.rels)}
    ${y.attack ? `<p class="note">${I('target')}<span>내 사주에 손잡는 글자(합)가 많은데, 올해 부딪히는 글자(충·형)가 들어와요. 이 방식은 "부딪쳐도 되는 해, 결과는 내년"으로 봐요. 꼭 싸우라는 뜻은 아니에요.</span></p>` : ''}
    ${y.samjae ? note(NOTE.samjae) : ''}${x.pyeongwan ? note(NOTE.pyeongwan) : ''}${x.bokeum ? note(NOTE.bokeum) : ''}
    ${calcBox([...partsRows(x), ['세운 합계', sgn(x.total)], ['대운', sgn(y.D ? y.D.total : 0)], ['다음 해', sgn(y.nextY.total)]], '<p class="small">이 해의 분류는 대운과 그해 세운으로 정해요. 나침반 탭은 이번 달(월운)까지 넣어서 숫자가 조금 달라요.</p>')}`);
}
function openDaeun(i) {
  const c = chartOf(me()), d = c.daeun.list[i], D = S.component(c, d.gz, 'daeun');
  sheet(`<div class="top"><div><p class="sub">${d.startYear}–${d.endYear}년 · ${d.startAge}–${d.endAge}세</p><h2 id="sheetTitle">${hz2(d.gz)} ${S.ko(d.gz)} 대운</h2></div>${closeBtn()}</div>
    <div class="tags"><span class="tag">10년 흐름 ${TEN_W(D.total)}</span><span class="tag">${stageTxt(D.stage)}</span>${D.halfPeak ? '<span class="tag">반쪽 전성기</span>' : ''}${noteTags(D.notes)}</div>
    <p class="lead">${esc(daeunText(c, D, d))}</p>${godsLine(D.gods)}<h3>내 사주와 만나는 글자</h3>${relList(D.rels)}
    ${D.pyeongwan ? note(NOTE.pyeongwan) : ''}${D.bokeum ? note(NOTE.bokeum) : ''}
    ${calcBox([...partsRows(D), ['대운 합계', sgn(D.total)]])}`);
}
const closeBtn = () => `<button class="x" data-act="close" aria-label="닫기">${I('x')}</button>`;
function sheet(html, skip) { const d = $('#sheet'); d.innerHTML = `<div class="sh">${html}</div>`; linkTerms($('#sheet .sh'), skip); if (!d.open) d.showModal(); d.scrollTop = 0; }

// ── 오늘의 일진 ──
const DAY_NAME = { good: '좋은 날', ok: '무난한 날', care: '조심할 날' };
const DAY_K = { good: 'prep', ok: 'rest', care: 'guard' };
const DAY_LINE = {
  good: { push: '오늘은 기운이 좋아요. 미뤄 둔 일을 하나 시작해 보세요.', guard: '오늘은 기운이 좋아요. 그래도 새 일보다 하던 일을 단단히 하는 날이에요.', prep: '오늘은 기운이 좋아요. 그래도 큰 결정보다 준비한 걸 실행하는 날이에요.', rest: '오늘은 기운이 좋아요. 무리하지 말고 가볍게 한 가지만 해요.' },
  ok: { push: '무난한 날이에요. 계획대로 한 걸음씩 가요.', guard: '무난한 날이에요. 하던 일을 지키며 정리해요.', prep: '무난한 날이에요. 준비 목록에서 하나를 끝내 보세요.', rest: '무난한 날이에요. 쉬어 가도 괜찮아요.' },
  care: { push: '조금 조심할 날이에요. 큰 흐름은 좋으니 오늘만 속도를 늦춰요.', guard: '조금 조심할 날이에요. 계약·말다툼은 하루 미뤄요.', prep: '조금 조심할 날이에요. 새 일은 미루고 점검만 해요.', rest: '조금 조심할 날이에요. 일찍 쉬어 가요.' }
};
const DAY_TPL = {
  move: { 비겁: ['같은 길 가는 사람과 정보 나누기', '남과 비교하며 조급해하기'], 식상: ['이주 관련 메일·글 하나 쓰기', '말로만 약속하기'], 재성: ['정착 비용 한 항목 계산하기', '충동적인 큰 결제'], 관성: ['서류 마감일 확인하기', '규정을 짐작으로 넘기기'], 인성: ['필요한 서류 하나 발급·정리하기', '정보만 보고 미루기'] },
  career: { 비겁: ['동료와 진도 맞추기', '경쟁심에 무리하기'], 식상: ['문제 풀이·실습 한 세트', '이론만 읽고 끝내기'], 재성: ['공부 시간 예산 짜기', '공부 시간을 다른 일에 내주기'], 관성: ['시험·지원 일정 확인하기', '마감 직전 몰아치기'], 인성: ['기초 개념 복습하기', '자료만 모으고 안 보기'] },
  money: { 비겁: ['오늘 지출 기록하기', '돈 빌려주기·공동 투자 약속'], 식상: ['돈 원칙 한 줄 다시 읽기', '기분 따라 소비하기'], 재성: ['통장·고정비 한 번 훑어보기', '계획 없는 충동 매수'], 관성: ['세금·납부 일정 확인하기', '압박감에 서두른 결정'], 인성: ['약관·계약서 꼼꼼히 읽기', '남이 권한 상품에 그대로 가입하기'] },
  family: { 비겁: ['둘만의 시간 30분 내기', '주변 말로 상대 판단하기'], 식상: ['고마운 점 한 가지 말하기', '농담처럼 던지는 날 선 말'], 재성: ['함께 쓸 돈 이야기 짧게 나누기', '큰 지출 혼자 정하기'], 관성: ['약속·일정 미리 맞추기', '피곤할 때 중요한 대화'], 인성: ['상대 이야기 끝까지 듣기', '생각만 하고 표현 안 하기'] }
};
const LUCKY = ['초록', '빨강', '노랑', '흰색·은색', '검정·남색'];
const wkOf = ymd => '일월화수목금토'[new Date(ymd + 'T12:00:00').getDay()];
const mdOf = ymd => `${+ymd.slice(5, 7)}월 ${+ymd.slice(8)}일`;
function dayGist(dv) {
  const D = dv.D, parts = [`${josa(godTxt(D.gods[0]), '이/가')} 도는 날이에요.`];
  const need = uniq(D.notes.filter(n => n.k === 'need').map(n => pl(n.t.replace('필요한 ', '')))), over = uniq(D.notes.filter(n => n.k === 'avoid').map(n => pl(n.t.replace('넘치는 ', ''))));
  if (need.length) parts.push(`필요한 ${need.join('·')} 기운이 들어와요.`);
  if (over.length) parts.push(`이미 많은 ${over.join('·')} 기운은 조심해요.`);
  const good = uniqRels(D.rels.filter(r => r.s > 0)), bad = uniqRels(D.rels.filter(r => r.s < 0));
  if (good.length) parts.push(`내 사주와 손잡는 글자가 있어요(${uniq(good.map(r => r.type)).join('·')}).`);
  if (bad.length) parts.push(`부딪히는 글자도 있어서 말과 약속을 한 번 더 살펴요(${uniq(bad.map(r => r.type)).join('·')}).`);
  return parts.join(' ');
}
function dayBlock(c, dv, cls, opts2 = {}) {
  const g = dv.D.gods[0].group, A = c.analysis;
  const why = h => h.rel ? REL_GL[h.rel.type] : h.need != null ? `필요한 ${EL_PLAIN[h.need]} 기운` : '';   // 시트에서만 이유까지
  const hrs = dv.hours.map(h => `<span class="tag"><span class="num">${h.from}–${h.to}</span>${opts2.open ? ` ${h.branch}시${why(h) ? ' · ' + why(h) : ''}` : ''}</span>`).join('');
  const body = `<p class="gist">${esc(dayGist(dv))}</p>
    <ul class="today-areas">${['move', 'career', 'money', 'family'].map(k => `<li><b>${I(AREA_ICON[k])}${esc(area(k))}</b><span class="do">${I('check')}${esc(DAY_TPL[k][g][0])}</span><span class="dont">${I('x')}${esc(DAY_TPL[k][g][1])}</span></li>`).join('')}</ul>
    ${A.needed.length ? `<p class="small lucky">행운 색(재미로) ${A.needed.map(e => `<span><i class="dot e-${ELC[e]}"></i>${LUCKY[e]}</span>`).join('')}</p>` : ''}`;
  return `<p class="lead">${esc(DAY_LINE[dv.label][cls])}</p>${hrs ? `<div class="today-hrs"><span class="small">잘 맞는 시간</span>${hrs}</div>` : ''}
    ${opts2.open ? `<div class="day-b">${body}</div>` : `<button type="button" class="linkbtn" data-act="day" data-d="${dv.ymd}" aria-haspopup="dialog">오늘 할 일·피할 일 보기${I('chev', 'i chev-r')}</button>`}`;
}
function todayCard(c, p) {
  const dv = S.dayView(c, today(), { sect: db.settings.sect }), cls = S.now(c, today(), opts()).cls;
  return `<section class="card today" id="todayCard"><div class="ch"><h2>오늘</h2><span class="sub">${mdOf(dv.ymd)} (${wkOf(dv.ymd)})</span><span class="cls k-${DAY_K[dv.label]}">${DAY_NAME[dv.label]}</span></div>
    ${dayBlock(c, dv, cls)}</section>`;
}
function weekStrip(c) {
  const t0 = today(), days = [];
  for (let k = -3; k <= 3; k++) { const d = new Date(t0.getTime() + k * 864e5), dv = S.dayView(c, d, { sect: db.settings.sect }); days.push({ dv, k }); }
  return `<section class="card weekc"><div class="ch"><h2>오늘 앞뒤 7일</h2><span class="sub">날을 누르면 그날의 할 일·피할 일이 보여요</span></div>
    <div class="week">${days.map(({ dv, k }) => `<button data-act="day" data-d="${dv.ymd}" class="k-${DAY_K[dv.label]}"${k === 0 ? ' aria-current="date"' : ''} aria-label="${mdOf(dv.ymd)} ${wkOf(dv.ymd)}요일 ${dv.gz}일 ${DAY_NAME[dv.label]}"><span class="wd">${k === 0 ? '오늘' : wkOf(dv.ymd)}</span><b class="num">${+dv.ymd.slice(8)}</b>${hz2(dv.gz)}<span class="dl">${DAY_NAME[dv.label].replace(' 날', '')}</span></button>`).join('')}</div></section>`;
}
function openDay(ymd) {
  const c = chartOf(me()), at = new Date(ymd + 'T12:00:00+09:00'), dv = S.dayView(c, at, { sect: 2 }), cls = S.now(c, at, opts()).cls;
  sheet(`<div class="top"><div><p class="sub">${mdOf(ymd)} (${wkOf(ymd)}) · 이번 달 ${S.CLASSES[cls].name}</p><h2 id="sheetTitle">${hz2(dv.gz)} ${S.ko(dv.gz)}일</h2></div>${closeBtn()}</div>
    <div class="tags"><span class="cls k-${DAY_K[dv.label]}">${DAY_NAME[dv.label]}</span></div>${dayBlock(c, dv, cls, { open: true })}
    ${calcBox([...partsRows(dv.D), ['일진 합계', sgn(dv.D.total)]], '<p class="small">+1 이상 좋은 날, −1 이상 무난한 날, 그 아래는 조심할 날. 일진은 대운·세운 점수에 섞지 않고 따로 봐요.</p>')}`);
}

// ── 타로 ──
const T = window.Tarot;
const SUIT_IC = { w: 'flame', c: 'droplet', s: 'sword', p: 'coin' };
function cardFace(d, cls = '') {
  const c = T.byId[d.id];
  return `<figure class="tcard e-${ELC[c.el]}${d.rev ? ' rev' : ''} ${cls}" role="img" aria-label="${esc(c.name)}${d.rev ? '(역방향)' : ''}"><img src="tarot/${c.id}.webp" alt="" width="150" height="258" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('fb')">
    <div class="tfb" aria-hidden="true"><span class="tn">${c.numeral}</span>${I(c.major ? 'sparkle' : SUIT_IC[c.suit])}<b>${esc(c.name)}</b><span>${esc(c.en)}</span></div></figure>`;
}
const tarotOf = () => { db.tarot = db.tarot || {}; db.tarot.daily = db.tarot.daily || {}; db.tarot.history = db.tarot.history || []; db.tarot.log = db.tarot.log || []; return db.tarot; };
const myHist = () => tarotOf().history.map((h, i) => ({ h, i })).filter(x => !x.h.pid || x.h.pid === me().id);
const rngCrypto = () => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; };
const tMethod = () => T.METHODS[db.settings.tarotMethod] || T.METHODS.rws;
const ROLE_LINE = '사주는 큰 흐름(대운·세운), 타로는 지금 이 질문의 가까운 흐름이에요.';
const creditNote = () => tMethod().credit ? `<p class="small credit">${esc(tMethod().credit)}</p>` : '';
function tarotCard(c, p) {
  const ymd = S.dayView(c, today(), { sect: db.settings.sect }).ymd, got = ((tarotOf().daily[p.id] || {})[ymd]);
  if (!got) return `<section class="card tarot-today" id="tarotCard"><div class="ch"><h2>오늘의 카드</h2><span class="sub">하루 한 장 · 뽑으면 오늘은 바뀌지 않아요</span></div>
    <div class="tdraw undrawn"><div class="tback" aria-hidden="true">${I('sparkle')}</div><div class="tmain"><p class="lead">오늘 하루를 떠올리며 한 장을 뽑아 보세요.</p>
      <div class="btns"><button class="btn pri" data-act="tdraw">${I('sparkle')}한 장 뽑기</button><button class="btn" data-act="tthree">질문으로 보기</button></div></div></div></section>`;
  const cardD = tMethod().reversed ? got : { ...got, rev: false };     // 정회도 방식이면 예전에 뽑은 역방향도 바로 세워 보여 줌
  const f = T.face(cardD), dv = S.dayView(c, today(), { sect: db.settings.sect }), cls = S.now(c, today(), opts()).cls;
  const pol = tMethod().polar ? T.polarity(got.id, 0) : null;
  return `<section class="card tarot-today" id="tarotCard"><div class="ch"><h2>오늘의 카드</h2><button type="button" class="linkbtn" data-act="tthree" aria-haspopup="dialog">질문으로 카드 보기${I('chev', 'i chev-r')}</button></div>
    <div class="tdraw">${cardFace(cardD)}<div class="tmain"><h3>${esc(f.name)}${cardD.rev ? ' <span class="sub">역방향</span>' : ''}</h3><p class="tk">${esc(f.m.k)}</p><p class="lead">${esc(pol ? pol.t : f.m.t)}</p></div>
      <div class="tmore"><details class="more"><summary>사주와 함께 보기</summary><p class="note">${I('compass')}<span><span class="tag sm">앱이 더한 연결</span> ${esc(T.withSaju(cardD, { name: p.name, needed: c.analysis.needed, avoid: c.analysis.avoid, day: dv.label, cls }))}</span></p></details>
      ${creditNote()}</div></div></section>`;
}
function drawDaily() {
  const p = me(), c = chartOf(p), ymd = S.dayView(c, today(), { sect: db.settings.sect }).ymd, t = tarotOf();
  const mine = t.daily[p.id] = t.daily[p.id] || {};
  if (mine[ymd]) return;                                   // 같은 날 다시 뽑지 않음
  mine[ymd] = T.draw(1, { rng: rngCrypto, reversed: tMethod().reversed })[0];
  for (const k of Object.keys(mine).sort().slice(0, -30)) delete mine[k];   // 프로필마다 최근 30일만
  save();
  const el = $('#tarotCard'); if (el) el.outerHTML = tarotCard(c, p);
}
const SAFE = {
  crisis: `<div class="banner crisis" role="alert">${I('heart')}<span><b>지금 많이 힘드신가요.</b> 카드 읽기는 여기서 멈출게요. 혼자 견디지 말고 지금 바로 이야기해 주세요.<span class="btns gap-t"><a class="btn" href="tel:109">자살예방상담 109</a><a class="btn" href="tel:15770199">정신건강위기상담 1577-0199</a></span><span class="small">24시간 연결돼요. 위급하면 112·119.</span></span></div>`,
  money: `<p class="note">${I('wallet')}<span><b>돈의 시점은 보지 않아요.</b> 언제 오를지·언제 살지 같은 질문은 카드로 답하지 않아요. 대신 '흐름 3장'이나 '할까 말까'로 내 돈 습관과 마음가짐을 비춰 보세요.</span></p>`,
  health: `<p class="note">${I('info')}<span><b>건강은 카드로 보지 않아요.</b> 몸이나 마음이 걱정되면 의사·전문가와 상담하세요.</span></p>`,
  again: `<p class="note">${I('info')}<span>같은 질문은 24시간 안에 한 번만 다시 뽑을 수 있어요. 처음 나온 카드를 먼저 천천히 읽어 봐요.</span></p>`
};
function readingHtml(h) {
  const r = T.reading(h.cards, { spread: h.spread, area: h.area, q: h.q, cls: h.cls, method: h.method, name: me().name, a: h.a, b: h.b });
  const n = T.SPREADS[r.spread].positions.length, adv = r.advice;
  return `<div class="reading-t"><h3>${esc(r.title || r.spreadName)}${r.title ? ` <span class="sub">${esc(r.spreadName)}</span>` : ''}</h3>
    <p class="small">${r.q ? `질문: ${esc(r.q)} · ` : ''}${esc(r.areaName)}${h.a ? ` · A ${esc(h.a)} / B ${esc(h.b)}` : ''}</p>
    <div class="tthree n${n}">${h.cards.slice(0, n).map((d, i) => `<div>${cardFace(d, 'sm')}<span class="tpos">${esc(r.lines[i].pos)}</span></div>`).join('')}</div>
    <ul class="rels">${r.lines.map(l => `<li><b>${esc(l.pos)} · ${esc(l.name)}${l.rev ? ' (역)' : ''}${l.pole === 'neg' ? ' · 조심' : ''}</b><span><b class="tk">${esc(l.k)}</b> ${esc(l.t)}</span></li>`).join('')}</ul>
    ${r.verdict ? `<p class="lead verdict-l">${esc(r.verdict)}</p>` : ''}
    ${r.slots ? `<p class="small">${r.slots.extended ? '한 번 더 긴 단위로 봤어요 · ' : ''}슬롯: ${r.slots.units.map((u, i) => `${u}개월 ${esc(r.slots.cards[i].name)}`).join(' · ')}</p>` : ''}
    ${r.notes.length ? `<ul class="dos">${r.notes.map(t => `<li>${I('sparkle')}<span>${esc(t)}</span></li>`).join('')}</ul>` : ''}
    ${r.flow ? `<p class="note">${I('compass')}<span>${esc(r.flow)}</span></p>` : ''}
    ${adv ? `<div class="advice">${cardFace({ id: adv.id, rev: adv.rev }, 'xs')}<p><b>조언 카드</b> ${esc(adv.t)}</p></div>` : ''}
    ${r.money ? `<p class="small">${esc(r.money)}</p>` : ''}<p class="small">${esc(r.closing)}</p>${r.credit ? `<p class="small credit">${esc(r.credit)}</p>` : ''}</div>`;
}
function openTarot(idx, msg) {
  const t = tarotOf(), h = idx != null ? t.history[idx] : null, mine = myHist();
  const opt = (v, l, cur) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`, sp = (h && h.spread) || 'flow3';
  sheet(`<div class="top"><div><p class="sub">${esc(ROLE_LINE)}</p><h2 id="sheetTitle">질문으로 카드 보기</h2></div>${closeBtn()}</div>
    <p class="small">타로는 마음을 비춰 보는 거울이에요. 결정은 직접 해요. 돈 질문이어도 사고팔 종목·시점·금액은 다루지 않아요. 건강 질문은 보지 않아요.</p>${creditNote()}
    <form class="form tform" id="tarotForm" data-sp="${sp}"><div class="two"><label class="f">카드 펼치기<select name="spread">${Object.entries(T.SPREADS).filter(([, s]) => s.advice).map(([k, s]) => opt(k, s.name, sp)).join('')}</select></label>
      <label class="f">무엇에 대해<select name="area">${['move', 'career', 'money', 'family'].map(k => opt(k, k === 'money' ? T.AREA_NAME.money : area(k), h && h.area)).join('')}${opt('free', '자유 질문', h && h.area)}</select></label></div>
      <label class="f">질문 (선택)<input type="text" name="q" maxlength="60" placeholder="예: 이번 달 무엇에 집중할까"></label>
      <div class="two ab-only"><label class="f">A<input type="text" name="a" maxlength="20" placeholder="예: 지금 회사"></label><label class="f">B<input type="text" name="b" maxlength="20" placeholder="예: 새 과정"></label></div>
      <button class="btn pri" type="submit">${I('sparkle')}카드 뽑기</button></form>
    <div id="tarotOut">${msg ? SAFE[msg] : h ? readingHtml(h) : ''}</div>
    <h3>지난 읽기 <span class="sub">최근 10개 · 이 기기에만</span></h3>
    ${mine.length ? `<ul class="hist">${mine.map(({ h: x, i }) => `<li><button class="btn" data-act="thist" data-i="${i}">${esc(x.at.slice(5, 10).replace('-', '/'))} · ${esc((T.SPREADS[x.spread] || T.SPREADS.flow3).name)} · ${esc(x.area === 'free' ? '자유 질문' : x.area === 'money' ? T.AREA_NAME.money : area(x.area))}</button><button class="btn danger" data-act="tdel" data-i="${i}" aria-label="이 읽기 지우기">${I('trash')}</button></li>`).join('')}</ul>` : '<p class="small">아직 없어요.</p>'}`);
  const f = $('#tarotForm'); f.spread.addEventListener('change', () => { f.dataset.sp = f.spread.value; });
  const hd = $('#tarotOut h3, #tarotOut [role="alert"], #tarotOut .note');
  if (h || msg) { if (hd) { hd.tabIndex = -1; hd.scrollIntoView({ block: 'start' }); hd.focus({ preventScroll: true }); } }
}
function submitTarot(f) {
  const q = f.q.value.trim().slice(0, 60), spread = f.spread.value, ar = f.area.value;
  const g = T.guard(q + ' ' + f.a.value + ' ' + f.b.value, { spread, area: ar });
  if (g) return openTarot(null, g);                         // 위기: 중단 + 상담 전화 · 건강: 전문가 안내 · 돈의 시점: 보지 않음
  const pid = me().id, key = T.qKey(pid, spread, q), t = tarotOf();
  if (!T.canDraw(t.log, key)) return openTarot(null, 'again');
  t.log = t.log.filter(x => Date.now() - Date.parse(x.at) < 2 * 864e5); t.log.push({ key, at: new Date().toISOString() });   // 기록 삭제와 따로 두는 뽑기 기록
  const cards = T.draw(T.cardsNeeded(spread), { rng: rngCrypto, reversed: tMethod().reversed });
  const h = { at: new Date().toISOString(), pid, key, spread, area: ar, q, a: f.a.value.trim().slice(0, 20), b: f.b.value.trim().slice(0, 20), cards, cls: S.now(chartOf(me()), today(), opts()).cls, method: db.settings.tarotMethod || 'rws' };
  t.history.unshift(h);
  const keep = new Set(t.history.filter(x => (x.pid || pid) === pid).slice(0, 10));   // 프로필마다 최근 10개
  t.history = t.history.filter(x => (x.pid || pid) !== pid || keep.has(x)); save();
  openTarot(0);
}
/** 숫자로 뽑는 카드(수비학): 타고난 카드 · 올해의 카드. 사주와 섞지 않고 옆에 나란히 */
function numerCard(c, p) {
  const Y = kst(today()).y, soul = T.soulCard(c.solar), yc = T.yearCard(c.solar, Y);
  const act = yc.up.t.split(/(?<=요\.)\s*/).filter(Boolean).pop();
  return `<details class="card fold numer"><summary class="ch"><h2>숫자로 보는 카드</h2><span class="sub">수비학 · 재미로 · 타고난 카드 ${soul.numeral} ${esc(soul.name)}, ${Y}년 카드 ${yc.numeral} ${esc(yc.name)}</span></summary>
    <div class="numer-g">
      <div class="nc">${cardFace({ id: soul.id })}<div><p class="nk">타고난 카드</p><h3>${soul.numeral} ${esc(soul.name)}</h3><p class="tk">${esc(soul.up.k)}</p><p>${esc(soul.up.t)}</p></div></div>
      <div class="nc">${cardFace({ id: yc.id })}<div><p class="nk">${Y}년 올해의 카드</p><h3>${yc.numeral} ${esc(yc.name)}</h3>
        <ul class="dos"><li class="do">${I('check')}<span><b>좋은 점</b> ${esc(yc.up.k)}</span></li><li class="dont">${I('info')}<span><b>주의할 점</b> ${esc(yc.rev.t)}</span></li><li>${I('sparkle')}<span><b>올해의 조언</b> ${esc(act)}</span></li></ul></div></div>
    </div>
    <p class="small gap-t">양력 생일로 계산해요. 타고난 카드는 생년월일 숫자를 한 자리가 될 때까지 더해서, 올해의 카드는 생일(월·일) 숫자에 올해 숫자를 더해서 골라요. 사주 해석과는 섞지 않아요.</p></details>`;
}

// ── 이야기로 읽기 (원국 → 7장, 규칙 문장) ──
const STEM_IMG = { 甲: '큰 나무', 乙: '풀과 덩굴', 丙: '태양', 丁: '등불', 戊: '큰 산', 己: '논밭', 庚: '바위와 쇠', 辛: '보석', 壬: '큰 물', 癸: '비와 이슬' };
const STEM_TRAIT = { 甲: '곧게 자라며 앞장서는', 乙: '유연하게 감아 오르는', 丙: '밝게 비추며 눈에 띄는', 丁: '가까운 곳을 따뜻하게 밝히는', 戊: '묵직하게 버티는', 己: '사람과 일을 길러 내는', 庚: '단단하게 결단하는', 辛: '섬세하게 다듬는', 壬: '넓게 흐르며 담아내는', 癸: '조용히 스며드는' };
const NUMK = ['', '하나', '둘', '셋', '넷'];
const SEASON_W = ['한겨울', '늦겨울', '봄 문턱', '한봄', '늦봄', '여름 문턱', '한여름', '늦여름', '가을 문턱', '한가을', '늦가을', '겨울 문턱'];
const STAGE_OF_GOD = { 편재: '돈·물건이 흐르는 판 — 물류·유통·기획처럼 큰 흐름을 다루는 일과 잘 맞아요', 정재: '꾸준히 쌓아 가는 살림의 판 — 성실하게 모으고 관리하는 일과 잘 맞아요', 편관: '책임과 압박을 견디며 크는 판 — 힘든 자리를 맡아 이겨 내며 자라요', 정관: '규칙과 조직 안에서 자리 잡는 판 — 믿음을 쌓아 올라가는 일과 잘 맞아요', 식신: '손재주·실력으로 먹고사는 판 — 기술을 꾸준히 갈고닦는 일과 잘 맞아요', 상관: '말·재주로 틀을 깨는 판 — 새 방식을 내놓는 일과 잘 맞아요', 편인: '남다른 기술·아이디어를 익히는 판 — 특수한 전문성과 잘 맞아요', 정인: '배움과 문서로 서는 판 — 공부·자격으로 길을 여는 일과 잘 맞아요', 비견: '스스로 서는 판 — 내 이름을 걸고 하는 일과 잘 맞아요', 겁재: '경쟁 속에서 나눠 갖는 판 — 함께 겨루며 크는 일과 잘 맞아요' };
const SHORTG = { 비견: '자기 힘', 겁재: '경쟁', 식신: '실력', 상관: '재주', 편재: '큰돈', 정재: '꾸준한 돈', 편관: '책임·자격', 정관: '자리', 편인: '아이디어', 정인: '배움', '일간(나)': '나' };
const ROOT_OF = { 인성: '배움·기술', 식상: '재주·표현', 재성: '돈·살림 감각', 관성: '책임감·규칙', 비겁: '자기 힘·독립심' };
const SPOUSE_OF = { 식상: '표현과 열정이 관계의 중심이에요.', 재성: '현실 감각과 살림이 관계의 중심이에요.', 관성: '책임과 약속이 관계의 중심이에요.', 인성: '보살핌과 배움이 관계의 중심이에요.', 비겁: '친구 같은 동지 관계를 원해요.' };
const EL_JOB = ['자라게 하고 가르치는 일', '빛·열·전기', '땅·중개·관리', '쇠·기계·정밀', '물·흐름·유통'];
const PATH_OF = { 관성: '자격·면허를 더하는', 식상: '손기술을 쌓는', 재성: '사업으로 넓히는', 인성: '가르치고 전하는', 비겁: '독립해서 하는' };
const INWARD = ['묘', '절', '태', '양', '병', '사'], OUTWARD = ['건록', '제왕', '관대'];
function storyChapters(c, p) {
  const A = c.analysis, ps = c.pillars, d = ps[2][0], nm = p.name, img = STEM_IMG[d];
  const stems = ps.filter(Boolean).map(x => x[0]), same = stems.filter(x => x === d).length, bigyeop = A.gods.filter((g, i) => g && i !== 2 && g.stem.group === '비겁').length;
  const ch = [];   // [제목, 쉬운 말 먼저, 용어가 든 자세한 말]
  // 1 나를 뜻하는 글자
  let p1 = `${josa(nm, '은/는')} ${img}처럼 ${STEM_TRAIT[d]} 사람이에요.`, d1 = `나를 뜻하는 글자(일간)는 ${d}, ${josa(img, '이에요/예요')}.`;
  if (same >= 2) { p1 += ' 같은 성향이 많아서 어디서나 눈에 띄지만, 한쪽에 몰아 걸기 쉬워요. 나눠서 거는 습관이 좋아요.'; d1 += ` 위 글자(천간)에 ${josa(d, '이/가')} ${NUMK[same] || same}이라 "${josa(img, '이/가')} ${NUMK[same] || same}"인 사주예요. 같은 기운(비견)이 많은 사주예요.`; }
  else if (bigyeop) { p1 += ' 경쟁할 때 힘이 나는 편이에요. 다만 나눠 갖는 일이 생기기 쉬우니 돈 약속은 분명히 해요.'; d1 += ' 비슷한 기운(겁재)이 곁에 있어요.'; }
  else { p1 += ' 혼자 밀기보다 사람·환경과 맞물려 움직이는 편이에요.'; d1 += ' 위 글자(천간)에 같은 기운이 없어요.'; }
  ch.push(['나를 뜻하는 글자', p1, d1]);
  // 2 계절 + 달 자리 기운
  const mb = ps[1][1], mg = A.gods[1].branch;
  const [stg, stgHow] = STAGE_OF_GOD[mg.name].split(' — ');
  ch.push(['태어난 계절과 무대', `삶의 무대는 ${josa(stg, '이에요/예요')}. ${stgHow}.`, `${SEASON_W[S.bi(mb)]}에 태어났고(달 글자 ${mb}), 이 자리에 ${josa(godTxt(mg), '이/가')} 있어서 그래요.`]);
  // 3 움직임
  const ym = ps.map((x, i) => x && '寅申巳亥'.includes(x[1]) ? `${SPOT[S.PALACE[i]]} ${x[1]}` : null).filter(Boolean);
  const chung = uniq(A.natalRel.filter(r => r.type === '충').map(r => r.name.split(' ')[0]));
  const yy = nextYears(gz => gz[1] === A.yeokma, 1), moving = ym.length >= 2 || chung.length;
  let p3 = moving ? `이사·이동과 인연이 깊어요. 한자리에 머물기보다 자리를 옮기며 크는 편이에요.${ym.length >= 2 ? ' 먼 이동·해외와도 잘 맞아요.' : ''}` : '한곳에 뿌리내리며 크는 편이에요.';
  if (yy && moving) p3 += ` ${yy.split(' ')[0]}년에 다시 이동이 많은 해가 와요.`;
  let d3 = ym.length >= 2 ? `여덟 글자 중 이동을 부르는 글자(역마 寅·申·巳·亥)가 ${NUMK[ym.length] || ym.length}이에요. 태어난 ${josa(ym.join(', '), '이에요/예요')}.` : ym.length ? `이동을 부르는 글자(역마)는 태어난 ${ym[0]} 하나예요.` : '이동을 부르는 글자(역마)가 없어요.';
  if (chung.length) d3 += ` ${chung.join('·')} 글자가 서로 부딪혀요(충).`;
  if (yy && moving) d3 += ` ${yy.split(' ')[0]}년 ${yy.split(' ')[1]}에 ${josa(A.yeokma, '이/가')} 다시 들어와요.`;
  ch.push(['움직임', p3, d3]);
  // 4 뿌리와 배우자 자리
  const yg = A.gods[0].branch, dg = A.gods[2].branch, st0 = A.stages[0], st2 = A.stages[2];
  let p4 = `${josa(ROOT_OF[yg.group], '이/가')} 내 뿌리예요. 관계에서는 ${SPOUSE_OF[dg.group]}`;
  if (INWARD.includes(st2)) p4 += ' 마음을 속에 담아 두는 편이라, 속마음을 말로 꺼내는 연습이 관계를 편하게 해요.';
  else if (OUTWARD.includes(st2)) p4 += ' 마음이 겉으로 바로 드러나는 편이라, 한 박자 쉬고 말하면 좋아요.';
  const d4 = `띠 글자(${ps[0][1]})에 ${josa(godTxt(yg), '이/가')} 있고, 그 자리의 힘은 ${josa(stageTxt(st0), '이에요/예요')}. 배우자 자리(날 글자 ${ps[2][1]})에는 ${josa(godTxt(dg), '이/가')} 있고, 그 자리의 힘은 ${josa(stageTxt(st2), '이에요/예요')}.`;
  ch.push(['뿌리와 배우자 자리', p4, d4]);
  // 5 시주
  if (ps[3]) {
    const hs = A.gods[3].stem, hb = A.gods[3].branch, e = S.stemEl(S.si(d));
    ch.push(['나이 들수록 커지는 숙제', `나이 들수록 "${josa(SHORTG[hs.name], '을/를')} ${josa(SHORTG[hb.name], '으로/로')} 바꾸는 것"이 과제예요. 예를 들면 ${josa(EL_JOB[e], '을/를')} 다루는 일에 ${PATH_OF[hb.group]} 길이 잘 맞아요.`,
      `시간 기둥(시주 ${ps[3]})에 ${josa(godTxt(hs), '과/와')} ${josa(godTxt(hb), '이/가')} 있어요. 나를 뜻하는 ${josa(elName(e), '은/는')} ${EL_JOB[e]}의 기운이에요.`]);
  } else ch.push(['나이 들수록 커지는 숙제', '태어난 시간을 몰라서 이 장은 비워 둘게요.', '시간 기둥(시주)이 없어요.']);
  // 6 필요한 기운 + 상대
  const need = A.needed.map(elName).join('·'), needP = A.needed.map(e => EL_PLAIN[e]).join('·');
  let p6 = need ? `나에게는 ${needP} 기운이 필요해요.` : '크게 치우친 기운이 없어서, 꼭 필요한 기운은 적어요.', d6 = need ? `필요한 기운은 ${josa(need, '이에요/예요')}. ${pl((A.reasons.find(r => r.kind === 'need') || {}).why || '').replace(' (조후)', ' (계절 맞추기, 조후)')}` : '';
  const pt = partner();
  if (pt && pt !== p && A.needed.length) {
    const pc = chartOf(pt);
    if (pc) {
      const has = A.needed.filter(e => pc.analysis.count[e] > 0), m = S.match(c, pc);
      p6 += has.length ? ` ${pt.name}에게 이 기운이 있어서 곁에서 채워 줘요.` : ` ${pt.name}에게는 이 기운이 적어요. 다른 사람이나 환경으로 채우면 좋아요.`;
      if (has.length) d6 += ` ${pt.name}에게는 ${has.map(e => `${elName(e)} ${pc.analysis.count[e]}개`).join(', ')}가 있어요.`;
      if (m.gangHwi) d6 += ' 두 사람의 중심 글자 丙(태양)과 壬(큰 물)은 강물 위에 햇빛이 비치는 그림이라 "강휘상영"이라고 불러요.';
    }
  }
  ch.push(['필요한 기운', p6, d6.trim()]);
  // 7 대운 이야기 + 앞으로 몇 해
  const v = S.now(c, today(), opts()), L = c.daeun.list, i = v.daeun ? L.indexOf(v.daeun) : -1;
  const dPh = dd => { const [a, b] = S.component(c, dd.gz, 'daeun').gods; return SHORTG[a.name] === SHORTG[b.name] ? SHORTG[a.name] : `${josa(SHORTG[a.name], '과/와')} ${SHORTG[b.name]}`; };
  const runs = [];
  for (let Y = v.year; Y <= v.year + 6; Y++) { const y = S.yearView(c, Y), av = y.Y.notes.find(n => n.k === 'avoid'), why = av ? EL_PLAIN[S.EL_HANJA.findIndex(h => av.t.includes(h))] + ' 기운 넘침' : ''; const r = runs[runs.length - 1]; if (r && r.cls === y.cls && r.why === why) r.to = Y; else runs.push({ from: Y, to: Y, cls: y.cls, why }); }
  const p7 = '앞으로는 ' + runs.slice(0, 3).map(r => `${r.from === r.to ? r.from : `${r.from}–${String(r.to).slice(2)}`}년 ${S.CLASSES[r.cls].name}${r.why ? `(${r.why})` : ''}`).join(' → ') + '예요.';
  const parts = [];
  if (i > 0) parts.push(`${L[i - 1].startAge}세부터 10년(${L[i - 1].gz})은 ${josa(dPh(L[i - 1]), '이/가')} 들어온 시기였어요.`);
  if (i >= 0) parts.push(`지금 ${L[i].startYear}–${L[i].endYear}년(${L[i].gz})은 ${josa(dPh(L[i]), '이/가')} 들어오는 10년이고, 흐름은 ${{ 좋음: '좋아요', 보통: '보통이에요', 버거움: '버거운 편이에요' }[TEN_W(v.D.total)]}.`);
  if (L[i + 1]) parts.push(`${L[i + 1].startYear}년부터(${L[i + 1].gz})는 ${josa(dPh(L[i + 1]), '이/가')} 들어와요.`);
  ch.push(['10년 흐름과 앞으로', p7, parts.join(' ')]);
  const push = runs.find(r => r.cls === 'push');
  const sum = `${same >= 2 ? `${josa(img, '이/가')} ${NUMK[same] || same}인` : `${img}인`} ${nm}. ${STAGE_OF_GOD[mg.name].split(' — ')[0]}에서 ${moving ? '움직이며' : '뿌리내리며'} 커요. ${push ? (push.from === v.year ? '지금이 밀고 갈 때예요.' : `${push.from}년부터 밀고 갈 때예요.`) : `지금은 ${S.CLASSES[v.cls].name}예요.`}`;
  return { ch, sum };
}
function storyCard(c, p) {
  const { ch, sum } = storyChapters(c, p), part = ([t, pl1, dt], i) => `<h3><span class="cn num">${i + 1}</span>${t}</h3><p>${esc(pl1)}</p>${dt ? `<p class="dt">${esc(dt)}</p>` : ''}`;
  return `<section class="card story"><div class="ch"><h2>이야기로 읽기</h2></div>
    <p class="sum">${esc(sum)}</p>
    ${part(ch[0], 0)}
    <details class="more"><summary>이어서 읽기 (${ch.length - 1}장 더)</summary>${ch.slice(1).map((x, i) => part(x, i + 1)).join('')}</details></section>`;
}

// ── 페이지: 내 사주 ──
const STAGE_SHORT = { 장생: '시작', 목욕: '꾸밈', 관대: '채비', 건록: '자립', 제왕: '한창', 쇠: '노련', 병: '쉼', 사: '마무리', 묘: '저장', 절: '끊고 잇기', 태: '씨앗', 양: '자람' };
function pillarCells(c, compact) {
  const A = c.analysis, order = [3, 2, 1, 0];
  if (compact) return `<div class="mini">${order.map(i => { const p = c.pillars[i]; return p ? `<div${i === 2 ? ' class="me"' : ''}><span class="pl">${SPOT[S.PALACE[i]]}</span>${hz(p[0])}${hz(p[1])}</div>` : `<div><span class="pl">${SPOT[S.PALACE[i]]}</span><span class="hz q">?</span><span class="pl">모름</span></div>`; }).join('')}</div>`;
  return `<div class="pillars">${order.map(i => {
    const p = c.pillars[i];
    if (!p) return `<div class="pillar empty"><span class="pl">${SPOT[S.PALACE[i]]}</span><span class="god">시간 모름</span><span class="hz">?</span><span class="hz">?</span><span class="st">3주로 봐요</span></div>`;
    const g = A.gods[i];
    return `<button type="button" class="pillar${i === 2 ? ' me' : ''}" data-act="cell" data-i="${i}" aria-label="${S.PALACE[i]}주 ${p} 뜻 보기"><span class="pl">${SPOT[S.PALACE[i]]}${i === 2 ? ' · 나' : ''}</span><span class="god">${SHORTG[g.stem.name] || g.stem.name}</span>${hz(p[0])}<span class="k">${S.STEM_KO[S.si(p[0])]} · ${EL_PLAIN[S.stemEl(S.si(p[0]))]}</span>${hz(p[1])}<span class="k">${S.BRANCH_KO[S.bi(p[1])]} · ${EL_PLAIN[S.BR_EL[S.bi(p[1])]]}</span><span class="god">${SHORTG[g.branch.name]}</span><span class="st">${STAGE_SHORT[A.stages[i]]}</span></button>`;
  }).join('')}</div>`;
}
const SH_BASE = { 년지: '띠', 일지: '날 글자', 일주: '날 기둥' };
const AREA_SHORT = { 년: '사회', 월: '직장', 일: '배우자', 시: '자녀·말년' };
const REL_PLAIN = { 충: '변화·이동이 생기기 쉬워요', 형: '서류·약속이 어긋나기 쉬워요', 해: '작은 오해가 생기기 쉬워요', 육합: '도움과 인연이 붙어요', 반합: '힘이 모여요', 삼합: '힘이 크게 모여요', 방합: '힘이 모여요', '방합 완성': '힘이 크게 모여요', '같은 글자': '방식이 닮았어요' };
const natLi = r => `<li><span class="rp">${esc(uniq([AREA_SHORT[r.a], AREA_SHORT[r.b]]).join('·'))} 쪽에서 ${REL_PLAIN[r.type]}</span><span class="rh">${esc(relTxt(r))} · ${SPOT[r.a]}–${SPOT[r.b]} 자리</span></li>`;
const SIGN_NOTE = `<p class="small signs">충·형·해는 '변화·엇갈림 신호'예요. 나쁜 일이 정해진 건 아니에요.</p>`;
const shAt = t => t.replace(/^([년월일시])(지|주) /, (_, k, j) => `${SPOT[k]} ${j === '지' ? '글자' : '기둥'} `);
function pageChart() {
  const p = me(); if (!p) return emptyHome();
  const c = chartOf(p); if (!c) return errCard(p);
  const A = c.analysis, cands = c.candidates;
  const pick = db.settings.hourPick[p.id] || (cands[0] && cands[0].gz);
  const seg = cands.length > 1 ? `<div class="seg pick" role="group" aria-label="태어난 시간 고르기">${cands.map(x => `<button data-act="hour" data-gz="${x.gz}" aria-pressed="${x.gz === pick}"><span class="rb" aria-hidden="true"></span><span class="num">${x.from}–${x.to}</span> <span class="hz">${x.gz}</span></button>`).join('')}</div>` : '';
  const yb = c.pillars[0][1], tie = cands[0] && cands[0].tie;
  return `<div class="head"><h1>${esc(p.name)}의 사주</h1><p>${S.ANIMAL[S.bi(yb)]}띠 · ${p.gender === 'F' ? '여' : '남'}</p></div>
  <section class="card natal"><div class="ch"><h2>타고난 여덟 글자</h2><span class="sub">여덟 글자는 태어난 때의 기운 지도예요. 칸을 누르면 뜻이 나와요.</span></div>
    ${pillarCells(c)}
    <p class="small pkey">글자 위아래 작은 말은 그 글자가 나에게 주는 기운, 맨 아래는 그 자리에서 내 힘이에요.</p>
    ${seg ? `<div class="segrow"><p><b>태어난 시간 고르기</b> <span class="small">${esc(p.time.from)}–${esc(p.time.to)} 사이라 두 가지예요. 맞는 시간을 고르면 결과가 달라져요.${tie ? '' : ' 더 가능성 높은 쪽을 먼저 골라 두었어요.'}</span></p>${seg}</div>` : ''}
    <details class="calc"><summary>어떻게 계산했나요?</summary><div class="meta"><span>양력 ${c.solar}${p.cal === 'lunar' ? ` (음력 ${esc(p.date)}${p.leap ? ' 윤달' : ''})` : ''} · ${esc(p.city || '')} ${(+p.lng).toFixed(2)}°E</span>
      <span>${c.hourKnown ? `태어난 곳 기준 시각으로 ${c.corr.minutes}분 보정${c.corr.dst ? '(서머타임 1시간 포함)' : ''} → ${c.local} (일주·시주). 연주·월주·대운은 절기 기준 시각으로 계산해요.` : '태어난 시간을 몰라 연·월·일 3주로 봐요'}</span>
      <span>대운이 바뀌는 나이(대운수) ${c.daeun.su} (${c.daeun.y}년 ${c.daeun.m}개월) · ${c.daeun.forward ? '앞으로 도는 순서(순행)' : '거꾸로 도는 순서(역행)'} · 연 경계 ${db.settings.yearBoundary === 'seol' ? '설' : '입춘'}</span>
      <span>칸 속 쉬운 말은 십성(${uniq(A.gods.filter(Boolean).flatMap(g => [g.stem.name, g.branch.name]).filter(n => GOD_GL[n])).join('·')})과 12운성을 줄인 말이에요.</span></div></details>
  </section>
  ${storyCard(c, p)}
  <div class="grid g2">
    <section class="card"><div class="ch"><h2>다섯 기운</h2><span class="sub">여덟 글자 속 나무·불·흙·쇠·물</span></div>
      <div class="bars">${A.count.map((n, e) => `<div class="b e-${ELC[e]}"><span><i class="dot"></i>${elName(e)}</span><span class="t"><i style="width:${n / A.total * 100}%"></i></span><span class="num">${n}</span></div>`).join('')}</div>
      <h3 class="gap-t">필요한 기운</h3>
      <div class="tags gap-s">${A.needed.map(e => elTag(e, 'good')).join('')}${A.avoid.map(e => `<span class="tag bad">넘치면 부담: ${elName(e)}</span>`).join('')}</div>
      <details class="more"><summary>왜 필요할까요</summary><ul class="reasons">${A.reasons.map(r => `<li><span class="dot e-${ELC[r.e]}"></span><span>${esc(pl(r.why).replace('(조후)', '(계절 맞추기, 조후)'))}</span></li>`).join('')}</ul>
        ${note(NOTE.yongsin)}<p class="small gap-t">가장 많은 기운은 ${elName(A.dominant)}이에요. 쇠·물 비율 ${Math.round(A.metalWater * 100)}% (달수 기준: 60% 이상이면 불의 해에 재물이 좋다고 봐요)</p></details>
    </section>
    <section class="card"><div class="ch"><h2>글자끼리의 관계</h2></div>
      ${A.natalRel.length ? `<ul class="rels plain">${A.natalRel.slice(0, 3).map(natLi).join('')}</ul>${A.natalRel.some(r => r.s < 0) ? SIGN_NOTE : ''}${A.natalRel.length > 3 ? `<details class="more"><summary>관계 더 보기 (${A.natalRel.length - 3}개)</summary><ul class="rels plain">${A.natalRel.slice(3).map(natLi).join('')}</ul></details>` : ''}` : '<p class="small">여덟 글자 안에 특별히 끌어당기거나 부딪히는 짝은 없어요.</p>'}
      <details class="more"><summary>자리의 힘과 특별한 글자(신살) 보기</summary><p class="small">가볍게 참고만 하세요.</p><ul class="rels">${[3, 2, 1, 0].filter(i => c.pillars[i]).map(i => `<li><b>${SPOT[S.PALACE[i]]} 글자 ${c.pillars[i][1]}</b><span>${stageTxt(A.stages[i])}</span></li>`).join('')}
        ${A.shinsal.map(s => `<li><b>${s.name}</b><span>${esc(shAt(s.at))} (${SH_BASE[s.base] || s.base} 기준) · ${esc(s.note)}</span></li>`).join('')}
        <li><b>삼재 해</b><span>${A.samjae.join('·')}년이에요(띠 기준). 이 방식은 아주 조금만 반영해요.</span></li></ul></details>
    </section>
  </div>
  <div class="grid g2 folds">${T ? numerCard(c, p) : ''}${glossCard()}</div>`;
}

// ── 어려운 말 풀이 (1031 MJ "좀 더 디테일하게 뜻풀이, 무슨 말인지 잘 모르겠어") — 글 속 용어에 점선 밑줄, 누르면 쉬운 뜻 ──
const NOLINK = 'button, a, select, option, input, textarea, label, svg, h1, h2, summary, .tag, .cls, .seg, .whobar, .hint, .bar, .mlist, .pills, .legend, .bars';
let TERM_RE;
function linkTerms(root, skip) {
  if (!window.Gloss || !root) return;
  TERM_RE = TERM_RE || new RegExp(Gloss.LINK.slice().sort((a, b) => b.length - a.length).map(w => w.replace(/[()]/g, '\\$&')).join('|') + `|\\((?:${Gloss.ONE.join('|')})\\)`, 'g');
  const re = TERM_RE, scopes = root.matches('.sh') ? [root, ...root.querySelectorAll('.card')] : [...root.querySelectorAll('.card')];
  const done = new Set(skip ? [skip] : []);   // 한 화면에 같은 말은 처음 한 번만 밑줄 (리뷰: 71개는 너무 많음)
  const seen = [], folded = [];               // 접힌 칸 속 말보다 보이는 말에 먼저 밑줄
  for (const sc of scopes) {
    const tw = document.createTreeWalker(sc, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) { const n = tw.currentNode, pe = n.parentElement; re.lastIndex = 0; if (!pe.closest(NOLINK) && pe.closest('.card, .sh') === sc && re.test(n.data)) (pe.closest('details:not([open]) > :not(summary)') ? folded : seen).push(n); }
  }
  {
    for (const n of [...seen, ...folded]) {
      const s = n.data; let last = 0, m, frag = null; re.lastIndex = 0;
      while ((m = re.exec(s))) {
        const one = m[0][0] === '(', w = one ? m[0].slice(1, -1) : m[0], key = Gloss.key(w);
        if (!key || done.has(key) || (!one && /[가-힣]/.test(s[m.index - 1] || '')) || (w === '일주' && s[m.index + 2] === '일')) continue;
        done.add(key); frag = frag || document.createDocumentFragment();
        const at = m.index + (one ? 1 : 0), b = document.createElement('button');
        b.type = 'button'; b.className = 'term'; b.dataset.act = 'term'; b.dataset.t = key; b.textContent = w;
        const po = s[at - 1] === '(' && s[at + w.length] === ')';   // "(입춘)"은 괄호째 한 줄에
        frag.append(s.slice(last, po ? at - 1 : at));
        if (po) { const nw = document.createElement('span'); nw.className = 'nw'; nw.append('(', b, ')'); frag.append(nw); } else frag.append(b);
        last = at + w.length + (po ? 1 : 0);
      }
      if (frag) { frag.append(s.slice(last)); n.replaceWith(frag); }
    }
  }
}
const GROUP = { 비겁: ['비견', '겁재'], 식상: ['식신', '상관'], 재성: ['편재', '정재'], 관성: ['편관', '정관'], 인성: ['편인', '정인'] };
const PALACE_KEY = ['연주', '월주', '일주', '시주'];
// 지금 보는 사람의 사주에서 이 말이 어디 있는지
function termMine(key, c) {
  const A = c.analysis, at = [], P = c.pillars;
  const names = GROUP[key] || [key];
  A.gods.forEach((g, i) => { if (!g) return; if (names.includes(g.stem.name)) at.push(`${PALACE_KEY[i]} 위 글자 ${P[i][0]}(${g.stem.name})`); if (names.includes(g.branch.name)) at.push(`${PALACE_KEY[i]} 아래 글자 ${P[i][1]}(${g.branch.name})`); });
  if (Gloss.G[key].c === '십성' && key !== '십성') return at.length ? `${at.join(', ')}에 있어요.` : '원국에는 없어요. 대운·세운으로 이 글자가 들어올 때 이 뜻이 나타난다고 봐요.';
  const ei = ['목(木)', '화(火)', '토(土)', '금(金)', '수(水)'].indexOf(key);
  if (ei >= 0) return `${A.total}글자 중 ${A.count[ei]}개예요.${A.count[ei] === 0 ? ' 빠진 기운이라 채워 주면 좋다고 봐요.' : A.count[ei] >= 3 ? ' 많은 편이라 넘치면 부담이 될 수 있어요.' : ''}`;
  if (Gloss.G[key].c === '12운성' && key !== '12운성') { const w = A.stages.map((s, i) => s === key ? `${PALACE_KEY[i]}(${P[i][1]})` : '').filter(Boolean); return w.length ? `${w.join(', ')} 자리가 이 상태예요.` : ''; }
  if (Gloss.G[key].c === '신살' && key !== '삼재') { const w = A.shinsal.filter(s => s.name === key); return w.length ? w.map(s => `${s.at} (${s.base} 기준)`).join(', ') + '에 있어요.' : '원국에는 없어요.'; }
  const pi = PALACE_KEY.indexOf(key);
  if (pi >= 0) return P[pi] ? `${key}는 ${P[pi]}(${S.ko(P[pi])}) 기둥이에요. 위쪽 원국 칸을 누르면 글자 뜻을 더 볼 수 있어요.` : '태어난 시간을 몰라서 비어 있어요.';
  if (key === '일간') return `${P[2][0]}, ${josa(STEM_IMG[P[2][0]], '이에요/예요')}. ${STEM_TRAIT[P[2][0]]} 기운이에요.`;
  if (key === '삼재') return `${A.samjae.join('·')}년이 삼재 해예요.`;
  if (key === '대운수') return `${c.daeun.su}세부터 10년마다 바뀌어요 (${c.daeun.forward ? '순행' : '역행'}).`;
  if (key === '대운') { const y = kst(today()).y, d = c.daeun.list.find(x => x.startYear <= y && y <= x.endYear); return d ? `지금은 ${d.gz}(${S.ko(d.gz)}) 대운이에요 (${d.startYear}–${d.endYear}).` : ''; }
  return '';
}
function openTerm(k) {
  const key = Gloss.key(k), t = key && Gloss.G[key]; if (!t) return;
  const p = me(), c = p && chartOf(p), mine = c ? termMine(key, c) : '';
  sheet(`<div class="top"><div><p class="sub">${esc(t.c)} · 쉬운 뜻</p><h2 id="sheetTitle">${esc(key)}</h2></div>${closeBtn()}</div>
    <p class="lead">${esc(t.s)}</p>
    <h3>자세히</h3><p>${esc(t.d)}</p>
    <h3>예를 들면</h3><p>${esc(t.ex)}</p>
    ${mine ? `<h3>${esc(p.name)}의 사주에서는</h3><p>${esc(mine)}</p>` : ''}
    <div class="btns"><a class="btn" href="#/chart#gloss" data-act="close">${I('book')}어려운 말 사전 전체</a></div>`, key);
}
const BR_SEASON = ['한겨울(양력 12월쯤)', '늦겨울(1월쯤)', '초봄(2월쯤)', '봄(3월쯤)', '늦봄(4월쯤)', '초여름(5월쯤)', '한여름(6월쯤)', '늦여름(7월쯤)', '초가을(8월쯤)', '가을(9월쯤)', '늦가을(10월쯤)', '초겨울(11월쯤)'];
function openCell(i) {
  const p = me(), c = chartOf(p), A = c.analysis, g = A.gods[i], P = c.pillars[i]; if (!P) return;
  const st = P[0], br = P[1], b = S.bi(br), pal = PALACE_KEY[i];
  const godLine = n => { const x = Gloss.get(n); return x ? `<p>나에게 이 글자는 <b>${esc(josa(godTxt({ name: n }), '이에요/예요'))}</b>. ${esc(x.s)}.</p><p class="small">${esc(x.d)}</p>` : ''; };
  const stg = Gloss.get(A.stages[i]), gs = n => (GOD_GL[n] || '').replace(' 기운', '');
  const one = i === 2 ? `${STEM_IMG[st]} 같은 나, 그리고 ${S.ANIMAL[b]}(${br}) 자리에 ${gs(g.branch.name)} 기운` : `${(Gloss.get(pal).s.split(' — ')[1] || pal)} 자리에 ${gs(g.stem.name)}과 ${gs(g.branch.name)} 기운`;
  sheet(`<div class="top"><div><p class="sub">${pal} · ${esc(Gloss.get(pal).s.split(' — ')[1] || '')}</p><h2 id="sheetTitle">${hz2(P)} ${S.ko(P)}</h2></div>${closeBtn()}</div>
    <p class="lead"><b>한마디로</b> ${esc(one)}</p>
    <h3>위 글자 ${st}(${S.STEM_KO[S.si(st)]}): ${STEM_IMG[st]}</h3>
    <p>${elName(S.stemEl(S.si(st)))} 기운이고, ${STEM_TRAIT[st]} 글자예요.</p>
    ${i === 2 ? `<p>이 글자가 바로 <b>나(일간)</b>예요. 사주의 나머지 일곱 글자는 모두 이 글자와의 관계로 읽어요.</p>` : godLine(g.stem.name)}
    <h3>아래 글자 ${br}(${S.BRANCH_KO[b]}): ${S.ANIMAL[b]}, ${BR_SEASON[b]}</h3>
    <p>${elName(S.BR_EL[b])} 기운이에요.</p>
    ${godLine(g.branch.name)}
    ${stg ? `<h3>이 자리에서 내 힘: ${stageTxt(A.stages[i])}</h3><p>${esc(stg.s)}. ${esc(stg.d)}</p>` : ''}
    <h3>${pal}라는 자리</h3><p>${esc(Gloss.get(pal).d)}</p>`);
}
function glossCard() {
  if (!window.Gloss) return '';
  const open = location.hash.split('#')[2] === 'gloss';
  return `<details class="card fold" id="gloss"${open ? ' open' : ''}><summary class="ch"><h2>어려운 말 사전</h2><span class="sub">${Object.keys(Gloss.G).length}개 · 누르면 쉬운 뜻과 내 사주에서의 자리가 나와요</span></summary>
    ${Gloss.ORDER.map(cat => `<h3 class="gap-t">${cat}</h3><div class="tlist">${Object.entries(Gloss.G).filter(([, v]) => v.c === cat).map(([k, v]) => `<button type="button" class="tbtn" data-act="term" data-t="${esc(k)}"><b>${esc(k)}</b><span>${esc(v.s)}</span></button>`).join('')}</div>`).join('')}
  </details>`;
}

// ── 페이지: 궁합·결혼일 ──
function pageMatch() {
  const pa = me(), pb = partner(); if (!pa || !pb) return emptyHome();
  const A = chartOf(pa), B = chartOf(pb); if (!A || !B) return errCard(!A ? pa : pb);
  const m = S.match(A, B);
  const nA = pa.name, nB = pb.name;
  const relLine = [`둘 다 같은 기운이라 서로를 잘 이해해요. 다만 비슷한 데서 부딪히기도 해요.`, `${nA}의 기운이 ${josa(nB, '을/를')} 살려 주는 관계예요.`, `${nA}의 기운이 ${josa(nB, '을/를')} 다잡는 관계예요.`, `${nB}의 기운이 ${josa(nA, '을/를')} 다잡는 관계예요.`, `${nB}의 기운이 ${josa(nA, '을/를')} 살려 주는 관계예요.`][m.rel];
  const fills = [], adjust = [];
  const fl = (x, a, b) => { if (x.length) fills.push(`${a}에게 필요한 ${josa(x.map(f => elName(f.e)).join('·'), '을/를')} ${josa(b, '이/가')} 갖고 있어요 (${x.map(f => EL_PLAIN[f.e] + ' ' + f.has + '개').join(', ')}).`); };
  fl(m.fillAB, nA, nB); fl(m.fillBA, nB, nA);
  // 두 사람 사이 관계: 같은 글자쌍·같은 관계는 하나로 (자리만 모음), 배우자 자리 → 세기 순
  const groups = new Map();
  for (const r of m.cross) {
    if (r.type === '형' && m.cross.some(x => x.type === '충' && x.A === r.A && x.B === r.B && x.a === r.a && x.b === r.b)) continue;
    const key = [r.A, r.B].sort().join('') + r.type;
    if (!groups.has(key)) groups.set(key, { ...r, where: [], sp: false });
    const g = groups.get(key); g.where.push(`${nA} ${SPOT[r.a]} – ${nB} ${SPOT[r.b]}`); g.sp = g.sp || (r.a === '일' && r.b === '일');
  }
  const rank = r => (r.sp ? 10 : 0) + Math.abs(r.s) * 2 + r.where.length;
  const rels = [...groups.values()].sort((a, b) => rank(b) - rank(a));
  const relLi = r => `<li><b>${r.A}–${r.B} ${r.type === '같은 글자' ? r.type : `${REL_GL[r.type]}(${r.type})`}</b><span><span class="rw">${esc(r.where.join(' · '))} 자리${r.where.length > 1 ? ` (${r.where.length}곳)` : ''}</span>${esc(relMeaning(r.type))}</span></li>`;
  const good = rels.filter(r => r.s > 0), bad = rels.filter(r => r.s < 0);
  for (const r of good.slice(0, 3)) fills.push(`${r.A}–${r.B} 글자가 ${REL_GL[r.type]}(${r.type}). ${relMeaning(r.type)}`);
  if (m.spouse.some(r => r.type === '같은 글자')) fills.push(`두 사람 모두 배우자 자리(날 글자)에 ${josa(A.pillars[2][1], '이/가')} 있어요. 생활 리듬과 가치관이 닮은 편이에요.`);
  if (m.rel === 3 || m.rel === 2) adjust.push(`중심 글자끼리 ${m.rel === 3 ? '물이 불을 다스리는(수극화)' : '한쪽이 다잡는'} 관계예요. 결정할 때 '누가 정할지' 미리 나누면 서로 편해요.`);
  for (const r of bad.slice(0, 3)) adjust.push(`${r.A}–${r.B} 글자가 ${REL_GL[r.type]}(${r.type})${r.where.length > 1 ? `, ${r.where.length}곳에서 엇갈려요` : ''}. ${r.type === '충' ? '이사·일 같은 큰 변화 때 속도가 다를 수 있어요. 일정을 함께 정하세요.' : relMeaning(r.type)}`);
  const head = m.fillAB.length && m.fillBA.length ? '서로에게 필요한 기운을 갖고 있는 짝이에요' : m.fillAB.length || m.fillBA.length ? '한쪽이 다른 쪽을 채워 주는 짝이에요' : '서로 다른 결을 맞춰 가는 짝이에요';
  // 쉬운 말 한 줄: 두 사람 중심 글자의 오행으로 (예: 물(예비 신부)이 불(MJ)을 식혀 주는 사이)
  const eA = S.stemEl(S.si(A.pillars[2][0])), eB = S.stemEl(S.si(B.pillars[2][0])), who = (e, n) => `${EL_PLAIN[e]}(${n})`;
  const CTRL = { '4-1': '식혀 주는', '1-3': '녹여 다듬는', '3-0': '다듬어 주는', '0-2': '뚫어 주는', '2-4': '막아 주는' };
  const gen = (x, nx, y, ny) => `${josa(who(x, nx), '이/가')} ${josa(who(y, ny), '을/를')} 살려 주는 사이예요. 서로 힘을 북돋워요.`;
  const ctl = (x, nx, y, ny) => `${josa(who(x, nx), '이/가')} ${josa(who(y, ny), '을/를')} ${CTRL[x + '-' + y] || '다잡아 주는'} 사이예요. 정할 일이 갈릴 땐 누가 정할지 미리 나눠요.`;
  const plainLead = [`둘 다 ${EL_PLAIN[eA]} 기운이라 서로를 잘 이해하는 사이예요. 비슷한 데서 부딪히기도 하니 역할을 나눠 보세요.`, gen(eA, nA, eB, nB), ctl(eA, nA, eB, nB), ctl(eB, nB, eA, nA), gen(eB, nB, eA, nA)][m.rel];
  const wd = db.settings.wedding || '';
  return `<div class="head"><h1>궁합·결혼일</h1><p>${esc(nA)} 기준 · 상대 ${esc(nB)}${B.hourKnown ? '' : ` (${esc(josa(nB, '은/는'))} 태어난 시간을 몰라 여섯 글자로 봐요)`}</p></div>
  <section class="card pairc"><div class="ch"><h2>${head}</h2></div>
    <div class="pair"><div><p class="who">${esc(nA)} · 중심 글자 ${A.pillars[2][0]}</p>${pillarCells(A, true)}</div><div><p class="who">${esc(nB)} · 중심 글자 ${B.pillars[2][0]}</p>${pillarCells(B, true)}</div></div>
    <p class="lead gap-t">${esc(plainLead)}</p>
    <details class="more"><summary>자세히</summary><div class="why-b"><p>${esc(relLine)}</p>
    ${m.gangHwi ? `<p>丙(태양)과 壬(큰 물)은 <b>강휘상영(江暉相映)</b>, "강물 위에 햇빛이 비치는 그림"으로 많이 풀어요. 서로를 돋보이게 한다는 좋은 뜻이에요.</p>
    <p class="note">${I('info')}<span>솔직하게 보면 丙과 壬은 서로 부딪히는 짝(천간 충)이기도 해요. 물이 불을 다스리는 관계(수극화)라 긴장도 있어요. 서로의 속도를 존중하면 장점이 더 커져요.</span></p>` : m.stemHap ? `<p>두 사람의 중심 글자가 서로 끌어당겨요(천간합). 서로 끌리는 힘이 있어요.</p>` : m.stemChung ? `<p>두 사람의 중심 글자가 서로 부딪혀요(천간 충). 방식 차이가 드러나기 쉬워요.</p>` : ''}</div></details>
  </section>
  <div class="lists">
    <section class="card"><div class="ch"><h2>서로 채워주는 점</h2></div>${list3(fills.length ? fills : ['서로 필요한 기운이 겹치지 않아요. 다른 사람·환경으로 채워도 괜찮아요.'], 'do', 'check')}</section>
    <section class="card"><div class="ch"><h2>부딪힐 때 맞춰갈 점</h2></div>${adjust.length ? list3(adjust, 'dont', 'info') : '<ul class="dos"><li>크게 부딪히는 글자는 없어요.</li></ul>'}</section>
  </div>
  <div class="grid g2">
    <section class="card"><div class="ch"><h2>다섯 기운 비교</h2></div>
      <div class="pair">${[[pa, A], [pb, B]].map(([p, c]) => `<div><p class="who">${esc(p.name)} · 필요: ${c.analysis.needed.map(e => EL_PLAIN[e]).join('·') || '없음'}</p><div class="bars sm">${c.analysis.count.map((n, e) => `<div class="b e-${ELC[e]}"><span><i class="dot"></i>${EL_PLAIN[e]}</span><span class="t"><i style="width:${n / c.analysis.total * 100}%"></i></span><span class="num">${n}</span></div>`).join('')}</div></div>`).join('')}</div>
    </section>
    <section class="card"><div class="ch"><h2>두 사람 사이 글자 관계</h2></div>
      <ul class="rels">${rels.slice(0, 3).map(relLi).join('')}</ul>
      ${rels.length > 3 ? `<details class="more"><summary>자세히 (${rels.length - 3}개 더)</summary><ul class="rels">${rels.slice(3).map(relLi).join('')}</ul></details>` : ''}
    </section>
  </div>
  <section class="card" id="wedCard"><div class="ch"><h2>결혼일 점검</h2>${wd ? `<span class="sub num">${wd.replace(/-/g, '.')} (${wk(wd)})</span>` : ''}</div>
    <div id="wedOut">${wd ? wedResult(wd, true) : '<p class="small">아래에서 날짜를 넣으면 두 사람 사주에 그 해·그 달·그 날을 대 봐요.</p>'}</div>
    <details class="more datepick"${wd ? '' : ' open'}><summary>${I('calendar')}${wd ? '다른 날짜도 점검해 보기' : '날짜 점검하기'}</summary>
      <div class="datein"><input id="wed" type="date" value="${esc(wd)}" aria-label="점검할 날짜"><button class="btn" data-act="wedcheck">점검하기</button></div>
      <div id="altOut">${wd ? altBlock(wd) : ''}</div>
    </details>
  </section>`;
}
const VERD = { good: '잘 맞는 편', ok: '무난한 편', care: '신경 쓸 점이 있는 편' };
/** 목록은 3개까지 보이고 나머지는 접어 둠 (두 카드 높이를 맞춤) */
const list3 = (items, cls, ic) => { const li = t => `<li class="${cls}">${I(ic)}<span>${esc(t)}</span></li>`; return `<ul class="dos">${items.slice(0, 3).map(li).join('')}</ul>${items.length > 3 ? `<details class="more"><summary>더 보기 (${items.length - 3}개)</summary><ul class="dos">${items.slice(3).map(li).join('')}</ul></details>` : ''}`; };
function wedResult(ymd, fixed) {
  const pa = me(), pb = partner(), A = chartOf(pa), B = chartOf(pb);
  const rA = S.checkDate(A, ymd), rB = S.checkDate(B, ymd);
  const one = (p, c, r) => {
    const lines = [];
    if (r.spouseRel.length) lines.push(`그날 글자 ${josa(r.Dg[1], '이/가')} 배우자 자리(${c.pillars[2][1]})와 ${uniq(r.spouseRel.map(x => REL_GL[x.type] + '(' + x.type + ')')).join(', ')}. ${relMeaning(r.spouseRel[0].type)}`);
    const pos = uniq(r.D.notes.filter(n => n.k === 'need').map(n => pl(n.t.replace('필요한 ', ''))));
    if (pos.length) lines.push(`그날 필요한 ${pos.join('·')} 기운이 들어와요.`);
    lines.push(`해 ${r.Yg} ${YEAR_W(r.Y.total)} · 달 ${r.Mg} ${YEAR_W(r.M.total)} · 날 ${r.Dg} ${YEAR_W(r.D.total)}`);
    return `<div><b>${esc(p.name)} · ${VERD[r.verdict]}</b>${lines.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
  };
  const share = r => { const a = Math.abs(0.2 * r.Y.total), t = a + Math.abs(0.3 * r.M.total) + Math.abs(0.5 * r.D.total); return t ? a / t : 0; };
  const yearHeavy = [rA, rB].some(r => r.verdict !== 'good' && share(r) >= 0.5);
  const hyung = uniq([rA, rB].flatMap(r => r.spouseRel.filter(x => x.type === '형').map(x => x.name.split(' ')[0])));
  const worst = [rA, rB].some(r => r.verdict === 'care') ? 'care' : [rA, rB].every(r => r.verdict === 'good') ? 'good' : 'ok';
  const [, mo, dd] = ymd.split('-').map(Number), tip = hyung.length ? '계약서·하객 안내 날짜만 두 번 확인하세요.' : '중요한 일정만 한 번 더 확인하세요.';
  const headFixed = `${mo}월 ${dd}일은 ${{ good: '두 사람 모두에게 잘 맞는 편이에요', ok: '두 사람 모두에게 무난한 날이에요', care: '날짜를 바꿀 정도는 아니에요' }[worst]}. 정한 날을 기준으로 준비하면 돼요.${hyung.length || worst === 'care' ? ' ' + tip : ''}`;
  const headCheck = `${mo}월 ${dd}일은 ${{ good: '두 사람 모두에게 잘 맞는 편인 날이에요.', ok: '두 사람 모두에게 무난한 날이에요.', care: '조금 신경 쓸 점이 있는 날이에요. 날짜를 꼭 바꿔야 한다는 뜻은 아니에요.' }[worst]}`;
  return `<p class="lead">${fixed ? headFixed : headCheck}</p>
    ${yearHeavy ? `<p class="small">이 결과는 대부분 ${ymd.slice(0, 4)}년 자체에서 나와요. 날짜를 옮겨도 크게 달라지지 않아요.</p>` : ''}
    <details class="more"><summary>두 사람 자세히 보기</summary><p class="small">${rA.Yg}년 ${rA.Mg}월 ${rA.Dg}일${hyung.length ? ` · 어긋나기 쉬운 글자(${hyung.join('·')} 형)` : ''}</p>
    <div class="who-res">${one(pa, A, rA)}${one(pb, B, rB)}</div>
    ${calcBox([[`${pa.name} 해`, sgn(rA.Y.total)], [`${pa.name} 달`, sgn(rA.M.total)], [`${pa.name} 날`, sgn(rA.D.total)], [`${pb.name} 해`, sgn(rB.Y.total)], [`${pb.name} 달`, sgn(rB.M.total)], [`${pb.name} 날`, sgn(rB.D.total)]], '<p class="small">날 점수 = 해 0.2 + 달 0.3 + 날 0.5. +1 이상 잘 맞는 편, −1 이상 무난한 편.</p>')}</details>`;
}
function altBlock(ymd) {
  const alts = altDates(ymd, chartOf(me()), chartOf(partner()));
  return alts.length ? `<p class="small gap-t">같은 시기 주말 중 두 사람 흐름이 더 고른 날 (참고)</p><div class="alt">${alts.map(a => `<button class="btn" data-act="wedpick" data-d="${a.d}"><span class="num">${a.d.replace(/-/g, '.')} (${a.wk}) ${a.gz}</span></button>`).join('')}</div>` : '<p class="small gap-t">같은 시기 주말 중 더 고른 날은 없어요.</p>';
}
function altDates(ymd, A, B) {
  const [y, mo, d] = ymd.split('-').map(Number), out = [], base = Math.min(S.checkDate(A, ymd).S, S.checkDate(B, ymd).S);
  for (let k = -42; k <= 42; k++) {
    const t = new Date(y, mo - 1, d + k), wd = t.getDay();
    if (k === 0 || (wd !== 0 && wd !== 6)) continue;
    const s = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`, a = S.checkDate(A, s), b = S.checkDate(B, s);
    const sc = Math.min(a.S, b.S);
    if (sc > base) out.push({ d: s, sc, wk: wd ? '토' : '일', gz: a.Dg });
  }
  return out.sort((p, q) => q.sc - p.sc).slice(0, 3);
}

// ── 페이지: 설정 ──
function pageSettings() {
  const st = db.settings;
  const roleName = r => ({ me: '나', partner: '상대', other: '기타' }[r] || '기타');
  const timeTxt = t => t.mode === 'exact' ? t.at : t.mode === 'range' ? `${t.from}–${t.to}` : '시간 모름';
  return `<div class="head"><h1>설정</h1><p>모든 정보는 이 기기 브라우저에만 있어요</p></div>
  <div class="grid g2">
    <div class="col"><section class="card"><div class="ch ch-act"><h2>프로필</h2><button class="btn" data-act="add">${I('plus')}추가</button></div>
      <div class="plist">${db.profiles.map(p => `<div class="prof"><div><b>${esc(p.name)}</b> <span class="sub">${roleName(p.role)}${p.id === (me() || {}).id ? ' · 지금 보는 중' : ''}</span><br><span class="small">${p.cal === 'lunar' ? '음력' : '양력'} ${esc(p.date)}${p.leap ? ' 윤달' : ''} · ${timeTxt(p.time)} · ${p.gender === 'F' ? '여' : '남'} · ${esc(p.city || '')}</span></div>
        <div class="acts"><button class="btn" data-act="who" data-id="${esc(p.id)}" data-go="home" aria-label="${esc(p.name)} 사주 보기"${p.id === (me() || {}).id ? ' aria-pressed="true"' : ''}>${I('compass')}보기</button><button class="btn" data-act="edit" data-id="${esc(p.id)}" aria-label="${esc(p.name)} 고치기">${I('pen')}</button><button class="btn danger" data-act="del" data-id="${esc(p.id)}" aria-label="${esc(p.name)} 지우기">${I('trash')}</button></div></div>`).join('') || '<p class="small">아직 프로필이 없어요.</p>'}</div>
      <h3 class="gap-t">데이터</h3><p class="small gap-s">서버가 없어요. 가져오기 링크의 정보는 주소의 # 뒤에 있어서 인터넷으로 보내지지 않아요. 열자마자 이 기기에 저장하고 주소에서 지워요.</p>
      <div class="btns"><button class="btn" data-act="export">${I('download')}내보내기</button><button class="btn" data-act="copylink">${I('link')}링크 복사</button><button class="btn danger" data-act="wipe">${I('trash')}모두 지우기</button></div>
    </section>
  <details class="card fold"><summary class="ch"><h2>계산 방식</h2><span class="sub">유튜버 "주식분석가달수"의 풀이 영상에서 뽑은 규칙으로 계산해요. 일반(자평) 명리와 다른 점도 나란히 적었어요</span></summary>
    <ul class="dos method">
      <li>${I('check')}<span>필요한 기운 = 계절 온도 맞추기(조후) + 빠진 오행(결핍). 일간의 힘(신강·신약)과 격국은 쓰지 않아요.</span></li>
      <li>${I('check')}<span>지지 관계 무게: 년지(띠) 1.0 · 월지 0.8 · 일지 0.8 · 시지 0.5</span></li>
      <li>${I('check')}<span>글자 점수: 필요한 오행 +2, 넘치는 오행 −2, 재성 +1(필요한 오행이면 +2), 편관 −2, 비견·겁재 −1, 일주와 같은 간지 −2, 삼재 −1, 겁살 −0.5, 묘 −0.5</span></li>
      <li>${I('check')}<span>분류(스펙 그대로): 밀고 갈 때 = 대운 ≥ +1 이고 세운 ≥ +1 · 지킬 때 = 대운 ≥ +1 이고 세운 < 0 · 준비할 때 = 대운 < 0 이고 (세운 ≥ +1 또는 3년 안에 좋은 대운) · 쉬어갈 때 = 대운 < 0 이고 세운 < 0 · 다음 해 세운이 −2보다 낮으면 7월부터 준비할 때(6개월 선반영)</span></li>
      <li>${I('check')}<span>스펙에 없는 칸은 이렇게 정했어요: 대운 ≥ +1 이고 세운 0~1 → 지킬 때 · 대운 0~1 → 세운 ≥ +1 밀고 갈 때, 0~1 준비할 때, < 0 지킬 때 · 대운 < 0 이고 세운 0~1 → 준비할 때 · 대운 < 0, 세운 < 0 이어도 3년 안에 좋은 대운이 오면 준비할 때</span></li>
      <li>${I('check')}<span>해(흐름 탭)는 대운 + 그해 세운으로, 달(나침반·12개월)은 대운 + "세운 0.35 : 월운 0.10"으로 분류해요. 그 해의 대운은 실제 교체일 기준으로 그해 한가운데(8월 초)에 걸린 대운이에요.</span></li>
      <li>${I('check')}<span>연주·월주·대운은 절기 시각(베이징 기준 UTC+8)에 맞춘 시각으로, 일주·시주는 태어난 곳의 실제 시각(경도 보정)으로 계산해요. 이름(개명 포함)은 계산에 쓰지 않아요.</span></li>
      <li>${I('check')}<span>오늘(일진): 그날의 간지를 같은 규칙(오행 ±2, 지지 관계 무게, 십성, 겁살·묘)으로 점수 내 +1 이상 좋은 날, −1 이상 무난한 날, 그 아래 조심할 날. 문장은 이번 달 분류와 함께 읽어요. 잘 맞는 시간대는 원국과의 합 + 필요한 오행 + 그날 일지와의 관계로 골라요.</span></li>
      <li>${I('check')}<span>오늘(일진)의 날짜는 한국 시계 23:30부터 다음 날로 넘어가요(127.5° 기준 子시 23:30–01:30 관례). 오늘의 카드도 같은 날짜를 써요. 야자시를 고르면 자정에 넘어가요.</span></li>
      <li>${I('check')}<span>숫자로 보는 카드(수비학, 재미로): 타고난 카드 = 양력 생년월일 숫자를 한 자리가 될 때까지 더한 수(1–9)의 메이저, 올해의 카드 = 생일(월·일) 숫자 + 올해 숫자를 한 자리씩 더해 1–21은 그대로, 22는 바보(0), 23 이상은 다시 더한 수의 메이저예요(정회도 영상 방식). 서양 Greer 방식(월+일+연을 통째로 더함)과는 결과가 다를 수 있어요.</span></li>
      <li>${I('check')}<span>타로 → 오행: 완드=불(화), 컵=물(수), 소드=칼날·공기(금 — 쇠로 벼린 칼처럼 가르고 결단하는 기운), 펜타클=흙(토). 메이저는 전통 대응을 따라 원소 카드는 그 원소로(공기→금), 별자리 카드는 별자리 원소로, 행성 카드는 동양 이름 그대로(수성→수, 금성→금, 화성·태양→화, 목성→목, 토성→토, 달→수).</span></li>
      <li>${I('x')}<span>빼 둔 것: 오너 사주로 주가 보기, 건강·식단, 정치, 관상, 생활 미신, 타로로 사고팔 시점 보기</span></li>
    </ul>
    <p class="small gap-t">타로 그림: Pamela Colman Smith, Rider–Waite–Smith Tarot (1909), 퍼블릭 도메인 · Wikimedia Commons 스캔. 카드 뜻 문장은 이 앱이 직접 쓴 거예요.</p>
    <h3 class="gap-t">달수 방식과 일반 명리의 차이</h3>
    <ul class="cmp">${[
      ['무엇이 필요한가', '계절(조후)과 빠진 오행으로 정해요. 일간의 힘은 따지지 않아요.', '일간의 힘(억부)·조후·격국을 함께 보고 용신을 정해요.'],
      ['띠(년지)의 무게', '띠를 가장 크게 봐요. 그다음이 월·일.', '일간과 월령이 중심이고, 띠 위주 해석은 옛 방식·민속에 가까워요.'],
      ['편관 대운', '10년 하락기로 봐요 (앱에서는 "책임과 압박이 커지는 때"로 순화).', '식신이 누르거나 인성으로 이어지면 오히려 힘이 돼요. 길흉이 정반대일 수 있어요.'],
      ['비견·복음 대운', '같은 글자 = 경쟁자를 만나는 10년.', '기운이 약한 사주엔 도움이 되고, 복음은 되풀이·정체 정도로 봐요.'],
      ['신살·삼재', '삼재·겁살·백호 같은 신살을 자주 쓰고, 삼재 3년은 조심하라고 봐요.', '신살은 보조 참고로만 쓰고, 원국 전체의 균형을 먼저 봐요.'],
      ['다음 해를 미리 보기', '다음 해 운은 6개월 전부터 반영된다고 봐요.', '정해진 규칙은 없어요. 세운은 그해 입춘부터 봐요.']
    ].map(([t, a, b]) => `<li><span><span class="lb">${t} · 달수 방식</span>${a}</span><span><span class="lb">일반 명리</span>${b}</span></li>`).join('')}</ul>
  </details>
    </div>
    <section class="card"><div class="ch"><h2>보기와 계산</h2></div>
      <div class="opts">
        <label class="opt"><span>연도 경계</span><select data-set="yearBoundary"><option value="ipchun"${st.yearBoundary !== 'seol' ? ' selected' : ''}>입춘 (기본, 일반 만세력)</option><option value="seol"${st.yearBoundary === 'seol' ? ' selected' : ''}>설날 (달수 1회 발언)</option></select><span class="small">설날을 고르면 연주와 세운 경계만 바뀌어요. 월주·대운은 절기 그대로예요.</span></label>
        <label class="opt"><span>밤 11시(자시) 날짜</span><select data-set="sect"><option value="1"${+st.sect !== 2 ? ' selected' : ''}>23시부터 다음 날 (기본)</option><option value="2"${+st.sect === 2 ? ' selected' : ''}>자정부터 다음 날 (야자시)</option></select></label>
        <label class="opt"><span>화면 테마</span><select data-set="theme"><option value="auto"${st.theme === 'auto' ? ' selected' : ''}>기기 설정 따라가기</option><option value="light"${st.theme === 'light' ? ' selected' : ''}>밝게</option><option value="dark"${st.theme === 'dark' ? ' selected' : ''}>어둡게</option></select></label>
        <label class="chk"><input type="checkbox" data-set="hideMatch"${st.hideMatch ? ' checked' : ''}>궁합·결혼일 탭 숨기기</label>
        <label class="opt"><span>타로 읽는 방식 <span class="sub">(정회도 방식은 특정인 공식 서비스가 아니에요)</span></span><select data-set="tarotMethod">${Object.entries(T ? T.METHODS : {}).map(([k, m]) => `<option value="${k}"${st.tarotMethod === k ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>
      </div>
    </section>
  </div>`;
}
// ── 프로필 입력 폼 (시트) ──
function openForm(id) {
  const p = db.profiles.find(x => x.id === id) || { id: '', role: db.profiles.some(x => x.role === 'me') ? 'partner' : 'me', name: '', gender: 'M', cal: 'solar', leap: false, date: '', time: { mode: 'unknown' }, city: '서울', lng: 126.98 };
  const t = p.time || { mode: 'unknown' }, [ly, lm, ld] = (p.date || '').split('-');
  sheet(`<div class="top"><h2 id="sheetTitle">${id ? '프로필 고치기' : '프로필 추가'}</h2>${closeBtn()}</div>
  <form class="form" id="pform" data-id="${esc(p.id)}">
    <label class="f">부를 이름<input type="text" name="name" required maxlength="20" value="${esc(p.name)}" placeholder="예: MJ"></label>
    <div class="two"><label class="f">누구<select name="role"><option value="me"${p.role === 'me' ? ' selected' : ''}>나</option><option value="partner"${p.role === 'partner' ? ' selected' : ''}>상대(궁합)</option><option value="other"${p.role === 'other' ? ' selected' : ''}>기타</option></select></label>
    <label class="f">성별<select name="gender"><option value="M"${p.gender !== 'F' ? ' selected' : ''}>남</option><option value="F"${p.gender === 'F' ? ' selected' : ''}>여</option></select></label></div>
    <label class="f">달력<select name="cal"><option value="solar"${p.cal !== 'lunar' ? ' selected' : ''}>양력</option><option value="lunar"${p.cal === 'lunar' ? ' selected' : ''}>음력</option></select></label>
    <label class="f solar-only">생년월일 (양력)<input type="date" name="date" value="${p.cal !== 'lunar' ? esc(p.date) : ''}" min="1900-01-01" max="2100-12-31"></label>
    <fieldset class="lunar-only"><legend>생년월일 (음력)</legend><div class="three">
      <label class="f">년<input type="number" name="ly" min="1900" max="2100" inputmode="numeric" value="${p.cal === 'lunar' ? +ly : ''}"></label>
      <label class="f">월<input type="number" name="lm" min="1" max="12" inputmode="numeric" value="${p.cal === 'lunar' ? +lm : ''}"></label>
      <label class="f">일<input type="number" name="ld" min="1" max="30" inputmode="numeric" value="${p.cal === 'lunar' ? +ld : ''}"></label></div>
      <label class="chk"><input type="checkbox" name="leap"${p.leap ? ' checked' : ''}>윤달</label></fieldset>
    <label class="f">태어난 시간<select name="tmode"><option value="exact"${t.mode === 'exact' ? ' selected' : ''}>정확히 알아요</option><option value="range"${t.mode === 'range' ? ' selected' : ''}>대략 (몇 시~몇 시)</option><option value="unknown"${t.mode === 'unknown' ? ' selected' : ''}>몰라요 (3주로 보기)</option></select></label>
    <div class="two"><label class="f">시각 또는 시작<input type="time" name="t1" value="${esc(t.at || t.from || '')}"></label><label class="f">끝(대략일 때)<input type="time" name="t2" value="${esc(t.to || '')}"></label></div>
    <div class="two"><label class="f">태어난 곳<select name="city">${S.CITIES.map(([n]) => `<option${n === p.city ? ' selected' : ''}>${n}</option>`).join('')}<option value=""${S.CITIES.some(([n]) => n === p.city) ? '' : ' selected'}>기타 (경도 직접)</option></select></label>
    <label class="f">경도 (°E)<input type="number" name="lng" step="0.01" min="120" max="135" value="${esc(p.lng)}"></label></div>
    <p class="small">경도로 태어난 곳의 실제 시각을 계산해요 (서울은 약 32분 빠르게 보정). 1987–88년 서머타임도 반영해요.</p>
    <button class="btn pri" type="submit">저장</button>
  </form>`);
  const f = $('#pform');
  const sync = () => { f.dataset.cal = f.cal.value; };
  sync(); f.cal.addEventListener('change', sync);
  f.city.addEventListener('change', () => { const c = S.CITIES.find(([n]) => n === f.city.value); if (c) f.lng.value = c[1]; });
}
function saveForm(f) {
  const tm = f.tmode.value, t1 = f.t1.value, t2 = f.t2.value, lunar = f.cal.value === 'lunar';
  if (tm !== 'unknown' && !t1) return toast('시간을 넣어 주세요'), false;
  if (tm === 'range' && !t2) return toast('끝 시간을 넣어 주세요'), false;
  const date = lunar ? `${String(f.ly.value).padStart(4, '0')}-${String(f.lm.value).padStart(2, '0')}-${String(f.ld.value).padStart(2, '0')}` : f.date.value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return toast('생년월일을 넣어 주세요'), false;
  const raw = { id: f.dataset.id || 'p' + Date.now().toString(36), role: f.role.value, name: f.name.value.trim(), gender: f.gender.value, cal: f.cal.value, leap: lunar && f.leap.checked, date,
    time: tm === 'exact' ? { mode: 'exact', at: t1 } : tm === 'range' ? { mode: 'range', from: t1, to: t2 } : { mode: 'unknown' }, city: f.city.value || '기타', lng: +f.lng.value };
  let p;
  try { p = S.decodeImport('#import=' + S.encodeImport({ profiles: [raw] })).profiles[0]; S.computeChart(p); } catch (e) { toast(lunar ? '없는 음력 날짜예요. 윤달·말일을 확인해 주세요' : '날짜를 확인해 주세요'); return false; }
  const i = db.profiles.findIndex(x => x.id === p.id);
  if (i >= 0) db.profiles[i] = p; else db.profiles.push(p);
  if (p.role === 'me') db.settings.activeId = p.id;
  if (p.role === 'partner') db.settings.partnerId = p.id;
  return save();
}

// ── 이벤트 ──
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove('on'), 3000); }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) { if (e.target === $('#sheet')) $('#sheet').close(); return; }
  const a = b.dataset.act;
  if (a === 'year') openYear(+b.dataset.y);
  else if (a === 'daeun') openDaeun(+b.dataset.i);
  else if (a === 'close') $('#sheet').close();
  else if (a === 'hour') { db.settings.hourPick[me().id] = b.dataset.gz; save(); render(); }
  else if (a === 'day') openDay(b.dataset.d);
  else if (a === 'area') openArea(b.dataset.k);
  else if (a === 'why') openWhy();
  else if (a === 'who') { db.settings.activeId = b.dataset.id; save(); if (b.dataset.go) location.hash = '#/' + b.dataset.go; render(); toast(`${me().name} 사주로 바꿨어요`); const f = $('.whobar [aria-pressed="true"]'); if (f && !b.dataset.go) f.focus(); }
  else if (a === 'term') { if (!db.settings.termSeen) { db.settings.termSeen = true; save(); const h = $('#main .hint'); if (h) h.remove(); } openTerm(b.dataset.t); }
  else if (a === 'cell') openCell(+b.dataset.i);
  else if (a === 'tdraw') drawDaily();
  else if (a === 'tthree') openTarot();
  else if (a === 'thist') openTarot(+b.dataset.i);
  else if (a === 'tdel') {
    const pos = [...document.querySelectorAll('#sheet [data-act="tdel"]')].indexOf(b);
    tarotOf().history.splice(+b.dataset.i, 1); save(); openTarot();
    const rows = document.querySelectorAll('#sheet [data-act="thist"]');
    (rows[Math.min(pos, rows.length - 1)] || $('#tarotForm [name="spread"]')).focus();
  }
  else if (a === 'add') openForm('');
  else if (a === 'edit') openForm(b.dataset.id);
  else if (a === 'del') { const p = db.profiles.find(x => x.id === b.dataset.id); if (p && confirm(`${josa(p.name, '을/를')} 지울까요?`)) { db.profiles = db.profiles.filter(x => x !== p); save(); render(); } }
  else if (a === 'wedcheck' || a === 'wedpick') {
    const v = a === 'wedpick' ? b.dataset.d : $('#wed').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return toast('날짜를 골라 주세요');
    $('#wed').value = v; $('#altOut').innerHTML = wedResult(v, false) + altBlock(v);
  }
  else if (a === 'export') {
    const url = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }));
    const l = document.createElement('a'); l.href = url; l.download = 'saju-backup.json'; l.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  else if (a === 'copylink') {
    const link = location.origin + location.pathname + '#import=' + S.encodeImport({ profiles: db.profiles, settings: { wedding: db.settings.wedding, areas: db.settings.areas, focus: db.settings.focus, yearBoundary: db.settings.yearBoundary } });
    (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => toast('링크를 복사했어요. 생년월일이 들어 있으니 나만 쓰세요'), () => toast('복사하지 못했어요'));
  }
  else if (a === 'wipe') { if (confirm('이 기기에 저장된 모든 정보를 지울까요?')) { try { localStorage.removeItem(KEY); } catch (err) { /* noop */ } db = { profiles: [], settings: { ...DEF }, plans: {}, tarot: { daily: {}, history: [] } }; memo.clear(); render(); toast('모두 지웠어요'); } }
});
document.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.set; if (!k) return;
  db.settings[k] = e.target.type === 'checkbox' ? e.target.checked : k === 'sect' ? +e.target.value : e.target.value;
  save(); render();
});
let planT;
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.plan; if (!k) return;
  const p = me(), c = chartOf(p), v = S.now(c, today(), opts()), key = planKey(v, p);
  (db.plans[key] = db.plans[key] || { ...plansOf(v, p) })[k] = e.target.value.slice(0, 80);
  $('#pc-' + k).textContent = planComment(e.target.value, v.cls, v.M, k);
  const ap = $('#ap-' + k), pv = e.target.value.trim(); if (ap) ap.textContent = pv ? '내 계획: ' + pv : '';
  clearTimeout(planT); planT = setTimeout(save, 400);
});
document.addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'tarotForm') return submitTarot(e.target);
  if (e.target.id === 'pform') { if (saveForm(e.target)) { $('#sheet').close(); render(); toast('저장했어요'); } }
  else if (e.target.id === 'pasteForm') {
    const v = $('#pasteIn').value.trim(), i = v.indexOf('#import=');
    if (i < 0) return toast('#import= 이 들어 있는 링크를 붙여 넣어 주세요');
    const err = importFrom(v.slice(i));
    if (err === 'fail') return;
    if (err) return toast(err);
    render(); toast('정보를 이 기기에만 저장했어요');
  }
});
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawCharts, 120); });
addEventListener('hashchange', () => { if (/import=/.test(location.hash)) handleImport(); render(); if (!location.hash.split('#')[2]) scrollTo(0, 0); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);

const PAGES = { home: pageHome, flow: pageFlow, chart: pageChart, match: pageMatch, settings: pageSettings };
if (window.Solar && S) handleImport();
render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
