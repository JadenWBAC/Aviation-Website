/**
 * Jaden's Plane Gallery - Main JavaScript
 * Optimized code for the aviation gallery website
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components in a single call
  initializeComponents();
});

/**
 * Main initialization function that calls all component initializers
 */
function initializeComponents() {
  const components = {
    hero: document.querySelector('.hero-content'),
    gallery: document.querySelectorAll('.gallery-item'),
    video: {
      featured: document.getElementById('featured-video'),
      overlay: document.getElementById('video-overlay'),
      hero: document.querySelector('.hero-video')
    },
    aircraftGrid: document.getElementById('aircraft-grid'),
    galleryFilters: document.querySelector('.gallery-filters'),
    contactForm: document.querySelector('.contact-form'),
    aboutPage: document.querySelector('.section-title'),
    navLinks: document.querySelectorAll('nav a')
  };

  // Initialize only components that exist on the page
  if (components.hero) initializeHero(components.hero);
  if (components.gallery.length) initializeGallery(components.gallery);
  if (components.galleryFilters) initializeGalleryFilters(components.galleryFilters);
  if (components.video.featured && components.video.overlay) initializeVideoOverlay(components.video);
  if (components.aircraftGrid) renderAircraftCards(components.aircraftGrid);
  if (components.contactForm) initializeContactForm(components.contactForm);
  if (components.aboutPage) initializeAboutPage(components.aboutPage);
  if (components.navLinks.length) initializeNavigation(components.navLinks);

  // Swap in a placeholder for any missing photo marked with data-fallback
  initializeImageFallbacks();
}

/**
 * Hero Section Animation
 */
function initializeHero(heroContent) {
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    heroContent.classList.add('fade-in');
  });
}

/**
 * Gallery lightbox: click a photo to see it large.
 *   - Esc closes it, the left/right arrow keys move between photos
 *   - on a phone, swipe left/right
 *   - photos hidden by a filter are skipped
 */
function initializeGallery(galleryItems) {
  const grid = galleryItems[0].parentElement;
  let lightbox = null;   // the open viewer's elements, or null while it's closed
  let currentIndex = 0;  // which of the VISIBLE photos is showing
  let opener = null;     // the grid photo that opened the viewer (focus goes back there)

  // Make every photo reachable with the keyboard, not just the mouse
  galleryItems.forEach(item => {
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    const caption = item.querySelector('.image-caption');
    if (caption) item.setAttribute('aria-label', 'View larger: ' + caption.textContent.trim());
  });

  // The grid shows small thumbnails (images/Gallery/thumbs/...).
  // If a thumbnail doesn't exist yet, fall back to the full-size photo so nothing ever looks broken.
  function useFullPhotoIfThumbMissing(img) {
    const swap = () => {
      if (img.dataset.full && !img.dataset.usedFull) {
        img.dataset.usedFull = 'yes';   // only ever swap once
        img.src = img.dataset.full;
      }
    };
    img.addEventListener('error', swap, { once: true });
    if (img.complete && img.naturalWidth === 0) swap(); // it had already failed before this code ran
  }
  galleryItems.forEach(item => useFullPhotoIfThumbMissing(item.querySelector('img')));

  // Photos not hidden by a filter
  const visibleItems = () => Array.from(galleryItems).filter(item => !item.hidden);

  grid.addEventListener('click', function(e) {
    const item = e.target.closest('.gallery-item');
    if (item && !lightbox) openLightbox(item);
  });

  grid.addEventListener('keydown', function(e) {
    const item = e.target.closest('.gallery-item');
    if (item && !lightbox && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); // stops the space bar from scrolling the page
      openLightbox(item);
    }
  });

  function makeButton(className, symbol, label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.textContent = symbol;
    btn.setAttribute('aria-label', label);
    return btn;
  }

  function openLightbox(item) {
    opener = item;

    const overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';

    const container = document.createElement('div');
    container.className = 'zoomed-container';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-label', 'Photo viewer');

    const img = document.createElement('img');
    const caption = document.createElement('div');
    caption.className = 'image-caption';
    const closeBtn = makeButton('zoom-close-btn', '×', 'Close');
    const prevBtn = makeButton('lightbox-nav lightbox-prev', '‹', 'Previous photo');
    const nextBtn = makeButton('lightbox-nav lightbox-next', '›', 'Next photo');

    container.append(img, caption, closeBtn);
    document.body.append(overlay, container, prevBtn, nextBtn);
    document.body.style.overflow = 'hidden';

    lightbox = { overlay, container, img, caption, prevBtn, nextBtn };
    showPhoto(visibleItems().indexOf(item));

    // Mouse / touch
    overlay.addEventListener('click', closeLightbox);
    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', () => showPhoto(currentIndex - 1));
    nextBtn.addEventListener('click', () => showPhoto(currentIndex + 1));

    // Keyboard (removed again in closeLightbox)
    document.addEventListener('keydown', onKeydown);

    // Swipe: finger moves left = next photo, right = previous
    let touchStartX = null;
    container.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    container.addEventListener('touchend', e => {
      if (touchStartX === null) return;
      const distance = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(distance) > 50) showPhoto(currentIndex + (distance < 0 ? 1 : -1));
    }, { passive: true });

    closeBtn.focus();
  }

  function showPhoto(index) {
    const items = visibleItems();
    currentIndex = (index + items.length) % items.length; // wraps around at both ends
    const item = items[currentIndex];
    const thumb = item.querySelector('img');
    const caption = item.querySelector('.image-caption');

    lightbox.img.alt = thumb.alt;

    // Show the small thumbnail instantly, then swap in the full-size photo once it has downloaded
    lightbox.img.src = thumb.currentSrc || thumb.src;
    const full = thumb.dataset.full;
    if (full && !(thumb.currentSrc || '').endsWith(full)) {
      const shownIndex = currentIndex;
      const bigPhoto = new Image();
      bigPhoto.onload = () => {
        // only swap if the viewer is still open and still on this photo
        if (lightbox && currentIndex === shownIndex) lightbox.img.src = full;
      };
      bigPhoto.src = full;
    }
    lightbox.caption.textContent = caption ? caption.textContent : '';

    // No arrows if there's only one photo to look at
    lightbox.prevBtn.hidden = items.length < 2;
    lightbox.nextBtn.hidden = items.length < 2;
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') showPhoto(currentIndex + 1);
    else if (e.key === 'ArrowLeft') showPhoto(currentIndex - 1);
  }

  function closeLightbox() {
    if (!lightbox) return;
    [lightbox.overlay, lightbox.container, lightbox.prevBtn, lightbox.nextBtn].forEach(el => el.remove());
    document.removeEventListener('keydown', onKeydown);
    document.body.style.overflow = '';
    lightbox = null;
    if (opener) opener.focus();
  }
}

