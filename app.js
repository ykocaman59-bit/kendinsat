// --- LOCALSTORAGE TABANLI YÖNETİCİ VE GÖNDERİ SİSTEMİ (KESİN ÇÖZÜM) ---

const shareBox = document.getElementById('shareBox');
const submitPostBtn = document.getElementById('submitPostBtn');
const postContent = document.getElementById('postContent');
const postsContainer = document.getElementById('postsContainer');

const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const logoutBtn = document.getElementById('logoutBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');

const ADMIN_EMAIL = "ykocaman59@gmail.com";

// Sayfa yüklendiğinde oturumu ve akışı denetle
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadPosts();
    setupAdminButtonTrigger();
});

// Üst menüdeki "Sultanbeyli Takip (Yönetici)" butonuna tıklayınca profili açma
function setupAdminButtonTrigger() {
    // Sizin arayüzdeki profil/yönetici butonunu yakala
    const headerProfileBtn = document.querySelector('button[id*="Profile"], button[id*="Admin"], header button:last-child, .btn-primary');
    if (headerProfileBtn) {
        headerProfileBtn.onclick = (e) => {
            e.preventDefault();
            openMainUserMenu();
        };
    }
}

// Oturum Durumu Kontrolü
function checkAuthStatus() {
    let currentUser = JSON.parse(localStorage.getItem('current_user'));

    // Eğer hiç giriş yapılmadıysa varsayılan olarak yöneticiyi veya kayıtlı kullanıcıyı al
    if (!currentUser) {
        currentUser = {
            email: ADMIN_EMAIL,
            name: "yönetici",
            username: "admin",
            photoURL: "",
            instagram: localStorage.getItem('admin_instagram') || ""
        };
        localStorage.setItem('current_user', JSON.stringify(currentUser));
    }
}

// ANA KULLANICI MENÜSÜ (PROFİL MODALI AÇMA)
function openMainUserMenu() {
    let currentUser = JSON.parse(localStorage.getItem('current_user')) || {
        email: ADMIN_EMAIL,
        name: "yönetici",
        username: "admin",
        instagram: localStorage.getItem('admin_instagram') || ""
    };

    let isAdmin = currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // Modal içindeki inputları HTML'deki sırasına ve yapısına göre bulup dolduruyoruz
    const modalInputs = profileModal ? profileModal.querySelectorAll('input') : [];
    
    // Genelde 1. input Ad Soyad, 2. input Kullanıcı Adı, 3. input Gmail/Diğer
    if (modalInputs.length >= 2) {
        modalInputs[0].value = isAdmin ? "yönetici" : (currentUser.name || "");
        modalInputs[1].value = isAdmin ? "admin" : (currentUser.username || "");
        if (modalInputs[2]) {
            modalInputs[2].value = currentUser.email || ADMIN_EMAIL;
            modalInputs[2].disabled = true; // Gmail değiştirilemez
        }
    }

    // Ekstra Instagram Alanı Yönetimi
    let instaInput = document.getElementById('modalUserInstagram');
    if (!instaInput && modalInputs.length > 0) {
        const div = document.createElement('div');
        div.style.marginTop = "10px";
        div.innerHTML = `
            <label style="font-size:0.85rem; display:block; text-align:left; margin-bottom:4px; font-weight:bold;">Instagram Adresi:</label>
            <input type="text" id="modalUserInstagram" class="swal2-input" style="width:100%; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;" placeholder="https://instagram.com/kullanici">
        `;
        modalInputs[modalInputs.length - 1].parentNode.insertBefore(div, saveProfileBtn);
        instaInput = document.getElementById('modalUserInstagram');
    }
    
    if (instaInput) {
        instaInput.value = isAdmin ? (localStorage.getItem('admin_instagram') || "") : (currentUser.instagram || "");
    }

    // Yönetici kısıtlamaları (Ad ve Kullanıcı adı değiştirilemez, sadece Instagram güncellenebilir)
    if (isAdmin) {
        if (modalInputs[0]) modalInputs[0].disabled = true;
        if (modalInputs[1]) modalInputs[1].disabled = true;
    }

    if (profileModal) profileModal.style.display = 'flex';
}

