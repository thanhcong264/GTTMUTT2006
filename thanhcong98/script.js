document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // THEME TOGGLE (DARK / LIGHT MODE)
    // ==========================================================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (savedTheme) {
        body.className = savedTheme;
    } else {
        // Default to dark theme
        body.className = 'dark-theme';
    }

    themeToggleBtn.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            localStorage.setItem('portfolio-theme', 'light-theme');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            localStorage.setItem('portfolio-theme', 'dark-theme');
        }
    });

    // ==========================================================================
    // MOBILE NAV MENU TOGGLE
    // ==========================================================================
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    const toggleMenu = () => {
        mobileMenuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Prevent body scrolling when mobile menu is open
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    };

    mobileMenuToggle.addEventListener('click', toggleMenu);

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    // ==========================================================================
    // HEADER SCROLL EFFECT & BACK TO TOP BUTTON
    // ==========================================================================
    const header = document.getElementById('main-header');
    const backToTopBtn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        // Header styling on scroll
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Back to top button visibility
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    // Back to top action
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ==========================================================================
    // TYPING TEXT EFFECT (HERO SECTION)
    // ==========================================================================
    const typingText = document.getElementById('typing-text');
    const words = ["Lập trình viên Fullstack", "Nhà phát triển Web", "Người đam mê công nghệ"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeDelay = 150;

    const typeEffect = () => {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            // Remove character
            typingText.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typeDelay = 75; // Faster deletion
        } else {
            // Add character
            typingText.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typeDelay = 150; // Normal typing
        }

        // Handle word switching logic
        if (!isDeleting && charIndex === currentWord.length) {
            // Word complete, wait before deleting
            typeDelay = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            // Word deleted, move to next
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeDelay = 500; // Pause before typing next word
        }

        setTimeout(typeEffect, typeDelay);
    };

    // Start the typing effect
    if (typingText) {
        setTimeout(typeEffect, 1000);
    }

    // ==========================================================================
    // SCROLL TRIGGERS & ACTIVE NAVIGATION LINKS
    // ==========================================================================
    const sections = document.querySelectorAll('section');

    const scrollActiveIndicator = () => {
        const scrollY = window.pageYOffset;

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120; // offset header
            const sectionId = current.getAttribute('id');
            const correspondingLink = document.getElementById(`link-${sectionId}`);

            if (correspondingLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    correspondingLink.classList.add('active');
                } else {
                    correspondingLink.classList.remove('active');
                }
            }
        });
    };

    window.addEventListener('scroll', scrollActiveIndicator);

    // ==========================================================================
    // SKILLS PROGRESS BAR ANIMATION (INTERSECTION OBSERVER)
    // ==========================================================================
    const skillsSection = document.getElementById('skills');
    const progressBars = document.querySelectorAll('.progress-bar-fill');

    const animateSkills = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                progressBars.forEach(bar => {
                    const widthValue = bar.style.width; // Reads width from inline style
                    bar.style.width = '0'; // reset
                    setTimeout(() => {
                        bar.style.width = widthValue; // trigger layout rebuild with original width
                    }, 100);
                });
                observer.unobserve(entry.target); // Trigger only once
            }
        });
    };

    const skillsObserver = new IntersectionObserver(animateSkills, {
        root: null,
        threshold: 0.25 // Trigger when 25% of section is visible
    });

    if (skillsSection) {
        // Pre-store percentages and set width to 0 initial state
        progressBars.forEach(bar => {
            const originalWidth = bar.getAttribute('style').match(/width:\s*(\d+)%/)[0];
            bar.dataset.targetWidth = originalWidth;
        });
        
        skillsObserver.observe(skillsSection);
    }

    // ==========================================================================
    // PROJECT FILTERING
    // ==========================================================================
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from other buttons, add to current
            filterButtons.forEach(button => button.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    card.classList.remove('hide');
                    card.classList.add('show');
                } else {
                    card.classList.remove('show');
                    card.classList.add('hide');
                }
            });
        });
    });

    // ==========================================================================
    // CONTACT FORM INTERACTION & TOAST FEEDBACK
    // ==========================================================================
    const contactForm = document.getElementById('contact-form');
    const formToast = document.getElementById('form-toast');
    const btnSubmit = document.getElementById('btn-submit-form');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Change button state to loading
            const originalBtnContent = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `Đang gửi... <i class="fa-solid fa-spinner fa-spin"></i>`;

            // Simulate form submission delay
            setTimeout(() => {
                // Hide button loading, clear inputs
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnContent;
                contactForm.reset();

                // Show success toast inside the glass container
                formToast.classList.remove('hidden');

                // Auto hide toast after 5 seconds
                setTimeout(() => {
                    formToast.classList.add('hidden');
                }, 5000);
            }, 1800);
        });
    }

    // Modal Logic for Odoo ERP Demo
    const btnDemoOdoo = document.querySelector('.btn-demo-odoo');
    const odooModal = document.getElementById('odoo-modal');
    const btnModalClose = document.querySelector('.modal-close');

    if (btnDemoOdoo && odooModal) {
        btnDemoOdoo.addEventListener('click', (e) => {
            e.preventDefault();
            odooModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }

    if (btnModalClose && odooModal) {
        btnModalClose.addEventListener('click', () => {
            odooModal.classList.add('hidden');
            document.body.style.overflow = '';
        });
        
        // Close when clicking outside
        odooModal.addEventListener('click', (e) => {
            if (e.target === odooModal) {
                odooModal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    // Odoo Modal Tab Logic
    const odooTabBtns = document.querySelectorAll('.odoo-tab-btn');
    const odooTabContents = document.querySelectorAll('.odoo-tab-content');

    odooTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            odooTabBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            // Hide all tab contents
            odooTabContents.forEach(content => {
                content.style.display = 'none';
            });

            // Show target tab content
            const targetId = btn.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });

    // ==========================================================================
    // ODOO - HELPER: TOAST NOTIFICATION
    // ==========================================================================
    const showOdooToast = (message) => {
        const existing = document.querySelector('.odoo-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'odoo-toast';
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2800);
    };

    // ==========================================================================
    // ODOO - HELPER: ATTACH DELETE BUTTONS (event delegation)
    // ==========================================================================
    const attachDeleteButtons = (tbodyId) => {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-odoo-delete');
            if (btn) {
                const row = btn.closest('tr');
                if (row) {
                    row.style.animation = 'fadeOut 0.25s ease forwards';
                    setTimeout(() => row.remove(), 240);
                }
            }
        });
    };

    // Attach delete to existing rows
    attachDeleteButtons('tbody-students');
    attachDeleteButtons('tbody-courses');
    attachDeleteButtons('tbody-grades');

    // ==========================================================================
    // ODOO - HELPER: SEARCH/FILTER TABLE ROWS
    // ==========================================================================
    const attachSearch = (inputId, tbodyId) => {
        const input = document.getElementById(inputId);
        const tbody = document.getElementById(tbodyId);
        if (!input || !tbody) return;
        input.addEventListener('input', () => {
            const query = input.value.toLowerCase();
            tbody.querySelectorAll('tr').forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    };

    attachSearch('search-students', 'tbody-students');
    attachSearch('search-courses', 'tbody-courses');
    attachSearch('search-grades', 'tbody-grades');

    // ==========================================================================
    // ODOO - TAB: SINH VIÊN (Students)
    // ==========================================================================
    const btnCreateStudent  = document.getElementById('btn-create-student');
    const formCreateStudent = document.getElementById('form-create-student');
    const btnCancelStudent  = document.getElementById('btn-cancel-student');
    const btnSaveStudent    = document.getElementById('btn-save-student');
    const btnDiscardStudent = document.getElementById('btn-discard-student');
    const tbodyStudents     = document.getElementById('tbody-students');

    const openStudentForm = () => {
        formCreateStudent.style.display = 'block';
        document.getElementById('new-sv-id').focus();
    };
    const closeStudentForm = () => {
        formCreateStudent.style.display = 'none';
        ['new-sv-id','new-sv-name'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('new-sv-major').value = '';
        document.getElementById('new-sv-status').value = 'active';
    };

    if (btnCreateStudent)  btnCreateStudent.addEventListener('click', openStudentForm);
    if (btnCancelStudent)  btnCancelStudent.addEventListener('click', closeStudentForm);
    if (btnDiscardStudent) btnDiscardStudent.addEventListener('click', closeStudentForm);

    if (btnSaveStudent) {
        btnSaveStudent.addEventListener('click', () => {
            const id     = document.getElementById('new-sv-id').value.trim();
            const name   = document.getElementById('new-sv-name').value.trim();
            const major  = document.getElementById('new-sv-major').value;
            const status = document.getElementById('new-sv-status').value;

            if (!id || !name || !major) {
                document.getElementById('new-sv-id').style.borderColor   = id    ? '' : '#ef4444';
                document.getElementById('new-sv-name').style.borderColor = name  ? '' : '#ef4444';
                document.getElementById('new-sv-major').style.borderColor = major ? '' : '#ef4444';
                return;
            }

            const statusMap = { active: 'Đang học', graduated: 'Đã tốt nghiệp', suspended: 'Tạm dừng' };
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${id}</td>
                <td>${name}</td>
                <td>${major}</td>
                <td><span class="status-badge ${status}">${statusMap[status]}</span></td>
                <td><button class="btn-odoo-delete" title="Xoá"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tbodyStudents.appendChild(tr);
            closeStudentForm();
            showOdooToast(`Đã thêm sinh viên "${name}" thành công!`);
        });
    }

    // ==========================================================================
    // ODOO - TAB: KHÓA HỌC (Courses)
    // ==========================================================================
    const btnCreateCourse  = document.getElementById('btn-create-course');
    const formCreateCourse = document.getElementById('form-create-course');
    const btnCancelCourse  = document.getElementById('btn-cancel-course');
    const btnSaveCourse    = document.getElementById('btn-save-course');
    const btnDiscardCourse = document.getElementById('btn-discard-course');
    const tbodyCourses     = document.getElementById('tbody-courses');

    const openCourseForm = () => {
        formCreateCourse.style.display = 'block';
        document.getElementById('new-kh-id').focus();
    };
    const closeCourseForm = () => {
        formCreateCourse.style.display = 'none';
        ['new-kh-id','new-kh-name','new-kh-teacher','new-kh-credits'].forEach(id => {
            document.getElementById(id).value = '';
        });
    };

    if (btnCreateCourse)  btnCreateCourse.addEventListener('click', openCourseForm);
    if (btnCancelCourse)  btnCancelCourse.addEventListener('click', closeCourseForm);
    if (btnDiscardCourse) btnDiscardCourse.addEventListener('click', closeCourseForm);

    if (btnSaveCourse) {
        btnSaveCourse.addEventListener('click', () => {
            const id      = document.getElementById('new-kh-id').value.trim();
            const name    = document.getElementById('new-kh-name').value.trim();
            const teacher = document.getElementById('new-kh-teacher').value.trim();
            const credits = document.getElementById('new-kh-credits').value.trim();

            if (!id || !name || !teacher || !credits) {
                ['new-kh-id','new-kh-name','new-kh-teacher','new-kh-credits'].forEach(fid => {
                    const el = document.getElementById(fid);
                    el.style.borderColor = el.value.trim() ? '' : '#ef4444';
                });
                return;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${id}</td>
                <td>${name}</td>
                <td>${teacher}</td>
                <td>${credits}</td>
                <td><button class="btn-odoo-delete" title="Xoá"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tbodyCourses.appendChild(tr);
            closeCourseForm();
            showOdooToast(`Đã thêm khóa học "${name}" thành công!`);
        });
    }

    // ==========================================================================
    // ODOO - TAB: BẢNG ĐIỂM (Grades)
    // ==========================================================================
    const btnCreateGrade  = document.getElementById('btn-create-grade');
    const formCreateGrade = document.getElementById('form-create-grade');
    const btnCancelGrade  = document.getElementById('btn-cancel-grade');
    const btnSaveGrade    = document.getElementById('btn-save-grade');
    const btnDiscardGrade = document.getElementById('btn-discard-grade');
    const tbodyGrades     = document.getElementById('tbody-grades');

    const openGradeForm = () => {
        formCreateGrade.style.display = 'block';
        document.getElementById('new-grade-sv').focus();
    };
    const closeGradeForm = () => {
        formCreateGrade.style.display = 'none';
        ['new-grade-sv','new-grade-kh','new-grade-gk','new-grade-ck'].forEach(id => {
            document.getElementById(id).value = '';
        });
    };

    if (btnCreateGrade)  btnCreateGrade.addEventListener('click', openGradeForm);
    if (btnCancelGrade)  btnCancelGrade.addEventListener('click', closeGradeForm);
    if (btnDiscardGrade) btnDiscardGrade.addEventListener('click', closeGradeForm);

    if (btnSaveGrade) {
        btnSaveGrade.addEventListener('click', () => {
            const sv = document.getElementById('new-grade-sv').value.trim();
            const kh = document.getElementById('new-grade-kh').value.trim();
            const gk = parseFloat(document.getElementById('new-grade-gk').value);
            const ck = parseFloat(document.getElementById('new-grade-ck').value);

            if (!sv || !kh || isNaN(gk) || isNaN(ck)) {
                ['new-grade-sv','new-grade-kh','new-grade-gk','new-grade-ck'].forEach(fid => {
                    const el = document.getElementById(fid);
                    el.style.borderColor = el.value.trim() ? '' : '#ef4444';
                });
                return;
            }

            const total = ((gk * 0.4) + (ck * 0.6)).toFixed(1);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${sv}</td>
                <td>${kh}</td>
                <td>${gk.toFixed(1)}</td>
                <td>${ck.toFixed(1)}</td>
                <td><strong>${total}</strong></td>
                <td><button class="btn-odoo-delete" title="Xoá"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tbodyGrades.appendChild(tr);
            closeGradeForm();
            showOdooToast(`Đã lưu điểm cho "${sv}" thành công!`);
        });
    }

    // Add fadeOut keyframe via JS if not already in CSS
    if (!document.getElementById('odoo-keyframes')) {
        const style = document.createElement('style');
        style.id = 'odoo-keyframes';
        style.textContent = `@keyframes fadeOut { to { opacity:0; transform:translateX(20px); } }`;
        document.head.appendChild(style);
    }
});

