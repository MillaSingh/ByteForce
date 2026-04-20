const idInput = document.getElementById('idNumber');
const dobField = document.getElementById('dobField');
const registerForm = document.getElementById('registerForm');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

// Initialize EmailJS
emailjs.init('vi1AV9hQmg6Ud4qWs');

idInput.addEventListener('input', function () {
    const idNumber = this.value.replace(/\D/g, '').slice(0, 13);
    this.value = idNumber;
    if (idNumber.length === 13) {
        const yy = parseInt(idNumber.slice(0, 2));
        const mm = idNumber.slice(2, 4);
        const dd = idNumber.slice(4, 6);
        let fullYear;
        if (yy >= 0 && yy <= 21) {
            fullYear = 2000 + yy;
        } else {
            fullYear = 1900 + yy;
        }
        dobField.value = `${fullYear}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    } else {
        dobField.value = '';
    }
});

registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const surname = document.getElementById('surname').value.trim();
    const email = document.getElementById('email').value.trim();
    const idNumber = idInput.value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const detailsConfirmed = document.getElementById('detailsConfirmation').checked;

    clearMessages();

    // Validation
    if (!firstName || !surname || !email || !idNumber || !password || !detailsConfirmed) {
        showError('Please fill all fields and confirm details.');
        return;
    }

    if (!/^\d{13}$/.test(idNumber)) {
        showError('ID must be exactly 13 digits.');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Please enter a valid email address.');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
    }

    // Generate OTP and stage user data
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const userData = {
        fullName: `${firstName} ${surname}`,
        email,
        password,
        idNumber,
        role: 'patient'
    };

    // Save to sessionStorage (staging)
    sessionStorage.setItem('pendingUser', JSON.stringify(userData));
    sessionStorage.setItem('currentOTP', otp);

    // Send OTP via EmailJS
    try {
        const templateParams = {
            email: email,             // This tells EmailJS WHO to send it to
            firstName: firstName,     // You can use {{firstName}} in your template later if you want
            passcode: otp,           // Matches {{passcode}} in your HTML
            time: new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString() // Cleaner time format
        };
        await emailjs.send('service_3ezcsxj', 'template_8tcz8ka', templateParams);

        showSuccess('OTP sent to your email! Check your inbox.');
        setTimeout(() => {
            window.location.href = '/html/verify-otp.html';
        }, 1500);
    } catch (error) {
        console.error('EmailJS error:', error);
        showError('Failed to send OTP. Please try again.');
    }
});

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
}

function showSuccess(msg) {
    successMsg.textContent = msg;
    successMsg.style.display = 'block';
}

function clearMessages() {
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
}