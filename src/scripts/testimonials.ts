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
  const prevButton = host.querySelector<HTMLButtonElement>(
    "[data-testimonials-prev]",
  );
  const nextButton = host.querySelector<HTMLButtonElement>(
    "[data-testimonials-next]",
  );

  if (!track || items.length === 0) return;
  host.dataset.testimonialsInit = "true";

  let currentIndex = 0;
  let scrollRaf: number | null = null;
  let isProgrammaticScroll = false;

  const setActive = (index: number) => {
    items.forEach((item, idx) =>
      item.classList.toggle("is-active", idx === index),
    );
    dots.forEach((dot, idx) =>
      dot.classList.toggle("is-active", idx === index),
    );
  };

  const syncFromScroll = () => {
    const scrollLeft = track.scrollLeft;
    const trackWidth = track.clientWidth;
    const containerCenter = scrollLeft + trackWidth / 2;

    let nearestIndex = 0;
    let minDistance = Number.MAX_VALUE;

    items.forEach((item, index) => {
      const itemCenter = item.offsetLeft + item.clientWidth / 2;
      const distance = Math.abs(itemCenter - containerCenter);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestIndex !== currentIndex) {
      currentIndex = nearestIndex;
      setActive(currentIndex);
    }
  };

  const goTo = (index: number) => {
    const clamped = (index + items.length) % items.length;
    const item = items[clamped];
    const targetLeft =
      item.offsetLeft - (track.clientWidth - item.clientWidth) / 2;

    isProgrammaticScroll = true;
    track.scrollTo({ left: targetLeft, behavior: "smooth" });

    setTimeout(() => {
      isProgrammaticScroll = false;
      currentIndex = clamped;
      setActive(clamped);
    }, 500);
  };

  track.addEventListener(
    "scroll",
    () => {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => {
        if (!isProgrammaticScroll) syncFromScroll();
      });
    },
    { passive: true },
  );

  prevButton?.addEventListener("click", () => goTo(currentIndex - 1));
  nextButton?.addEventListener("click", () => goTo(currentIndex + 1));
  dots.forEach((dot, idx) => dot.addEventListener("click", () => goTo(idx)));

  setActive(0);
};

const setup = () =>
  document
    .querySelectorAll("[data-testimonials-carousel]")
    .forEach(initTestimonialsCarousel);
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", setup);
else setup();
document.addEventListener("astro:after-swap", setup);
