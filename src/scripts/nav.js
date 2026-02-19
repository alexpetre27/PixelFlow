let initialized = false;

export function initNavbar() {
  if (initialized) return;
  initialized = true;

  const nav = document.getElementById("main-nav");
  const container = document.getElementById("nav-container");
  const toggleBtn = document.getElementById("mobile-menu-toggle");
  const menu = document.getElementById("mobile-menu");
  const overlay = document.getElementById("nav-overlay");

  if (!nav || !container) return;

  let lastScrolledState = null;

  const applyScrolledStyles = () => {
    nav.classList.remove("top-8");
    nav.classList.add("top-4");

    container.classList.remove("max-w-6xl");
    container.classList.add("max-w-4xl");

    container.classList.add("bg-black/80", "px-4");
  };

  const applyDefaultStyles = () => {
    nav.classList.remove("top-4");
    nav.classList.add("top-8");

    container.classList.remove("max-w-4xl");
    container.classList.add("max-w-6xl");

    container.classList.remove("bg-black/80", "px-4");
  };

  const handleScroll = () => {
    const isScrolled = window.scrollY > 20;
    if (isScrolled === lastScrolledState) return;

    lastScrolledState = isScrolled;
    isScrolled ? applyScrolledStyles() : applyDefaultStyles();
  };

  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });

  if (!toggleBtn || !menu || !overlay) return;

  const menuIcon = toggleBtn.querySelector(".menu-icon");
  const closeIcon = toggleBtn.querySelector(".close-icon");

  let isOpen = false;

  let scrollY = 0;

  const openMenu = () => {
    isOpen = true;

    scrollY = window.scrollY;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";

    menu.classList.remove(
      "opacity-0",
      "translate-y-[-20px]",
      "pointer-events-none",
    );
    menu.classList.add("opacity-100", "translate-y-0", "pointer-events-auto");

    overlay.classList.remove("opacity-0", "pointer-events-none");
    overlay.classList.add("opacity-100", "pointer-events-auto");

    menuIcon?.classList.add("hidden");
    closeIcon?.classList.remove("hidden");
  };

  const closeMenu = () => {
    isOpen = false;

    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";

    window.scrollTo(0, scrollY);

    menu.classList.remove(
      "opacity-100",
      "translate-y-0",
      "pointer-events-auto",
    );
    menu.classList.add(
      "opacity-0",
      "translate-y-[-20px]",
      "pointer-events-none",
    );

    overlay.classList.remove("opacity-100", "pointer-events-auto");
    overlay.classList.add("opacity-0", "pointer-events-none");

    menuIcon?.classList.remove("hidden");
    closeIcon?.classList.add("hidden");
  };

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isOpen ? closeMenu() : openMenu();
  });

  overlay.addEventListener("click", closeMenu);

  document.querySelectorAll(".mobile-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closeMenu();
  });
}
