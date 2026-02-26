const initTestimonialsCarousel = (root: Element) => {
  const host = root as HTMLElement;
  if (host.dataset.testimonialsInit === "true") return;

  const track = host.querySelector<HTMLElement>("[data-testimonials-track]");
  const items = Array.from(
    host.querySelectorAll<HTMLElement>("[data-testimonial-item]"),
  );
  const dots = Array.from(
    host.querySelectorAll<HTMLButtonElement>("[data-testimonials-dot]"),
  );
  const prevBtn = host.querySelector<HTMLButtonElement>(
    "[data-testimonials-prev]",
  );
  const nextBtn = host.querySelector<HTMLButtonElement>(
    "[data-testimonials-next]",
  );

  if (!track || items.length === 0) return;
  host.dataset.testimonialsInit = "true";

  let currentIndex = 0;
  let isMoving = false;
  let scrollTimeout: any;

  const setActive = (index: number) => {
    if (index < 0 || index >= items.length) return;
    currentIndex = index;
    items.forEach((item, i) => item.classList.toggle("is-active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  };

  const sync = () => {
    if (isMoving) return;

    const scrollLeft = Math.ceil(track.scrollLeft);
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (scrollLeft <= 10) {
      if (currentIndex !== 0) setActive(0);
      return;
    }

    if (scrollLeft >= maxScroll - 10) {
      const last = items.length - 1;
      if (currentIndex !== last) setActive(last);
      return;
    }

    const center = scrollLeft + track.clientWidth / 2;
    let closestIndex = currentIndex;
    let minDiff = Number.MAX_VALUE;

    items.forEach((item, i) => {
      const itemCenter = item.offsetLeft + item.clientWidth / 2;
      const diff = Math.abs(itemCenter - center);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    });

    if (closestIndex !== currentIndex) setActive(closestIndex);
  };

  const scrollTo = (index: number) => {
    const target = (index + items.length) % items.length;
    const item = items[target];
    if (!item) return;

    isMoving = true;
    const targetLeft =
      item.offsetLeft - (track.clientWidth - item.clientWidth) / 2;

    track.scrollTo({ left: targetLeft, behavior: "smooth" });
    setActive(target);

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isMoving = false;
    }, 600);
  };

  track.addEventListener(
    "scroll",
    () => {
      requestAnimationFrame(sync);
    },
    { passive: true },
  );

  prevBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    scrollTo(currentIndex - 1);
  });
  nextBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    scrollTo(currentIndex + 1);
  });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", (e) => {
      e.preventDefault();
      scrollTo(i);
    });
  });

  const forceInit = () => {
    setActive(0);
    track.scrollTo({ left: 0, behavior: "auto" });
  };

  forceInit();
  setTimeout(forceInit, 150);
};

const setup = () => {
  requestAnimationFrame(() => {
    document
      .querySelectorAll("[data-testimonials-carousel]")
      .forEach(initTestimonialsCarousel);
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup();
}

document.addEventListener("astro:after-swap", setup);
