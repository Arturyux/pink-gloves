/* ---- mobile menu ---- */
const burger = document.getElementById('burger');
const links  = document.getElementById('navlinks');
burger.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
links.addEventListener('click', e => {
  if (e.target.tagName === 'A') {
    links.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
});

/* ---- cumulative tier disclosure: animated dropdown, height measured via scrollHeight ---- */
document.querySelectorAll('.inherits').forEach(btn => {
  const panel = document.getElementById(btn.dataset.toggle);
  btn.addEventListener('click', () => {
    const opening = !panel.classList.contains('open');
    if (opening) {
      panel.classList.add('open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      requestAnimationFrame(() => { panel.style.maxHeight = '0px'; });
      panel.classList.remove('open');
    }
    btn.setAttribute('aria-expanded', opening);
  });
});

/* ---- Deep Clean card: its photo travels down and stretches by the same factor
   the card itself grows, so it keeps up while the accordion opens and after a
   viewport resize. Only this card gets the treatment; the other two keep their
   authored, unscaled backgrounds. ----

   The authored values in style.css (--bg-pos / --bg-size) stay the single source
   of truth: this reads them every pass and writes the derived result to the
   separate --bg-pos-live / --bg-size-live pair, so hand-edits and the mobile
   breakpoint's own values keep working. */
(function(){
  const bg = document.querySelector('.tier-bg--deep');
  if (!bg || typeof ResizeObserver === 'undefined') return;
  const card  = bg.closest('.tier');
  const panel = card && card.querySelector('.inherited');
  if (!card || !panel) return;

  let aspect = null;    // naturalWidth / naturalHeight of the photo
  let baseW  = 0;       // card width the baseline below was measured at
  let baseH  = 0;       // card height with the panel closed, at that width

  function sync(){
    if (!aspect) return;
    const boxW = parseFloat(getComputedStyle(bg, '::before').width);
    if (!boxW) return;

    const cs = getComputedStyle(bg);
    const [xTok = '0px', yTok = '0px'] = (cs.getPropertyValue('--bg-pos') || '').trim().split(/\s+/);
    const [wTok = '100%']              = (cs.getPropertyValue('--bg-size') || '').trim().split(/\s+/);

    // the photo's rendered size at the authored width, before any stretching
    const imgW = wTok.endsWith('%') ? parseFloat(wTok) / 100 * boxW : parseFloat(wTok);
    if (!imgW) return;
    const imgH = imgW / aspect;

    const rect   = card.getBoundingClientRect();
    const cardH  = rect.height;
    const panelH = panel.getBoundingClientRect().height;

    // Baseline = the card's height with the panel closed. It can't just be
    // (cardH - panelH): on desktop `.tiers` is a grid, so all three cards share
    // one row height and this card doesn't actually grow until its panel pushes
    // the whole row past the tallest sibling. So take the baseline from a real
    // closed measurement, re-taken whenever the layout width changes.
    if (Math.abs(rect.width - baseW) > 0.5) { baseW = rect.width; baseH = 0; }
    if (panelH < 0.5) baseH = cardH;                       // closed: exact
    else if (!baseH)  baseH = Math.max(cardH - panelH, 1); // open at a width we haven't seen closed

    const k = baseH > 0 ? Math.max(cardH / baseH, 1) : 1;

    bg.style.setProperty('--bg-size-live', wTok + ' ' + (imgH * k).toFixed(2) + 'px');
    bg.style.setProperty('--bg-pos-live', xTok + ' ' + ((parseFloat(yTok) || 0) * k).toFixed(2) + 'px');
  }

  // read the photo straight off the stylesheet so the URL isn't duplicated here
  const url = (getComputedStyle(bg, '::before').backgroundImage || '').match(/url\(["']?(.*?)["']?\)/);
  if (!url) return;
  const probe = new Image();
  const ready = () => { aspect = probe.naturalWidth / probe.naturalHeight; sync(); };
  probe.onload = ready;
  probe.src = url[1];
  if (probe.complete && probe.naturalWidth) ready();

  // Fires on every frame either box resizes — the accordion's height transition
  // and any viewport/resolution change both land here. The panel is observed as
  // well as the card: while the grid row is taller than this card, the panel can
  // finish collapsing without the card's own height ever changing, and watching
  // the card alone would leave the last frame unsynced.
  const ro = new ResizeObserver(sync);
  ro.observe(card);
  ro.observe(panel);
})();

/* ---- shared toast, used by the extras flow and the gallery below ---- */
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg){
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---- build-your-request: choose a tier, tick extras, get a ready-to-send message ---- */
(function(){
  const quote = document.getElementById('quote');
  if (!quote) return;

  const quoteTierEl   = document.getElementById('quoteTier');
  const quoteExtrasEl = document.getElementById('quoteExtrasLine');
  const quoteText     = document.getElementById('quoteText');
  const emailBtn      = document.getElementById('quoteEmailBtn');
  const copyBtn       = document.getElementById('quoteCopyBtn');
  const resetBtn      = document.getElementById('quoteReset');
  const extrasSection = document.querySelector('.extras');
  const tierHint      = document.getElementById('tierHint');

  let tier = null;
  const extras = new Set();

  function buildText(){
    return [
      'Hi Pink Gloves Cleaning,',
      '',
      "I'd like to request a quote for:",
      '',
      'Service: ' + tier,
      'Extras: ' + (extras.size ? [...extras].join(', ') : 'None'),
      '',
      'My address: (to see how far you are)',
      'Preferred date/time: (to see if we are available)',
      'Extra questions: (optional)',
      '',
      'Thanks!'
    ].join('\n');
  }

  function openQuote(){
    const wasOpen = quote.classList.contains('open');
    quote.classList.add('open');
    // re-measure every time (not just on first open) so extras wrapping to a
    // second line while already open still animates to the new height
    requestAnimationFrame(() => { quote.style.maxHeight = quote.scrollHeight + 'px'; });
    return wasOpen;
  }
  function closeQuote(){
    if (!quote.classList.contains('open')) return;
    quote.style.maxHeight = quote.scrollHeight + 'px';
    requestAnimationFrame(() => { quote.style.maxHeight = '0px'; });
    quote.classList.remove('open');
  }

  function render(){
    if (!tier){
      if (tierHint) tierHint.hidden = false;
      closeQuote();
      return;
    }
    if (tierHint) tierHint.hidden = true;
    quoteTierEl.textContent = tier;
    quoteExtrasEl.textContent = extras.size ? '+ ' + [...extras].join(', ') : '';
    const text = buildText();
    quoteText.value = text;
    const subject = 'Cleaning quote request: ' + tier;
    emailBtn.href = 'mailto:testing@pinkglovesservices.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
    openQuote();
  }

  if (tierHint){
    tierHint.addEventListener('click', () => {
      const services = document.getElementById('services');
      if (services) services.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  document.querySelectorAll('.choose-tier').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const card = link.closest('.tier');
      tier = card.querySelector('h3').textContent.trim();
      document.querySelectorAll('.tier').forEach(t => t.classList.remove('chosen'));
      card.classList.add('chosen');
      render();
      if (extrasSection) extrasSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (!tier){
        showToast('Pick main service first');
        return;
      }
      const name = chip.dataset.extra;
      const on = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', String(!on));
      if (on) extras.delete(name); else extras.add(name);
      render();
    });
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(quoteText.value);
    } catch {
      quoteText.select();
      document.execCommand('copy');
    }
    const original = copyBtn.textContent;
    copyBtn.textContent = 'Copied ✓';
    copyBtn.disabled = true;
    setTimeout(() => { copyBtn.textContent = original; copyBtn.disabled = false; }, 1800);
  });

  resetBtn.addEventListener('click', () => {
    tier = null;
    extras.clear();
    document.querySelectorAll('.tier').forEach(t => t.classList.remove('chosen'));
    document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
    render();
  });
})();

/* ---- reviews carousel: auto-rotates, arrows step it, swipeable on touch ---- */
(function(){
  const track    = document.getElementById('reviewGrid');
  const windowEl = document.querySelector('.review-window');
  const prevBtn  = document.getElementById('reviewPrev');
  const nextBtn  = document.getElementById('reviewNext');
  if (!track || !windowEl || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.children);
  if (slides.length <= 1) return;

  const DEFAULT_MS = 6000;
  const FAST_MS = 2000;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let intervalMs = DEFAULT_MS;
  let timer = null;
  let step = 0;      // distance from one card's left edge to the next, gap included
  let maxIndex = 0;  // last scroll position that still fills the window

  // The number of cards on screen is set in CSS (three on desktop, one when it
  // narrows), so read the pitch back off the layout rather than assuming it.
  function measure(){
    step = slides[1].offsetLeft - slides[0].offsetLeft;
    const visible = step > 0 ? Math.max(1, Math.round(windowEl.clientWidth / step)) : 1;
    maxIndex = Math.max(0, slides.length - visible);
    if (index > maxIndex) index = maxIndex;

    // every review already fits: nothing to page through
    const idle = maxIndex === 0;
    prevBtn.hidden = nextBtn.hidden = idle;
    if (idle) { clearInterval(timer); timer = null; }
    else if (!timer && !reduce) restart();

    setTransition(false);
    applyTransform(0);
  }

  function setTransition(on){
    track.style.transition = on ? 'transform .5s cubic-bezier(.4,0,.2,1)' : 'none';
  }
  function applyTransform(extraPx){
    track.style.transform = 'translateX(' + (-index * step + (extraPx || 0)) + 'px)';
  }
  function go(i){
    index = i < 0 ? maxIndex : (i > maxIndex ? 0 : i); // wrap around at both ends
    setTransition(true);
    applyTransform(0);
  }
  function next(){ go(index + 1); }
  function prev(){ go(index - 1); }

  function restart(){
    clearInterval(timer);
    if (maxIndex > 0) timer = setInterval(next, intervalMs);
  }
  function setSpeed(ms){
    intervalMs = ms;
    restart();
  }

  prevBtn.addEventListener('click', () => { prev(); restart(); });
  nextBtn.addEventListener('click', () => { next(); restart(); });

  [prevBtn, nextBtn].forEach(btn => {
    btn.addEventListener('mouseenter', () => setSpeed(FAST_MS));
    btn.addEventListener('mouseleave', () => setSpeed(DEFAULT_MS));
    btn.addEventListener('focus', () => setSpeed(FAST_MS));
    btn.addEventListener('blur', () => setSpeed(DEFAULT_MS));
  });

  /* swipe / drag to move between slides */
  let dragging = false, startX = 0, dragDelta = 0;

  windowEl.addEventListener('pointerdown', e => {
    if (maxIndex === 0 || e.target.closest('.car-arrow')) return;
    dragging = true;
    startX = e.clientX;
    dragDelta = 0;
    setTransition(false);
    clearInterval(timer);
    windowEl.setPointerCapture(e.pointerId);
  });
  windowEl.addEventListener('pointermove', e => {
    if (!dragging) return;
    dragDelta = e.clientX - startX;
    applyTransform(dragDelta);
  });
  function endDrag(){
    if (!dragging) return;
    dragging = false;
    const threshold = step * 0.18;
    if (dragDelta <= -threshold) next();
    else if (dragDelta >= threshold) prev();
    else { setTransition(true); applyTransform(0); }
    restart();
  }
  windowEl.addEventListener('pointerup', endDrag);
  windowEl.addEventListener('pointercancel', endDrag);

  measure();
  // the card pitch changes with the viewport, so re-derive it on resize
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measure).observe(windowEl);
})();

/* ---- gallery: auto-detects photos dropped into public/img/gallery/<category>/,
   fills each card with a bento preview, opens a swipeable lightbox on tap.
   The listing is built by the gallery-manifest plugin in vite.config.js —
   public/ is copied verbatim by Vite, so import.meta.glob can't see into it. ---- */
import galleryPhotos from 'virtual:gallery';

(function(){
  const shots = document.querySelectorAll('.shot[data-category]');
  if (!shots.length) return;

  // manifest paths are base-relative; BASE_URL keeps them right in a subfolder
  const base = import.meta.env.BASE_URL || '/';
  const byCategory = {};
  for (const cat in galleryPhotos) {
    byCategory[cat] = galleryPhotos[cat].map(p => base.replace(/\/?$/, '/') + p);
  }

  shots.forEach(shot => {
    const urls = byCategory[shot.dataset.category];
    const bento = shot.querySelector('.shot-bento');
    if (!urls || !urls.length || !bento) return;
    const count = Math.min(urls.length, 4);
    bento.classList.add('count-' + count);
    urls.slice(0, count).forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      bento.appendChild(img);
    });
  });

  const lightbox = document.getElementById('lightbox');
  const lbTrack  = document.getElementById('lbTrack');
  const lbWindow = document.getElementById('lbWindow');
  const lbPrev   = document.getElementById('lbPrev');
  const lbNext   = document.getElementById('lbNext');
  const lbClose  = document.getElementById('lbClose');
  if (!lightbox || !lbTrack || !lbWindow || !lbPrev || !lbNext || !lbClose) return;

  let index = 0;
  let slideCount = 0;
  let lastFocused = null;

  function setTransition(on){
    lbTrack.style.transition = on ? 'transform .4s cubic-bezier(.4,0,.2,1)' : 'none';
  }
  function applyTransform(extraPx){
    lbTrack.style.transform = 'translateX(calc(' + (-index * 100) + '% + ' + (extraPx || 0) + 'px))';
  }
  function go(i){
    index = (i + slideCount) % slideCount;
    setTransition(true);
    applyTransform(0);
  }
  function next(){ go(index + 1); }
  function prev(){ go(index - 1); }

  function openGallery(cat){
    const urls = byCategory[cat];
    if (!urls || !urls.length){
      showToast('No photos yet for this one');
      return;
    }
    lbTrack.innerHTML = '';
    urls.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      lbTrack.appendChild(img);
    });
    slideCount = urls.length;
    index = 0;
    setTransition(false);
    applyTransform(0);
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }
  function closeGallery(){
    lightbox.hidden = true;
    document.body.style.overflow = '';
    lbTrack.innerHTML = '';
    if (lastFocused) lastFocused.focus();
  }

  shots.forEach(shot => {
    const pill = shot.querySelector('.ph-pill');
    if (pill) pill.addEventListener('click', () => openGallery(shot.dataset.category));
  });

  lbPrev.addEventListener('click', prev);
  lbNext.addEventListener('click', next);
  lbClose.addEventListener('click', closeGallery);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeGallery(); });
  document.addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeGallery();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'ArrowRight') next();
  });

  let dragging = false, startX = 0, dragDelta = 0;
  lbWindow.addEventListener('pointerdown', e => {
    if (slideCount <= 1 || e.target.closest('.lb-arrow')) return;
    dragging = true;
    startX = e.clientX;
    dragDelta = 0;
    setTransition(false);
    lbWindow.setPointerCapture(e.pointerId);
  });
  lbWindow.addEventListener('pointermove', e => {
    if (!dragging) return;
    dragDelta = e.clientX - startX;
    applyTransform(dragDelta);
  });
  function endDrag(){
    if (!dragging) return;
    dragging = false;
    const threshold = lbWindow.clientWidth * 0.18;
    if (dragDelta <= -threshold) next();
    else if (dragDelta >= threshold) prev();
    else { setTransition(true); applyTransform(0); }
  }
  lbWindow.addEventListener('pointerup', endDrag);
  lbWindow.addEventListener('pointercancel', endDrag);
})();

