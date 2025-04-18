document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

let bookings = JSON.parse(localStorage.getItem('zintleBookings')) || [];
let currentTripType = 'oneway';
let currentRideType = 'now';

function initializeApp() {
    loadBookings();
    setupEventListeners();
    setupDemoData();
    toggleDateTimeField();
}

function setupEventListeners() {
    document.getElementById('bookingForm').addEventListener('submit', handleSubmit);
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', handleTripTypeToggle);
    });
    document.querySelectorAll('.ride-option').forEach(option => {
        option.addEventListener('click', handleRideTypeSelection);
    });
    
    // Real-time validation for phone number
    document.getElementById('userPhone').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '').substring(0, 10);
    });
}

function handleTripTypeToggle(e) {
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentTripType = e.target.dataset.type;
    calculateFare();
}

function handleRideTypeSelection(e) {
    document.querySelectorAll('.ride-option').forEach(opt => opt.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentRideType = e.currentTarget.dataset.type;
    toggleDateTimeField();
    calculateFare();
}

function toggleDateTimeField() {
    const dateField = document.getElementById('pickupDate');
    if (currentRideType === 'later') {
        dateField.style.display = 'block';
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        dateField.min = today;
        
        // Set default time to next hour
        const now = new Date();
        const nextHour = new Date(now.setHours(now.getHours() + 1));
        document.getElementById('pickupTime').value = 
            `${String(nextHour.getHours()).padStart(2, '0')}:${String(nextHour.getMinutes()).padStart(2, '0')}`;
    } else {
        dateField.style.display = 'none';
    }
}

function calculateFare() {
    const basePrice = 60;
    let fare = basePrice;
    
    // Apply modifiers
    if(currentTripType === 'roundtrip') fare += basePrice;
    if(currentRideType === 'later') fare += basePrice * 0.1;
    
    document.getElementById('fareDisplay').textContent = `R ${fare.toFixed(2)}`;
}

function handleSubmit(e) {
    e.preventDefault();
    
    const booking = {
        id: Date.now(),
        userName: document.getElementById('userName').value.trim(),
        userEmail: document.getElementById('userEmail').value.trim(),
        userPhone: document.getElementById('userPhone').value.trim(),
        pickup: document.getElementById('pickup').value.trim(),
        dropoff: document.getElementById('dropoff').value.trim(),
        type: currentRideType,
        tripType: currentTripType,
        fare: parseFloat(document.getElementById('fareDisplay').textContent.replace('R ', '')),
        datetime: currentRideType === 'later' ? 
            `${document.getElementById('pickupDate').value} ${document.getElementById('pickupTime').value}` : 
            'ASAP',
        status: 'Scheduled',
        bookingDate: new Date().toLocaleString()
    };

    if(!validateUserDetails(booking)) return;

    bookings.push(booking);
    localStorage.setItem('zintleBookings', JSON.stringify(bookings));
    showConfirmation(booking);
    loadBookings();
    resetForm();
}

function validateUserDetails(booking) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^0[0-9]{9}$/;
    
    if(!booking.userName) {
        showError('Please enter your full name');
        return false;
    }
    
    if(!emailRegex.test(booking.userEmail)) {
        showError('Please enter a valid email address');
        return false;
    }
    
    if(!phoneRegex.test(booking.userPhone)) {
        showError('Please enter a valid 10-digit South African phone number (starting with 0)');
        return false;
    }
    
    return true;
}

function showError(message) {
    const errorPopup = document.createElement('div');
    errorPopup.className = 'error-popup';
    errorPopup.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(errorPopup);
    
    setTimeout(() => {
        errorPopup.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        errorPopup.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(errorPopup);
        }, 300);
    }, 3000);
}

function showConfirmation(booking) {
    const popup = document.getElementById('confirmationPopup');
    const popupContent = document.querySelector('.popup-content');
    
    // Set popup content
    document.getElementById('popupRoute').textContent = `${booking.pickup} to ${booking.dropoff}`;
    document.getElementById('popupTime').textContent = booking.datetime;
    document.getElementById('popupTripType').textContent = booking.tripType.toUpperCase();
    document.getElementById('popupTotal').textContent = `R ${booking.fare.toFixed(2)}`;

    // Set user details
    document.getElementById('popupUserDetails').innerHTML = `
        <div class="user-detail-item">
            <span>Name:</span>
            <span>${booking.userName}</span>
        </div>
        <div class="user-detail-item">
            <span>Email:</span>
            <span>${booking.userEmail}</span>
        </div>
        <div class="user-detail-item">
            <span>Phone:</span>
            <span>${booking.userPhone}</span>
        </div>
    `;

    // Show/hide additional charges
    document.getElementById('roundtripCharge').style.display = 
        currentTripType === 'roundtrip' ? 'flex' : 'none';
    document.getElementById('scheduledCharge').style.display = 
        currentRideType === 'later' ? 'flex' : 'none';

    // Show popup
    popup.style.display = 'flex';
    setTimeout(() => {
        popupContent.classList.add('show');
    }, 10);
}

function closePopup() {
    const popup = document.getElementById('confirmationPopup');
    const popupContent = document.querySelector('.popup-content');
    
    popupContent.classList.remove('show');
    setTimeout(() => {
        popup.style.display = 'none';
    }, 300);
}

function loadBookings() {
    const bookingsGrid = document.getElementById('bookings');
    bookingsGrid.innerHTML = bookings.map(booking => `
        <div class="booking-item">
            <h3>${booking.pickup} → ${booking.dropoff}</h3>
            <div class="booking-details">
                <p><i class="fas fa-user"></i> ${booking.userName}</p>
                <p><i class="fas fa-clock"></i> ${booking.datetime}</p>
                <p><i class="fas fa-exchange-alt"></i> ${booking.tripType.toUpperCase()}</p>
                <p class="fare">R ${booking.fare.toFixed(2)}</p>
                <p class="status ${booking.status.toLowerCase()}">
                    <i class="fas fa-circle"></i> ${booking.status}
                </p>
                <p class="booking-date">Booked: ${booking.bookingDate}</p>
            </div>
        </div>
    `).join('');
}

function resetForm() {
    document.getElementById('bookingForm').reset();
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-type="oneway"]').classList.add('active');
    currentTripType = 'oneway';
    calculateFare();
}

function setupDemoData() {
    if(bookings.length === 0) {
        bookings.push({
            id: 1,
            userName: "John Doe",
            userEmail: "john@example.com",
            userPhone: "0821234567",
            pickup: "Work Office",
            dropoff: "Home",
            type: "later",
            tripType: "roundtrip",
            fare: 126.00,
            datetime: "2024-05-25 17:30",
            status: "Scheduled",
            bookingDate: "5/20/2024, 10:30:00 AM"
        });
        localStorage.setItem('zintleBookings', JSON.stringify(bookings));
    }
}

// Close popup when clicking outside
document.getElementById('confirmationPopup').addEventListener('click', (e) => {
    if(e.target === document.getElementById('confirmationPopup')) {
        closePopup();
    }
});
