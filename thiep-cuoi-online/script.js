document.addEventListener('DOMContentLoaded', () => {
    // 1. Countdown Timer Logic
    // Set the date we're counting down to (e.g., Oct 25, 2026 18:00:00)
    const countDownDate = new Date("Oct 25, 2026 18:00:00").getTime();

    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    // Update the countdown every 1 second
    const x = setInterval(function() {

        // Get today's date and time
        const now = new Date().getTime();

        // Find the distance between now and the count down date
        const distance = countDownDate - now;

        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result
        if(daysEl && hoursEl && minutesEl && secondsEl) {
            daysEl.innerHTML = days < 10 ? '0' + days : days;
            hoursEl.innerHTML = hours < 10 ? '0' + hours : hours;
            minutesEl.innerHTML = minutes < 10 ? '0' + minutes : minutes;
            secondsEl.innerHTML = seconds < 10 ? '0' + seconds : seconds;
        }

        // If the count down is finished, write some text
        if (distance < 0) {
            clearInterval(x);
            const countdownEl = document.getElementById("countdown");
            if(countdownEl) {
                countdownEl.innerHTML = "<h3 style='color: var(--accent-color); font-family: var(--font-heading);'>Đám cưới đang diễn ra!</h3>";
            }
        }
    }, 1000);

    // 2. RSVP Form Submission Handling
    const rsvpForm = document.getElementById('rsvp-form');
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = rsvpForm.querySelector('.btn-submit');
            const originalText = submitBtn.innerText;
            
            // Show loading state
            submitBtn.innerText = 'Đang gửi...';
            submitBtn.disabled = true;

            // Simulate API Call / Form Submission delay
            setTimeout(() => {
                alert('Cảm ơn bạn đã xác nhận tham dự! Lời chúc của bạn đã được gửi đến cô dâu chú rể.');
                rsvpForm.reset();
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }

    // 3. Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 4. Navbar shrink on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.padding = '10px 50px';
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        } else {
            navbar.style.padding = '20px 50px';
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
        }
    });
});
