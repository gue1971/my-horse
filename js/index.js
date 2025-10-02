
// ===== helpers =====
const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>[...r.querySelectorAll(s)];
const sleep = ms => new Promise(r=>setTimeout(r, ms));

async function getJSON(url){
  const r = await fetch(url, {cache:'no-store'});
  if(!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

const PANELS = ['tab1','tab2','tab3','tab4','tab5'];
const imgBase   = slug => `images/${slug}/`;
const albumJson = slug => `data/albums/${slug}.json`;
const clubIcon  = club => `assets/icons/clubs/${club}.gif`;

// ===== UA-based link builders =====
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function clubUrl(club, id){
  if (!id) return '#';
  switch (club) {
    case 'carrot': return isMobile
      ? `https://carrotclub.net/sp/horse/lfx-horse-id-${id}.htm`
      : `https://carrotclub.net/horse/horse.asp?id=${id}`;
    case 'silk':   return `https://www.silkhorseclub.jp/horse_info/shozoku/detail/${id}/view`;
    case 'tokyo':  return `https://www.tokyo-tc.com/${id}`; // horses.json 側が next/xxxx 等を持っている想定
    case 'win':    return `https://www.win-rc.co.jp/site/belonging/list/belong_list_detail.php?hcd=${id}`;
    default:       return '#';
  }
}

const jraUrl  = id => id ? `https://www.jra.go.jp/JRADB/accessU.html?CNAME=${encodeURIComponent(id)}` : '#';
const jbisUrl = id => id ? `https://www.jbis.or.jp/horse/${encodeURIComponent(id)}/` : '#';
// function bbsUrl(id){
//   if(!id) return '#';
//   return isMobile
//     ? `https://db.sp.netkeiba.com/horse/horse_bbs.html?id=${encodeURIComponent(id)}`
//     : `https://db.netkeiba.com/?pid=horse_board&id=${encodeURIComponent(id)}`;
// }
function bbsUrl(id) {
  if (!id) return '#';
  
  // 画面幅に基づいてモバイル判定
  const isMobile = window.innerWidth <= 768;

  // モバイルとPCで異なるURLを返す
  return isMobile
    ? `https://db.sp.netkeiba.com/horse/horse_bbs.html?id=${encodeURIComponent(id)}`
    : `https://db.netkeiba.com/?pid=horse_board&id=${encodeURIComponent(id)}`;
}



// ===== album -> hero pick =====
function pickHero(album){
  if (!Array.isArray(album) || album.length===0) return null;
  return album.find(x=>x.isHero) || album[0];
}

// ===== placeholder (SVG data URI) =====
function placeholderHTML(label='画像準備中'){
  const svg = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='400' height='300'>
      <defs>
        <linearGradient id='g' x1='0' x2='0' y1='0' y2='1'>
          <stop offset='0%' stop-color='#111315'/>
          <stop offset='100%' stop-color='#0c0e10'/>
        </linearGradient>
        <pattern id='p' width='20' height='20' patternUnits='userSpaceOnUse'>
          <path d='M20 0H0V20' fill='none' stroke='#2b2f34' stroke-width='1'/>
        </pattern>
      </defs>
      <rect x='1' y='1' width='398' height='298' rx='12' ry='12' fill='url(#g)' stroke='#2b2f34'/>
      <rect x='1' y='1' width='398' height='298' rx='12' ry='12' fill='url(#p)' opacity='0.55'/>
      <g fill='#3f4750' transform='translate(0,6)'>
        <circle cx='150' cy='140' r='22'/><rect x='185' y='120' width='80' height='40' rx='6'/>
      </g>
      <text x='200' y='246' text-anchor='middle' font-family='system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif' font-size='16' fill='#9aa1a9'>${label}</text>
    </svg>
  `);
  return `<div class="placeholder"><div class="ph"><img alt="${label}" src="data:image/svg+xml,${svg}"></div></div>`;
}

// ===== card builder =====
function buildCard({ horse, hero, hasAlbum }) {
  const nameLabel = horse.nameJa || horse.name || horse.slug;
  const val = (x) => (x ?? '').toString().trim() || '—';

  const card = document.createElement('article');
  card.className = 'card';

  // 左：画像（アルバムが無ければ詳細へ）
  const left = document.createElement('a');
  left.className = 'card-left';
  left.href = hasAlbum ? `album.html?id=${encodeURIComponent(horse.slug)}`
    : `horse.html?id=${encodeURIComponent(horse.slug)}`;
  if (hero) {
    const src = `images/${horse.slug}/${hero.file || hero.src}`;
    const img = document.createElement('img');
    img.src = src;
    img.alt = hero.caption || nameLabel;
    img.loading = 'lazy';
    left.appendChild(img);
    if (!hasAlbum) left.classList.add('is-disabled');
  } else {
    left.innerHTML = placeholderHTML();
    left.classList.add('is-disabled');
  }
  card.appendChild(left);

  // 右コンテナ
  const right = document.createElement('div');
  right.className = 'card-right';

  // 右：上（クラブ公式）
  const top = document.createElement('div');
  top.className = 'card-right-top';
  const aClub = document.createElement('a');
  aClub.href = clubUrl(horse.club, horse.clubPage);
  aClub.target = '_blank';
  aClub.rel = 'noopener';
  aClub.setAttribute('aria-label', `${nameLabel} のクラブ公式へ`);

  const clubImg = document.createElement('img');
  clubImg.className = 'club-icon';
  clubImg.src = `assets/icons/clubs/${horse.club}.gif`; // ← いまは .gif 運用
  clubImg.alt = horse.club;

  const nameSpan = document.createElement('span');
  nameSpan.textContent = nameLabel;

  aClub.appendChild(clubImg);
  aClub.appendChild(nameSpan);
  top.appendChild(aClub);

  right.appendChild(top);

  // 右：中（詳細＝ミニプロフィール全体がリンク）
  const mid = document.createElement('a');
  mid.className = 'card-right-mid';
  mid.href = `horse.html?id=${encodeURIComponent(horse.slug)}`;
  mid.setAttribute('aria-label', `${nameLabel} の詳細ページへ`);

  const mini = document.createElement('div');
  mini.className = 'mini-prof';

  // helper: row を作る
  const mkRow = (pairs, oneCol = false) => {
    const row = document.createElement('div');
    row.className = 'row' + (oneCol ? ' row-1col' : '');
    pairs.forEach(([label, value]) => {
      const l = document.createElement('span');
      l.className = 'label';
      l.textContent = label;
      const v = document.createElement('span');
      v.className = 'val';
      v.textContent = val(value);
      row.appendChild(l);
      row.appendChild(v);
    });
    return row;
  };

  // 1段目：父・母（縦並びに変更）
  mini.appendChild(mkRow([
  ['父', horse.sire],
  ['母', horse.dam]
  ], true));  // 縦並びにするためにtrueを指定

  // 2段目：母父（縦並びに変更）
  mini.appendChild(mkRow([
   ['母父', horse.damsire]
  ], true));  // 縦並びにするためにtrueを指定

  // 3段目：生年月日と募集総額を結合して表示（ラベルなし）
  const birthDate = horse.birth.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1年$2月$3日生');

  // 募集額をそのまま表示（「万募集」の形式にする）
  const price = horse.price + '募集';  // 「万」をそのまま使い、「募集」を追加

  // birthDate と price の間に全角スペースを挟んで結合
  const birthAndPrice = `${birthDate}　${price}`;  // 全角スペース（「　」）で繋げる

  // 横並びに表示（ラベルなし）
  mini.appendChild(mkRow([
    ['', birthAndPrice]  // ラベルは空白、値を表示
  ], false));  // falseを指定して横並びに


  // 4段目：生産・厩舎（縦並びに変更）
  mini.appendChild(mkRow([
   ['生産', horse.farm],
   ['厩舎', horse.stable]
  ], true));  // 縦並びにするためにtrueを指定

  mid.appendChild(mini);
  right.appendChild(mid);


  // 右：下（JRA/JBIS/BBS）
  const bottom = document.createElement('div');
  bottom.className = 'links';

  // JRAリンク（IDがない場合、クリックできない）
  const jraLink = document.createElement('a');
  jraLink.href = horse.jra_id ? jraUrl(horse.jra_id) : '#';
  jraLink.target = '_blank';
  jraLink.rel = 'noopener';
  jraLink.innerHTML = '<img src="assets/icons/jra.png" alt="JRA">JRA';
  if (!horse.jra_id) {
    jraLink.style.pointerEvents = 'none'; // クリックできないようにする
    jraLink.style.opacity = '0.5'; // 見た目も無効に
  }

  // JBISリンク（IDがない場合、クリックできない）
  const jbisLink = document.createElement('a');
  jbisLink.href = horse.jbis_id ? jbisUrl(horse.jbis_id) : '#';
  jbisLink.target = '_blank';
  jbisLink.rel = 'noopener';
  jbisLink.innerHTML = '<img src="assets/icons/jbis.png" alt="JBIS">JBIS';
  if (!horse.jbis_id) {
    jbisLink.style.pointerEvents = 'none'; // クリックできないようにする
    jbisLink.style.opacity = '0.5'; // 見た目も無効に
  }

  // BBSリンク（IDがない場合、クリックできない）
  const bbsLink = document.createElement('a');
  bbsLink.href = horse.netkeiba_horse_id ? bbsUrl(horse.netkeiba_horse_id) : '#';
  bbsLink.target = '_blank';
  bbsLink.rel = 'noopener';
  bbsLink.innerHTML = '<img src="assets/icons/netkeiba.png" alt="BBS">BBS';
  if (!horse.netkeiba_horse_id) {
    bbsLink.style.pointerEvents = 'none'; // クリックできないようにする
    bbsLink.style.opacity = '0.5'; // 見た目も無効に
  }

  // リンクをまとめて追加
  bottom.appendChild(jraLink);
  bottom.appendChild(jbisLink);
  bottom.appendChild(bbsLink);

  right.appendChild(bottom);

  card.appendChild(right);
  return card;
}

// ===== tabs: show/hide + swipe + per-tab scroll restore =====
function showTab(id){
  PANELS.forEach(tid=>{
    const p = document.getElementById(tid);
    if (!p) return;
    p.hidden = (tid !== id);
  });
  $$('.tab').forEach(b=>b.classList.toggle('is-active', b.dataset.tab===id));
  localStorage.setItem('lastTab', id);
}

function saveScroll(id){
  const y = document.documentElement.scrollTop || document.body.scrollTop || 0;
  sessionStorage.setItem(`scroll:${id}`, String(y));
}

function restoreScrollAfterImages(id){
  const panel = document.getElementById(id);
  if (!panel) return;

  const targetY = Number(sessionStorage.getItem(`scroll:${id}`) || 0);
  if (!targetY) return;

  const imgs = [...panel.querySelectorAll('img')].filter(img => img.complete === false);
  if (imgs.length === 0) {
    window.scrollTo({top: targetY});
    return;
  }
  let loaded = 0;
  const tryRestore = () => {
    loaded++;
    if (loaded >= imgs.length) window.scrollTo({top: targetY});
  };
  imgs.forEach(img => {
    img.addEventListener('load', tryRestore, {once:true});
    img.addEventListener('error', tryRestore, {once:true});
  });
}

// swipe between tabs (mobile UX)
function enableSwipe(){
  let sx=0, sy=0, moving=false;
  const el = document.body;
  el.addEventListener('touchstart', e=>{
    if (!e.touches[0]) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; moving=true;
  }, {passive:true});
  el.addEventListener('touchmove', e=>{
    if (!moving || !e.touches[0]) return;
    const dx = e.touches[0].clientX - sx;
    const dy = e.touches[0].clientY - sy;
    if (Math.abs(dy) > Math.abs(dx)) return;   // 縦優先
    if (Math.abs(dx) < 48) return;             // しきい値
    moving=false;
    const cur = localStorage.getItem('lastTab') || 'tab1';
    const idx = PANELS.indexOf(cur);
    const next = dx < 0 ? PANELS[(idx+1)%PANELS.length] : PANELS[(idx-1+PANELS.length)%PANELS.length];
    saveScroll(cur);
    showTab(next);
    setTimeout(()=>restoreScrollAfterImages(next), 0);
  }, {passive:true});
}

// ===== render =====
async function render(){
  // タブクリック
  $$('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cur = localStorage.getItem('lastTab') || 'tab1';
      saveScroll(cur);
      const next = btn.dataset.tab;
      showTab(next);
      setTimeout(()=>restoreScrollAfterImages(next), 0);
    });
  });

  // 初期タブ
  const init = localStorage.getItem('lastTab') || 'tab1';
  showTab(init);

  // horses.json 読み込み
  let horses;
  try{
    const doc = await getJSON('data/horses.json');
    horses = Array.isArray(doc) ? doc : doc.horses;
  }catch(e){
    console.error(e);
    $('#tab1')?.insertAdjacentText('afterbegin','horses.json の読み込みに失敗しました。');
    return;
  }

  // パネル要素
  const areas = Object.fromEntries(PANELS.map(id=>[id, document.getElementById(id)]));

  // 各馬カード
  for (const h of horses){
    let hero=null, hasAlbum=false;
    try{
      const a = await getJSON(albumJson(h.slug)); // /data/albums/<slug>.json
      hasAlbum = Array.isArray(a.album) && a.album.length>0;
      hero = hasAlbum ? (pickHero(a.album)) : null;
    }catch(e){
      // 未整備OK
    }
    const card = buildCard({horse:h, hero, hasAlbum});
    const key = 'tab' + String(h.tab || 1);
    (areas[key] || areas['tab1']).appendChild(card);
  }

  // 初期タブのスクロール復元（画像読み込み待ち）
  restoreScrollAfterImages(init);
}

// ===== boot =====
window.addEventListener('DOMContentLoaded', ()=>{
  render().catch(console.error);
  enableSwipe();
});