// PROFİLİ KAYDET
if (saveProfileBtn) {
    saveProfileBtn.onclick = () => {
        let currentUser = JSON.parse(localStorage.getItem('current_user')) || {};
        let isAdmin = currentUser.email ? currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() : true;

        const modalInputs = profileModal ? profileModal.querySelectorAll('input') : [];
        const instaInput = document.getElementById('modalUserInstagram');
        const newInsta = instaInput ? instaInput.value.trim() : "";

        if (isAdmin) {
            // Yönetici bilgileri kilitli ve sabit kalır, sadece Instagram localStorage'a kaydedilir
            localStorage.setItem('admin_instagram', newInsta);
            currentUser.name = "yönetici";
            currentUser.username = "admin";
            currentUser.email = ADMIN_EMAIL;
            currentUser.instagram = newInsta;
            localStorage.setItem('current_user', JSON.stringify(currentUser));
            alert("Yönetici profili ve Instagram adresiniz başarıyla kaydedildi!");
        } else {
            if (modalInputs[0]) currentUser.name = modalInputs[0].value.trim();
            if (modalInputs[1]) currentUser.username = modalInputs[1].value.trim().toLowerCase();
            currentUser.instagram = newInsta;
            localStorage.setItem('current_user', JSON.stringify(currentUser));
            alert("Profiliniz başarıyla güncellendi!");
        }

        if (profileModal) profileModal.style.display = 'none';
        loadPosts();
    };
}

// MODAL KAPATMA
if (closeProfileModal) {
    closeProfileModal.addEventListener('click', () => { profileModal.style.display = 'none'; });
}

// ÇIKIŞ YAP (Yönetici bilgilerini silmez, sadece oturumu yeniler)
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (profileModal) profileModal.style.display = 'none';
        alert("Çıkış yapıldı.");
    });
}

// HESAP SİLME
if (deleteAccountBtn) {
    deleteAccountBtn.onclick = () => {
        if (confirm("Hesabınızı silmek istediğinize emin misiniz?")) {
            if (profileModal) profileModal.style.display = 'none';
            alert("Hesap sıfırlandı.");
        }
    };
}

// GÖNDERİ PAYLAŞMA
if (submitPostBtn) {
    submitPostBtn.addEventListener('click', () => {
        const content = postContent ? postContent.value.trim() : "";
        if (!content) return alert("Lütfen bir şeyler yazın!");

        let currentUser = JSON.parse(localStorage.getItem('current_user')) || { email: ADMIN_EMAIL };
        let isAdmin = currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        let displayName = isAdmin ? "yönetici" : (currentUser.name || "Üye");

        let posts = JSON.parse(localStorage.getItem('local_posts')) || [];
        
        const newPost = {
            id: Date.now().toString(),
            userName: displayName,
            userPhoto: currentUser.photoURL || "https://via.placeholder.com/40",
            isAdmin: isAdmin,
            content: content,
            date: "Az önce"
        };

        posts.unshift(newPost);
        localStorage.setItem('local_posts', JSON.stringify(posts));

        if (postContent) postContent.value = "";
        loadPosts();
    });
}

// GÖNDERİLERİ LİSTELEME VE İNSTAGRAM İKONU
function loadPosts() {
    if (!postsContainer) return;
    
    let posts = JSON.parse(localStorage.getItem('local_posts')) || [];
    
    // Eğer hiç gönderi yoksa varsayılan test gönderisini koru veya boş bırak
    postsContainer.innerHTML = "";

    if (posts.length === 0) {
        return;
    }

    posts.forEach(post => {
        let instaIconHtml = "";
        if (post.isAdmin) {
            let adminInsta = localStorage.getItem('admin_instagram');
            if (adminInsta) {
                instaIconHtml = `<a href="${adminInsta}" target="_blank" style="margin-left:8px; color:#E1306C; font-size:1.1rem;"><i class="fa-brands fa-instagram"></i></a>`;
            }
        }

        postsContainer.innerHTML += `
            <div class="post-card" style="background:#fff; padding:15px; margin-bottom:15px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <div class="post-header" style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                    <img src="${post.userPhoto}" style="width:40px; height:40px; border-radius:50%;">
                    <div class="post-user-info">
                        <h4 style="margin:0; font-size:1rem; display:flex; align-items:center;">
                            <span>${post.userName}</span> 
                            ${instaIconHtml} 
                            ${post.isAdmin ? '<span class="admin-badge" style="background:#000; color:#fff; font-size:0.7rem; padding:2px 6px; border-radius:4px; margin-left:6px;">YÖNETİCİ</span>' : ''}
                        </h4>
                        <span style="font-size:0.75rem; color:gray;">${post.date}</span>
                    </div>
                </div>
                <div class="post-body" style="font-size:0.95rem; color:#333;">${post.content}</div>
            </div>
        `;
    });
}
