// --- LOCALSTORAGE TABANLI YÖNETİCİ VE GÖNDERİ SİSTEMİ ---

// DOM Elementleri
const loginBtn = document.getElementById('loginBtn');
const userMenuSection = document.getElementById('userMenuSection');
const shareBox = document.getElementById('shareBox');
const submitPostBtn = document.getElementById('submitPostBtn');
const postContent = document.getElementById('postContent');
const isPoll = document.getElementById('isPoll');
const postsContainer = document.getElementById('postsContainer');

const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const logoutBtn = document.getElementById('logoutBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const modalUserName = document.getElementById('modalUserName');
const modalUserEmail = document.getElementById('modalUserEmail');
const modalUserPhoto = document.getElementById('modalUserPhoto');

const ADMIN_EMAIL = "ykocaman59@gmail.com";

// Sayfa yüklendiğinde oturum durumunu kontrol et
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadPosts();
});

// GİRİŞ İŞLEMİ (Simüle edilmiş veya Google/Admin butonuna bağlı)
function checkAuthStatus() {
    const currentUser = JSON.parse(localStorage.getItem('current_user'));

    if (currentUser) {
        if (shareBox) shareBox.style.display = 'block';
        let isAdmin = currentUser.email === ADMIN_EMAIL;

        if (userMenuSection) {
            userMenuSection.innerHTML = `
                <button class="btn-primary" id="openProfileMenuBtn" style="display:flex; align-items:center; gap:8px;">
                    <img src="${currentUser.photoURL || 'https://via.placeholder.com/30'}" style="width:24px; height:24px; border-radius:50%;"> 
                    ${isAdmin ? 'yönetici' : currentUser.name} ${isAdmin ? '<span class="admin-badge">YÖNETİCİ</span>' : ''}
                </button>
            `;

            document.getElementById('openProfileMenuBtn').addEventListener('click', () => {
                openMainUserMenu(isAdmin);
            });
        }
    } else {
        if (shareBox) shareBox.style.display = 'none';
        if (userMenuSection) {
            userMenuSection.innerHTML = `
                <button id="loginBtn" class="btn-primary"><i class="fa-brands fa-google"></i> Giriş Yap</button>
            `;
            // Test için örnek hızlı giriş promptu
            document.getElementById('loginBtn').addEventListener('click', () => {
                let email = prompt("Gmail adresinizi giriniz (Yönetici için: ykocaman59@gmail.com):");
                if (!email) return;
                
                let isAdmin = email.trim().toLowerCase() === ADMIN_EMAIL;
                let userData = {
                    email: email.trim(),
                    name: isAdmin ? "yönetici" : "Üye",
                    username: isAdmin ? "admin" : "uye_" + Math.floor(Math.random()*1000),
                    photoURL: "https://via.placeholder.com/40",
                    instagram: isAdmin ? (localStorage.getItem('admin_instagram') || "") : ""
                };

                localStorage.setItem('current_user', JSON.stringify(userData));
                checkAuthStatus();
                loadPosts();
            });
        }
    }
}

// ANA KULLANICI MENÜSÜ (PROFİL MODALI)
function openMainUserMenu(isAdmin) {
    const currentUser = JSON.parse(localStorage.getItem('current_user'));
    if (!currentUser) return;

    if (isAdmin) {
        modalUserName.value = "yönetici";
        modalUserEmail.innerText = ADMIN_EMAIL;
    } else {
        modalUserName.value = currentUser.name || '';
        modalUserEmail.innerText = currentUser.email;
    }
    modalUserPhoto.src = currentUser.photoURL || 'https://via.placeholder.com/80';

    // Kullanıcı Adı Input Alanı
    let usernameInput = document.getElementById('modalUserUsername');
    if (!usernameInput) {
        const divU = document.createElement('div');
        divU.style.marginTop = "10px";
        divU.innerHTML = `
            <label style="font-size:0.85rem; display:block; text-align:left; margin-bottom:4px;">Kullanıcı Adı:</label>
            <input type="text" id="modalUserUsername" class="swal2-input" style="width:100%; padding:8px; box-sizing:border-box;" placeholder="kullanici_adi">
        `;
        modalUserName.parentNode.insertBefore(divU, saveProfileBtn);
        usernameInput = document.getElementById('modalUserUsername');
    }
    usernameInput.value = isAdmin ? "admin" : (currentUser.username || '');

    // Instagram Input Alanı
    let instaInput = document.getElementById('modalUserInstagram');
    if (!instaInput) {
        const div = document.createElement('div');
        div.style.marginTop = "10px";
        div.innerHTML = `
            <label style="font-size:0.85rem; display:block; text-align:left; margin-bottom:4px;">Instagram Adresi:</label>
            <input type="text" id="modalUserInstagram" class="swal2-input" style="width:100%; padding:8px; box-sizing:border-box;" placeholder="https://instagram.com/kullanici">
        `;
        modalUserName.parentNode.insertBefore(div, saveProfileBtn);
        instaInput = document.getElementById('modalUserInstagram');
    }
    
    instaInput.value = isAdmin ? (localStorage.getItem('admin_instagram') || "") : (currentUser.instagram || '');
    
    // Kısıtlamalar
    if (isAdmin) {
        modalUserName.disabled = true; 
        usernameInput.disabled = true;
        instaInput.disabled = false; // Yönetici Instagram adresini değiştirebilir
    } else {
        modalUserName.disabled = false;
        usernameInput.disabled = false;
        instaInput.disabled = false;
    }

    if (profileModal) profileModal.style.display = 'flex';
}

