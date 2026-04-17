// --- SHARED COMPONENTS LOADER ---
async function loadComponents() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // 1. Load Navbar
    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (navPlaceholder) {
        try {
            const response = await fetch('components/navbar.html');
            const html = await response.text();
            navPlaceholder.innerHTML = html;
            await updateNavbar(currentPage);
        } catch (err) {
            console.error("Failed to load navbar:", err);
        }
    }

    // 2. Load Chatbot
    const chatPlaceholder = document.getElementById('chatbot-placeholder');
    if (chatPlaceholder) {
        try {
            const response = await fetch('components/chatbot.html');
            const html = await response.text();
            chatPlaceholder.innerHTML = html;
            
            // Trigger chatbot logic if the global init function exists
            if (typeof window.initChatbot === "function") {
                window.initChatbot();
            }
        } catch (err) {
            console.error("Failed to load chatbot:", err);
        }
    }

    // 3. Load Footer
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        try {
            const response = await fetch('components/footer.html');
            const html = await response.text();
            footerPlaceholder.innerHTML = html;
            
            // Update year
            const yr = document.getElementById('footer-year');
            if (yr) yr.textContent = new Date().getFullYear();
        } catch (err) {
            console.error("Failed to load footer:", err);
        }
    }
}

// --- DYNAMIC NAVBAR LOGIC ---
async function updateNavbar(currentPage) {
    const authLinksArea = document.getElementById('auth-links');
    const navLinks = document.getElementById('nav-links');
    if (!authLinksArea || !navLinks) return;

    // Set active class on links
    navLinks.querySelectorAll('a[data-nav]').forEach(link => {
        const navType = link.getAttribute('data-nav');
        // Simple mapping
        const pageToNav = {
            'index.html': 'home',
            'blog.html': 'blog',
            'blog_detail.html': 'blog',
            'events.html': 'events',
            'event_detail.html': 'events',
            'team.html': 'team'
        };
        if (pageToNav[currentPage] === navType) {
            link.classList.add('active');
        }
    });

    const user = await window.api.getUser();
    const isAuthenticated = window.api.isAuthenticated();

    if (isAuthenticated && user) {
        let linksHtml = '';
        if (user.role === 'head' || user.role === 'mod') {
            linksHtml += `<a href="admin.html" class="nav-admin-link ${currentPage === 'admin.html' ? 'active' : ''}"><i class="fas fa-shield-halved"></i> Admin</a>`;
        }
        linksHtml += `<a href="profile.html" class="nav-profile-link ${currentPage === 'profile.html' ? 'active' : ''}"><i class="fas fa-user-circle"></i> Profil</a>`;
        linksHtml += `<a href="#" id="logout-btn" class="nav-logout-btn"><i class="fas fa-sign-out-alt"></i> Quitter</a>`;
        authLinksArea.innerHTML = linksHtml;

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.api.logout();
            });
        }
    } else {
        authLinksArea.innerHTML = `
            <a href="login.html" class="btn btn-outline" id="login-link">Connexion</a>
        `;
    }

    // Initialize Mobile Menu (Hamburger)
    const hamburger = document.getElementById('hamburger');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('open');
            hamburger.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && e.target !== hamburger) {
                navLinks.classList.remove('open');
                hamburger.textContent = '☰';
            }
        });
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', loadComponents);

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbarElement = document.querySelector('.navbar');
    if (navbarElement) {
        if (window.scrollY > 50) {
            navbarElement.style.background = 'rgba(3, 3, 5, 0.9)';
            navbarElement.style.borderBottomColor = 'rgba(99, 102, 241, 0.2)';
            navbarElement.style.height = '64px';
        } else {
            navbarElement.style.background = 'rgba(3, 3, 5, 0.75)';
            navbarElement.style.borderBottomColor = 'rgba(255, 255, 255, 0.08)';
            navbarElement.style.height = 'var(--nav-h)';
        }
    }
});

// Footer year auto-update
const yr = document.getElementById('footer-year');
if (yr) yr.textContent = new Date().getFullYear();
