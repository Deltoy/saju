/* app.js — UI for 사주 나침반. Data lives only in this browser (localStorage). */
'use strict';
const S = window.Saju;
const KEY = 'saju.v1';
const DEF = { yearBoundary: 'ipchun', sect: 1, theme: 'auto', hideMatch: false, hourPick: {}, wedding: '', areas: {}, focus: {}, activeId: null, partnerId: null };
const AREA_DEF = { move: '이동·정착', career: '진로·공부', money: '돈·투자', family: '가정·관계' };
const FOCUS_DEF = { move: '이동 준비', career: '공부', money: '비상금·지출 관리', family: '관계' };
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sgn = x => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(1);

// ── 조사: 받침 따라 을/를 · 이/가 · 은/는 · 과/와 · 으로/로 (영문·숫자는 읽는 소리 기준) ──
function batchim(w) {
  const c = String(w).trim().replace(/[\s)\]」'"·.]+$/, '').slice(-1);
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
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.profiles)) return { profiles: d.profiles, settings: { ...DEF, ...d.settings }, plans: d.plans || {} }; } catch (e) { /* 저장소 막힘 → 빈 상태 */ }
  return { profiles: [], settings: { ...DEF }, plans: {} };
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
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'
};
const I = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
const CLS_ICON = { push: 'arrowUp', guard: 'shield', prep: 'sprout', rest: 'moon' };
const CLS_SHORT = { push: '밀고', guard: '지킬', prep: '준비', rest: '쉬어' };
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
const SUB = (cls, base) => cls === 'prep' && base !== 'prep' ? { guard: '올해는 지키면서 내년을 준비', push: '올해는 밀되 내년을 준비', rest: '쉬면서 내년을 준비' }[base]
  : { push: '미뤄 둔 도전을 시작', guard: '새로 벌이기보다 지키기', prep: '정리하고 실력을 쌓기', rest: '무리하지 말고 쉬기' }[cls];
/** 모든 탭이 같은 낱말을 씀: 10년 흐름 · 올해 · 다음 해 → 분류 */
function readingChips(D, Y, N) {
  const c = (k, w, v) => `<span class="rd rd-${v}"><span class="rk">${k}</span>${w}</span>`;
  return `<div class="reading">${c('10년 흐름', TEN_W(D), D >= 1 ? 'g' : D >= 0 ? 'n' : 'b')}${c('올해', YEAR_W(Y), Y >= 1 ? 'g' : Y >= 0 ? 'n' : 'b')}${c('다음 해', NEXT_W(N), N >= 1 ? 'g' : N >= -2 ? 'n' : 'b')}</div>`;
}

