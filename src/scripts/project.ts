const initProjectsEditorial = (root: Element) => {
  const host = root as HTMLElement;
  if (host.dataset.editorialInit === 'true') return;

  const items = Array.from(host.querySelectorAll<HTMLElement>('[data-project-item]'));
  const placeholders = Array.from(host.querySelectorAll<HTMLElement>('[data-project-placeholder]'));
  const searchInput = host.querySelector<HTMLInputElement>('[data-project-search]');
  const categoryButtons = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-category-filter]'));
  const list = host.querySelector<HTMLElement>('[data-project-list]');
  const prevButton = host.querySelector<HTMLButtonElement>('[data-page-prev]');
  const nextButton = host.querySelector<HTMLButtonElement>('[data-page-next]');
  const pageLabel = host.querySelector<HTMLElement>('[data-page-label]');
  const emptyState = host.querySelector<HTMLElement>('[data-empty-state]');
  const resultsCount = host.querySelector<HTMLElement>('[data-results-count]');

  if (!items.length || !list || !searchInput || !prevButton || !nextButton || !pageLabel || !emptyState || !resultsCount) return;

  host.dataset.editorialInit = 'true';

  const state = {
    query: '',
    category: 'all',
    page: 1,
    pageSize: 3,
  };
  let introPlayed = false;

  const applyFilters = () => {
    const filtered = items.filter((item) => {
      const title = item.dataset.title || '';
      const description = item.dataset.description || '';
      const category = item.dataset.category || 'General';

      const matchesQuery = !state.query || title.includes(state.query) || description.includes(state.query);
      const matchesCategory = state.category === 'all' || category === state.category;

      return matchesQuery && matchesCategory;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const visibleItems = filtered.slice(start, end);
    const placeholderCount = total === 0 ? 0 : Math.max(0, state.pageSize - visibleItems.length);

    items.forEach((item) => item.classList.add('is-hidden'));
    visibleItems.forEach((item) => item.classList.remove('is-hidden'));
    placeholders.forEach((placeholder) => placeholder.classList.add('is-hidden'));
    placeholders.slice(0, placeholderCount).forEach((placeholder) => placeholder.classList.remove('is-hidden'));

    resultsCount.textContent = String(total);
    pageLabel.textContent = `Pagina ${state.page} din ${totalPages}`;
    prevButton.disabled = state.page <= 1;
    nextButton.disabled = state.page >= totalPages;
    emptyState.classList.toggle('hidden', total !== 0);
  };

  const animatePageChange = (nextPage: number) => {
    if (nextPage === state.page) return;
    state.page = nextPage;
    list.classList.add('is-switching');
    window.setTimeout(() => {
      applyFilters();
      list.classList.remove('is-switching');
    }, 170);
  };

  const playIntro = () => {
    if (introPlayed) return;
    introPlayed = true;

    const visibleCards = Array.from(host.querySelectorAll<HTMLElement>('.project-item:not(.is-hidden)'));
    if (visibleCards.length === 0) return;

    list.classList.add('is-booting');
    visibleCards.forEach((item) => item.classList.add('is-entering'));

    window.setTimeout(() => {
      list.classList.remove('is-booting');
      visibleCards.forEach((item, index) => {
        window.setTimeout(() => {
          item.classList.remove('is-entering');
        }, index * 95);
      });
    }, 320);
  };

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.category = button.dataset.categoryFilter || 'all';
      state.page = 1;

      categoryButtons.forEach((chip) => chip.classList.remove('is-active'));
      button.classList.add('is-active');

      applyFilters();
    });
  });

  searchInput.addEventListener('input', () => {
    state.query = searchInput.value.trim().toLowerCase();
    state.page = 1;
    applyFilters();
  });

  prevButton.addEventListener('click', () => {
    if (state.page > 1) animatePageChange(state.page - 1);
  });

  nextButton.addEventListener('click', () => {
    animatePageChange(state.page + 1);
  });

  applyFilters();
  playIntro();
};

const setupProjectsEditorial = () => {
  document.querySelectorAll('[data-projects-editorial]').forEach((root) => initProjectsEditorial(root));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupProjectsEditorial, { once: true });
} else {
  setupProjectsEditorial();
}

document.addEventListener('astro:after-swap', setupProjectsEditorial);
