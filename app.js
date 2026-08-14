// Firebase Yapılandırmanız
const firebaseConfig = {
    apiKey: "AIzaSyD-ornek-api-key-buraya",
    authDomain: "kendinsat.firebaseapp.com",
    projectId: "kendinsat",
    storageBucket: "kendinsat.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:1234:web:abcd"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

const googleLoginBtn = document.getElementById('googleLoginBtn');
const authArea = document.getElementById('authArea');
const userProfile = document.getElementById('userProfile');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then((result) => {
            console.log("Giriş başarılı:", result.user.displayName);
        }).catch((error) => {
            console.error("Giriş hatası:", error.message);
            alert("Google ile giriş yaparken bir hata oluştu.");
        });
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });
}

auth.onAuthStateChanged((user) => {
    if (user) {
        authArea.style.display = 'none';
        userProfile.style.display = 'flex';
        userName.textContent = user.displayName || user.email;
    } else {
        authArea.style.display = 'flex';
        userProfile.style.display = 'none';
    }
});

// Filtreleme ve Arama Mekanizması
const applyFilterBtn = document.getElementById('applyFilterBtn');
if (applyFilterBtn) {
    applyFilterBtn.addEventListener('click', () => {
        const selectedCategory = document.getElementById('categoryFilter').value;
        const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
        const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
        
        const listings = document.querySelectorAll('.listing-item');
        let visibleCount = 0;

        listings.forEach(item => {
            const category = item.getAttribute('data-category');
            const price = parseFloat(item.getAttribute('data-price'));

            let categoryMatch = (selectedCategory === 'all' || category === selectedCategory);
            let priceMatch = (price >= minPrice && price <= maxPrice);

            if (categoryMatch && priceMatch) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        document.getElementById('listingCount').textContent = `${visibleCount} İlan Listeleniyor`;
    });
}
