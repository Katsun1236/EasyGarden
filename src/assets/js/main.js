document.addEventListener('DOMContentLoaded', () => {

    // --- LENIS SMOOTH SCROLL (INERTIE FLUIDE LUXE) ---
    let lenis = null;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            smoothWheel: true,
            touchMultiplier: 1.5,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    const navbar = document.getElementById('navbar');
    const navBtn = document.getElementById('nav-btn');
    if (navbar) {
        const gradientClasses = ['bg-gradient-to-b', 'from-stone-950/85', 'via-stone-950/40', 'to-transparent'];
        const updateNav = () => {
            if (window.scrollY > 50) {
                navbar.classList.add('nav-scrolled', 'text-stone-900');
                navbar.classList.remove('text-white', ...gradientClasses);
                if(navBtn) {
                    navBtn.classList.remove('bg-white', 'text-stone-900');
                    navBtn.classList.add('bg-botanic-dark', 'text-white');
                }
            } else {
                navbar.classList.remove('nav-scrolled', 'text-stone-900');
                navbar.classList.add('text-white', ...gradientClasses);
                if(navBtn) {
                    navBtn.classList.add('bg-white', 'text-stone-900');
                    navBtn.classList.remove('bg-botanic-dark', 'text-white');
                }
            }
        };
        window.addEventListener('scroll', updateNav, { passive: true });
        if (lenis) lenis.on('scroll', updateNav);
    }

    const btnOpen = document.getElementById('mobile-menu-btn');
    const btnClose = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function openMenu() {
        mobileMenu.classList.remove('translate-x-full');
        mobileMenu.classList.add('translate-x-0');
        document.body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
        btnOpen.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
        mobileMenu.classList.add('translate-x-full');
        mobileMenu.classList.remove('translate-x-0');
        document.body.style.overflow = '';
        if (lenis) lenis.start();
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
                const el = entry.target;
                let delay = 0;
                if (el.classList.contains('reveal-delay-1')) delay = 150;
                else if (el.classList.contains('reveal-delay-2')) delay = 300;
                setTimeout(() => {
                    el.classList.add('active');
                }, delay);
                obs.unobserve(el);
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

    // --- MOTEUR DE PARALLAXE GÉANT (GPU-ACCÉLÉRÉ & 60FPS) ---
    function initParallaxEngine() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const parallaxBgs = Array.from(document.querySelectorAll('[data-parallax]'));
        const parallaxFloats = Array.from(document.querySelectorAll('[data-parallax-float]'));

        if (parallaxBgs.length === 0 && parallaxFloats.length === 0) return;

        // Suivre uniquement les éléments visibles pour des performances optimales (0 lag)
        const visibleElements = new Set();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    visibleElements.add(entry.target);
                } else {
                    visibleElements.delete(entry.target);
                }
            });
        }, { rootMargin: '100px 0px 100px 0px' });

        parallaxBgs.forEach(el => observer.observe(el));
        parallaxFloats.forEach(el => observer.observe(el));

        let ticking = false;

        function updateParallax() {
            const vh = window.innerHeight;
            const vhCenter = vh / 2;

            visibleElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const centerDelta = (rect.top + rect.height / 2) - vhCenter;

                if (el.hasAttribute('data-parallax')) {
                    const speed = parseFloat(el.getAttribute('data-parallax')) || 0.25;
                    const y = (centerDelta * speed).toFixed(1);
                    el.style.transform = `translate3d(0, ${y}px, 0) scale(1.15)`;
                } else if (el.hasAttribute('data-parallax-float')) {
                    const speed = parseFloat(el.getAttribute('data-parallax-float')) || -0.15;
                    const y = (centerDelta * speed).toFixed(1);
                    el.style.transform = `translate3d(0, ${y}px, 0)`;
                }
            });

            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });

        if (lenis) {
            lenis.on('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateParallax);
                    ticking = true;
                }
            });
        }

        window.addEventListener('resize', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });

        // Calcul initial
        requestAnimationFrame(updateParallax);
    }
    initParallaxEngine();

    // --- MODULE AVANT / APRÈS (IMAGE COMPARISON SLIDER) ---
    function initBeforeAfterSliders() {
        document.querySelectorAll('.before-after-slider').forEach(slider => {
            const range = slider.querySelector('.slider-range');
            const beforeLayer = slider.querySelector('.before-layer');
            const handle = slider.querySelector('.slider-handle');
            const beforeImg = beforeLayer ? beforeLayer.querySelector('img') : null;

            if (!range || !beforeLayer || !handle || !beforeImg) return;

            function updateSlider(val) {
                const clamped = Math.max(0, Math.min(100, val));
                beforeLayer.style.width = clamped + '%';
                handle.style.left = clamped + '%';
            }

            function updateImgWidth() {
                beforeImg.style.width = slider.offsetWidth + 'px';
            }

            range.addEventListener('input', (e) => updateSlider(e.target.value));
            window.addEventListener('resize', updateImgWidth);
            updateImgWidth();
            updateSlider(50);
        });
    }
    initBeforeAfterSliders();

    // --- TUNNEL DE DEVIS EXPRESS (WIZARD 3 ÉTAPES) ---
    const wizard = document.getElementById('devis-wizard');
    if (wizard) {
        let currentStep = 1;
        const stepLine = document.getElementById('step-line');
        const badges = wizard.querySelectorAll('.step-badge');
        const steps = wizard.querySelectorAll('.wizard-step');

        window.goToStep = function(stepNum) {
            currentStep = stepNum;
            steps.forEach(s => s.classList.add('hidden'));
            const targetStep = document.getElementById(`wizard-step-${stepNum}`);
            if (targetStep) targetStep.classList.remove('hidden');

            for (let i = 1; i <= 3; i++) {
                const node = document.getElementById(`step-node-${i}`);
                if (node) {
                    if (i <= stepNum) {
                        node.classList.add('step-primary', 'text-stone-900');
                        node.classList.remove('text-stone-400');
                    } else {
                        node.classList.remove('step-primary', 'text-stone-900');
                        node.classList.add('text-stone-400');
                    }
                }
            }
        };

        // Option cards selection styling
        wizard.querySelectorAll('.wizard-option').forEach(opt => {
            opt.addEventListener('click', () => {
                wizard.querySelectorAll('.wizard-option').forEach(o => {
                    o.classList.remove('border-botanic', 'bg-botanic/5');
                    o.classList.add('border-stone-200');
                });
                opt.classList.add('border-botanic', 'bg-botanic/5');
                opt.classList.remove('border-stone-200');
                const radio = opt.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            });
        });

        // Surface buttons selection
        wizard.querySelectorAll('.surface-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                wizard.querySelectorAll('.surface-btn').forEach(b => {
                    b.classList.remove('border-botanic', 'bg-botanic/5', 'text-botanic');
                    b.classList.add('border-stone-200', 'text-stone-700');
                });
                btn.classList.add('border-botanic', 'bg-botanic/5', 'text-botanic');
                btn.classList.remove('border-stone-200', 'text-stone-700');
            });
        });

        // Form submission
        const form = document.getElementById('wizard-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                form.classList.add('hidden');
                const successDiv = document.getElementById('wizard-success');
                if (successDiv) successDiv.classList.remove('hidden');
            });
        }
    }
});