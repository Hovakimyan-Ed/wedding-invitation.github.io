// Countdown
const weddingDate = new Date("2025-12-18T11:30:00").getTime();

const countdown = setInterval(() => {
  const now = new Date().getTime();
  const distance = weddingDate - now;

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById("days").textContent = days;
  document.getElementById("hours").textContent = hours;
  document.getElementById("minutes").textContent = minutes;
  document.getElementById("seconds").textContent = seconds;
}, 1000);

(() => {
  function onImagesLoaded(container) {
    const imgs = Array.from(container.querySelectorAll('img'));
    const pending = imgs.filter(img => !img.complete);
    if (!pending.length) return Promise.resolve();
    return new Promise(res => {
      let left = pending.length;
      const done = () => (--left === 0) && res();
      pending.forEach(img => {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    });
  }

  function initInfiniteCarousel(root) {
    const track = root.querySelector('.inf-carousel__track');
    if (!track) return;

    const originals = Array.from(track.children);
    const frag = document.createDocumentFragment();
    originals.forEach(n => frag.appendChild(n.cloneNode(true)));
    track.appendChild(frag);

    let baseWidth = null;
    let rafId = null;
    let last = 0;
    let isPointerDown = false;
    let cooldownUntil = 0;
    let startX = 0;
    let startScroll = 0;

    const pxPerSec = parseFloat(root.dataset.speed || '60');

    function wrapScroll() {
      if (baseWidth == null) return;
      if (track.scrollLeft >= baseWidth) track.scrollLeft -= baseWidth;
      else if (track.scrollLeft < 0) track.scrollLeft += baseWidth;
    }

    function measure() {
      baseWidth = track.scrollWidth / 2;
    }

    function loop(ts) {
      rafId = requestAnimationFrame(loop);
      if (!last) { last = ts; return; }
      const dtMs = ts - last;
      last = ts;
      if (isPointerDown || ts < cooldownUntil || baseWidth == null) return;
      const delta = (pxPerSec * dtMs) / 1000;
      track.scrollLeft += delta;
      wrapScroll();
    }

    const onPointerDown = (e) => {
      isPointerDown = true;
      root.classList.add('is-dragging');
      startX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
      startScroll = track.scrollLeft;
      cooldownUntil = performance.now() + 1200;
    };

    const onPointerMove = (e) => {
      if (!isPointerDown) return;
      const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
      const dx = clientX - startX;
      track.scrollLeft = startScroll - dx;
      wrapScroll();
      if (e.cancelable) e.preventDefault();
    };

    const onPointerUp = () => {
      if (!isPointerDown) return;
      isPointerDown = false;
      root.classList.remove('is-dragging');
      cooldownUntil = performance.now() + 1200;
    };

    track.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);

    track.addEventListener('touchstart', (e) => onPointerDown(e), { passive: true });
    track.addEventListener('touchmove', (e) => onPointerMove(e), { passive: false });
    window.addEventListener('touchend', onPointerUp);

    track.addEventListener('mousedown', (e) => onPointerDown(e));
    window.addEventListener('mousemove', (e) => onPointerMove(e));
    window.addEventListener('mouseup', onPointerUp);

    track.addEventListener('wheel', () => {
      cooldownUntil = performance.now() + 1200;
    }, { passive: true });

    track.addEventListener('scroll', wrapScroll, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!rafId) {
        last = 0;
        rafId = requestAnimationFrame(loop);
      }
    });

    onImagesLoaded(track).then(() => {
      measure();
      last = 0;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    });

    const ro = new ResizeObserver(() => { baseWidth = track.scrollWidth / 2; });
    ro.observe(track);
  }

  document.querySelectorAll('.inf-carousel').forEach(initInfiniteCarousel);
})();
