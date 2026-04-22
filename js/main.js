document.addEventListener('DOMContentLoaded', () => {

    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('nav-scrolled', window.scrollY > 50);
        });
    }

    const btnOpen = document.getElementById('mobile-menu-btn');
    const btnClose = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function openMenu() {
        mobileMenu.classList.remove('translate-x-full');
        mobileMenu.classList.add('translate-x-0');
        document.body.style.overflow = 'hidden';
        btnOpen.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
        mobileMenu.classList.add('translate-x-full');
        mobileMenu.classList.remove('translate-x-0');
        document.body.style.overflow = '';
        btnOpen.setAttribute('aria-expanded', 'false');
    }

    if (btnOpen) {
        btnOpen.setAttribute('aria-expanded', 'false');
        btnOpen.addEventListener('click', openMenu);
    }
    if (btnClose) btnClose.addEventListener('click', closeMenu);
    mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    document.querySelectorAll('.faq-question').forEach((btn, index) => {
        const answerId = `faq-answer-${index}`;
        const answer = btn.nextElementSibling;
        if (answer) answer.id = answerId;
        
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', answerId);
        
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('active');
            
            document.querySelectorAll('.faq-item.active').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
            });
            
            if (!isOpen) {
                item.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && (currentPath.endsWith(href) || currentPath === href || (href !== '/' && currentPath.includes(href.replace('.html', ''))))) {
            link.classList.add('page-active');
        }
    });
});