/* ---- draggable glove with bubble trail (stage 1) ---- */
(function(){
  const stage = document.getElementById('gloveStage');
  const glove = document.getElementById('glove');
  const hint  = document.getElementById('dragHint');
  if (!stage || !glove) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dragging = false, originX = 0, originY = 0, dx = 0, dy = 0;
  let lastX = 0, rot = 0, lastBubble = 0;

  const apply = () => {
    glove.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg)';
  };

  glove.addEventListener('pointerdown', e => {
    dragging = true;
    glove.setPointerCapture(e.pointerId);
    glove.classList.add('dragging');
    glove.classList.remove('idle');
    glove.style.transition = 'none';
    originX = e.clientX - dx;
    originY = e.clientY - dy;
    lastX = e.clientX;
    if (hint) hint.classList.add('gone');
    e.preventDefault();
  });

  glove.addEventListener('pointermove', e => {
    if (!dragging) return;
    dx = e.clientX - originX;
    dy = e.clientY - originY;

    // rotation follows the direction of the swing, eased so it doesn't snap
    const vx = e.clientX - lastX;
    lastX = e.clientX;
    rot = Math.max(-22, Math.min(22, rot * 0.86 + vx * 0.75));

    apply();
    if (!reduce && Math.abs(vx) > 1) blow(e);
  });

  function release(){
    if (!dragging) return;
    dragging = false;
    glove.classList.remove('dragging');
    // overshoot on the way back reads as a swing settling
    glove.style.transition = 'transform .95s cubic-bezier(.18,.89,.32,1.28)';
    dx = 0; dy = 0; rot = 0;
    apply();
    setTimeout(() => {
      glove.style.transition = '';
      glove.style.transform = '';
      if (!reduce) glove.classList.add('idle');
    }, 950);
  }
  glove.addEventListener('pointerup', release);
  glove.addEventListener('pointercancel', release);

  function blow(e){
    const now = performance.now();
    if (now - lastBubble < 55) return;
    lastBubble = now;

    const r = stage.getBoundingClientRect();
    const b = document.createElement('span');
    const size = 7 + Math.random() * 17;
    b.className = 'bubble';
    b.style.width = b.style.height = size + 'px';
    b.style.left = (e.clientX - r.left - size / 2) + 'px';
    b.style.top  = (e.clientY - r.top  - size / 2) + 'px';
    b.style.setProperty('--dx', (Math.random() * 70 - 35) + 'px');
    b.style.setProperty('--dy', (-70 - Math.random() * 100) + 'px');
    b.style.setProperty('--sc', (0.35 + Math.random() * 0.55).toFixed(2));
    b.style.setProperty('--dur', (900 + Math.random() * 800) + 'ms');
    stage.appendChild(b);
    b.addEventListener('animationend', () => b.remove());
  }

  if (reduce) glove.classList.remove('idle');
})();

