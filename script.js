// ========================================
// 个人主页交互脚本
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initSmoothScroll();
    initScrollSpy();
    initRevealAnimations();
    initProjectCard3DTilt();
    initNavbarShadow();
});

// ========================================
// 1. 移动端汉堡菜单
// ========================================
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (!hamburger || !navMenu) return;

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        }
    });

    // 点击菜单链接关闭菜单
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const icon = hamburger.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        });
    });

    // 点击页面其他区域关闭菜单
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            const icon = hamburger.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        }
    });
}

// ========================================
// 2. 平滑滚动（带导航栏偏移补偿）
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = document.querySelector('.navbar')?.offsetHeight || 60;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========================================
// 3. 滚动监听 - 导航高亮
// ========================================
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observerOptions = {
        root: null,
        rootMargin: '-30% 0px -70% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}

// ========================================
// 4. 滚动渐显动画
// ========================================
function initRevealAnimations() {
    const revealTargets = document.querySelectorAll(
        '.skill-card, .about-content, .contact-item, .container1'
    );

    revealTargets.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    });

    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });
}

// ========================================
// 5. 项目卡片 3D 倾斜效果（替代 25 条 CSS 规则）
// ========================================
function initProjectCard3DTilt() {
    const cards = document.querySelectorAll('.container1');

    cards.forEach(card => {
        const cardElement = card.querySelector('.card');
        if (!cardElement) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateY = ((x - centerX) / centerX) * 15;
            const rotateX = -((y - centerY) / centerY) * 15;

            cardElement.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            cardElement.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
    });
}

// ========================================
// 6. 导航栏阴影（滚动时加深阴影）
// ========================================
function initNavbarShadow() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                navbar.style.boxShadow = scrollY > 10
                    ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                    : '0 2px 10px rgba(0, 0, 0, 0.1)';
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// ========================================
// 动态注入导航 active 样式
// ========================================
const navStyle = document.createElement('style');
navStyle.textContent = `
    .nav-menu a.active {
        color: var(--primary, #3498db) !important;
    }
    .nav-menu a.active::after {
        width: 100%;
    }
`;
document.head.appendChild(navStyle);

