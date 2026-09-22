/**
 * ============================================================
 * CELEBRATIONS RESTAURANT — INTERACTIVITY & APPLICATION LOGIC
 * ============================================================
 * Handles navigation, menu filtering, customer favourites carousel,
 * gallery lightbox, reservation forms, scroll animations, and FAB.
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure data loaded
  if (typeof RESTAURANT === 'undefined' || typeof MENU_ITEMS === 'undefined') {
    console.error('Celebrations: data.js failed to load.');
    return;
  }

  /* ------------------------------------------------------------
   * 1. STATE MANAGEMENT
   * ------------------------------------------------------------ */
  const menuState = {
    type: 'all',        // 'all' | 'veg' | 'nonveg'
    category: 'all',    // 'all' | category string
    search: '',
  };

  const galleryState = {
    category: 'all',
    currentIndex: 0,
    filteredItems: [],
  };

  /* ------------------------------------------------------------
   * 2. DOM ELEMENTS
   * ------------------------------------------------------------ */
  // Navigation
  const navbar = document.getElementById('navbar');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const navLinks = document.querySelectorAll('.navbar__link, .mobile-nav__link');

  // Menu Elements

  // Menu Elements
  const toggleVeg = document.getElementById('toggle-veg');
  const toggleNonVeg = document.getElementById('toggle-nonveg');
  const menuSearchInput = document.getElementById('menu-search-input');
  const menuCategoriesContainer = document.getElementById('menu-categories');
  const menuGrid = document.getElementById('menu-grid');
  const menuCount = document.getElementById('menu-count');
  const menuNoResults = document.getElementById('menu-no-results');
  const resetMenuFiltersBtn = document.getElementById('reset-menu-filters');

  // Gallery Elements
  const galleryFiltersContainer = document.getElementById('gallery-filters');
  const galleryGrid = document.getElementById('gallery-grid');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  // Reservation Form
  const reservationForm = document.getElementById('reservation-form');
  const formFields = document.getElementById('form-fields');
  const formSuccess = document.getElementById('form-success');
  const resSuccessDesc = document.getElementById('res-success-desc');
  const resResetBtn = document.getElementById('res-reset-btn');
  const resDateInput = document.getElementById('res-date');

  // FAB & Footer
  const fabContainer = document.getElementById('fab-container');
  const currentYearSpan = document.getElementById('current-year');

  /* ------------------------------------------------------------
   * 3. INITIALIZATION
   * ------------------------------------------------------------ */
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // Set min date on reservation input to today
  if (resDateInput) {
    const today = new Date().toISOString().split('T')[0];
    resDateInput.min = today;
    resDateInput.value = today;
  }

  // Render sections safely
  try { initMenuCategories(); } catch (e) { console.error('Menu categories error:', e); }
  try { renderMenu(); } catch (e) { console.error('Menu render error:', e); }
  try { initGallery(); } catch (e) { console.error('Gallery error:', e); }
  try { initScrollObservers(); } catch (e) { console.error('Scroll observers error:', e); }

  /* ------------------------------------------------------------
   * 4. NAVBAR & SCROLL BEHAVIOR
   * ------------------------------------------------------------ */
  function handleScroll() {
    const scrollY = window.scrollY;

    // Navbar background transition
    if (scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Floating Action Buttons visibility
    if (scrollY > 350) {
      fabContainer.classList.add('visible');
    } else {
      fabContainer.classList.remove('visible');
    }

    // Active link highlighting
    highlightActiveSection();
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check

  // Active section highlighting via viewport offset
  const sections = document.querySelectorAll('section[id], header[id]');
  function highlightActiveSection() {
    const scrollPosition = window.scrollY + 180;

    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');

      if (scrollPosition >= top && scrollPosition < top + height) {
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }

  // Mobile Navigation Drawer Toggle
  function openMobileNav() {
    hamburgerBtn.classList.add('active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    mobileNav.classList.add('open');
    mobileOverlay.classList.add('visible');
    document.body.classList.add('no-scroll');
  }

  function closeMobileNav() {
    hamburgerBtn.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    mobileOverlay.classList.remove('visible');
    document.body.classList.remove('no-scroll');
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      if (mobileNav.classList.contains('open')) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMobileNav);
  }

  // Smooth scroll and auto-close mobile drawer on link click
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          closeMobileNav();

          const navHeight = navbar.offsetHeight || 70;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navHeight + 5;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  /* (Customer Favourites section removed) */

  /* ------------------------------------------------------------
   * 6. MENU INTERACTION & FILTERING
   * ------------------------------------------------------------ */
  function initMenuCategories() {
    if (!menuCategoriesContainer) return;

    const categories = typeof MENU_CATEGORIES !== 'undefined' ? MENU_CATEGORIES : [
      { key: 'all', label: 'All Items' },
      { key: 'Biryani', label: 'Biryani' },
      { key: 'Starters', label: 'Starters' },
      { key: 'Curries', label: 'Curries' },
      { key: 'Tandoori', label: 'Tandoori' },
      { key: 'Rice', label: 'Rice' },
      { key: 'Noodles', label: 'Noodles' },
      { key: 'Breads', label: 'Breads' },
      { key: 'Soups', label: 'Soups' },
      { key: 'Drinks', label: 'Drinks' },
      { key: 'Desserts', label: 'Desserts' },
    ];

    menuCategoriesContainer.innerHTML = categories
      .map((cat) => `
        <button 
          type="button" 
          class="menu-categories__pill ${cat.key === menuState.category ? 'active' : ''}" 
          data-category="${cat.key}"
          role="tab"
          aria-selected="${cat.key === menuState.category}"
        >
          ${cat.label}
        </button>
      `)
      .join('');

    menuCategoriesContainer.querySelectorAll('.menu-categories__pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const catKey = pill.getAttribute('data-category');
        selectCategory(catKey);
      });
    });
  }

  function selectCategory(catKey) {
    menuState.category = catKey;

    // Update pill active states
    if (menuCategoriesContainer) {
      menuCategoriesContainer.querySelectorAll('.menu-categories__pill').forEach((pill) => {
        const isMatch = pill.getAttribute('data-category') === catKey;
        pill.classList.toggle('active', isMatch);
        pill.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
    }

    renderMenu();
  }

  // Dietary Toggle (Veg / Non-Veg)
  if (toggleVeg) {
    toggleVeg.addEventListener('click', () => {
      if (menuState.type === 'veg') {
        menuState.type = 'all';
        toggleVeg.classList.remove('active');
        toggleVeg.setAttribute('aria-pressed', 'false');
      } else {
        menuState.type = 'veg';
        toggleVeg.classList.add('active');
        toggleVeg.setAttribute('aria-pressed', 'true');
        if (toggleNonVeg) {
          toggleNonVeg.classList.remove('active');
          toggleNonVeg.setAttribute('aria-pressed', 'false');
        }
      }
      renderMenu();
    });
  }

  if (toggleNonVeg) {
    toggleNonVeg.addEventListener('click', () => {
      if (menuState.type === 'nonveg') {
        menuState.type = 'all';
        toggleNonVeg.classList.remove('active');
        toggleNonVeg.setAttribute('aria-pressed', 'false');
      } else {
        menuState.type = 'nonveg';
        toggleNonVeg.classList.add('active');
        toggleNonVeg.setAttribute('aria-pressed', 'true');
        if (toggleVeg) {
          toggleVeg.classList.remove('active');
          toggleVeg.setAttribute('aria-pressed', 'false');
        }
      }
      renderMenu();
    });
  }

  // Menu Search with debounce
  let searchDebounceTimer;
  if (menuSearchInput) {
    menuSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        menuState.search = e.target.value.trim().toLowerCase();
        renderMenu();
      }, 150);
    });
  }

  // Reset Filters Button
  if (resetMenuFiltersBtn) {
    resetMenuFiltersBtn.addEventListener('click', () => {
      menuState.type = 'all';
      menuState.category = 'all';
      menuState.search = '';

      if (menuSearchInput) menuSearchInput.value = '';
      if (toggleVeg) {
        toggleVeg.classList.remove('active');
        toggleVeg.setAttribute('aria-pressed', 'false');
      }
      if (toggleNonVeg) {
        toggleNonVeg.classList.remove('active');
        toggleNonVeg.setAttribute('aria-pressed', 'false');
      }
      selectCategory('all');
    });
  }

  // Render Filtered Menu Cards
  function renderMenu() {
    if (!menuGrid) return;

    const filtered = MENU_ITEMS.filter((item) => {
      // Filter by dietary type
      if (menuState.type !== 'all' && item.type !== menuState.type) {
        return false;
      }

      // Filter by category
      if (menuState.category !== 'all' && item.category !== menuState.category) {
        return false;
      }

      // Filter by search query
      if (menuState.search) {
        const nameMatch = item.name.toLowerCase().includes(menuState.search);
        const descMatch = item.description ? item.description.toLowerCase().includes(menuState.search) : false;
        const catMatch = item.category ? item.category.toLowerCase().includes(menuState.search) : false;
        if (!nameMatch && !descMatch && !catMatch) {
          return false;
        }
      }

      return true;
    });

    // Update count display
    if (menuCount) {
      let typeText = '';
      if (menuState.type === 'veg') typeText = ' Pure Veg';
      if (menuState.type === 'nonveg') typeText = ' Non-Veg';

      let catText = menuState.category !== 'all' ? ` in ${menuState.category}` : '';
      let searchText = menuState.search ? ` matching "${menuState.search}"` : '';

      menuCount.textContent = `Showing ${filtered.length} of ${MENU_ITEMS.length}${typeText} dishes${catText}${searchText}`;
    }

    // Handle empty state
    if (filtered.length === 0) {
      menuGrid.innerHTML = '';
      if (menuNoResults) menuNoResults.style.display = 'block';
      return;
    } else {
      if (menuNoResults) menuNoResults.style.display = 'none';
    }

    // Render cards
    menuGrid.innerHTML = filtered
      .map((item) => {
        const priceHTML = item.price !== null 
          ? `<span class="menu-card__price">₹${item.price}</span>` 
          : `<span class="menu-card__price menu-card__price--pending">Price on request</span>`;

        const typeIndicator = `<span class="food-type-indicator food-type-indicator--${item.type}" title="${item.type === 'veg' ? 'Pure Vegetarian' : 'Non-Vegetarian'}"></span>`;
        
        let badgesHTML = '';
        if (item.popular) {
          badgesHTML += `<span class="badge badge--popular">★ Popular</span>`;
        }
        if (item.type === 'veg') {
          badgesHTML += `<span class="badge badge--veg">Veg</span>`;
        }

        // Spice level indicator
        let spiceHTML = '';
        if (item.spiceLevel && item.spiceLevel > 0) {
          const chills = '🌶️'.repeat(Math.min(item.spiceLevel, 3));
          spiceHTML = `<span class="menu-card__spice" title="Spice Level: ${item.spiceLevel}/3">${chills}</span>`;
        }

        return `
          <article class="menu-card" data-category="${item.category}" data-id="${item.id}">
            <div class="menu-card__img">
              ${badgesHTML ? `<div class="menu-card__badges">${badgesHTML}</div>` : ''}
              <img 
                src="${item.image}" 
                alt="${item.name} - Celebrations Restaurant" 
                loading="lazy"
                onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';"
              >
            </div>
            <div class="menu-card__body">
              <div class="menu-card__header">
                ${typeIndicator}
                <h3 class="menu-card__name">${item.name}</h3>
              </div>
              <p class="menu-card__desc">${item.description || 'Authentic regional preparation spiced to perfection.'}</p>
              <div class="menu-card__footer">
                ${priceHTML}
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${spiceHTML}
                  <button type="button" class="btn btn--outline btn--sm" style="padding: 4px 10px; font-size: 0.75rem;" title="Order online" onclick="event.stopPropagation(); openOrderModal()">
                    Order
                  </button>
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    // Add click handler to menu cards to open order modal
    menuGrid.querySelectorAll('.menu-card').forEach((card) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        openOrderModal();
      });
    });
  }

  /* ------------------------------------------------------------
   * 7. GALLERY & LIGHTBOX
   * ------------------------------------------------------------ */
  function initGallery() {
    if (!galleryGrid) return;

    // Use GALLERY_CATEGORIES from data.js or default
    const categories = typeof GALLERY_CATEGORIES !== 'undefined' ? GALLERY_CATEGORIES : [
      { key: 'all', label: 'All' },
      { key: 'food', label: 'Dishes' },
      { key: 'biryani', label: 'Biryani' },
      { key: 'veg', label: 'Veg' },
      { key: 'nonveg', label: 'Non-Veg' },
      { key: 'ambience', label: 'Ambience' },
    ];

    // Populate filter tabs
    if (galleryFiltersContainer) {
      galleryFiltersContainer.innerHTML = categories
        .map((cat) => `
          <button 
            type="button" 
            class="menu-categories__pill ${cat.key === galleryState.category ? 'active' : ''}" 
            data-gallery-cat="${cat.key}"
            role="tab"
            aria-selected="${cat.key === galleryState.category}"
          >
            ${cat.label}
          </button>
        `)
        .join('');

      galleryFiltersContainer.querySelectorAll('.menu-categories__pill').forEach((btn) => {
        btn.addEventListener('click', () => {
          const cat = btn.getAttribute('data-gallery-cat');
          selectGalleryCategory(cat);
        });
      });
    }

    renderGallery();
  }

  function selectGalleryCategory(cat) {
    galleryState.category = cat;

    if (galleryFiltersContainer) {
      galleryFiltersContainer.querySelectorAll('.menu-categories__pill').forEach((btn) => {
        const isMatch = btn.getAttribute('data-gallery-cat') === cat;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
    }

    renderGallery();
  }

  function renderGallery() {
    if (!galleryGrid || typeof GALLERY_IMAGES === 'undefined') return;

    galleryState.filteredItems = GALLERY_IMAGES.filter((img) => {
      if (galleryState.category === 'all') return true;
      return img.category === galleryState.category;
    });

    galleryGrid.innerHTML = galleryState.filteredItems
      .map((item, index) => `
        <div class="gallery-item" data-index="${index}" tabindex="0" role="button" aria-label="Enlarge image: ${item.alt}">
          <img 
            src="${item.src}" 
            alt="${item.alt}" 
            loading="lazy"
            onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80';"
          >
        </div>
      `)
      .join('');

    // Attach click listeners to open lightbox
    galleryGrid.querySelectorAll('.gallery-item').forEach((elem) => {
      elem.addEventListener('click', () => {
        const idx = parseInt(elem.getAttribute('data-index'), 10);
        openLightbox(idx);
      });
      elem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const idx = parseInt(elem.getAttribute('data-index'), 10);
          openLightbox(idx);
        }
      });
    });
  }

  function openLightbox(index) {
    if (!lightbox || !galleryState.filteredItems[index]) return;

    galleryState.currentIndex = index;
    updateLightboxContent();

    lightbox.classList.add('open');
    document.body.classList.add('no-scroll');
  }

  function closeLightboxModal() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  function updateLightboxContent() {
    const item = galleryState.filteredItems[galleryState.currentIndex];
    if (!item) return;

    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
    lightboxCaption.textContent = item.alt;
  }

  function nextLightboxImage() {
    if (galleryState.filteredItems.length === 0) return;
    galleryState.currentIndex = (galleryState.currentIndex + 1) % galleryState.filteredItems.length;
    updateLightboxContent();
  }

  function prevLightboxImage() {
    if (galleryState.filteredItems.length === 0) return;
    galleryState.currentIndex = (galleryState.currentIndex - 1 + galleryState.filteredItems.length) % galleryState.filteredItems.length;
    updateLightboxContent();
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightboxModal);
  if (lightboxNext) lightboxNext.addEventListener('click', nextLightboxImage);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevLightboxImage);

  // Close when clicking outside image content
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightboxModal();
      }
    });
  }

  // Keyboard navigation for Lightbox
  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('open')) return;

    if (e.key === 'Escape') {
      closeLightboxModal();
    } else if (e.key === 'ArrowRight') {
      nextLightboxImage();
    } else if (e.key === 'ArrowLeft') {
      prevLightboxImage();
    }
  });

  /* ------------------------------------------------------------
   * 8. TABLE RESERVATION FORM
   * ------------------------------------------------------------ */
  if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('res-name').value.trim();
      const phone = document.getElementById('res-phone').value.trim();
      const date = document.getElementById('res-date').value;
      const time = document.getElementById('res-time').value;
      const guests = document.getElementById('res-guests').value;
      const special = document.getElementById('res-special').value.trim();

      // Simple validation
      if (!name || !phone || !date || !time) {
        alert('Please fill out all required fields marked with *');
        return;
      }

      // Phone check (10 digits)
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
      }

      // Format date nicely
      let formattedDate = date;
      try {
        const d = new Date(date);
        formattedDate = d.toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch (err) {
        formattedDate = date;
      }

      // Show success screen
      formFields.classList.add('hidden');
      formSuccess.classList.add('show');

      if (resSuccessDesc) {
        resSuccessDesc.innerHTML = `
          Dear <strong>${name}</strong>, your table for <strong>${guests} guests</strong> on <strong>${formattedDate}</strong> at <strong>${time}</strong> has been received.<br><br>
          We will send a confirmation call/SMS to <strong>${phone}</strong> shortly. For instant changes, call <a href="tel:09030994922" style="color: var(--clr-primary); font-weight: bold;">090309 94922</a>.
        `;
      }
    });
  }

  if (resResetBtn) {
    resResetBtn.addEventListener('click', () => {
      reservationForm.reset();
      if (resDateInput) {
        resDateInput.value = new Date().toISOString().split('T')[0];
      }
      formFields.classList.remove('hidden');
      formSuccess.classList.remove('show');
    });
  }

  /* ------------------------------------------------------------
   * 9. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
   * ------------------------------------------------------------ */
  function initScrollObservers() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    revealElements.forEach((elem) => elem.classList.add('revealed'));

    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        {
          root: null,
          threshold: 0.05,
          rootMargin: '50px',
        }
      );

      revealElements.forEach((elem) => revealObserver.observe(elem));
    }
  }
});

/* ------------------------------------------------------------
 * GLOBAL: ORDER MODAL FUNCTIONS
 * ------------------------------------------------------------ */
function openOrderModal() {
  const modal = document.getElementById('order-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.classList.add('no-scroll');
  }
}

function closeOrderModal() {
  const modal = document.getElementById('order-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }
}

// Close order modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeOrderModal();
  }
});
