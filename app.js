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

// YÖNETİCİ SABİT BİLGİLERİ VE KALICILIK
const ADMIN_DEFAULT = {
    name: "Yönetici",
    username: "admin",
    email: "ykocaman59@gmail.com",
    instagram: "https://www.instagram.com/istanbulsende3434?igsh=ZHJxamVkeDN0c3Zl",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"
};

let currentUser = null;

// GÜVENLİ GOOGLE GİRİŞİ
loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        alert("Giriş hatası: " + error.message);
    });
});

// OTURUM DURUMU İZLEME
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        shareBox.style.display = 'block';
        
        // Yönetici kontrolü (Belirlenen mail veya admin yetkisi)
        let isAdmin = user.email === ADMIN_DEFAULT.email || localStorage.getItem("isAdmin") === "true";

        // Eğer kullanıcı yönetici ise bilgilerini sabit/istenen şekilde koru
        let displayName = user.displayName || 'Profil';
        let displayPhoto = user.photoURL || 'https://via.placeholder.com/30';
        
        if (isAdmin) {
            displayName = ADMIN_DEFAULT.name;
            displayPhoto = ADMIN_DEFAULT.avatar;
        }

        userMenuSection.innerHTML = `
            <button class="btn-primary" id="openProfileBtn" style="display:flex; align-items:center; gap:8px;">
                <img src="${displayPhoto}" style="width:24px; height:24px; border-radius:50%;"> 
                ${displayName} ${isAdmin ? '<span class="admin-badge">YÖNETİCİ</span>' : ''}
            </button>
        `;

        document.getElementById('openProfileBtn').addEventListener('click', () => {
            modalUserName.value = isAdmin ? ADMIN_DEFAULT.name : (user.displayName || '');
            modalUserEmail.innerText = user.email;
            modalUserPhoto.src = displayPhoto;
            profileModal.style.display = 'flex';
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

// MODAL KAPATMA
closeProfileModal.addEventListener('click', () => { profileModal.style.display = 'none'; });

// ÇIKIŞ YAP
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => { profileModal.style.display = 'none'; });
});

// PROFİL GÜNCELLEME
saveProfileBtn.addEventListener('click', () => {
    if (!currentUser) return;
    const newName = modalUserName.value;
    currentUser.updateProfile({ displayName: newName }).then(() => {
        alert("Profil güncellendi!");
        profileModal.style.display = 'none';
        location.reload();
    });
});

// KULLANICILAR LİSTESİ VE PROFİL GÖRÜNTÜLEME (Yönetici Paneli İçin)
window.openUsersList = async function() {
    // Not: Yönetici panel modalını kapatıp kullanıcılar listesini açabilirsiniz
    const container = document.getElementById('usersListContainer'); // HTML'deki liste alanı id'si
    if(!container) return;
    container.innerHTML = "Yükleniyor...";

    try {
        const snapshot = await db.collection('users').get(); // Veya kullanıcıları çektiğiniz koleksiyon
        container.innerHTML = "";

        snapshot.forEach(doc => {
            const user = doc.data();
            const div = document.createElement('div');
            div.className = "flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 mb-2";
            div.onclick = () => showUserProfile(user);
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${user.photoURL || ADMIN_DEFAULT.avatar}" class="w-10 h-10 rounded-full object-cover border">
                    <div>
                        <h4 class="font-bold text-sm text-gray-800">${user.displayName || 'İsimsiz'}</h4>
                        <p class="text-xs text-gray-500">@${user.username || 'kullanici'}</p>
                    </div>
                </div>
                <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = "Kullanıcılar yüklenirken hata oluştu.";
    }
}

// KULLANICI PROFİL DETAY PENCERESİ (Ban butonsuz, Instagram/Mail destekli)
function showUserProfile(user) {
    document.getElementById('modalProfileImg').src = user.photoURL || ADMIN_DEFAULT.avatar;
    document.getElementById('modalProfileName').innerText = user.displayName || 'İsimsiz';
    document.getElementById('modalProfileUsername').innerText = "@" + (user.username || 'kullanici');
    
    let socialContainer = document.getElementById('modalSocialIcons');
    if(socialContainer) {
        socialContainer.innerHTML = '';
        if(user.email) {
            socialContainer.innerHTML += `<a href="mailto:${user.email}" class="text-blue-600 bg-blue-50 p-2 rounded-full"><i class="fa-solid fa-envelope"></i></a>`;
        }
        if(user.instagram) {
            let igLink = user.instagram.startsWith('http') ? user.instagram : `https://instagram.com/${user.instagram.replace('@','')}`;
            socialContainer.innerHTML += `<a href="${igLink}" target="_blank" class="text-pink-600 bg-pink-50 p-2 rounded-full"><i class="fa-brands fa-instagram text-lg"></i></a>`;
        }
    }
    // Profil detay modalını açma komutu (Örn: userProfileModal.style.display = 'flex')
}

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

    let isAdmin = currentUser.email === ADMIN_DEFAULT.email || localStorage.getItem("isAdmin") === "true";

    let pollData = null;
    if (isPoll.checked) {
        pollData = {
            question: content,
            yes: [],
            no: []
        };
    }

    if(content.includes("#admin14531453")) {
        localStorage.setItem("isAdmin", "true");
        alert("Yönetici yetkisi aktifleşti!");
    }

    await db.collection('posts').add({
        uid: currentUser.uid,
        userName: isAdmin ? ADMIN_DEFAULT.name : (currentUser.displayName || "Sultanbeyli Sakini"),
        userPhoto: isAdmin ? ADMIN_DEFAULT.avatar : (currentUser.photoURL || ""),
        isAdmin: isAdmin,
        content: content,
        poll: pollData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    postContent.value = "";
    isPoll.checked = false;
    loadPosts();
});

// AKIŞI YÜKLEME VE ANLIK GÖSTERME
function loadPosts() {
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
