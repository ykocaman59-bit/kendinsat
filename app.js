// FIREBASE YAPILANDIRMANIZI BURAYA EKLEYİN
const firebaseConfig = {
    apiKey: "BURAYA_FIREBASE_API_KEY",
    authDomain: "BURAYA_AUTH_DOMAIN",
    projectId: "BURAYA_PROJECT_ID",
    storageBucket: "BURAYA_STORAGE_BUCKET",
    messagingSenderId: "BURAYA_MESSAGING_SENDER_ID",
    appId: "BURAYA_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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

let currentUser = null;
const ADMIN_EMAIL = "ykocaman59@gmail.com";

// GÜVENLİ GOOGLE GİRİŞİ
if(loginBtn) {
    loginBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch((error) => {
            alert("Giriş hatası: " + error.message);
        });
    });
}

// OTURUM DURUMU İZLEME VE KULLANICI KONTROLÜ
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        if(shareBox) shareBox.style.display = 'block';
        
        let isAdmin = user.email === ADMIN_EMAIL;

        // Kullanıcı veritabanı kontrolü
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists && !isAdmin) {
            // İlk kayıt esnasında Ad Soyad ve Kullanıcı Adı alma
            let customName = prompt("Adınızı ve Soyadınızı girin:", user.displayName || "Üye");
            if (!customName) customName = "Üye";

            let customUsername = "";
            let isUnique = false;

            // Kullanıcı adı çakışma kontrolü döngüsü
            while (!isUnique) {
                let tempUsername = prompt("Kullanıcı adınızı girin:", "uye_" + Math.floor(Math.random()*1000));
                if (!tempUsername) {
                    customUsername = "uye_" + Math.floor(Math.random()*10000);
                    break;
                }
                tempUsername = tempUsername.trim().toLowerCase();

                // Veritabanında bu kullanıcı adı var mı kontrol et
                const querySnapshot = await db.collection('users').where('username', '==', tempUsername).get();
                if (querySnapshot.empty && tempUsername !== "admin") {
                    customUsername = tempUsername;
                    isUnique = true;
                } else {
                    let suggested = tempUsername + Math.floor(Math.random() * 900 + 100);
                    alert(`Bu kullanıcı adı zaten alınmış! Size önerilen alternatif: @${suggested}`);
                }
            }

            let customInsta = prompt("Instagram profil linkiniz (İsteğe bağlı, boş bırakabilirsiniz):", "");

            await userRef.set({
                name: customName,
                username: customUsername,
                email: user.email,
                photoURL: user.photoURL || "https://via.placeholder.com/40",
                instagram: customInsta || "",
                lastUsernameChange: Date.now(),
                isAdmin: false
            });
        } else if (isAdmin) {
            // Yönetici bilgileri sabitlenir
            await userRef.set({
                name: "yönetici",
                username: "admin",
                email: ADMIN_EMAIL,
                photoURL: user.photoURL || "https://via.placeholder.com/40",
                instagram: userDoc.exists && userDoc.data().instagram ? userDoc.data().instagram : "",
                lastUsernameChange: Date.now(),
                isAdmin: true
            }, { merge: true });
        }

        if(userMenuSection) {
            userMenuSection.innerHTML = `
                <button class="btn-primary" id="openProfileMenuBtn" style="display:flex; align-items:center; gap:8px;">
                    <img src="${user.photoURL || 'https://via.placeholder.com/30'}" style="width:24px; height:24px; border-radius:50%; object-fit:cover;"> 
                    ${isAdmin ? 'yönetici' : (user.displayName || 'Profil')} ${isAdmin ? '<span class="admin-badge">YÖNETİCİ</span>' : ''}
                </button>
            `;

            document.getElementById('openProfileMenuBtn').addEventListener('click', () => {
                openMainUserMenu(isAdmin);
            });
        }

    } else {
        currentUser = null;
        if(shareBox) shareBox.style.display = 'none';
        if(userMenuSection) {
            userMenuSection.innerHTML = `
                <button id="loginBtn" class="btn-primary"><i class="fa-brands fa-google"></i> Gmail ile Giriş Yap</button>
            `;
            const newLoginBtn = document.getElementById('loginBtn');
            if(newLoginBtn) {
                newLoginBtn.addEventListener('click', () => {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    auth.signInWithPopup(provider);
                });
            }
        }
    }
    loadPosts();
});

