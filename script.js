
let slideIndex = 0;
let activeSessionId = 0;
let userManualStop = false;

document.addEventListener('DOMContentLoaded', () => {
    initGrid();
    initScrollObserver();
    initMobileScrollEffects();
    initMobileMenu();
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (window.scrollY > 50) {
            nav.classList.remove('bg-gradient-to-b');
            nav.classList.add('bg-black');
        } else {
            nav.classList.add('bg-gradient-to-b');
            nav.classList.remove('bg-black');
        }
    });
});

// --- RANDOM SHUFFLE UTILITY ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- PIXEL LOADING GRID ---
function initGrid() {
    const grid = document.getElementById('hero-grid');
    const totalGridSlots = 50;
    const availableImages = 14;
    const cells = [];

    // 1. Build the grid
    for (let i = 0; i < totalGridSlots; i++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');

        const imageIndex = (i % availableImages) + 1;
        const imgUrl = `images/(${imageIndex}).webp`;

        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = "Gallery Image " + imageIndex;
        img.loading = "lazy";

        cell.dataset.id = i + 1;
        cell.appendChild(img);

        cell.onclick = (e) => {
            userClickStop();
            openNetflixModal(cell, imgUrl, i + 1);
        };

        grid.appendChild(cell);
        cells.push(cell);
    }

    // 2. Randomize Loading Order
    let indices = Array.from({ length: totalGridSlots }, (_, i) => i);
    indices = shuffleArray(indices);

    // 3. Animate them
    indices.forEach((cellIndex, timeIndex) => {
        const cell = cells[cellIndex];
        setTimeout(() => {
            cell.classList.add('loaded');
        }, timeIndex * 30);
    });
}

function openDonateModal() {
    userClickStop();
    const overlay = document.getElementById('donate-overlay');
    const card = document.getElementById('donate-card');
    document.body.style.overflow = 'hidden';
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        card.classList.remove('opacity-0', 'scale-95');
        card.classList.add('scale-100');
    });
}

function closeDonateModal() {
    const overlay = document.getElementById('donate-overlay');
    const card = document.getElementById('donate-card');
    overlay.classList.add('opacity-0');
    card.classList.add('opacity-0', 'scale-95');
    card.classList.remove('scale-100');
    setTimeout(() => {
        overlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 300);
}

function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const icon = btn.querySelector('i');
    btn.onclick = () => toggleMobileMenu();
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const icon = document.querySelector('#mobile-menu-btn i');
    menu.classList.toggle('hidden');
    if (menu.classList.contains('hidden')) {
        icon.classList.remove('fa-times'); icon.classList.add('fa-bars');
    } else {
        icon.classList.remove('fa-bars'); icon.classList.add('fa-times');
    }
}

function initMobileScrollEffects() {
    const elements = document.querySelectorAll('.impact-card, .scroll-reveal-img');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('mobile-active');
            } else {
                entry.target.classList.remove('mobile-active');
            }
        });
    }, { threshold: 0.5, rootMargin: "0px" });
    elements.forEach(el => observer.observe(el));
}

// --- UPDATED SENSOR LOGIC (FIXED FOR MOBILE) ---
function initScrollObserver() {
    const grid = document.getElementById('hero-grid');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!userManualStop) startSlideshow();
            } else {
                killCurrentSession();
                resetAllTransforms();
            }
        });
    }, {
        // CHANGED: Lower threshold to 0.1 (10%) so it detects properly on mobile
        threshold: 0.1
    });
    observer.observe(grid);
}

function userClickStart() { userManualStop = false; startSlideshow(); }
function userClickStop() { userManualStop = true; stopSlideshow(); }
function killCurrentSession() { activeSessionId++; }

async function startSlideshow() {
    killCurrentSession();
    const mySessionId = activeSessionId;
    document.getElementById('btn-start').classList.add('hidden');
    document.getElementById('btn-stop').classList.remove('hidden');
    const cells = document.querySelectorAll('.grid-cell');
    if (cells.length === 0) return;

    while (true) {
        if (mySessionId !== activeSessionId) return;
        if (slideIndex >= cells.length) slideIndex = 0;
        const currentCell = cells[slideIndex];
        const rect = currentCell.getBoundingClientRect();

        // --- STRICT VIEWPORT CHECK (UPDATED FOR NAVBAR) ---
        // Navbar is ~80px. We shouldn't pop items under it.
        const navHeight = 80;
        const isFullyOnScreen = (rect.top >= navHeight) && (rect.bottom <= window.innerHeight);

        if (isFullyOnScreen) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const cellCenterX = rect.left + rect.width / 2;
            const cellCenterY = rect.top + rect.height / 2;
            const moveX = centerX - cellCenterX;
            const moveY = centerY - cellCenterY;
            const scaleW = (window.innerWidth * 0.60) / rect.width;
            const scaleH = (window.innerHeight * 0.80) / rect.height;
            let finalScale = Math.min(scaleW, scaleH);
            if (finalScale < 1.2) finalScale = 1.2;
            if (finalScale > 25) finalScale = 15;

            currentCell.style.transform = `translate(${moveX}px, ${moveY}px) scale(${finalScale})`;
            currentCell.classList.add('active-pop');
            await new Promise(r => setTimeout(r, 2000));
            if (mySessionId !== activeSessionId) { resetCell(currentCell); return; }
            resetCell(currentCell);
            await new Promise(r => setTimeout(r, 200));
        }
        slideIndex++;
        if (!isFullyOnScreen) await new Promise(r => setTimeout(r, 20));
    }
}

function resetCell(cell) { cell.style.transform = ''; cell.classList.remove('active-pop'); }
function resetAllTransforms() { document.querySelectorAll('.grid-cell').forEach(cell => resetCell(cell)); }
function stopSlideshow() {
    killCurrentSession();
    document.getElementById('btn-start').classList.remove('hidden');
    document.getElementById('btn-stop').classList.add('hidden');
    resetAllTransforms();
}

function openNetflixModal(clickedCell, imgUrl, id) {
    const overlay = document.getElementById('modal-overlay');
    const card = document.getElementById('modal-card');
    const modalImg = document.getElementById('modal-image');
    document.getElementById('modal-id').innerText = id;
    modalImg.src = imgUrl;
    document.body.style.overflow = 'hidden';
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        card.classList.remove('opacity-0', 'scale-95');
        card.classList.add('scale-100');
    });
}

function userCloseModal() {
    const overlay = document.getElementById('modal-overlay');
    const card = document.getElementById('modal-card');
    overlay.classList.add('opacity-0');
    card.classList.add('opacity-0', 'scale-95');
    card.classList.remove('scale-100');
    setTimeout(() => {
        overlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 300);
}