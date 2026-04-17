/**
 * InfoClub Authentication Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // --- LOGIN ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('login-error');
            const btn = document.getElementById('login-btn');

            errorDiv.style.display = 'none';
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';

            try {
                await window.api.login(email, password);
                window.location.href = 'index.html';
            } catch (err) {
                console.error(err);
                errorDiv.textContent = err.message;
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = 'Se connecter <i class="fas fa-arrow-right"></i>';
            }
        });
    }

    // --- REGISTER ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('register-btn');
            const errorDiv = document.getElementById('register-error');

            const userData = {
                full_name: document.getElementById('full_name').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };

            errorDiv.style.display = 'none';
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';

            try {
                await window.api.register(userData);
                // After registration, show success and redirect
                btn.innerHTML = '<i class="fas fa-check"></i> Succès !';
                btn.style.background = '#10b981';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } catch (err) {
                console.error(err);
                errorDiv.textContent = err.message;
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = 'Créer mon compte <i class="fas fa-user-plus"></i>';
            }
        });
    }
});
