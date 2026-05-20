'use strict';



/**
 * add event on element
 */

const addEventOnElem = function (elem, type, callback) {
  if (!elem) return;

  if (NodeList.prototype.isPrototypeOf(elem) || Array.isArray(elem)) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
    return;
  }

  elem.addEventListener(type, callback);
};



/**
 * navbar toggle
 */

const navToggler = document.querySelector("[data-nav-toggler]");
const navbar = document.querySelector("[data-navbar]");
const navbarLinks = document.querySelectorAll("[data-nav-link]");
const navbarDropdowns = document.querySelectorAll("[data-navbar-dropdown]");

const toggleNavbar = function () {
  if (!navbar || !navToggler) return;
  navbar.classList.toggle("active");
  navToggler.classList.toggle("active");
};

addEventOnElem(navToggler, "click", toggleNavbar);


const closeNavbarDropdowns = function () {
  navbarDropdowns.forEach((dropdown) => {
    dropdown.classList.remove("dropdown-open");
    const trigger = dropdown.querySelector(".navbar-dropdown-trigger");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  });
};

const closeNavbar = function () {
  if (!navbar || !navToggler) return;
  navbar.classList.remove("active");
  navToggler.classList.remove("active");
  closeNavbarDropdowns();
};

/**
 * categories dropdown (mobile toggle)
 */

navbarDropdowns.forEach((dropdown) => {
  const trigger = dropdown.querySelector(".navbar-dropdown-trigger");
  if (!trigger) return;

  trigger.addEventListener("click", function (e) {
    if (window.matchMedia("(min-width: 992px)").matches) return;

    e.preventDefault();
    e.stopPropagation();

    const isOpen = dropdown.classList.contains("dropdown-open");
    closeNavbarDropdowns();

    if (!isOpen) {
      dropdown.classList.add("dropdown-open");
      trigger.setAttribute("aria-expanded", "true");
    }
  });
});

document.addEventListener("click", function () {
  if (window.matchMedia("(min-width: 992px)").matches) return;
  closeNavbarDropdowns();
});

addEventOnElem(navbarLinks, "click", closeNavbar);



/**
 * active header when window scroll down to 100px
 */

const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

const activeElemOnScroll = function () {
  if (!header || !backTopBtn) return;

  if (document.body.classList.contains("checkout-body")) {
    header.classList.remove("active");
    backTopBtn.classList.toggle("active", window.scrollY > 100);
    return;
  }

  const shouldActivate = window.scrollY > 100;
  header.classList.toggle("active", shouldActivate);
  backTopBtn.classList.toggle("active", shouldActivate);
};

let ticking = false;
addEventOnElem(window, "scroll", function () {
  if (ticking) return;

  ticking = true;
  window.requestAnimationFrame(function () {
    activeElemOnScroll();
    ticking = false;
  });
});

activeElemOnScroll();



/**
 * Cats offers slider - left/right arrow buttons scroll the cards
 */

const catsSlider = document.querySelector("[data-cats-slider]");
const catsSliderPrev = document.querySelector("[data-cats-slider-prev]");
const catsSliderNext = document.querySelector("[data-cats-slider-next]");

if (catsSlider && catsSliderPrev) {
  catsSliderPrev.addEventListener("click", function () {
    catsSlider.scrollBy({ left: -catsSlider.clientWidth, behavior: "smooth" });
  });
}

if (catsSlider && catsSliderNext) {
  catsSliderNext.addEventListener("click", function () {
    catsSlider.scrollBy({ left: catsSlider.clientWidth, behavior: "smooth" });
  });
}


/**
 * Best seller slider - show 4 cards per view on desktop
 */

const bestSellerSlider = document.querySelector("[data-best-seller-slider]");
const bestSellerPrev = document.querySelector("[data-best-seller-slider-prev]");
const bestSellerNext = document.querySelector("[data-best-seller-slider-next]");

if (bestSellerSlider && bestSellerPrev) {
  bestSellerPrev.addEventListener("click", function () {
    bestSellerSlider.scrollBy({ left: -bestSellerSlider.clientWidth, behavior: "smooth" });
  });
}

if (bestSellerSlider && bestSellerNext) {
  bestSellerNext.addEventListener("click", function () {
    bestSellerSlider.scrollBy({ left: bestSellerSlider.clientWidth, behavior: "smooth" });
  });
}

/**
 * Smooth page-intro and scroll-reveal animations
 */

window.requestAnimationFrame(function () {
  document.body.classList.add("is-ready");
});

const revealGroups = document.querySelectorAll(
  ".category .scrollbar-item, .take-care .take-care-item, .product .best-seller-slide, .cats-offers .cats-slide, .service .grid-list > li, .brand .scrollbar-item, .footer-list li"
);

for (let i = 0; i < revealGroups.length; i++) {
  const revealTarget = revealGroups[i];
  revealTarget.setAttribute("data-reveal", "");
  revealTarget.style.setProperty("--reveal-delay", `${Math.min(i % 8, 7) * 70}ms`);
}

const directRevealTargets = document.querySelectorAll(
  ".hero .container, .section-title, .cta-content, .footer-brand, .shop-page-head, .shop-categories, .shop-products-bar, .shop-grid .product-card, .shop-filters .filter-card, .checkout-page"
);

for (let i = 0; i < directRevealTargets.length; i++) {
  directRevealTargets[i].setAttribute("data-reveal", "");
}

const allRevealTargets = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    function (entries, observer) {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        if (!entry.isIntersecting) continue;

        entry.target.classList.add("reveal-in");
        observer.unobserve(entry.target);
      }
    },
    {
      root: null,
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  for (let i = 0; i < allRevealTargets.length; i++) {
    revealObserver.observe(allRevealTargets[i]);
  }
} else {
  for (let i = 0; i < allRevealTargets.length; i++) {
    allRevealTargets[i].classList.add("reveal-in");
  }
}

/**
 * profile dropdown (login / wishlist)
 */
const profileTrigger = document.querySelector("[data-profile-trigger]");
const profileDropdown = document.querySelector("[data-profile-dropdown]");

const closeProfileDropdown = function () {
  if (!profileTrigger || !profileDropdown) return;

  const wrapper = profileTrigger.closest(".profile-dropdown-wrapper");
  if (!wrapper) return;

  wrapper.classList.remove("profile-dropdown-open");
  profileDropdown.setAttribute("aria-hidden", "true");
  profileTrigger.setAttribute("aria-expanded", "false");
};

const toggleProfileDropdown = function () {
  if (!profileTrigger || !profileDropdown) return;

  const wrapper = profileTrigger.closest(".profile-dropdown-wrapper");
  if (!wrapper) return;

  const isOpen = wrapper.classList.contains("profile-dropdown-open");
  if (isOpen) {
    closeProfileDropdown();
    return;
  }

  wrapper.classList.add("profile-dropdown-open");
  profileDropdown.setAttribute("aria-hidden", "false");
  profileTrigger.setAttribute("aria-expanded", "true");
};

if (profileTrigger && profileDropdown) {
  addEventOnElem(profileTrigger, "click", function (e) {
    e.stopPropagation();
    toggleProfileDropdown();
  });

  document.addEventListener("click", function (e) {
    const wrapper = profileTrigger.closest(".profile-dropdown-wrapper");
    if (!wrapper) return;
    if (!wrapper.contains(e.target)) closeProfileDropdown();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeProfileDropdown();
  });

  // Close the dropdown when selecting an item.
  addEventOnElem(profileDropdown.querySelectorAll("[data-profile-link]"), "click", closeProfileDropdown);
}