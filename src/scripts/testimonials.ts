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
  const [prevBtn, nextBtn] = [
    host.querySelector<HTMLButtonElement>("[data-testimonials-prev]"),
    host.querySelector<HTMLButtonElement>("[data-testimonials-next]"),
  ];

  if (!track || items.length === 0) return;
  host.dataset.testimonialsInit = "true";

  let currentIndex = 0;
  let isMoving = false;

  const setActive = (index: number) => {
    currentIndex = index;
    items.forEach((item, i) => item.classList.toggle("is-active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  };

  const sync = () => {
    if (isMoving) return;

    const scrollLeft = track.scrollLeft;
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (scrollLeft <= 20) {
      if (currentIndex !== 0) setActive(0);
      return;
    }

    if (scrollLeft >= maxScroll - 20) {
      const last = items.length - 1;
      if (currentIndex !== last) setActive(last);
      return;
    }

    const center = scrollLeft + track.clientWidth / 2;
    let closestIndex = currentIndex;
    let minDiff = Number.MAX_VALUE;

    items.forEach((item, i) => {
      const diff = Math.abs(item.offsetLeft + item.clientWidth / 2 - center);
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

    isMoving = true;
    const left = item.offsetLeft - (track.clientWidth - item.clientWidth) / 2;

    track.scrollTo({ left, behavior: "smooth" });
    setActive(target);

    setTimeout(() => {
      isMoving = false;
    }, 600);
  };

  track.addEventListener("scroll", () => requestAnimationFrame(sync), {
    passive: true,
  });
  prevBtn?.addEventListener("click", () => scrollTo(currentIndex - 1));
  nextBtn?.addEventListener("click", () => scrollTo(currentIndex + 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => scrollTo(i)));

  setActive(0);
};

const setup = () =>
  document
    .querySelectorAll("[data-testimonials-carousel]")
    .forEach(initTestimonialsCarousel);
document.addEventListener("DOMContentLoaded", setup);
document.addEventListener("astro:after-swap", setup);
