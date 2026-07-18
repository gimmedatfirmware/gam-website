// Glad Animal Movements — site interactions

// Mobile nav toggle
const toggle = document.querySelector(".nav__toggle");
const menu = document.querySelector(".nav__menu");

toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(open));
});

// Close the mobile menu after choosing a link
menu.addEventListener("click", (e) => {
  if (e.target.matches("a")) {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

// Scroll-reveal animations (skipped if reduced motion is preferred)
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Hero background video: hold on the poster frame for reduced-motion users
const heroVideo = document.querySelector(".hero__video");
if (heroVideo && prefersReducedMotion) {
  heroVideo.removeAttribute("autoplay");
  heroVideo.pause();
}
const revealEls = document.querySelectorAll(".reveal");

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealEls.forEach((el) => el.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => observer.observe(el));
}

// Keep the footer year current
document.getElementById("year").textContent = new Date().getFullYear();