// PROFİLİ KAYDET
if (saveProfileBtn) {
    saveProfileBtn.onclick = () => {
        const currentUser = JSON.parse(localStorage.getItem('current_user'));
        if (!currentUser) return;
        
        let isAdmin = currentUser.email === ADMIN_EMAIL;
        const newInsta = document.getElementById('modalUserInstagram').value.trim();

        if (isAdmin) {
            localStorage.setItem('admin_instagram', newInsta);
            alert("Yönetici profili ve Instagram adresiniz başarıyla kaydedildi!");
        } else {
            const newName = modalUserName.value.trim();
            const newUsername = document.getElementById('modalUserUsername').value.trim().toLowerCase();
            
            currentUser.name = newName;
            currentUser.username = newUsername;
            currentUser.instagram = newInsta;
            localStorage.setItem('current_user', JSON.stringify(currentUser));
            alert("Profiliniz başarıyla güncellendi!");
        }

        if (profileModal) profileModal.style.display = 'none';
        checkAuthStatus();
        loadPosts();
    };
}

// MODAL KAPATMA
if (closeProfileModal) {
    closeProfileModal.addEventListener('click', () => { profileModal.style.display = 'none'; });
}

// ÇIKIŞ YAP
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('current_user');
        if (profileModal) profileModal.style.display = 'none';
        checkAuthStatus();
        loadPosts();
    });
}

// HESAP SİLME
if (deleteAccountBtn) {
    deleteAccountBtn.onclick = () => {
        if (confirm("Hesabınızı silmek istediğinize emin misiniz?")) {
            localStorage.removeItem('current_user');
            if (profileModal) profileModal.style.display = 'none';
            checkAuthStatus();
            loadPosts();
            alert("Hesap silindi.");
        }
    };
}

// GÖNDERİ PAYLAŞMA
if (submitPostBtn) {
    submitPostBtn.addEventListener('click', () => {
        const currentUser = JSON.parse(localStorage.getItem('current_user'));
        if (!currentUser) return alert("Lütfen önce giriş yapın!");

        const content = postContent.value.trim();
        if (!content) return alert("Lütfen bir şeyler yazın!");

        let isAdmin = currentUser.email === ADMIN_EMAIL;
        let displayName = isAdmin ? "yönetici" : currentUser.name;

        let posts = JSON.parse(localStorage.getItem('local_posts')) || [];
        
        const newPost = {
            id: Date.now().toString(),
            uid: currentUser.email,
            userName: displayName,
            userPhoto: currentUser.photoURL || "",
            isAdmin: isAdmin,
            content: content,
            date: "Az önce"
        };

        posts.unshift(newPost); // En üste ekle
        localStorage.setItem('local_posts', JSON.stringify(posts));

        postContent.value = "";
        loadPosts();
    });
}

// GÖNDERİLERİ LİSTELEME
function loadPosts() {
    if (!postsContainer) return;
    
    let posts = JSON.parse(localStorage.getItem('local_posts')) || [];
    postsContainer.innerHTML = "";

    if (posts.length === 0) {
        postsContainer.innerHTML = "<p style='text-align:center; color:gray; padding:20px;'>Henüz gönderi yok.</p>";
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