// ── 글자 표시 ──
const ELC = ['wood', 'fire', 'earth', 'metal', 'water'];
const elName = e => `${S.EL[e]}(${S.EL_HANJA[e]})`;
const elTag = (e, kind) => `<span class="tag el e-${ELC[e]}${kind ? ' ' + kind : ''}"><i></i>${elName(e)}</span>`;
const hz = c => { const e = S.STEMS.includes(c) ? S.stemEl(S.si(c)) : S.BR_EL[S.bi(c)]; return `<span class="hz ce e-${ELC[e]}">${c}</span>`; };
const hz2 = gz => `<span class="pairhz">${hz(gz[0])}${hz(gz[1])}</span>`;
const gzKo = gz => `${gz}(${S.ko(gz)})`;
const uniq = a => [...new Set(a)];
const uniqRels = rels => [...new Map(rels.map(r => [r.name, r])).values()];
const relTags = rels => uniqRels(rels).map(r => `<span class="tag ${r.s > 0 ? 'good' : r.s < 0 ? 'bad' : ''}">${esc(relTxt(r))}</span>`).join('');
const noteTags = notes => uniq(notes.map(n => n.k + '|' + n.t)).map(x => { const [k, t] = x.split('|'); return `<span class="tag ${k === 'need' ? 'good' : 'bad'}">${esc(t)}</span>`; }).join('');

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
const errCard = (p, msg) => `<div class="head"><h1>계산하지 못했어요</h1></div><section class="card"><div class="ch"><h2>${I('info')}${esc(p ? josa(p.name, '은/는') : '')} 프로필을 읽지 못했어요</h2></div><p class="lead">${esc(msg || '생년월일이나 음력 윤달이 맞는지 설정에서 확인해 주세요.')}</p><div class="btns gap-t"><a class="btn pri" href="#/settings">${I('gear')}설정으로 가기</a></div></section>`;

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
    `<p class="side-note">명리는 흐름을 보는 참고예요 — 결정은 직접. 투자 판단의 근거로 쓰지 마세요.</p>`;
}
function render() {
  applyTheme();
  if (!window.Solar || !window.Lunar || !S) {
    $('#main').innerHTML = `<div class="head"><h1>사주 나침반</h1></div><section class="card"><div class="ch"><h2>${I('info')}계산 도구를 불러오지 못했어요</h2></div><p class="lead">lunar.js 파일이 없어서 계산할 수 없어요. 인터넷에 연결된 상태에서 새로고침해 주세요.</p></section>`;
    return;
  }
  const t = db.profiles.length ? route() : (route() === 'settings' ? 'settings' : 'home');
  renderNav(t);
  FLOW = null;
  $('#main').innerHTML = PAGES[t]();
  drawCharts();
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
  move: { push: '{f을} 실제로 움직이기 좋은 때예요.', guard: '새로 벌이기보다 이미 시작한 {f을} 차근차근 마무리해요.', prep: '다음 흐름에 바로 움직일 수 있게 {f을} 미리 갖춰 두세요.', rest: '큰 이동 결정은 미루고 {f은} 정보만 모아 두세요.' },
  career: { push: '{f에} 새 목표를 하나 더 붙여도 좋아요.', guard: '새로 시작하기보다 이미 시작한 {f을} 마무리해요.', prep: '새로 시작하기보다 이미 시작한 {f을} 마무리하며 내년을 준비해요.', rest: '양을 줄여도 괜찮아요. {f은} 꾸준함만 지켜요.' },
  money: { push: '원칙 안에서 {f을} 넓혀 봐요.', guard: '새 투자보다 {f부터} 지켜요.', prep: '{f으로} 내년을 준비해요.', rest: '돈 결정은 미루고 {f만} 해 두세요.' },
  family: { push: '{f에서} 큰 결정을 함께 정하기 좋아요.', guard: '{f은} 정한 일정대로 가고, 새 약속은 줄여요.', prep: '{f} 목록을 미리 채워 두세요.', rest: '둘만의 쉬는 시간을 먼저 챙기고 {f은} 천천히 해요.' }
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
function areaContext(c, k) {
  const day = c.pillars[2][0], A = c.analysis, female = (me() || {}).gender === 'F';
  if (k === 'move') { const y = nextYears(gz => gz[1] === A.yeokma); return y && { t: `이동 기운(역마 ${A.yeokma})이 큰 해: ${y}` }; }
  if (k === 'career') { const y = nextYears(gz => S.godOfStem(day, gz[0]).group === '인성'); return y && { t: `공부·문서 기운(인성)이 들어오는 해: ${y}` }; }
  if (k === 'money') return { t: '사주 흐름은 시장 가격과 맞지 않을 수 있어요. 달수 본인도 "선반영·후반영 때문에 딱 맞지 않는다"고 했어요. 특정 종목·매매 시점은 다루지 않아요.' };
  if (db.settings.wedding && partner()) return { t: `${db.settings.wedding.slice(0, 4)}년은 결혼이라는 큰 일을 치르는 해예요. 이 방식으로는 이직·큰 투자 같은 다른 큰 일을 같은 해에 겹치지 않는 걸 권해요.`, link: ['#/match#wedCard', '결혼일 점검 보기'] };
  const g = female ? '관성' : '재성', y = nextYears(gz => S.godOfStem(day, gz[0]).group === g);
  return y && { t: `배우자 자리를 비추는 해(${g}): ${y}` };
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
  const A = c.analysis, need = A.needed.map(elName).join('·') || '필요한';
  const d = v.daeun, nd = v.nextDaeun, Y = v.Y;
  const av = Y.notes.find(n => n.k === 'avoid'), br = Y.rels.find(r => r.s < 0);
  const yNeg = av ? `이미 많은 ${av.t.replace('넘치는 ', '')} 기운이 더 들어오는 해라` : br ? `${relTxt(br)}이 걸리는 해라` : '';
  if (v.cls === 'prep' && v.prepBadge) return `큰 흐름(${gzKo(d.gz)} 대운)은 ${TEN_W(v.D.total) === '좋음' ? '좋지만' : '그대로지만'} 내년(${gzKo(v.nextY.gz)})의 기운이 조심스러워요. 이 방식은 다음 해 운이 6개월 전부터 미리 반영된다고 봐서, 지금은 새로 벌이기보다 정리·점검으로 내년을 준비할 때예요.`;
  switch (v.cls) {
    case 'push': return `${d.startAge}세부터 10년은 나에게 필요한 ${need} 기운이 들어오는 시기예요. 올해(${gzKo(Y.gz)})도 흐름이 맞아요. 미뤄 둔 도전을 시작해 보세요. 결과는 ${v.year + 1}년에 더 또렷해져요.`;
    case 'guard': return `큰 흐름(${gzKo(d.gz)} 대운)은 좋지만 올해(${gzKo(Y.gz)})는 ${yNeg || '기운이 엇갈려'} 무리하거나 부딪히기 쉬워요. 계약서·명의는 두 번 확인하고, 새로 벌이기보다 지키는 쪽을 택하세요.`;
    case 'prep': return nd ? `${Math.max(1, nd.startYear - v.year)}년 뒤 ${gzKo(nd.gz)} 대운이 오기 전이에요. 지금은 정리하고 실력을 쌓을 때예요. 안 쓰는 지출과 무리한 빚부터 줄여 두면 좋은 운을 먼저 받아요.` : '지금은 정리하고 실력을 쌓을 때예요.';
    default: return '대운과 올해 모두 기운이 엇갈려요. 무리한 확장보다 몸과 마음, 관계, 현금 흐름을 챙기고 큰 결정은 조금 미뤄 보세요.';
  }
}
function daeunText(c, D, d) {
  const need = c.analysis.needed.map(elName).join('·');
  let t = D.total >= 1 ? `${d.startAge}세부터 10년은 나에게 필요한 ${need} 기운이 들어오는 회사예요.` : D.total >= 0 ? `${d.startAge}세부터 10년은 크게 좋지도 나쁘지도 않은 무난한 회사예요.` : `${d.startAge}세부터 10년은 맞춰 가는 데 힘이 드는 회사예요. 실력을 쌓는 시간으로 쓰면 좋아요.`;
  if (D.pyeongwan) t += ' 압박·책임 기운(편관)이 있어요. 예전 방식을 고집하기보다 자리와 역할을 새로 정해 보세요.';
  if (D.halfPeak) t += ` 다만 ${relTxt(D.rels.find(r => r.type === '충'))}이 있어 성과에 잡음이 따를 수 있어요 (반쪽 전성기).`;
  return t;
}
function seunText(c, v) {
  const Y = v.Y, pos = uniq(Y.rels.filter(r => r.s > 0).map(relTxt)), neg = uniq(Y.rels.filter(r => r.s < 0).map(relTxt)), el = uniq(Y.notes.map(n => n.t));
  let t = Y.total >= 1 ? '나와 잘 맞는 거래처 같은 해예요.' : Y.total >= 0 ? '무난한 거래처 같은 해예요.' : '까다로운 거래처 같은 해예요.';
  if (el.length) t += ` ${el.join(', ')} 기운이 들어와요.`;
  if (pos.length) t += ` ${pos.join(', ')}으로 힘이 모이고${neg.length ? ',' : '요.'}`;
  if (neg.length) t += ` ${neg.join(', ')}은(는) 조심할 부분이에요.`;
  return t + ' 올해 한 일의 결과는 다음 해에 더 또렷해진다고 봐요.';
}
/** 다음 해 준비 배너: 남은 달과 다음 세운 시작일을 날짜로 계산 (입춘·설이 낀 달은 빼고 그 전 달까지) */
function prepBanner(v) {
  const now = kst(today()), end = kst(new Date(v.nextSeunStart.getTime() - 10 * 864e5)), a = [], b = [];
  for (let y = now.y, m = now.m; y < end.y || (y === end.y && m <= end.m); m === 12 ? (y++, m = 1) : m++) (y === now.y ? a : b).push(m);
  const span = l => l.length ? (l.length > 1 ? `${l[0]}–${l[l.length - 1]}월` : `${l[0]}월`) : '';
  const txt = [span(a), span(b)].filter(Boolean), months = txt.length > 1 ? `${josa(txt[0], '과/와')} ${txt[1]}` : txt[0];
  const st = md(v.nextSeunStart), how = db.settings.yearBoundary === 'seol' ? '설' : '입춘';
  return `<div class="banner">${I('flag')}<span><b>다음 해 준비</b> — 남은 ${josa(months, '은/는')} 정리·점검 위주로 가요. ${v.nextY.gz}년은 ${st}(${how})부터예요.</span></div>`;
}
const calcBox = (rows, extra = '') => `<details class="calc"><summary>계산 보기</summary><div class="calc-b"><div class="parts num">${rows.map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</div>${extra}</div></details>`;

// ── 나침반 다이얼 ──
function dial(cls) {
  const C = 130, R = 106, order = ['push', 'guard', 'rest', 'prep'], ang = { push: 0, guard: 90, rest: 180, prep: 270 };
  const pt = (a, r) => [C + r * Math.sin(a * Math.PI / 180), C - r * Math.cos(a * Math.PI / 180)];
  const f = n => n.toFixed(1);
  const arc = (a0, a1, r) => { const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r); return `M${f(x0)} ${f(y0)}A${r} ${r} 0 0 1 ${f(x1)} ${f(y1)}`; };
  const lbl = { push: [C, C - 62], guard: [C + 64, C + 5], rest: [C, C + 70], prep: [C - 64, C + 5] };
  let s = `<svg class="dial" viewBox="0 0 260 260" role="img" aria-label="이번 달 나침반: ${S.CLASSES[cls].name}">`;
  s += `<circle cx="${C}" cy="${C}" r="${R + 18}" class="dial-bg"/><circle cx="${C}" cy="${C}" r="${R - 20}" fill="none" stroke="var(--line)"/>`;
  for (let i = 0; i < 72; i++) { const major = i % 18 === 0, [x0, y0] = pt(i * 5, R - 30), [x1, y1] = pt(i * 5, R - (major ? 22 : 26)); s += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="var(--ink3)" stroke-opacity="${major ? .7 : .25}" stroke-width="${major ? 1.5 : 1}"/>`; }
  for (const k of order) { const m = ang[k]; s += `<path d="${arc(m - 40, m + 40, R)}" class="k-${k}" stroke="${k === cls ? 'var(--k)' : 'var(--line)'}" stroke-width="10" fill="none" stroke-linecap="round"/>`; }
  for (const k of order) { const [x, y] = lbl[k]; s += `<text x="${x}" y="${y}" text-anchor="middle" font-size="12.5" font-weight="${k === cls ? 700 : 500}" class="k-${k}" fill="${k === cls ? 'var(--k)' : 'var(--ink3)'}">${S.CLASSES[k].name}</text>`; }
  const [dx, dy] = pt(ang[cls], R);
  s += `<circle cx="${C}" cy="${C}" r="36" fill="var(--card)" stroke="var(--line)"/>`;
  s += `<text x="${C}" y="${C + 5}" text-anchor="middle" font-size="24" font-weight="750" class="k-${cls}" fill="var(--k)">${CLS_SHORT[cls]}</text><text x="${C}" y="${C + 22}" text-anchor="middle" font-size="11" fill="var(--ink3)">이번 달</text>`;
  s += `<circle cx="${f(dx)}" cy="${f(dy)}" r="9" fill="var(--card)" class="k-${cls}" stroke="var(--k)" stroke-width="4"/></svg>`;
  return s;
}

// ── 페이지: 나침반 ──
function emptyHome() {
  return `<div class="head"><h1>사주 나침반</h1><p>생년월일을 넣으면 지금의 흐름을 보여 드려요</p></div>
    <section class="card empty-state"><div class="ch"><h2>${I('compass')}아직 저장된 정보가 없어요</h2></div>
    <p class="lead">정보는 이 기기 브라우저에만 저장되고 어디로도 보내지지 않아요. 홈 화면에 추가한 앱은 사파리와 저장 공간이 따로라, 받은 가져오기 링크를 아래에 붙여 넣으면 바로 채워져요.</p>
    <form class="paste" id="pasteForm"><input type="url" id="pasteIn" placeholder="https://…/#import=…" aria-label="가져오기 링크 붙여넣기" autocomplete="off"><button class="btn" type="submit">${I('link')}가져오기</button></form>
    <button class="btn pri" data-act="add">${I('plus')}직접 입력하기</button></section>`;
}
function pageHome() {
  const p = me();
  if (!p) return emptyHome();
  const c = chartOf(p); if (!c) return errCard(p);
  const v = S.now(c, today(), opts()), M = v.M, adv = lifeAdvice(c, M, v.cls);
  const yv = S.yearView(c, v.year), Dd = v.D, d = v.daeun, nd = v.nextDaeun;
  const ms = S.months(c, today(), 12, opts());
  const tags = [];
  if (v.attack) tags.push(`<span class="tag">${I('target')}공격 타이밍: 부딪쳐도 되는 해, 결과는 내년</span>`);
  if (Dd && Dd.halfPeak) tags.push('<span class="tag">반쪽 전성기</span>');
  if (v.Y.samjae) tags.push('<span class="tag bad">삼재 해</span>');
  const plans = db.plans[planKey(v)] || {};
  return `<div class="head"><h1>${esc(p.name)}의 나침반</h1><p>${fmtDate(today())} · ${gzKo(M.gz)}월(${md(v.monthStart)}~${md(new Date(v.monthEnd.getTime() - 864e5))})</p></div>
  <section class="card verdict k-${v.cls}" aria-label="이번 달 흐름">
    <div class="compass">${dial(v.cls)}
      <div class="verdict-t"><p class="sub">이번 달은</p><h2>${S.CLASSES[v.cls].name}</h2><p class="vsub">${SUB(v.cls, v.base)}</p>
        ${readingChips(Dd ? Dd.total : 0, v.Y.total, v.nextY.total)}
        <p class="lead">${esc(whyText(c, v))}</p>${v.prepBadge ? prepBanner(v) : ''}${tags.length ? `<div class="tags">${tags.join('')}</div>` : ''}
        ${calcBox([['대운(10년)', sgn(Dd ? Dd.total : 0)], ['세운(올해)', sgn(v.Y.total)], ['월운(이번 달)', sgn(M.total)], ['올해+이번 달', sgn(v.near)], ['합친 점수', sgn(v.S)]], `<p class="small">분류는 대운과 "올해+이번 달"(세운 0.35 : 월운 0.10)로 정해요. 흐름 탭의 해 점수는 올해 세운만 쓰고, 이번 달을 넣지 않아서 숫자가 달라요. 합친 점수 = 대운 0.55 + 세운 0.35 + 월운 0.10.</p>`)}
      </div>
    </div>
  </section>
  <div class="periods">
    ${d ? `<section class="card period">
      <div class="ch"><h2>${I('building')}10년 회사</h2><span class="sub num">${d.startYear}–${d.endYear} · ${d.startAge}–${d.endAge}세</span></div>
      <div class="gz">${hz2(d.gz)}<span class="sub">${S.ko(d.gz)} 대운 · 10년 흐름 ${TEN_W(Dd.total)}</span></div>
      <p class="small gods">${godTxt(Dd.gods[0])} · ${godTxt(Dd.gods[1])}</p>
      <p class="lead">${esc(daeunText(c, Dd, d))}</p>
      <div class="tags">${noteTags(Dd.notes)}${relTags(Dd.rels)}${nd ? `<span class="tag">다음: ${nd.gz} ${nd.startYear}–</span>` : ''}</div>
      ${Dd.pyeongwan ? note(NOTE.pyeongwan) : ''}${Dd.bokeum ? note(NOTE.bokeum) : ''}
    </section>` : ''}
    <section class="card period">
      <div class="ch"><h2>${I('hand')}1년 거래처</h2>${clsPill(yv.cls)}</div>
      <div class="gz">${hz2(v.Y.gz)}<span class="sub">${v.year}년 ${S.ko(v.Y.gz)} · 올해 ${YEAR_W(v.Y.total)}</span></div>
      <p class="small gods">${godTxt(v.Y.gods[0])} · ${godTxt(v.Y.gods[1])}</p>
      <p class="lead">${esc(seunText(c, yv))}</p>
      <div class="tags">${noteTags(v.Y.notes)}${relTags(v.Y.rels)}<span class="tag">다음 해: ${v.nextY.gz} ${NEXT_W(v.nextY.total)}</span></div>
      ${v.Y.pyeongwan ? note(NOTE.pyeongwan) : v.Y.bokeum ? note(NOTE.bokeum) : ''}
    </section>
  </div>
  <details class="card fold"><summary class="ch"><h2>${I('calendar')}앞으로 12개월</h2><span class="sub">${esc(monthsSentence(ms, v))}</span><span class="bar strip" aria-hidden="true">${ms.map(m => `<i class="k-${m.cls}"></i>`).join('')}</span></summary>
    <div class="mlist">${ms.map(m => `<div><b class="num">${m.y % 100}.${String(m.m).padStart(2, '0')}</b>${hz2(m.gz)}${clsPill(m.cls)}</div>`).join('')}</div>
  </details>
  <h2 class="sec">이번 달 할 일 · 피할 일<span class="sub">지금 분류(${S.CLASSES[v.cls].name})와 이번 달 글자로 고른 문장이에요</span></h2>
  <div class="areas">${adv.map(a => `<section class="card area">
    <h3>${I(AREA_ICON[a.k])}${esc(area(a.k))}</h3>
    <p class="aline k-${v.cls}">${esc(a.line)}</p>
    <ul class="dos">${a.dos.map(t => `<li class="do">${I('check')}<span class="lbl">할 일</span><span>${esc(t)}</span></li>`).join('')}${a.donts.map(t => `<li class="dont">${I('x')}<span class="lbl">피할 일</span><span>${esc(t)}</span></li>`).join('')}</ul>
    ${a.ctx ? `<p class="small ctx">${esc(a.ctx.t)}</p>${a.ctx.link ? `<a class="btn sm" href="${a.ctx.link[0]}">${I('calendar')}${a.ctx.link[1]}</a>` : ''}` : ''}
    <label class="plan"><span>이번 달 내 계획</span><input type="text" maxlength="80" data-plan="${a.k}" value="${esc(plans[a.k] || '')}" placeholder="예: ${esc(PLAN_EX[a.k])}"></label>
    <p class="plan-c" id="pc-${a.k}" aria-live="polite">${esc(planComment(plans[a.k], v.cls, M, a.k))}</p>
  </section>`).join('')}</div>`;
}
const PLAN_EX = { move: '비자 서류 목록 만들기', career: '모의고사 2회 풀기', money: '고정비 3개 줄이기', family: '예식장 계약서 확인' };
const planKey = v => { const k = kst(v.monthStart); return `${k.y}-${String(k.m).padStart(2, '0')}`; };
function monthsSentence(ms, v) {
  const runs = [];
  for (const m of ms) { const l = runs[runs.length - 1]; if (l && l.cls === m.cls) l.n++; else runs.push({ cls: m.cls, n: 1, start: m.start }); }
  const ys = uniq(ms.map(m => m.Y.total)), yw = ys.every(x => x < 0) ? '엇갈려서' : ys.every(x => x >= 1) ? '좋아서' : '섞여 있어서';
  const why = `10년 흐름은 ${TEN_W(v.D ? v.D.total : 0) === '좋음' ? '좋고' : TEN_W(v.D ? v.D.total : 0) === '보통' ? '보통이고' : '버겁고'} 올해·내년 기운이 ${yw}예요`;
  if (runs.length === 1) return `앞으로 12개월 모두 ${S.CLASSES[runs[0].cls].name} — ${why}.`;
  return `${runs.slice(0, 3).map((r, i) => `${i ? md(r.start) + '부터' : '지금은'} ${S.CLASSES[r.cls].name}`).join(', ')}${runs.length > 3 ? ' …' : ''} — ${why}.`;
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
  return `<div class="head"><h1>흐름</h1><p>대운은 10년 회사, 세운은 1년 거래처예요</p></div>
  <section class="card"><div class="ch"><h2>${I('building')}대운 10년 흐름</h2><span class="sub">대운이 바뀌는 나이(대운수) ${c.daeun.su} · ${c.daeun.forward ? '앞으로 도는 순서(순행)' : '거꾸로 도는 순서(역행)'} · 나이는 태어나자마자 1살(세는나이)</span></div>
    <div class="dae">${dl.map((d, i) => `<button data-act="daeun" data-i="${i}" class="k-${dk(dS[i])}" aria-label="${d.gz} 대운 ${d.startYear}년부터 ${d.startAge}세, 10년 흐름 ${TEN_W(dS[i])}"${v.daeun && v.daeun.gz === d.gz ? ' aria-current="true"' : ''}>
      ${hz2(d.gz)}<span class="small num">${d.startYear}– · ${d.startAge}세</span>
      <span class="bar"><i style="width:${Math.round(Math.abs(dS[i]) / mx * 100)}%"></i></span><span class="small">${TEN_W(dS[i])}</span></button>`).join('')}</div>
  </section>
  <section class="card"><div class="ch"><h2>${I('activity')}해마다 올해 기운 2024–2040</h2><span class="sub">점이나 아래 해를 누르면 자세히 보여요 · 선은 그해 세운 점수</span></div>
    ${sjPush.length ? `<p class="note">${I('info')}<span>삼재(${span(sjPush)})는 이 방식에서도 해마다 −1점뿐이라, 대운이 좋은 해는 그대로 밀고 갈 때로 나와요. 계약·서류만 한 번 더 확인하세요.</span></p>` : ''}
    <div class="chart" data-chart="years" role="img" aria-label="${esc(yAria)}"></div>
    <div class="legend">${['push', 'guard', 'prep', 'rest'].map(k => `<span class="k-${k}"><i></i>${S.CLASSES[k].name}</span>`).join('')}<span><i class="sj"></i>삼재</span><span class="lg-prep"><b class="lg-mk">준비</b>다음 해 준비 표시</span></div>
    <div class="years">${years.map(y => `<button class="yr" data-act="year" data-y="${y.year}"${y.year === v.year ? ' aria-current="true"' : ''}><b class="num">${y.year} ${y.Y.gz}</b>${clsPill(y.cls)}<span class="small">올해 ${YEAR_W(y.Y.total)}${y.samjae ? ' · 삼재' : ''}</span></button>`).join('')}<div class="yr yr-help"><b>보는 법</b><span class="small">색 = 행동 분류 · 해를 누르면 이유가 나와요</span></div></div>
  </section>
  <section class="card"><div class="ch"><h2>${I('calendar')}앞으로 12개월</h2><span class="sub">${esc(monthsSentence(ms, v))}</span></div>
    <div class="chart" data-chart="months" role="img" aria-label="${esc(mAria)}"></div>
    <div class="legend">${uniq(ms.map(m => m.cls)).map(k => `<span class="k-${k}"><i></i>${S.CLASSES[k].name}</span>`).join('')}<span>막대 = 올해+그달 기운 (세운 0.35 : 월운 0.10), 절기로 나눈 달</span></div>
  </section>`;
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
  if (!u.length) return '<p class="small">원국과 특별히 얽히는 지지 관계는 없어요.</p>';
  return `<ul class="rels">${u.map(r => `<li><b>${esc(relTxt(r))}</b><span>${esc(r.palace ? r.palace + '지(' + S.PALACE_AREA[r.palace] + ')와 — ' : '')}${esc(relMeaning(r.type))}</span></li>`).join('')}</ul>`;
}
const PN = { element: '오행', relations: '지지 관계', tenGod: '십성', shinsal: '신살', stage: '12운성' };
const partsRows = x => Object.entries(x.parts).map(([k, v]) => [PN[k], sgn(v)]);
function openYear(Y) {
  const c = chartOf(me()), y = S.yearView(c, Y), x = y.Y;
  sheet(`<div class="top"><div><p class="sub">${Y}년 세운 · 대운 ${y.daeun ? y.daeun.gz : '-'}</p><h2 id="sheetTitle">${hz2(x.gz)} ${S.ko(x.gz)}년</h2></div>${closeBtn()}</div>
    <div class="tags">${clsPill(y.cls)}<span class="tag">${SUB(y.cls, y.base)}</span>${y.samjae ? '<span class="tag bad">삼재</span>' : ''}${y.attack ? `<span class="tag">${I('target')}공격 타이밍</span>` : ''}${y.prepBadge ? `<span class="tag">${I('flag')}7월부터 다음 해 준비</span>` : ''}</div>
    ${readingChips(y.D ? y.D.total : 0, x.total, y.nextY.total)}
    <p class="small">${godTxt(x.gods[0])} · ${godTxt(x.gods[1])}</p>
    <p class="lead">${esc(seunText(c, y))}</p>
    <div class="tags">${noteTags(x.notes)}</div>
    <h3>원국과의 관계</h3>${relList(x.rels)}
    ${y.attack ? `<p class="note">${I('target')}<span>원국에 내 편(합)이 많고 올해 부딪힘(충)·어긋남(형)이 들어와요. 이 방식은 "부딪쳐도 되는 해, 결과는 내년"으로 봐요. 다만 꼭 싸우라는 뜻은 아니에요.</span></p>` : ''}
    ${y.samjae ? note(NOTE.samjae) : ''}${x.pyeongwan ? note(NOTE.pyeongwan) : ''}${x.bokeum ? note(NOTE.bokeum) : ''}
    ${calcBox([...partsRows(x), ['세운 합계', sgn(x.total)], ['대운', sgn(y.D ? y.D.total : 0)], ['다음 해', sgn(y.nextY.total)]], '<p class="small">이 해의 분류는 대운과 그해 세운으로 정해요. 나침반 탭은 이번 달(월운)까지 넣어서 숫자가 조금 달라요.</p>')}`);
}
function openDaeun(i) {
  const c = chartOf(me()), d = c.daeun.list[i], D = S.component(c, d.gz, 'daeun');
  sheet(`<div class="top"><div><p class="sub">${d.startYear}–${d.endYear} · ${d.startAge}–${d.endAge}세</p><h2 id="sheetTitle">${hz2(d.gz)} ${S.ko(d.gz)} 대운</h2></div>${closeBtn()}</div>
    <div class="tags"><span class="tag">10년 흐름 ${TEN_W(D.total)}</span><span class="tag">${stageTxt(D.stage)}</span>${D.halfPeak ? '<span class="tag">반쪽 전성기</span>' : ''}${noteTags(D.notes)}</div>
    <p class="small">${godTxt(D.gods[0])} · ${godTxt(D.gods[1])}</p>
    <p class="lead">${esc(daeunText(c, D, d))}</p><h3>원국과의 관계</h3>${relList(D.rels)}
    ${D.pyeongwan ? note(NOTE.pyeongwan) : ''}${D.bokeum ? note(NOTE.bokeum) : ''}
    ${calcBox([...partsRows(D), ['대운 합계', sgn(D.total)]])}`);
}
const closeBtn = () => `<button class="x" data-act="close" aria-label="닫기">${I('x')}</button>`;
function sheet(html) { const d = $('#sheet'); d.innerHTML = `<div class="sh">${html}</div>`; if (!d.open) d.showModal(); }

// ── 페이지: 내 사주 ──
function pillarCells(c, compact) {
  const A = c.analysis, order = [3, 2, 1, 0];
  if (compact) return `<div class="mini">${order.map(i => { const p = c.pillars[i]; return p ? `<div${i === 2 ? ' class="me"' : ''}><span class="pl">${S.PALACE[i]}</span>${hz(p[0])}${hz(p[1])}</div>` : `<div><span class="pl">${S.PALACE[i]}</span><span class="hz q">?</span><span class="pl">모름</span></div>`; }).join('')}</div>`;
  return `<div class="pillars">${order.map(i => {
    const p = c.pillars[i];
    if (!p) return `<div class="pillar empty"><span class="pl">${S.PALACE[i]}주</span><span class="god">시간 모름</span><span class="hz">?</span><span class="hz">?</span><span class="st">3주로 봐요</span></div>`;
    const g = A.gods[i];
    return `<div class="pillar${i === 2 ? ' me' : ''}"><span class="pl">${S.PALACE[i]}주${i === 2 ? ' · 나' : ''}</span><span class="god">${g.stem.name}</span>${hz(p[0])}<span class="k">${S.STEM_KO[S.si(p[0])]} · ${S.EL[S.stemEl(S.si(p[0]))]}</span>${hz(p[1])}<span class="k">${S.BRANCH_KO[S.bi(p[1])]} · ${S.EL[S.BR_EL[S.bi(p[1])]]}</span><span class="god">${g.branch.name}</span><span class="st">${A.stages[i]}</span></div>`;
  }).join('')}</div>`;
}
function pageChart() {
  const p = me(); if (!p) return emptyHome();
  const c = chartOf(p); if (!c) return errCard(p);
  const A = c.analysis, cands = c.candidates;
  const pick = db.settings.hourPick[p.id] || (cands[0] && cands[0].gz);
  const seg = cands.length > 1 ? `<div class="seg" role="group" aria-label="시주 고르기">${cands.map(x => `<button data-act="hour" data-gz="${x.gz}" aria-pressed="${x.gz === pick}">${x.gz} ${x.from}–${x.to}</button>`).join('')}</div>` : '';
  const yb = c.pillars[0][1];
  const gods = uniq(A.gods.filter(Boolean).flatMap(g => [g.stem.name, g.branch.name]).filter(n => GOD_GL[n]));
  const tie = cands[0] && cands[0].tie;
  return `<div class="head"><h1>내 사주</h1><p>${esc(p.name)} · ${S.ANIMAL[S.bi(yb)]}띠 · ${p.gender === 'F' ? '여' : '남'}</p></div>
  <div class="grid g2">
    <section class="card"><div class="ch"><h2>${I('scroll')}원국 여덟 글자</h2>${seg}</div>
      ${pillarCells(c)}
      <p class="small gloss">글자 뜻: ${gods.map(n => `${n} = ${GOD_GL[n]}`).join(' · ')} · 아래 줄은 일간의 힘이 그 자리에서 어떤지(12운성)</p>
      <div class="meta"><span>양력 ${c.solar}${p.cal === 'lunar' ? ` (음력 ${esc(p.date)}${p.leap ? ' 윤달' : ''})` : ''} · ${esc(p.city || '')} ${(+p.lng).toFixed(2)}°E</span>
      <span>${c.hourKnown ? `태어난 곳 기준 시각으로 ${c.corr.minutes}분 보정${c.corr.dst ? '(서머타임 1시간 포함)' : ''} → ${c.local} (일주·시주). 연주·월주·대운은 절기 기준 시각으로 계산해요.` : '태어난 시간을 몰라 연·월·일 3주로 봐요'}</span>
      <span>대운이 바뀌는 나이(대운수) ${c.daeun.su} (${c.daeun.y}년 ${c.daeun.m}개월) · ${c.daeun.forward ? '앞으로 도는 순서(순행)' : '거꾸로 도는 순서(역행)'} · 연 경계 ${db.settings.yearBoundary === 'seol' ? '설' : '입춘'}</span></div>
      ${cands.length > 1 ? `<p class="note">${I('info')}<span>태어난 시간이 ${esc(p.time.from)}–${esc(p.time.to)} 사이라 시주가 두 가지예요. ${tie ? `겹치는 시간이 비슷해요. 우선 <b>${cands[0].gz}</b>로 두었으니, 아는 사실과 맞는 쪽으로 위에서 고르세요.` : `겹치는 시간이 더 긴 <b>${cands[0].gz}</b>를 기본으로 두었고, 위에서 바꿀 수 있어요.`}</span></p>` : ''}
    </section>
    <section class="card"><div class="ch"><h2>${I('chartBar')}오행 분포</h2><span class="sub">${A.total}글자 기준</span></div>
      <div class="bars">${A.count.map((n, e) => `<div class="b e-${ELC[e]}"><span><i class="dot"></i>${elName(e)}</span><span class="t"><i style="width:${n / A.total * 100}%"></i></span><span class="num">${n}</span></div>`).join('')}</div>
      <p class="small gap-t">가장 많은 기운 ${elName(A.dominant)} · 금·수 비율 ${Math.round(A.metalWater * 100)}% (달수 기준: 60% 이상이면 불의 해에 재물이 좋다고 봐요)</p>
      <h3 class="gap-t">필요한 기운</h3>
      <div class="tags gap-s">${A.needed.map(e => elTag(e, 'good')).join('')}${A.avoid.map(e => `<span class="tag bad">넘치면 부담: ${elName(e)}</span>`).join('')}</div>
      <ul class="reasons">${A.reasons.map(r => `<li><span class="dot e-${ELC[r.e]}"></span><span>${esc(r.why.replace('(조후)', '(계절 온도 맞추기, 조후)').replace('(조후 보조)', '(조후 보조)'))}</span></li>`).join('')}</ul>
      ${note(NOTE.yongsin)}
    </section>
  </div>
  <div class="grid g2">
    <section class="card"><div class="ch"><h2>${I('link')}지지 관계 (원국 안)</h2><span class="sub">년지(띠)를 가장 크게 보고 월·일·시 순서로 봐요</span></div>
      ${A.natalRel.length ? `<ul class="rels">${A.natalRel.map(r => `<li><b>${esc(relTxt(r))}</b><span>${r.a}(${S.PALACE_AREA[r.a]}) – ${r.b}(${S.PALACE_AREA[r.b]}) · ${esc(relMeaning(r.type))}</span></li>`).join('')}</ul>` : '<p class="small">원국 안에 특별한 합·충은 없어요.</p>'}
    </section>
    <section class="card"><div class="ch"><h2>${I('sprout')}12운성 · 신살</h2><span class="sub">가볍게 참고만 하세요</span></div>
      <ul class="rels">${[3, 2, 1, 0].filter(i => c.pillars[i]).map(i => `<li><b>${S.PALACE[i]}지 ${c.pillars[i][1]}</b><span>${stageTxt(A.stages[i])}</span></li>`).join('')}
      ${A.shinsal.map(s => `<li><b>${s.name}</b><span>${esc(s.at)} (${s.base} 기준) · ${esc(s.note)}</span></li>`).join('')}
      <li><b>삼재 해</b><span>${A.samjae.join('·')}년 (띠 기준). 이 방식은 해마다 −1점만 반영해요.</span></li></ul>
    </section>
  </div>`;
}

// ── 페이지: 궁합·결혼일 ──
function pageMatch() {
  const pa = me(), pb = partner(); if (!pa || !pb) return emptyHome();
  const A = chartOf(pa), B = chartOf(pb); if (!A || !B) return errCard(!A ? pa : pb);
  const m = S.match(A, B);
  const nA = pa.name, nB = pb.name;
  const relLine = [`같은 오행이라 서로를 잘 이해하지만 비슷한 데서 부딪히기도 해요.`, `${nA}의 기운이 ${josa(nB, '을/를')} 살려 주는 관계예요.`, `${nA}의 기운이 ${josa(nB, '을/를')} 다잡는 관계예요.`, `${nB}의 기운이 ${josa(nA, '을/를')} 다잡는 관계예요.`, `${nB}의 기운이 ${josa(nA, '을/를')} 살려 주는 관계예요.`][m.rel];
  const fills = [], adjust = [];
  const fl = (x, a, b) => { if (x.length) fills.push(`${a}에게 필요한 ${josa(x.map(f => elName(f.e)).join('·'), '을/를')} ${josa(b, '이/가')} 갖고 있어요 (${x.map(f => S.EL[f.e] + ' ' + f.has + '개').join(', ')}).`); };
  fl(m.fillAB, nA, nB); fl(m.fillBA, nB, nA);
  const nFill = fills.length;
  // 두 사람 사이 관계: 같은 글자쌍·같은 관계는 하나로 (자리만 모음), 배우자 자리 → 세기 순
  const groups = new Map();
  for (const r of m.cross) {
    if (r.type === '형' && m.cross.some(x => x.type === '충' && x.A === r.A && x.B === r.B && x.a === r.a && x.b === r.b)) continue;
    const key = [r.A, r.B].sort().join('') + r.type;
    if (!groups.has(key)) groups.set(key, { ...r, where: [] });
    groups.get(key).where.push(`${nA} ${r.a}(${S.PALACE_AREA[r.a]}) – ${nB} ${r.b}(${S.PALACE_AREA[r.b]})`);
  }
  const rank = r => (r.where.some(w => w.includes('배우자·나') && w.split('배우자·나').length > 2) ? 10 : 0) + Math.abs(r.s) * 2 + r.where.length;
  const rels = [...groups.values()].sort((a, b) => rank(b) - rank(a));
  const relLi = r => `<li><b>${r.A}–${r.B} ${r.type === '같은 글자' ? r.type : `${REL_GL[r.type]}(${r.type})`}</b><span>${esc(r.where.join(' · '))}${r.where.length > 1 ? ` (${r.where.length}곳)` : ''} · ${esc(relMeaning(r.type))}</span></li>`;
  const good = rels.filter(r => r.s > 0), bad = rels.filter(r => r.s < 0);
  for (const r of good.slice(0, 3)) fills.push(`${r.A}–${r.B}: ${REL_GL[r.type]}(${r.type}). ${relMeaning(r.type)}`);
  if (m.spouse.some(r => r.type === '같은 글자')) fills.push(`두 사람 모두 배우자 자리(일지)에 ${josa(A.pillars[2][1], '이/가')} 있어요. 생활 리듬과 가치관이 닮은 편이에요.`);
  if (m.rel === 3 || m.rel === 2) adjust.push(`일간끼리 ${m.rel === 3 ? '물이 불을 다스리는(수극화)' : '한쪽이 다잡는'} 관계예요. 결정할 때 '누가 정할지' 미리 나누면 서로 편해요.`);
  for (const r of bad.slice(0, 3)) adjust.push(`${r.A}–${r.B}: ${REL_GL[r.type]}(${r.type})${r.where.length > 1 ? `, ${r.where.length}곳에서 엇갈려요` : ''}. ${r.type === '충' ? '이사·일 같은 큰 변화 때 속도가 다를 수 있으니 일정을 함께 정하세요.' : relMeaning(r.type)}`);
  const head = m.fillAB.length && m.fillBA.length ? '서로에게 필요한 기운을 갖고 있는 짝이에요' : m.fillAB.length || m.fillBA.length ? '한쪽이 다른 쪽을 채워 주는 짝이에요' : '서로 다른 결을 맞춰 가는 짝이에요';
  const wd = db.settings.wedding || '';
  return `<div class="head"><h1>궁합·결혼일</h1><p>${esc(nA)} · ${esc(nB)}${B.hourKnown ? '' : ` (${esc(josa(nB, '은/는'))} 시간을 몰라 3주로 봐요)`}</p></div>
  <section class="card"><div class="ch"><h2>${I('heart')}${head}</h2></div>
    <div class="pair"><div><p class="who">${esc(nA)} · ${A.pillars[2][0]} 일간</p>${pillarCells(A, true)}</div><div><p class="who">${esc(nB)} · ${B.pillars[2][0]} 일간</p>${pillarCells(B, true)}</div></div>
  </section>
  <div class="grid g2">
    <section class="card"><div class="ch"><h2>${I('chartBar')}오행 보완</h2></div>
      <div class="pair">${[[pa, A], [pb, B]].map(([p, c]) => `<div><p class="who">${esc(p.name)} · 필요 ${c.analysis.needed.map(e => S.EL[e]).join('·') || '없음'}</p><div class="bars sm">${c.analysis.count.map((n, e) => `<div class="b e-${ELC[e]}"><span><i class="dot"></i>${S.EL[e]}</span><span class="t"><i style="width:${n / c.analysis.total * 100}%"></i></span><span class="num">${n}</span></div>`).join('')}</div></div>`).join('')}</div>
      <ul class="reasons gap-t">${nFill ? fills.slice(0, nFill).map(t => `<li><span class="dot good"></span><span>${esc(t)}</span></li>`).join('') : '<li><span></span><span>서로 필요한 기운이 겹치지 않아요. 다른 사람·환경으로 채워도 괜찮아요.</span></li>'}</ul>
    </section>
    <section class="card"><div class="ch"><h2>${I('compass')}일간 관계 · ${A.pillars[2][0]}–${B.pillars[2][0]}</h2></div>
      <p class="lead">${esc(relLine)}</p>
      ${m.gangHwi ? `<p class="lead gap-s">丙(해)과 壬(큰 물)은 일반 명리에서 <b>강휘상영(江暉相映)</b>, "강물 위에 햇빛이 비치는 그림"이라는 좋은 비유로 많이 풀어요. 서로를 돋보이게 한다는 뜻이에요.</p>
      <p class="note">${I('info')}<span>솔직하게 보면 丙과 壬은 천간 충이기도 하고, 물이 불을 다스리는(수극화) 관계라 긴장도 있어요. 좋은 그림과 긴장이 함께 있는 짝이라, 서로의 속도를 존중하면 장점이 더 커져요.</span></p>` : m.stemHap ? `<p class="note">${I('info')}<span>두 일간이 천간합이라 서로 끌리는 힘이 있어요.</span></p>` : m.stemChung ? `<p class="note">${I('info')}<span>두 일간이 천간 충이라 방식 차이가 드러나기 쉬워요.</span></p>` : ''}
    </section>
  </div>
  <section class="card"><div class="ch"><h2>${I('link')}지지 관계 (두 사람 사이)</h2><span class="sub">중요한 3가지 · 배우자 자리와 센 관계 먼저</span></div>
    <ul class="rels">${rels.slice(0, 3).map(relLi).join('')}</ul>
    ${rels.length > 3 ? `<details class="more"><summary>자세히 (${rels.length - 3}개 더)</summary><ul class="rels">${rels.slice(3).map(relLi).join('')}</ul></details>` : ''}
  </section>
  <div class="lists">
    <section class="card"><div class="ch"><h2>${I('check')}서로 채워주는 점</h2></div><ul class="dos">${fills.map(t => `<li class="do">${I('check')}<span>${esc(t)}</span></li>`).join('')}</ul></section>
    <section class="card"><div class="ch"><h2>${I('hand')}부딪힐 때 맞춰갈 점</h2></div><ul class="dos">${adjust.map(t => `<li class="dont">${I('info')}<span>${esc(t)}</span></li>`).join('') || '<li>크게 부딪히는 글자는 없어요.</li>'}</ul></section>
  </div>
  <section class="card" id="wedCard"><div class="ch"><h2>${I('calendar')}결혼일 점검</h2>${wd ? `<span class="sub num">${wd.replace(/-/g, '.')} (${wk(wd)})</span>` : ''}</div>
    <div id="wedOut">${wd ? wedResult(wd, true) : '<p class="small">아래에서 날짜를 넣으면 두 사람 원국에 그 해·그 달·그 날을 대 봐요.</p>'}</div>
    <details class="more"${wd ? '' : ' open'}><summary>${wd ? '아직 날짜를 정하기 전이라면' : '날짜 점검하기'}</summary>
      <div class="datein"><input id="wed" type="date" value="${esc(wd)}" class="btn" aria-label="점검할 날짜"><button class="btn" data-act="wedcheck">점검하기</button></div>
      <div id="altOut">${wd ? altBlock(wd) : ''}</div>
    </details>
  </section>`;
}
const VERD = { good: '잘 맞는 편', ok: '무난한 편', care: '신경 쓸 점이 있는 편' };
function wedResult(ymd, fixed) {
  const pa = me(), pb = partner(), A = chartOf(pa), B = chartOf(pb);
  const rA = S.checkDate(A, ymd), rB = S.checkDate(B, ymd);
  const one = (p, c, r) => {
    const lines = [];
    if (r.spouseRel.length) lines.push(`그날의 ${josa(r.Dg[1], '이/가')} 배우자 자리(일지 ${c.pillars[2][1]})와 ${uniq(r.spouseRel.map(relTxt)).join(', ')} — ${relMeaning(r.spouseRel[0].type)}`);
    const pos = uniq(r.D.notes.filter(n => n.k === 'need').map(n => n.t));
    if (pos.length) lines.push(`그날 ${pos.join('·')} 기운이 들어와요.`);
    lines.push(`그 해 ${r.Yg} 기운 ${YEAR_W(r.Y.total)} · 그 달 ${r.Mg} ${YEAR_W(r.M.total)} · 그 날 ${r.Dg} ${YEAR_W(r.D.total)}`);
    return `<div><b>${esc(p.name)} · ${VERD[r.verdict]}</b>${lines.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
  };
  const share = r => { const a = Math.abs(0.2 * r.Y.total), t = a + Math.abs(0.3 * r.M.total) + Math.abs(0.5 * r.D.total); return t ? a / t : 0; };
  const yearHeavy = [rA, rB].some(r => r.verdict !== 'good' && share(r) >= 0.5);
  const hyung = uniq([rA, rB].flatMap(r => r.spouseRel.filter(x => x.type === '형').map(x => x.name.split(' ')[0])));
  const worst = [rA, rB].some(r => r.verdict === 'care') ? 'care' : [rA, rB].every(r => r.verdict === 'good') ? 'good' : 'ok';
  const headFixed = `정한 날을 기준으로 준비하면 돼요.${hyung.length ? ` 형(${hyung.join('·')})은 서류·일정이 어긋나기 쉽다는 뜻이라, 예식장 계약서·하객 안내 날짜를 두 번 확인해 보세요.` : ''}`;
  const headCheck = { good: '두 사람 모두에게 잘 맞는 편인 날이에요.', ok: '두 사람 모두에게 무난한 날이에요.', care: '조금 신경 쓸 점이 있는 날이에요. 날짜를 꼭 바꿔야 한다는 뜻은 아니에요.' }[worst];
  return `<p class="lead">${rA.Yg}년 ${rA.Mg}월 ${rA.Dg}일 — ${fixed ? headFixed : headCheck}</p>
    ${yearHeavy ? `<p class="note">${I('info')}<span>이 점수는 대부분 ${ymd.slice(0, 4)}년(${rA.Yg}) 자체에서 나와서 날짜를 옮겨도 크게 달라지지 않아요.</span></p>` : ''}
    <div class="who-res">${one(pa, A, rA)}${one(pb, B, rB)}</div>
    ${calcBox([[`${pa.name} 해`, sgn(rA.Y.total)], [`${pa.name} 달`, sgn(rA.M.total)], [`${pa.name} 날`, sgn(rA.D.total)], [`${pb.name} 해`, sgn(rB.Y.total)], [`${pb.name} 달`, sgn(rB.M.total)], [`${pb.name} 날`, sgn(rB.D.total)]], '<p class="small">날 점수 = 해 0.2 + 달 0.3 + 날 0.5. +1 이상 잘 맞는 편, −1 이상 무난한 편.</p>')}`;
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
    <section class="card"><div class="ch"><h2>${I('scroll')}프로필</h2><button class="btn" data-act="add">${I('plus')}추가</button></div>
      <div class="plist">${db.profiles.map(p => `<div class="prof"><div><b>${esc(p.name)}</b> <span class="sub">· ${roleName(p.role)}${p.id === (me() || {}).id ? ' · 기준' : ''}</span><br><span class="small">${p.cal === 'lunar' ? '음력' : '양력'} ${esc(p.date)}${p.leap ? ' 윤달' : ''} · ${timeTxt(p.time)} · ${p.gender === 'F' ? '여' : '남'} · ${esc(p.city || '')}</span></div>
        <div class="acts"><button class="btn" data-act="edit" data-id="${esc(p.id)}" aria-label="${esc(p.name)} 고치기">${I('pen')}</button><button class="btn danger" data-act="del" data-id="${esc(p.id)}" aria-label="${esc(p.name)} 지우기">${I('trash')}</button></div></div>`).join('') || '<p class="small">아직 프로필이 없어요.</p>'}</div>
      <h3 class="gap-t">데이터</h3><p class="small gap-s">서버가 없어요. 가져오기 링크의 정보는 주소의 # 뒤에 있어 인터넷으로 전송되지 않고, 열자마자 이 기기에 저장한 뒤 주소에서 지워요.</p>
      <div class="btns"><button class="btn" data-act="export">${I('download')}내보내기</button><button class="btn" data-act="copylink">${I('link')}링크 복사</button><button class="btn danger" data-act="wipe">${I('trash')}모두 지우기</button></div>
    </section>
    <section class="card"><div class="ch"><h2>${I('gear')}계산과 보기</h2></div>
      <div class="opts">
        <label class="opt"><span>연도 경계</span><select data-set="yearBoundary"><option value="ipchun"${st.yearBoundary !== 'seol' ? ' selected' : ''}>입춘 (기본, 일반 만세력)</option><option value="seol"${st.yearBoundary === 'seol' ? ' selected' : ''}>설날 (달수 1회 발언)</option></select><span class="small">설날을 고르면 연주와 세운 경계만 바뀌어요. 월주·대운은 절기 그대로예요.</span></label>
        <label class="opt"><span>밤 11시(자시) 날짜</span><select data-set="sect"><option value="1"${+st.sect !== 2 ? ' selected' : ''}>23시부터 다음 날 (기본)</option><option value="2"${+st.sect === 2 ? ' selected' : ''}>자정부터 다음 날 (야자시)</option></select></label>
        <label class="opt"><span>화면 테마</span><select data-set="theme"><option value="auto"${st.theme === 'auto' ? ' selected' : ''}>기기 설정 따라가기</option><option value="light"${st.theme === 'light' ? ' selected' : ''}>밝게</option><option value="dark"${st.theme === 'dark' ? ' selected' : ''}>어둡게</option></select></label>
        <label class="chk"><input type="checkbox" data-set="hideMatch"${st.hideMatch ? ' checked' : ''}>궁합·결혼일 탭 숨기기</label>
      </div>
    </section>
  </div>
  <section class="card"><div class="ch"><h2>${I('book')}계산 방식 · 달수 방식 / 일반 명리</h2><span class="sub">유튜버 "주식분석가달수"의 풀이 영상에서 뽑은 규칙으로 계산하고, 일반(자평) 명리와 다른 점을 나란히 적었어요</span></div>
    <ul class="dos method">
      <li>${I('check')}<span>필요한 기운 = 계절 온도 맞추기(조후) + 빠진 오행(결핍). 일간의 힘(신강·신약)과 격국은 쓰지 않아요.</span></li>
      <li>${I('check')}<span>지지 관계 무게: 년지(띠) 1.0 · 월지 0.8 · 일지 0.8 · 시지 0.5</span></li>
      <li>${I('check')}<span>글자 점수: 필요한 오행 +2, 넘치는 오행 −2, 재성 +1(필요한 오행이면 +2), 편관 −2, 비견·겁재 −1, 일주와 같은 간지 −2, 삼재 −1, 겁살 −0.5, 묘 −0.5</span></li>
      <li>${I('check')}<span>분류(스펙 그대로): 밀고 갈 때 = 대운 ≥ +1 이고 세운 ≥ +1 · 지킬 때 = 대운 ≥ +1 이고 세운 < 0 · 준비할 때 = 대운 < 0 이고 (세운 ≥ +1 또는 3년 안에 좋은 대운) · 쉬어갈 때 = 대운 < 0 이고 세운 < 0 · 다음 해 세운이 −2보다 낮으면 7월부터 준비할 때(6개월 선반영)</span></li>
      <li>${I('check')}<span>스펙에 없는 칸은 이렇게 정했어요: 대운 ≥ +1 이고 세운 0~1 → 지킬 때 · 대운 0~1 → 세운 ≥ +1 밀고 갈 때, 0~1 준비할 때, < 0 지킬 때 · 대운 < 0 이고 세운 0~1 → 준비할 때 · 대운 < 0, 세운 < 0 이어도 3년 안에 좋은 대운이 오면 준비할 때</span></li>
      <li>${I('check')}<span>해(흐름 탭)는 대운 + 그해 세운으로, 달(나침반·12개월)은 대운 + "세운 0.35 : 월운 0.10"으로 분류해요. 그 해의 대운은 실제 교체일 기준으로 그해 한가운데(8월 초)에 걸린 대운이에요.</span></li>
      <li>${I('check')}<span>연주·월주·대운은 절기 시각(베이징 기준 UTC+8)에 맞춘 시각으로, 일주·시주는 태어난 곳의 실제 시각(경도 보정)으로 계산해요. 이름(개명 포함)은 계산에 쓰지 않아요.</span></li>
      <li>${I('x')}<span>빼 둔 것: 오너 사주로 주가 보기, 건강·식단, 정치, 관상, 생활 미신</span></li>
    </ul>
    <h3 class="gap-t">달수 방식과 일반 명리의 차이</h3>
    <ul class="cmp">${[
      ['무엇이 필요한가', '계절(조후)과 빠진 오행으로 정해요. 일간의 힘은 따지지 않아요.', '일간의 힘(억부)·조후·격국을 함께 보고 용신을 정해요.'],
      ['띠(년지)의 무게', '띠를 가장 크게 봐요. 그다음이 월·일.', '일간과 월령이 중심이고, 띠 위주 해석은 옛 방식·민속에 가까워요.'],
      ['편관 대운', '10년 하락기로 봐요 (앱에서는 "책임과 압박이 커지는 때"로 순화).', '식신이 누르거나 인성으로 이어지면 오히려 힘이 돼요. 길흉이 정반대일 수 있어요.'],
      ['비견·복음 대운', '같은 글자 = 경쟁자를 만나는 10년.', '기운이 약한 사주엔 도움이 되고, 복음은 되풀이·정체 정도로 봐요.'],
      ['신살·삼재', '삼재·겁살·백호 같은 신살을 자주 쓰고, 삼재 3년은 조심하라고 봐요.', '신살은 보조 참고로만 쓰고, 원국 전체의 균형을 먼저 봐요.'],
      ['다음 해를 미리 보기', '다음 해 운은 6개월 전부터 반영된다고 봐요.', '정해진 규칙은 없어요. 세운은 그해 입춘부터 봐요.']
    ].map(([t, a, b]) => `<li><span><span class="lb">${t} · 달수 방식</span>${a}</span><span><span class="lb">일반 명리</span>${b}</span></li>`).join('')}</ul>
  </section>`;
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
  else if (a === 'wipe') { if (confirm('이 기기에 저장된 모든 정보를 지울까요?')) { try { localStorage.removeItem(KEY); } catch (err) { /* noop */ } db = { profiles: [], settings: { ...DEF }, plans: {} }; memo.clear(); render(); toast('모두 지웠어요'); } }
});
document.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.set; if (!k) return;
  db.settings[k] = e.target.type === 'checkbox' ? e.target.checked : k === 'sect' ? +e.target.value : e.target.value;
  save(); render();
});
let planT;
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.plan; if (!k) return;
  const c = chartOf(me()), v = S.now(c, today(), opts()), key = planKey(v);
  (db.plans[key] = db.plans[key] || {})[k] = e.target.value.slice(0, 80);
  $('#pc-' + k).textContent = planComment(e.target.value, v.cls, v.M, k);
  clearTimeout(planT); planT = setTimeout(save, 400);
});
document.addEventListener('submit', e => {
  e.preventDefault();
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