/* ---- year ---- */
document.getElementById('yr').textContent = new Date().getFullYear();

/* ---- Google reviews hook (stage 4) ------------------------------------
   Leave off until you have the place_id + a referrer-restricted key.
   Add to <head>:
   <script async src="https://maps.googleapis.com/maps/api/js?key=KEY&loading=async&libraries=places"><\/script>

async function loadGoogleReviews(){
  const { Place } = await google.maps.importLibrary("places");
  const place = new Place({ id: "YOUR_PLACE_ID" });
  await place.fetchFields({ fields: ["rating","userRatingCount","reviews"] });

  document.getElementById('score').textContent = place.rating.toFixed(1);
  document.getElementById('count').textContent = place.userRatingCount + " Google reviews";

  document.getElementById('reviewGrid').innerHTML = place.reviews.map(r => {
    const a = r.authorAttribution;
    return `<article class="review">
      <div class="stars" aria-hidden="true">${"★".repeat(r.rating)}</div>
      <blockquote>${r.text}</blockquote>
      <footer>
        <img class="avatar" src="${a.photoURI}" alt="">
        <span><b>${a.displayName}</b><span>${r.relativePublishTimeDescription}</span></span>
      </footer>
    </article>`;
  }).join('');
}
------------------------------------------------------------------------ */
