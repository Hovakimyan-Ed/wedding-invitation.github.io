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
    const viewport = root.querySelector('.inf-carousel__viewport');
    const track = root.querySelector('.inf-carousel__track');
    if (!viewport || !track) return;

    // duplicate once to enable seamless loop
    const originals = Array.from(track.children);
    const fragment = document.createDocumentFragment();
    originals.forEach(n => fragment.appendChild(n.cloneNode(true)));
    track.appendChild(fragment);

    let baseWidth = null;            // width of one full set
    let rafId = null;
    let lastTs = 0;
    let paused = false;
    let dragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let resumeTimer = null;

    const speed = parseFloat(root.dataset.speed || '0.5'); // px/ms

    const pause = () => { paused = true; };
    const resumeSoon = (delay = 1200) => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, delay);
    };

    function loop(ts) {
      rafId = requestAnimationFrame(loop);
      if (paused || dragging || baseWidth == null) { lastTs = ts; return; }
      if (!lastTs) { lastTs = ts; return; }
      const dt = ts - lastTs;
      lastTs = ts;

      // advance
      track.scrollLeft += speed * dt;

      // seamless wrap
      if (track.scrollLeft >= baseWidth) {
        track.scrollLeft -= baseWidth;
      }
    }

    function measure() {
      // After duplication, baseWidth is exactly half of scrollWidth
      baseWidth = track.scrollWidth / 2;
    }

    // user interactions
    function onWheel() { pause(); resumeSoon(); }
    function onScroll() {
      // when user flings, keep wrap logic
      if (baseWidth != null && track.scrollLeft >= baseWidth) {
        track.scrollLeft -= baseWidth;
      } else if (baseWidth != null && track.scrollLeft < 0) {
        track.scrollLeft += baseWidth;
      }
    }

    const startDrag = (clientX) => {
      dragging = true;
      root.classList.add('is-dragging');
      pause();
      dragStartX = clientX;
      dragStartScroll = track.scrollLeft;
    };
    const moveDrag = (clientX) => {
      if (!dragging) return;
      const dx = clientX - dragStartX;
      track.scrollLeft = dragStartScroll - dx;

      // keep it seamless during drag
      if (track.scrollLeft >= baseWidth) {
        track.scrollLeft -= baseWidth;
        dragStartScroll -= baseWidth;
      } else if (track.scrollLeft < 0) {
        track.scrollLeft += baseWidth;
        dragStartScroll += baseWidth;
      }
    };
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      root.classList.remove('is-dragging');
      resumeSoon(800);
    };

    // Mouse
    track.addEventListener('mousedown', (e) => startDrag(e.clientX));
    window.addEventListener('mousemove', (e) => moveDrag(e.clientX));
    window.addEventListener('mouseup', endDrag);

    // Touch
    track.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      startDrag(t.clientX);
    }, { passive: true });
    track.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      moveDrag(t.clientX);
      e.preventDefault();
    }, { passive: false });
    window.addEventListener('touchend', endDrag);

    // Hover pause (optional but nice)
    root.addEventListener('mouseenter', pause);
    root.addEventListener('mouseleave', () => resumeSoon(200));

    track.addEventListener('wheel', onWheel, { passive: true });
    track.addEventListener('scroll', onScroll, { passive: true });

    // Kickoff after images are ready
    onImagesLoaded(track).then(() => {
      measure();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    });

    // In case layout changes (e.g., responsive), re-measure
    const ro = new ResizeObserver(() => { baseWidth = track.scrollWidth / 2; });
    ro.observe(track);
  }

  // Auto-init all instances on the page
  document.querySelectorAll('.inf-carousel').forEach(initInfiniteCarousel);
})();
