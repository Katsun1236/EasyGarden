document.addEventListener('DOMContentLoaded', () => {

    const navbar = document.getElementById('navbar');
    const navBtn = document.getElementById('nav-btn');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('nav-scrolled', 'text-stone-900');
                navbar.classList.remove('text-white');
                if(navBtn) {
                    navBtn.classList.remove('bg-white', 'text-stone-900');
                    navBtn.classList.add('bg-botanic-dark', 'text-white');
                }
            } else {
                navbar.classList.remove('nav-scrolled', 'text-stone-900');
                navbar.classList.add('text-white');
                if(navBtn) {
                    navBtn.classList.add('bg-white', 'text-stone-900');
                    navBtn.classList.remove('bg-botanic-dark', 'text-white');
                }
            }
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

    // --- MODULE AVANT / APRÈS (IMAGE COMPARISON SLIDER) ---
    function initBeforeAfterSliders() {
        document.querySelectorAll('.before-after-slider').forEach(slider => {
            const range = slider.querySelector('.slider-range');
            const beforeLayer = slider.querySelector('.before-layer');
            const handle = slider.querySelector('.slider-handle');
            const beforeImg = beforeLayer ? beforeLayer.querySelector('img') : null;

            if (!range || !beforeLayer || !handle || !beforeImg) return;

            function updateSlider(val) {
                beforeLayer.style.width = val + '%';
                handle.style.left = val + '%';
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

            if (stepLine) {
                stepLine.style.width = stepNum === 1 ? '0%' : stepNum === 2 ? '50%' : '100%';
            }

            badges.forEach((b, idx) => {
                const circle = b.querySelector('span:first-child');
                if (idx + 1 <= stepNum) {
                    circle.classList.add('bg-botanic', 'text-white');
                    circle.classList.remove('bg-stone-200', 'text-stone-600');
                } else {
                    circle.classList.remove('bg-botanic', 'text-white');
                    circle.classList.add('bg-stone-200', 'text-stone-600');
                }
            });
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