// ANA KULLANICI MENÜSÜ (YÖNETİCİ VEYA ÜYE)
async function openMainUserMenu(isAdmin) {
    if(!currentUser) return;
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    let userData = userDoc.exists ? userDoc.data() : {};
    
    if(modalUserName) modalUserName.value = isAdmin ? "yönetici" : (userData.name || currentUser.displayName || '');
    if(modalUserEmail) modalUserEmail.innerText = currentUser.email; 
    if(modalUserPhoto) modalUserPhoto.src = currentUser.photoURL || userData.photoURL || 'https://via.placeholder.com/80';

    // Kullanıcı Adı Input Alanı Kontrolü
    let usernameInput = document.getElementById('modalUserUsername');
    if (!usernameInput && modalUserName) {
        const divU = document.createElement('div');
        divU.style.marginTop = "10px";
        divU.innerHTML = `
            <label style="font-size:0.85rem; display:block; text-align:left; margin-bottom:4px;">Kullanıcı Adı:</label>
            <input type="text" id="modalUserUsername" class="swal2-input" style="width:100%; padding:8px; box-sizing:border-box;" placeholder="kullanici_adi">
        `;
        modalUserName.parentNode.insertBefore(divU, saveProfileBtn);
        usernameInput = document.getElementById('modalUserUsername');
    }
    if(usernameInput) usernameInput.value = isAdmin ? "admin" : (userData.username || '');

    // Instagram input alanı yönetimi
    let instaInput = document.getElementById('modalUserInstagram');
    if (!instaInput && modalUserName) {
        const div = document.createElement('div');
        div.style.marginTop = "10px";
        div.innerHTML = `
            <label style="font-size:0.85rem; display:block; text-align:left; margin-bottom:4px;">Instagram Adresi:</label>
            <input type="text" id="modalUserInstagram" class="swal2-input" style="width:100%; padding:8px; box-sizing:border-box;" placeholder="https://instagram.com/kullanici">
        `;
        modalUserName.parentNode.insertBefore(div, saveProfileBtn);
        instaInput = document.getElementById('modalUserInstagram');
    }
    
    if(instaInput) instaInput.value = userData.instagram || '';
    
    if (isAdmin) {
        if(modalUserName) modalUserName.disabled = true; 
        if(usernameInput) usernameInput.disabled = true;
        if(instaInput) instaInput.disabled = false; // Yönetici de Instagram adresini yazıp kaydedebilsin
    } else {
        if(modalUserName) modalUserName.disabled = false;
        if(usernameInput) usernameInput.disabled = false;
        if(instaInput) instaInput.disabled = false;
    }

    if(profileModal) profileModal.style.display = 'flex';
}

