/**
 * Portfolio Website JavaScript
 * Features: Mobile Menu, Dark Mode, Smooth Scroll, Form Validation, Scroll Animations
 */

// Configuration
const CONFIG = {
    storageKeys: {
        theme: 'portfolio-theme',
        scrollY: 'portfolio-scroll'
    },
    classes: {
        visible: 'visible',
        active: 'active',
        error: 'error',
        show: 'show',
        dark: 'dark'
    },
    selectors: {
        nav: '#navbar',
        mobileToggle: '#mobile-menu-toggle',
        navLinks: '#nav-links',
        themeToggle: '#theme-toggle',
        themeIcon: '#theme-icon',
        sections: '.section-fade',
        form: '#contact-form',
        toast: '#toast',
        toastMessage: '#toast-message'
    }
};

// Utility Functions
const utils = {
    /**
     * Debounce function to limit execution frequency
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function for scroll events
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Safe localStorage wrapper
     */
    storage: {
        get: (key) => {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn('localStorage not available');
                return null;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.warn('localStorage not available');
                return false;
            }
        }
    }
};

// Mobile Menu Module
const mobileMenu = {
    toggle: null,
    navLinks: null,
    isOpen: false,

    init() {
        this.toggle = document.querySelector(CONFIG.selectors.mobileToggle);
        this.navLinks = document.querySelector(CONFIG.selectors.navLinks);
        
        if (!this.toggle || !this.navLinks) return;
        
        this.toggle.addEventListener('click', () => this.handleToggle());
        
        // Close menu when clicking on links
        this.navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => this.close());
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.toggle.contains(e.target) && !this.navLinks.contains(e.target)) {
                this.close();
            }
        });
    },

    handleToggle() {
        this.isOpen ? this.close() : this.open();
    },

    open() {
        this.isOpen = true;
        this.toggle.setAttribute('aria-expanded', 'true');
        this.navLinks.classList.add(CONFIG.classes.active);
        this.toggle.classList.add(CONFIG.classes.active);
        document.body.style.overflow = 'hidden';
    },

    close() {
        this.isOpen = false;
        this.toggle.setAttribute('aria-expanded', 'false');
        this.navLinks.classList.remove(CONFIG.classes.active);
        this.toggle.classList.remove(CONFIG.classes.active);
        document.body.style.overflow = '';
    }
};

// Theme Module
const themeManager = {
    toggle: null,
    icon: null,
    currentTheme: 'dark',

    init() {
        this.toggle = document.querySelector(CONFIG.selectors.themeToggle);
        this.icon = document.querySelector(CONFIG.selectors.themeIcon);
        
        if (!this.toggle) return;

        // Load saved preference or default to dark
        const savedTheme = utils.storage.get(CONFIG.storageKeys.theme) || 'dark';
        this.setTheme(savedTheme, false);

        this.toggle.addEventListener('click', () => this.toggleTheme());
    },

    setTheme(theme, save = true) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update icon
        if (this.icon) {
            this.icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // Update aria-pressed
        if (this.toggle) {
            this.toggle.setAttribute('aria-pressed', theme === 'dark');
        }

        if (save) {
            utils.storage.set(CONFIG.storageKeys.theme, theme);
        }
    },

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        showToast(`Switched to ${newTheme} mode`);
    }
};

// Smooth Scroll Module
const smoothScroll = {
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleClick(e));
        });
    },

    handleClick(e) {
        const href = e.currentTarget.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        
        const navHeight = document.querySelector(CONFIG.selectors.nav)?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        // Update URL without jumping
        history.pushState(null, '', href);
        
        // Set focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
    }
};

// Scroll Animation Module
const scrollAnimation = {
    observer: null,

    init() {
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelectorAll(CONFIG.selectors.sections).forEach(el => {
                el.classList.add(CONFIG.classes.visible);
            });
            return;
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(CONFIG.classes.visible);
                    // Optionally unobserve after animation
                    // this.observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll(CONFIG.selectors.sections).forEach(el => {
            this.observer.observe(el);
        });
    }
};

// Form Validation Module
const formHandler = {
    form: null,

    init() {
        this.form = document.querySelector(CONFIG.selectors.form);
        if (!this.form) return;

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        this.form.querySelectorAll('input, textarea').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearError(field));
        });
    },

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        // Clear previous error
        this.clearError(field);

        // Required check
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            message = 'This field is required';
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }
        }

        // Min length for message
        if (field.tagName === 'TEXTAREA' && value.length < 10) {
            isValid = false;
            message = 'Message must be at least 10 characters';
        }

        if (!isValid) {
            this.showError(field, message);
        }

        return isValid;
    },

    showError(field, message) {
        field.classList.add(CONFIG.classes.error);
        const errorId = field.getAttribute('aria-describedby');
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
        }
        field.setAttribute('aria-invalid', 'true');
    },

    clearError(field) {
        field.classList.remove(CONFIG.classes.error);
        const errorId = field.getAttribute('aria-describedby');
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = '';
        }
        field.setAttribute('aria-invalid', 'false');
    },

    handleSubmit(e) {
        e.preventDefault();
        
        const fields = this.form.querySelectorAll('input, textarea');
        let isFormValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        if (isFormValid) {
            // Simulate form submission
            const submitBtn = this.form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            setTimeout(() => {
                showToast('Thanks for reaching out! I\'ll get back to you soon.');
                this.form.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 1500);
        } else {
            showToast('Please fix the errors in the form', 'error');
            // Focus first error
            const firstError = this.form.querySelector('.error');
            if (firstError) firstError.focus();
        }
    }
};

// Toast Notification System
function showToast(message, type = 'info') {
    const toast = document.querySelector(CONFIG.selectors.toast);
    const toastMessage = document.querySelector(CONFIG.selectors.toastMessage);
    
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    
    // Update icon based on type
    const icon = toast.querySelector('i');
    if (icon) {
        icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle';
    }

    toast.classList.add(CONFIG.classes.show);

    // Auto-hide
    setTimeout(() => {
        toast.classList.remove(CONFIG.classes.show);
    }, 3000);
}

// Navbar Scroll Effect
const navbarEffect = {
    init() {
        const nav = document.querySelector(CONFIG.selectors.nav);
        if (!nav) return;

        const handleScroll = utils.throttle(() => {
            if (window.scrollY > 100) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        }, 100);

        window.addEventListener('scroll', handleScroll);
    }
};

// Project Cards Interaction
const projectCards = {
    init() {
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                const project = card.getAttribute('data-project');
                const messages = {
                    'data-analysis': 'Data Analysis project coming soon!',
                    'ml-model': 'ML Prediction Model coming soon!',
                    'data-viz': 'Data Visualization project coming soon!'
                };
                showToast(messages[project] || 'Project details coming soon!');
            });

            // Keyboard accessibility
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    }
};

// Resume Button
const resumeButton = {
    init() {
        const btn = document.getElementById('resume-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                showToast('Resume download coming soon!');
            });
        }
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    mobileMenu.init();
    themeManager.init();
    smoothScroll.init();
    scrollAnimation.init();
    formHandler.init();
    navbarEffect.init();
    projectCards.init();
    resumeButton.init();

    console.log('Portfolio initialized successfully');
});

// Handle visibility change (save scroll position)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        utils.storage.set(CONFIG.storageKeys.scrollY, window.scrollY);
    }
});