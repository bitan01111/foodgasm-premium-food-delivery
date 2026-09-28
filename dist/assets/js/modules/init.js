export function initApp() {
  // Minimal boot to avoid hard break while extraction is ongoing.
  // Next extraction pass will fully wire Foodgasm logic.
  const loader = document.getElementById('app-loader');
  if (loader) loader.classList.add('hidden');

  // Basic scroll top button
  const scrollTop = document.getElementById('scroll-top');
  if (scrollTop) {
    scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    const onScroll = () => {
      if (!scrollTop) return;
      scrollTop.classList.toggle('visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Bottom nav + sidebar nav routing will be restored after markup extraction.
}