// PROFİL GÜNCELLEME (7 GÜN KURALI VE ÇAKIŞMA DENETİMİ İLE)
if(saveProfileBtn) {
    saveProfileBtn.onclick = async () => {
        if (!currentUser) return;
        let isAdmin = currentUser.email === ADMIN_EMAIL;

        const newName = modalUserName ? modalUserName.value.trim() : "";
        const usernameElem = document.getElementById('modalUserUsername');
        const newUsername = usernameElem ? usernameElem.value.trim().toLowerCase() : "";
        const instaElem = document.getElementById('modalUserInstagram');
        const newInsta = instaElem ? instaElem.value.trim() : "";

        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};

        if (isAdmin) {
            // Yönetici ad soyad ve kullanıcı adını değiştiremez ama Instagram adresini güncelleyebilir/kaydedebilir
            await userRef.update({
                instagram: newInsta,
                name: "yönetici",
                username: "admin"
            });
            alert("Yönetici profil bilgileriniz başarıyla güncellendi!");
            if(profileModal) profileModal.style.display = 'none';
            loadPosts();
            return;
        }

        // 7 Gün Kuralı Kontrolü (Normal kullanıcılar için)
        const currentTime = Date.now();
        const lastChange = userData.lastUsernameChange || 0;
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

        if (newUsername !== userData.username) {
            if (currentTime - lastChange < sevenDaysInMs) {
                const remainingDays = Math.ceil((sevenDaysInMs - (currentTime - lastChange)) / (1000 * 60 * 60 * 24));
                alert(`Kullanıcı adınızı değiştirmek için ${remainingDays} gün daha beklemelisiniz! (7 günde bir değiştirilebilir)`);
                return;
            }

            // Başka bir kullanıcı bu kullanıcı adını almış mı?
            const checkQuery = await db.collection('users').where('username', '==', newUsername).get();
            if (!checkQuery.empty) {
                let suggested = newUsername + Math.floor(Math.random() * 900 + 100);
                alert(`Bu kullanıcı adı başka biri tarafından kullanılıyor! Önerilen alternatif: @${suggested}`);
                return;
            }
        }

        let updateData = {
            name: newName,
            instagram: newInsta
        };

        if (newUsername !== userData.username) {
            updateData.username = newUsername;
            updateData.lastUsernameChange = currentTime;
        }

        await userRef.update(updateData);
        await currentUser.updateProfile({ displayName: newName });
        
        alert("Profiliniz başarıyla güncellendi!");
        if(profileModal) profileModal.style.display = 'none';
        loadPosts();
    };
}

// MODAL KAPATMA
if(closeProfileModal) {
    closeProfileModal.addEventListener('click', () => { if(profileModal) profileModal.style.display = 'none'; });
}

// ÇIKIŞ YAP
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => { if(profileModal) profileModal.style.display = 'none'; });
    });
}

// HESABI SİLME
if(deleteAccountBtn) {
    deleteAccountBtn.onclick = async () => {
        let confirmDelete = confirm("Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.");
        if (!confirmDelete) return;

        try {
            const batch = db.batch();
            const postsSnap = await db.collection('posts').where('uid', '==', currentUser.uid).get();
            postsSnap.forEach(doc => {
                batch.update(doc.ref, { userName: "Bu kullanıcı mevcut değildir", userPhoto: "", deletedUser: true, instagram: "" });
            });
            await batch.commit();

            await db.collection('users').doc(currentUser.uid).delete();
            await currentUser.delete();
            alert("Hesabınız başarıyla silindi.");
            if(profileModal) profileModal.style.display = 'none';
        } catch (error) {
            alert("Güvenlik nedeniyle tekrar giriş yapıp silmeniz gerekebilir: " + error.message);
            auth.signOut();
        }
    };
}

