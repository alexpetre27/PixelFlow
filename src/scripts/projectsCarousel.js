const initCarousel = (root) => {
  if (!root || root.dataset.carouselInit === "true") return;

  const track = root.querySelector("[data-carousel-track]");
  const prevBtn = root.querySelector("[data-carousel-prev]");
  const nextBtn = root.querySelector("[data-carousel-next]");
  if (!track) return;

  const items = Array.from(track.querySelectorAll(".carousel-item"));
  if (items.length === 0) return;

  root.dataset.carouselInit = "true";
  let currentIndex = 0;
  let scrollRaf = null;

  const setActiveClass = (index) => {
    items.forEach((item, itemIndex) =>
      item.classList.toggle("is-active", itemIndex === index),
    );
  };

  const centerItem = (index, behavior = "smooth") => {
    const clamped = (index + items.length) % items.length;
    const item = items[clamped];
    item.scrollIntoView({ behavior, block: "nearest", inline: "center" });
    currentIndex = clamped;
    setActiveClass(clamped);
  };

  const syncIndexFromScroll = () => {
    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    items.forEach((item, index) => {
      const itemCenter = item.offsetLeft + item.clientWidth / 2;
      const distance = Math.abs(itemCenter - trackCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestIndex !== currentIndex) {
      currentIndex = nearestIndex;
      setActiveClass(currentIndex);
    }
  };

  track.addEventListener(
    "scroll",
    () => {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(syncIndexFromScroll);
    },
    { passive: true },
  );

  nextBtn?.addEventListener("click", () => centerItem(currentIndex + 1));
  prevBtn?.addEventListener("click", () => centerItem(currentIndex - 1));
  window.addEventListener("resize", () => centerItem(currentIndex, "auto"));

  centerItem(0, "auto");
};

const setupCarousels = () => {
  document
    .querySelectorAll("[data-projects-carousel]")
    .forEach((root) => initCarousel(root));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupCarousels, { once: true });
} else {
  setupCarousels();
}
document.addEventListener("astro:after-swap", setupCarousels);
