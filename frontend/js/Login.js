import { signIn, googleSignIn, authStateListener } from '../js/auth.js';

        const emailLoginForm = document.getElementById('emailLoginForm');
        const googleSignInBtn = document.getElementById('googleSignInBtn');
        const errorMsg = document.getElementById('errorMsg');
        const authStatus = document.getElementById('authStatus');

        function showError(msg) {
            errorMsg.textContent = msg;
            errorMsg.style.display = 'block';
        }

        function clearError() {
            errorMsg.style.display = 'none';
        }

        let justLoggedIn = false;

        emailLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                justLoggedIn = true;
                await signIn(email, password);
            } catch (error) {
                justLoggedIn = false;
                showError(error.message);
            }
        });

        googleSignInBtn.addEventListener('click', async () => {
            clearError();
            try {
                justLoggedIn = true;
                await googleSignIn();
            } catch (error) {
                justLoggedIn = false;
                showError(error.message);
            }
        });

        authStateListener((user) => {
            if (user && justLoggedIn) {
                authStatus.textContent = `Logged in as: ${user.email || user.displayName}`;
                setTimeout(() => {
                    window.location.href = '/html/home.html';
                }, 1000);
            }
        });