// GÖNDERİ PAYLAŞMA
if(submitPostBtn) {
    submitPostBtn.addEventListener('click', async () => {
        const content = postContent ? postContent.value.trim() : "";
        if (!content) return alert("Lütfen bir şeyler yazın!");

        let isAdmin = currentUser.email === ADMIN_EMAIL;
        let userData = (await db.collection('users').doc(currentUser.uid).get()).data() || {};

        let pollData = null;
        if (isPoll && isPoll.checked) {
            pollData = { question: content, yes: [], no: [] };
        }

        await db.collection('posts').add({
            uid: currentUser.uid,
            userName: isAdmin ? "yönetici" : (userData.name || currentUser.displayName || "Sultanbeyli Sakini"),
            userPhoto: currentUser.photoURL || userData.photoURL || "https://via.placeholder.com/40",
            isAdmin: isAdmin,
            content: content,
            poll: pollData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        if(postContent) postContent.value = "";
        if(isPoll) isPoll.checked = false;
        loadPosts();
    });
}

// BAŞKA KULLANICI PROFİLİNİ GÖRÜNTÜLEME
window.viewUserProfile = async function(uid) {
    if(!uid) return;
    const userDoc = await db.collection('users').doc(uid).get();
    if(!userDoc.exists) {
        return alert("Bu kullanıcı mevcut değildir.");
    }
    let data = userDoc.data();
    alert(`Kullanıcı: ${data.name}\nKullanıcı Adı: @${data.username || 'kullanici'}`);
};

// AKIŞI YÜKLEME VE İNSTAGRAM İKONU ENTEGRASYONU
function loadPosts() {
    if(!postsContainer) return;
    db.collection('posts').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        postsContainer.innerHTML = "";
        snapshot.forEach(async (doc) => {
            const post = doc.data();
            const postId = doc.id;
            
            let isDeleted = post.deletedUser === true;
            let displayName = isDeleted ? "Bu kullanıcı mevcut değildir" : (post.userName || "yönetici");
            let displayPhoto = isDeleted ? "https://via.placeholder.com/40?text=X" : (post.userPhoto || "https://via.placeholder.com/40");

            let instaIconHtml = "";
            if (!isDeleted && post.uid) {
                const uDoc = await db.collection('users').doc(post.uid).get();
                if (uDoc.exists && uDoc.data().instagram) {
                    let instaLink = uDoc.data().instagram;
                    instaIconHtml = `<a href="${instaLink}" target="_blank" style="margin-left:8px; color:#E1306C; font-size:1.1rem;"><i class="fa-brands fa-instagram"></i></a>`;
                }
            }

            let pollHtml = "";
            if (post.poll) {
                const yesCount = post.poll.yes.length;
                const noCount = post.poll.no.length;
                const hasVotedYes = currentUser && post.poll.yes.includes(currentUser.uid);
                const hasVotedNo = currentUser && post.poll.no.includes(currentUser.uid);

                pollHtml = `
                    <div class="poll-area">
                        <p><strong>Anket:</strong> ${post.poll.question}</p>
                        <div class="poll-buttons">
                            <button onclick="votePoll('${postId}', 'yes')" class="btn-success" ${hasVotedYes ? 'disabled' : ''}>Evet (${yesCount})</button>
                            <button onclick="votePoll('${postId}', 'no')" class="btn-danger" ${hasVotedNo ? 'disabled' : ''}>Hayır (${noCount})</button>
                        </div>
                    </div>
                `;
            }

            postsContainer.innerHTML += `
                <div class="post-card">
                    <div class="post-header">
                        <img src="${displayPhoto}" class="post-avatar">
                        <div class="post-user-info">
                            <h4><span style="cursor:pointer;" onclick="viewUserProfile('${post.uid}')">${displayName}</span> ${instaIconHtml} ${post.isAdmin ? '<span class="admin-badge">YÖNETİCİ</span>' : ''}</h4>
                            <span>${post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString('tr-TR') : 'Yükleniyor...'}</span>
                        </div>
                    </div>
                    <div class="post-body">${post.content}</div>
                    ${pollHtml}
                </div>
            `;
        });
    });
}

// ANKET OY VERME FONKSİYONU
window.votePoll = async function(postId, choice) {
    if (!currentUser) return alert("Oy vermek için giriş yapmalısınız!");
    
    const postRef = db.collection('posts').doc(postId);
    const doc = await postRef.get();
    if (!doc.exists) return;

    let poll = doc.data().poll;
    
    poll.yes = poll.yes.filter(id => id !== currentUser.uid);
    poll.no = poll.no.filter(id => id !== currentUser.uid);

    if (choice === 'yes') poll.yes.push(currentUser.uid);
    if (choice === 'no') poll.no.push(currentUser.uid);

    await postRef.update({ poll: poll });
};
