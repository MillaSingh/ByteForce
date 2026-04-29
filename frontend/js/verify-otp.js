import { signUp } from './auth.js'; 
        
        // Check for pending user data
        const pendingUserStr = sessionStorage.getItem('pendingUser');
        const currentOTP = sessionStorage.getItem('currentOTP');
        if (!pendingUserStr || !currentOTP) {
            alert('No verification session found. Please register again.');
            window.location.href = '/html/register.html';
        }

        const pendingUser = JSON.parse(pendingUserStr);
        document.getElementById('emailDisplay').textContent = `We've sent a code to: ${pendingUser.email}`;

        // 30-minute expiry countdown
        const expiryTime = Date.now() + 30 * 60 * 1000;
        function updateCountdown() {
            const timeLeft = expiryTime - Date.now();
            if (timeLeft <= 0) {
                document.getElementById('countdown').innerHTML = '<strong>Session expired. Please register again.</strong>';
                document.getElementById('verifyForm').style.display = 'none';
                return;
            }
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            document.getElementById('countdown').textContent = `Time remaining: ${minutes}m ${seconds}s`;
            setTimeout(updateCountdown, 1000);
        }
        updateCountdown();
        document.getElementById('countdown').style.display = 'block';

        
//////////// OTP input handling
        const otpInputs = document.querySelectorAll('.otp-input');
        otpInputs[0].focus();

        function clearErrorStyles() {
            otpInputs.forEach(input => input.classList.remove('error'));
        }

        otpInputs.forEach((input, index) => {

            input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });


    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });

    input.addEventListener('paste', (e) => {
        const data = e.clipboardData.getData('text').split('');
        if (data.length === otpInputs.length) {
            otpInputs.forEach((input, i) => input.value = data[i]);
            otpInputs[otpInputs.length - 1].focus();
        }
    });

            input.addEventListener('input', function() {
                let val = this.value.replace(/[^0-9]/g, '');
                if (val.length > 1) val = val.slice(0,1);
                this.value = val;

                if (this.value && index < 5) {
                    otpInputs[index + 1].focus();
                }
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !this.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0,6);
                Array.from(pasted).forEach((digit, i) => {
                    if (otpInputs[i]) otpInputs[i].value = digit;
                });
                if (pasted.length) otpInputs[Math.min(pasted.length, 6)-1].focus();
            });
        });

/////////// Form submission and OTP verification

        document.getElementById('verifyForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            clearErrorStyles();

            const enteredOtp = Array.from(otpInputs).map(i => i.value).join('');
            const errorMsg = document.getElementById('errorMsg');
            const successMsg = document.getElementById('successMsg');

            if (!/^\d{6}$/.test(enteredOtp)) {
                errorMsg.textContent = 'Please enter valid 6-digit OTP';
                errorMsg.style.display = 'block';
                otpInputs.forEach(i => i.classList.add('error'));
                otpInputs[0].focus();
                return;
            }

            if (enteredOtp !== currentOTP) {
                errorMsg.textContent = 'Invalid OTP code!';
                errorMsg.style.display = 'block';
                otpInputs.forEach(i => i.classList.add('error'));
                otpInputs[0].focus();
                return;
            }

            // OTP verified! Complete Firebase registration
            try {
                await signUp(pendingUser.fullName, pendingUser.email, pendingUser.password, {
                    idNumber: pendingUser.idNumber,
                    role: pendingUser.role
                });

                // Success cleanup
                sessionStorage.clear();
                successMsg.textContent = 'Email verified! Registration complete. Redirecting...';
                successMsg.style.display = 'block';
                errorMsg.style.display = 'none';

                setTimeout(() => {
                    window.location.href = '/html/Login.html';
                }, 1500);
            } catch (error) {
                errorMsg.textContent = 'Firebase registration failed: ' + error.message;
                errorMsg.style.display = 'block';
            }
        });