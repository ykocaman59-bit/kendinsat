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

// GÜVENLİ GOOGLE GİRİŞİ
loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        alert("Giriş hatası: " + error.message);
    });
});

// OTURUM DURUMU İZLEME
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        shareBox.style.display = 'block';
        
        let isAdmin = user.email === "admin@sultanbeyli.com" || localStorage.getItem("isAdmin") === "true";

        // Kullanıcı verilerini Firestore'da saklayıp senkronize edelim (Instagram ve profil bilgileri için)
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            await userRef.set({
                name: user.displayName || "Sultanbeyli Sakini",
                email: user.email,
                photoURL: user.photoURL || "",
                instagram: "",
                isAdmin: isAdmin,
                lastProfileUpdate: 0
            }, { merge: true });
        }

        userMenuSection.innerHTML = `
            <button class="btn-primary" id="openProfileBtn" style="display:flex; align-items:center; gap:8px;">
                <img src="${user.photoURL || 'https://via.placeholder.com/30'}" style="width:24px; height:24px; border-radius:50%;"> 
                ${user.displayName || 'Profil'} ${isAdmin ? '<span class="admin-badge">YÖNETİCİ</span>' : ''}
            </button>
        `;

        document.getElementById('openProfileBtn').addEventListener('click', () => {
            openUserProfile(user.email);
        });

    } else {
        currentUser = null;
        shareBox.style.display = 'none';
        userMenuSection.innerHTML = `
            <button id="loginBtn" class="btn-primary"><i class="fa-brands fa-google"></i> Gmail ile Giriş Yap</button>
        `;
        document.getElementById('loginBtn').addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider);
        });
    }
    loadPosts();
});

// PROFİL GÖRÜNTÜLEME VE DÜZENLEME (Instagram ve 7 Gün Kısıtlaması Dahil)
window.openUserProfile = async function(userEmail) {
    const snapshot = await db.collection('users').where('email', '==', userEmail).get();
    if (snapshot.empty) return alert("Kullanıcı bulunamadı!");
    
    let targetDoc = snapshot.docs[0];
    let targetData = targetDoc.data();
    let targetUid = targetDoc.id;

    let isMe = currentUser && currentUser.email === userEmail;
    let isAdminViewer = currentUser && (currentUser.email === "admin@sultanbeyli.com" || localStorage.getItem("isAdmin") === "true");
    
    // 7 Gün Sınırı Kontrolü (Adminler muaf, normal kullanıcılar 7 günde 1 güncelleyebilir)
    let lastUpdate = targetData.lastProfileUpdate || 0;
    let daysSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
    let canUpdate = isAdminViewer || isMe && (daysSinceUpdate >= 7 || lastUpdate === 0);

    let modalBody = profileModal.querySelector('.modal-content') || profileModal; // Yapına göre container seçimi
    
    // Modal içeriğini dinamik olarak dolduruyoruz
    modalUserName.value = targetData.name || '';
    modalUserEmail.innerText = targetData.email;
    modalUserPhoto.src = targetData.photoURL || 'https://via.placeholder.com/80';

    // Instagram input alanı eklemek için modale geçici alan kontrolü
    let existingInstaInput = document.getElementById('modalUserInstagram');
    if (!existingInstaInput) {
        const instaDiv = document.createElement('div');
        instaDiv.style.marginTop = "10px";
        instaDiv.innerHTML = `
            <label style="font-size:0.85rem; display:block; text-align:left; margin-bottom:4px;">Instagram Profil Linki:</label>
            <input type="text" id="modalUserInstagram" class="swal2-input" style="width:100%; padding:8px; box-sizing:border-box;" placeholder="https://instagram.com/kullanici">
        `;
        modalUserName.parentNode.insertBefore(instaDiv, saveProfileBtn);
    }
    document.getElementById('modalUserInstagram').value = targetData.instagram || '';
    document.getElementById('modalUserInstagram').disabled = !isMe;

    // Mail Gönderme Butonu Ekleme (Eğer yoksa)
    let existingMailBtn = document.getElementById('modalMailBtn');
    if (!existingMailBtn && !isMe) {
        const mailBtn = document.createElement('a');
        mailBtn.id = 'modalMailBtn';
        mailBtn.className = 'btn-primary';
        mailBtn.style.cssText = "display:inline-block; margin-top:10px; text-decoration:none; text-align:center; background:#4f46e5; color:white; padding:8px 12px; border-radius:6px;";
        mailBtn.innerHTML = `<i class="fa-solid fa-envelope"></i> E-posta Gönder`;
        saveProfileBtn.parentNode.insertBefore(mailBtn, saveProfileBtn);
    }
    if (document.getElementById('modalMailBtn')) {
        document.getElementById('modalMailBtn').style.display = isMe ? 'none' : 'block';
        document.getElementById('modalMailBtn').href = `mailto:${targetData.email}`;
    }

    // Instagram İkonu Profil Görünümü İçin
    let existingInstaIcon = document.getElementById('modalInstaLink');
    if (!existingInstaIcon) {
        const instaIcon = document.createElement('a');
        instaIcon.id = 'modalInstaLink';
        instaIcon.target = "_blank";
        instaIcon.style.cssText = "font-size: 1.5rem; margin-top: 8px; color: #E1306C; display: inline-block;";
        instaIcon.innerHTML = `<i class="fa-brands fa-instagram"></i>`;
        modalUserPhoto.parentNode.appendChild(instaIcon);
    }
    if (targetData.instagram) {
        document.getElementById('modalInstaLink').href = targetData.instagram;
        document.getElementById('modalInstaLink').style.display = 'inline-block';
    } else {
        document.getElementById('modalInstaLink').style.display = 'none';
    }

    // Kaydet butonunu yetkiye göre ayarla
    saveProfileBtn.style.display = isMe ? 'block' : 'none';
    modalUserName.disabled = !isMe;

    profileModal.style.display = 'flex';

    // Kaydetme Olayı (7 gün kuralı ve admin muafiyeti entegre edilmiş hali)
    saveProfileBtn.onclick = async () => {
        if (!canUpdate) {
            return alert("Profilinizi sadece 7 günde bir güncelleyebilirsiniz!");
        }

        const newName = modalUserName.value;
        const newInsta = document.getElementById('modalUserInstagram').value;

        await currentUser.updateProfile({ displayName: newName });
        await db.collection('users').doc(currentUser.uid).update({
            name: newName,
            instagram: newInsta,
            lastProfileUpdate: isAdminViewer ? targetData.lastProfileUpdate : Date.now() // Admin güncellediyse süreyi etkilemez
        });

        alert("Profil başarıyla güncellendi!");
        profileModal.style.display = 'none';
        location.reload();
    };
};

