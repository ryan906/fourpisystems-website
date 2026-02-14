/* ==========================================================================
   FOUR PI SYSTEMS — Interactivity
   ========================================================================== */

/* --- Cursor Glow --- */
const glow = document.getElementById('cursorGlow');
let glowX = 0, glowY = 0, mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
(function moveGlow() {
    glowX += (mouseX - glowX) * 0.15;
    glowY += (mouseY - glowY) * 0.15;
    if (glow) glow.style.transform = `translate(${glowX - 200}px, ${glowY - 200}px)`;
    requestAnimationFrame(moveGlow);
})();

/* --- Nav Scroll --- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('nav-scrolled', window.scrollY > 80);
}, { passive: true });

/* --- Mobile Menu --- */
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
        const active = mobileMenu.classList.toggle('active');
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = active ? 'rotate(45deg) translate(3px, 3px)' : '';
        spans[1].style.transform = active ? 'rotate(-45deg) translate(3px, -3px)' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            const spans = navToggle.querySelectorAll('span');
            spans[0].style.transform = '';
            spans[1].style.transform = '';
        });
    });
}

/* --- Scroll Reveal --- */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));

/* --- Page Load --- */
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    startTerminalTyping();
});

/* --- Terminal Typing Effect --- */
function startTerminalTyping() {
    const el = document.querySelector('.terminal-text');
    if (!el) return;
    const text = el.dataset.text;
    el.textContent = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            el.textContent += text[i];
            i++;
            setTimeout(type, 50 + Math.random() * 80);
        }
    }
    setTimeout(type, 600);
}

/* --- Smooth Anchor Scroll --- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (target) {
            e.preventDefault();
            const top = target.getBoundingClientRect().top + window.scrollY - 84;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

/* --- Hero Orb Parallax --- */
const heroEl = document.querySelector('.hero');
const orbs = document.querySelectorAll('.orb');
if (heroEl && orbs.length) {
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY < heroEl.offsetHeight) {
            orbs.forEach((orb, i) => {
                orb.style.transform = `translateY(${scrollY * (i + 1) * 0.12}px)`;
            });
        }
    }, { passive: true });
}