/**
 * Gallery filter buttons (All / In flight / On the ground / Inside the plane).
 * Every photo in gallery.html has data-category="flight", "ground" or "inside".
 * Filtering just sets the photo's "hidden" attribute on or off.
 */
function initializeGalleryFilters(filterBar) {
  const items = document.querySelectorAll('.gallery-item');
  const buttons = filterBar.querySelectorAll('.filter-btn');
  const status = document.getElementById('filter-status');

  function applyFilter(filter) {
    let shown = 0;
    items.forEach(item => {
      const matches = filter === 'all' || item.dataset.category === filter;
      item.hidden = !matches;
      if (matches) shown++;
    });
    if (status) status.textContent = `Showing ${shown} of ${items.length} photos`;
  }

  filterBar.addEventListener('click', function(e) {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    buttons.forEach(b => {
      const isActive = (b === btn);
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', isActive);
    });
    applyFilter(btn.dataset.filter);
  });

  applyFilter('all'); // sets the "Showing 15 of 15 photos" text at the start
}

/**
 * Video Section Interactions
 */
function initializeVideoOverlay(videoElements) {
  const { featured, overlay, hero } = videoElements;
  
  // Event listener for featured video
  const videoEvents = ['play', 'pause', 'ended'];
  videoEvents.forEach(event => {
    featured.addEventListener(event, function() {
      const isPlaying = event === 'play';
      overlay.style.opacity = isPlaying ? '0' : '1';
    });
  });
  
  // Hero video autoplay: if the browser refuses (e.g. a phone in Low Power Mode),
  // show ONE play button instead.
  if (hero) {
    const attempt = hero.play();
    if (attempt !== undefined) {
      attempt.catch(() => {
        if (hero.parentNode.querySelector('.video-play-btn')) return; // already have one

        const playButton = document.createElement('button');
        playButton.type = 'button';
        playButton.className = 'video-play-btn';
        playButton.setAttribute('aria-label', 'Play background video');
        playButton.innerHTML = '<i class="fas fa-play"></i><span>Play video</span>';
        playButton.addEventListener('click', () => {
          hero.play();
          playButton.remove(); // job done, so the button goes away
        });
        hero.parentNode.appendChild(playButton);
      });
    }
  }
}