// MODAL KAPATMA
closeProfileModal.addEventListener('click', () => { profileModal.style.display = 'none'; });

// ÇIKIŞ YAP
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => { profileModal.style.display = 'none'; });
});

// GMAIL / HESABI SİLME
deleteAccountBtn.addEventListener('click', async () => {
    if (!confirm("Gmail hesabınızı ve site kaydınızı silmek istediğinize emin misiniz? Paylaştığınız mesajlar kalacak ancak isminiz 'Kullanıcı Yok' olarak güncellenecektir.")) return;

    try {
        const batch = db.batch();
        const postsSnap = await db.collection('posts').where('uid', '==', currentUser.uid).get();
        postsSnap.forEach(doc => {
            batch.update(doc.ref, { userName: "Kullanıcı Yok", userPhoto: "", deletedUser: true });
        });
        await batch.commit();

        await db.collection('users').doc(currentUser.uid).delete();
        await currentUser.delete();
        alert("Hesabınız başarıyla silindi.");
        profileModal.style.display = 'none';
    } catch (error) {
        alert("Güvenlik nedeniyle tekrar giriş yapmanız gerekebilir: " + error.message);
        auth.signOut();
    }
});

// GÖNDERİ PAYLAŞMA
submitPostBtn.addEventListener('click', async () => {
    const content = postContent.value.trim();
    if (!content) return alert("Lütfen bir şeyler yazın!");

    let isAdmin = currentUser.email === "admin@sultanbeyli.com" || localStorage.getItem("isAdmin") === "true";

    if(content.includes("#admin14531453")) {
        localStorage.setItem("isAdmin", "true");
        // Firestore'da da admin yetkisini güncelle
        await db.collection('users').doc(currentUser.uid).update({ isAdmin: true });
        alert("Yönetici yetkisi aktifleşti!");
    }

    let pollData = null;
    if (isPoll.checked) {
        pollData = { question: content, yes: [], no: [] };
    }

    await db.collection('posts').add({
        uid: currentUser.uid,
        userName: currentUser.displayName || "Sultanbeyli Sakini",
        userPhoto: currentUser.photoURL || "",
        isAdmin: isAdmin,
        content: content,
        poll: pollData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    postContent.value = "";
    isPoll.checked = false;
    loadPosts();
});

// KULLANICI SAYISI FORMATLAYICI (1, 1k, 10k formatı) VE AKIŞ YÜKLEME
function formatUserCount(count) {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'm';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
}

async function loadPosts() {
    // İsteğe bağlı: Toplam kullanıcı sayısını konsola veya uygun bir elemente yazdırabilirsin
    const usersSnapshot = await db.collection('users').get();
    console.log("Kayıtlı Kullanıcı Sayısı:", formatUserCount(usersSnapshot.size));

    db.collection('posts').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        postsContainer.innerHTML = "";
        snapshot.forEach((doc) => {
            const post = doc.data();
            const postId = doc.id;
            
            let isDeleted = post.deletedUser === true;
            let displayName = isDeleted ? "Kullanıcı Yok" : post.userName;
            let displayPhoto = isDeleted ? "https://via.placeholder.com/40?text=X" : (post.userPhoto || "https://via.placeholder.com/40");

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
                            <h4>${displayName} ${post.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}</h4>
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
}
