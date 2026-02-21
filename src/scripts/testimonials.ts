const initTestimonialsCarousel = (root: Element) => {
  const host = root as HTMLElement;
  if (host.dataset.testimonialsInit === 'true') return;

  const track = host.querySelector<HTMLElement>('[data-testimonials-track]');
  const items = Array.from(host.querySelectorAll<HTMLElement>('[data-testimonial-item]'));
  const dots = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-testimonials-dot]'));
  const prevButton = host.querySelector<HTMLButtonElement>('[data-testimonials-prev]');
  const nextButton = host.querySelector<HTMLButtonElement>('[data-testimonials-next]');

  if (!track || items.length === 0) return;

  host.dataset.testimonialsInit = 'true';

  let currentIndex = 0;
  let scrollRaf: number | null = null;
  let isProgrammaticScroll = false;
  let programmaticTimer: number | null = null;

  const setActive = (index: number) => {
    items.forEach((item, itemIndex) => {
      item.classList.toggle('is-active', itemIndex === index);
      item.setAttribute('aria-hidden', itemIndex === index ? 'false' : 'true');
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  };

  const goTo = (index: number, behavior: ScrollBehavior = 'smooth') => {
    const clamped = (index + items.length) % items.length;
    const isWrapForward = currentIndex === items.length - 1 && clamped === 0;
    const isWrapBackward = currentIndex === 0 && clamped === items.length - 1;
    const isWrapJump = isWrapForward || isWrapBackward;
    const transitionBehavior: ScrollBehavior = isWrapJump ? 'auto' : behavior;
    const item = items[clamped];
    const targetLeft = Math.max(
      0,
      Math.min(
        item.offsetLeft - (track.clientWidth - item.clientWidth) / 2,
        track.scrollWidth - track.clientWidth
      )
    );

    isProgrammaticScroll = true;
    if (programmaticTimer !== null) {
      window.clearTimeout(programmaticTimer);
    }

    if (isWrapJump) {
      host.classList.add('is-wrapping');
      window.setTimeout(() => {
        track.scrollTo({ left: targetLeft, behavior: 'auto' });
        currentIndex = clamped;
        setActive(clamped);
        window.requestAnimationFrame(() => host.classList.remove('is-wrapping'));
        isProgrammaticScroll = false;
        syncFromScroll();
      }, 130);
      return;
    }

    track.scrollTo({ left: targetLeft, behavior: transitionBehavior });
    currentIndex = clamped;
    setActive(clamped);

    programmaticTimer = window.setTimeout(() => {
      isProgrammaticScroll = false;
      syncFromScroll();
      programmaticTimer = null;
    }, 420);
  };

  const syncFromScroll = () => {
    if (track.scrollLeft <= 2) {
      if (currentIndex !== 0) {
        currentIndex = 0;
        setActive(0);
      }
      return;
    }
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) {
      const lastIndex = items.length - 1;
      if (currentIndex !== lastIndex) {
        currentIndex = lastIndex;
        setActive(lastIndex);
      }
      return;
    }

    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let nearestIndex = currentIndex;
    let nearestDistance = Number.POSITIVE_INFINITY;

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
      setActive(currentIndex);
    }
  };

  track.addEventListener(
    'scroll',
    () => {
      if (scrollRaf !== null) {
        cancelAnimationFrame(scrollRaf);
      }

      scrollRaf = requestAnimationFrame(() => {
        if (!isProgrammaticScroll) {
          syncFromScroll();
        }
        scrollRaf = null;
      });
    },
    { passive: true }
  );

  prevButton?.addEventListener('click', () => goTo(currentIndex - 1));
  nextButton?.addEventListener('click', () => goTo(currentIndex + 1));

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goTo(index));
  });

  window.addEventListener('resize', () => goTo(currentIndex, 'auto'));

  if (items.length <= 1) {
    prevButton?.setAttribute('hidden', 'true');
    nextButton?.setAttribute('hidden', 'true');
    host.querySelector<HTMLElement>('[data-testimonials-dots]')?.setAttribute('hidden', 'true');
  }

  currentIndex = 0;
  setActive(0);
  track.scrollTo({ left: 0, behavior: 'auto' });
  window.requestAnimationFrame(() => goTo(0, 'auto'));

  window.requestAnimationFrame(() => {
    host.classList.add('is-ready');
  });
};

const setupTestimonialsCarousel = () => {
  document.querySelectorAll('[data-testimonials-carousel]').forEach((root) => initTestimonialsCarousel(root));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTestimonialsCarousel, { once: true });
} else {
  setupTestimonialsCarousel();
}

document.addEventListener('astro:after-swap', setupTestimonialsCarousel);