/**
 * Aircraft cards are built from the AIRCRAFT list in aircraft-data.js
 * (one entry per plane), so adding a plane never means copy-pasting HTML.
 */
function renderAircraftCards(grid) {
  if (typeof AIRCRAFT === 'undefined' || !AIRCRAFT.length) {
    grid.innerHTML = '<p>Sorry, the aircraft list could not be loaded.</p>';
    return;
  }
  // For each plane in the list: build a card, then put it in the grid
  AIRCRAFT.forEach(plane => grid.appendChild(createAircraftCard(plane)));
}

function createAircraftCard(plane) {
  // One .spec-item for every entry in plane.specs, so a new spec needs no code change
  const specsHTML = Object.entries(plane.specs).map(([label, value]) => `
        <div class="spec-item">
          <span class="spec-label">${label}</span>
          <span class="spec-value">${value}</span>
        </div>`).join('');

  const card = document.createElement('div');
  card.className = 'aircraft-card';

  // innerHTML is fine here because this text is ours (aircraft-data.js).
  // For text that visitors type in, use textContent instead.
  card.innerHTML = `
    <a href="${plane.link}" class="aircraft-link" target="_blank" rel="noopener noreferrer">
      <div class="card-image">
        <img src="${plane.image}" alt="${plane.alt}">
        <div class="card-overlay">
          <span class="info-btn" aria-hidden="true"><i class="fas fa-external-link-alt"></i></span>
        </div>
      </div>
      <div class="card-content">
        <h3>${plane.name}</h3>
        <div class="specs-grid">${specsHTML}
        </div>
        <span class="visually-hidden">(opens the manufacturer's page in a new tab)</span>
      </div>
    </a>
  `;

  // If the photo is missing, swap in the local placeholder.
  // { once: true } means this runs one time only, so it can never loop.
  const img = card.querySelector('img');
  img.addEventListener('error', () => { img.src = 'images/placeholder.svg'; }, { once: true });

  return card;
}

/**
 * Contact Form Handling with improved validation
 */
function initializeContactForm(form) {
  // Form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Stop here if any field is invalid
    if (!validateForm(this)) return;

    // Be honest: if the form isn't connected to Formspree yet, say so
    // instead of pretending the message was sent.
    if (this.action.includes('YOUR_FORM_ID')) {
      showMessage(this, 'error', "The contact form isn't connected yet.");
      return;
    }

    const errorText = 'Something went wrong. Please try again.';

    try {
      // Send the form fields to Formspree and wait for the answer
      const response = await fetch(this.action, {
        method: 'POST',
        body: new FormData(this),
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        showMessage(this, 'success', 'Message sent successfully!');
        this.reset();
      } else {
        showMessage(this, 'error', errorText);   // the server answered, but said no
      }
    } catch (err) {
      showMessage(this, 'error', errorText);     // no internet, or the request was blocked
    }
  });
  
  // Input animations with event delegation
  form.addEventListener('focus', function(e) {
    const input = e.target.closest('input, textarea');
    if (!input) return;
    
    const border = input.parentElement.querySelector('.focus-border');
    if (border) border.style.width = '100%';
  }, true);
  
  form.addEventListener('blur', function(e) {
    const input = e.target.closest('input, textarea');
    if (!input) return;
    
    const border = input.parentElement.querySelector('.focus-border');
    if (border) border.style.width = '0';
  }, true);
}

/**
 * Form Validation with optimized selectors
 */
function validateForm(form) {
  const inputs = {
    name: form.querySelector('input[name="name"]'),
    email: form.querySelector('input[name="email"]'),
    message: form.querySelector('textarea[name="message"]')
  };
  
  let isValid = true;
  
  // Reset previous validation styles
  Object.values(inputs).forEach(input => {
    if (input) input.style.borderColor = '';
  });
  
  // Validate name
  if (inputs.name && inputs.name.value.trim() === '') {
    markInvalid(inputs.name);
    isValid = false;
  } else if (inputs.name) {
    markValid(inputs.name);
  }
  
  // Validate email
  if (inputs.email) {
    if (inputs.email.value.trim() === '' || !isValidEmail(inputs.email.value)) {
      markInvalid(inputs.email);
      isValid = false;
    } else {
      markValid(inputs.email);
    }
  }
  
  // Validate message
  if (inputs.message && inputs.message.value.trim() === '') {
    markInvalid(inputs.message);
    isValid = false;
  } else if (inputs.message) {
    markValid(inputs.message);
  }
  
  return isValid;
}

