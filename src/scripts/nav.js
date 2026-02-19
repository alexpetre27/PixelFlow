export function initNavScroll() {
  const nav = document.getElementById("main-nav");
  const container = document.getElementById("nav-container");

  if (!nav || !container) return;

  const handleScroll = () => {
    const isScrolled = window.scrollY > 20;

    if (isScrolled) {
      nav.classList.replace("top-8", "top-4");
      container.classList.replace("max-w-6xl", "max-w-4xl");
      container.classList.add("bg-black/80", "px-4");
    } else {
      nav.classList.replace("top-4", "top-8");
      container.classList.replace("max-w-4xl", "max-w-6xl");
      container.classList.remove("bg-black/80", "px-4");
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
}
