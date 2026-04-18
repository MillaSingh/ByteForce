# ByteForce Task Tracker

## New Task: Create OTP verification page for email with navigation from register.html ✓ Complete

### Steps:
- [x] 1. Update TODO.md with new plan
- [x] 2. Create frontend/verify-otp.html (form for OTP entry, styled like register.html, back button)
- [x] 3. Update register.html JS: Generate/store OTP on success, redirect to verify-otp.html
- [x] 4. Verify OTP logic in verify-otp.html (already implemented: load data, validate, save user on success)
- [x] 5. Test: Register -> OTP page -> verify -> Login.html
- [x] 6. Full flow complete

OTP flow:
- Register form validates, generates 6-digit OTP, stores temp data (30min expiry), redirects to verify-otp.html
- Verify page shows email, countdown, OTP input; validates code/expiry, saves user to localStorage, redirects to Login.html
- Matching styling from style.css, responsive form.

Test with `open frontend/register.html`