/**
 * Mark form field as invalid
 */
function markInvalid(element) {
  element.style.borderColor = '#ff3860';
  const border = element.parentElement.querySelector('.focus-border');
  if (border) border.style.backgroundColor = '#ff3860';
}

/**
 * Mark form field as valid
 */
function markValid(element) {
  element.style.borderColor = '#00d1b2';
  const border = element.parentElement.querySelector('.focus-border');
  if (border) border.style.backgroundColor = '#00d1b2';
}

/**
 * Email validation using regex
 */
function isValidEmail(email) {
  // Simple check: something@something.something
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Show a message under the form.
 * type is 'success' or 'error' (each has its own colours in the CSS).
 */
function showMessage(form, type, text) {
  // Remove an old message first so they don't pile up
  const existingMsg = form.querySelector('.success-message, .error-message');
  if (existingMsg) existingMsg.remove();

  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  const msgDiv = document.createElement('div');
  msgDiv.className = type + '-message';
  msgDiv.innerHTML = `
    <i class="fas ${icon}"></i>
    <p>${text}</p>
  `;
  form.appendChild(msgDiv); // goes right under the Send button

  // The 'fadeout' animation now exists in the CSS file.
  // When it finishes, remove the message from the page.
  msgDiv.style.animation = 'fadeout 5s forwards';
  msgDiv.addEventListener('animationend', () => msgDiv.remove());
}

/**
 * Any <img data-fallback="path"> swaps to that picture if its own photo is missing.
 * Example: <img src="images/founder.jpg" data-fallback="images/placeholder.svg" alt="...">
 */
function initializeImageFallbacks() {
  document.querySelectorAll('img[data-fallback]').forEach(img => {
    const swap = () => {
      if (!img.dataset.usedFallback) {
        img.dataset.usedFallback = 'yes';   // only ever swap once, so it can never loop
        img.src = img.dataset.fallback;
      }
    };
    img.addEventListener('error', swap, { once: true });
    if (img.complete && img.naturalWidth === 0) swap(); // it had already failed before this code ran
  });
}

/**
 * About Page Initialization with Intersection Observer
 */
function initializeAboutPage(sectionTitle) {
  // Add fade-in class to title
  requestAnimationFrame(() => {
    sectionTitle.classList.add('fade-in');
  });
  
  // Animate content sections when they scroll into view
  const sections = document.querySelectorAll('.about-content, .stats-section, .testimonials, .join-community');
  
  if (sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px'
    });
    
    sections.forEach(section => observer.observe(section));
  } else {
    // Fallback for browsers without IntersectionObserver
    sections.forEach(section => section.classList.add('fade-in'));
  }
}

/**
 * Navigation enhancement
 */
function initializeNavigation(navLinks) {
  const currentPage = window.location.pathname.split('/').pop();
  
  // Icon mapping
  const iconMap = {
    'home': 'fas fa-home',
    'gallery': 'fas fa-images',
    'aircraft': 'fas fa-plane',
    'about': 'fas fa-info-circle',
    'contact': 'fas fa-envelope'
  };
  
  // Apply icons and active classes
  navLinks.forEach(link => {
    const linkText = link.textContent.trim().toLowerCase();
    const iconClass = iconMap[linkText] || 'fas fa-angle-right';
    
    // Create and prepend icon element
    const icon = document.createElement('i');
    icon.className = iconClass;
    link.innerHTML = '';
    link.appendChild(icon);
    link.appendChild(document.createTextNode(' ' + linkText.charAt(0).toUpperCase() + linkText.slice(1)));
    
    // Set active class
    const href = link.getAttribute('href');
    if ((href === 'index.html' && (currentPage === '' || currentPage === 'index.html')) ||
        (href !== 'index.html' && currentPage.includes(href))) {
      link.classList.add('active');
    }
  });
  
  // Use CSS transitions instead of JavaScript for hover effects
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    nav a:not(.active):hover {
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform: scale(1.05);
    }
    nav a {
      transition: all 0.3s ease;
    }
  `;
  document.head.appendChild(styleTag);
}
