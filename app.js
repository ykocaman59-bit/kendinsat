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
let allUsersCache = []; 
let selectedAppealId = null;
let selectedAppealUserId = null;

const getDisplayName = (post) => post.isAdmin ? "Yönetici" : (post.userName || "Sultanbeyli Sakini");

// OTURUM DURUMU İZLEME
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        if(shareBox) shareBox.style.display = 'block';
        
        let isAdmin = user.email === ADMIN_DEFAULT.email || localStorage.getItem("isAdmin") === "true";

        let displayName = user.displayName || 'Profil';
        let displayPhoto = user.photoURL || 'https://via.placeholder.com/30';
        
        if (isAdmin) {
            displayName = ADMIN_DEFAULT.name; 
            displayPhoto = ADMIN_DEFAULT.avatar;
        }

        if(userMenuSection) {
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
        }
    } else {
        currentUser = null;
        if(shareBox) shareBox.style.display = 'none';
        if(userMenuSection) {
            userMenuSection.innerHTML = `
                <button id="loginBtn" class="btn-primary"><i class="fa-brands fa-google"></i> Gmail ile Giriş Yap</button>
            `;
            document.getElementById('loginBtn').addEventListener('click', () => {
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider);
            });
        }
    }
    loadPosts();
    checkAppealsCount();
});

if(closeProfileModal) {
    closeProfileModal.addEventListener('click', () => { profileModal.style.display = 'none'; });
}

if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => { profileModal.style.display = 'none'; });
    });
}

if(saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        if (!currentUser) return;
        const newName = modalUserName.value;
        currentUser.updateProfile({ displayName: newName }).then(() => {
            alert("Profil güncellendi!");
            profileModal.style.display = 'none';
            location.reload();
        });
    });
}

// 1. İTİRAZLAR SAYACI (0 İse hiç görünmez, yazı kalır)
async function checkAppealsCount() {
    try {
        const snapshot = await db.collection('appeals').where('read', '==', false).get();
        const count = snapshot.size;
        const badge = document.getElementById('appealCountBadge');
        if (badge) {
            if (count > 0) {
                badge.innerText = count;
                badge.style.display = "inline-block";
            } else {
                badge.innerText = "";
                badge.style.display = "none";
            }
        }
    } catch (e) {
        console.log("İtirazlar yüklenemedi");
    }
}

// 2. İTİRAZLAR LİSTESİNİ AÇMA
window.openAdminAppeals = async function() {
    const container = document.getElementById('adminAppealsListContainer');
    const modal = document.getElementById('adminAppealsModal');
    if(modal) modal.style.display = 'flex';
    if(!container) return;

    container.innerHTML = "Yükleniyor...";
    try {
        const snapshot = await db.collection('appeals').orderBy('createdAt', 'desc').get();
        container.innerHTML = "";

        if(snapshot.empty) {
            container.innerHTML = "<p class='text-xs text-gray-500 text-center py-4'>Hiç itiraz yok.</p>";
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const isUnread = data.read === false;
            
            const div = document.createElement('div');
            div.className = `p-3 mb-2 rounded-xl border flex items-center justify-between cursor-pointer ${isUnread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`;
            // Tıklandığında detay modalını açacak ve verileri aktaracak
            div.onclick = () => openAppealDetail(doc.id, data.userId, data.reason || data.content);
            
            div.innerHTML = `
                <div>
                    <h4 class="font-bold text-sm text-gray-800">${data.userName || 'Kullanıcı'} ${isUnread ? '<span class="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded ml-1">Yeni</span>' : ''}</h4>
                    <p class="text-xs text-gray-500 truncate max-w-[250px]">${data.reason || data.content || 'Açıklama yok'}</p>
                </div>
                <button class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-medium">İncele</button>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = "İtirazlar yüklenirken hata oluştu.";
    }
}

// 3. İTİRAZ DETAYINI GÖSTERME VE OKUNDU İŞARETLEME
window.openAppealDetail = async function(appealId, userId, reasonText) {
    selectedAppealId = appealId;
    selectedAppealUserId = userId;

    const detailContent = document.getElementById('appealDetailContent');
    if(detailContent) detailContent.innerText = reasonText || "Açıklama belirtilmemiş.";

    const detailModal = document.getElementById('appealDetailModal');
    if(detailModal) detailModal.style.display = 'flex';

    // Tıklandığı an okundu yap ve sayacı düşür
    try {
        await db.collection('appeals').doc(appealId).update({ read: true });
        checkAppealsCount(); 
    } catch(e) {
        console.log("Okundu işaretlenemedi", e);
    }
}

// 4. KABUL ET VEYA REDDET
window.resolveAppeal = async function(isApproved) {
    if(!selectedAppealId) {
        alert("Geçersiz itiraz ID'si!");
        return;
    }

    try {
        if(isApproved) {
            // Kabul edildiyse banı kaldır
            if(selectedAppealUserId) {
                await db.collection('bannedUsers').doc(selectedAppealUserId).delete();
            }
            alert("İtiraz onaylandı ve kullanıcının banı kaldırıldı!");
        } else {
            alert("İtiraz reddedildi. Kullanıcının banı devam ediyor.");
        }

        // İtiraz talebini listeden sil
        await db.collection('appeals').doc(selectedAppealId).delete();

        // Modalleri kapat
        const detailModal = document.getElementById('appealDetailModal');
        const appealsModal = document.getElementById('adminAppealsModal');
        if(detailModal) detailModal.style.display = 'none';
        if(appealsModal) appealsModal.style.display = 'none';
        
        checkAppealsCount();

    } catch (e) {
        alert("İşlem sırasında hata oluştu: " + e.message);
    }
}

// DİĞER YÖNETİCİ VE GÖNDERİ FONKSİYONLARI
window.openAdminUsersList = async function() {
    const container = document.getElementById('adminUsersListContainer') || document.getElementById('usersListContainer');
    if(!container) return;
    
    container.innerHTML = `
        <input type="text" id="userSearch" placeholder="Kullanıcı adı veya isim ara..." class="w-full p-2 mb-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <div id="userResults" class="space-y-2 max-h-60 overflow-y-auto">Yükleniyor...</div>
    `;

    const modalEl = document.getElementById('adminUsersModal') || document.getElementById('usersListModal');
    if(modalEl) modalEl.style.display = 'flex';

    try {
        const snapshot = await db.collection('users').get();
        allUsersCache = [];
        snapshot.forEach(doc => {
            allUsersCache.push({ id: doc.id, ...doc.data() });
        });

        renderUserList(allUsersCache);

        document.getElementById('userSearch').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allUsersCache.filter(u => 
                (u.displayName && u.displayName.toLowerCase().includes(query)) || 
                (u.username && u.username.toLowerCase().includes(query))
            );
            renderUserList(filtered);
        });
    } catch (e) {
        document.getElementById('userResults').innerHTML = "Kullanıcılar yüklenirken hata oluştu.";
    }
}

function renderUserList(users) {
    const resultsContainer = document.getElementById('userResults');
    if(!resultsContainer) return;
    resultsContainer.innerHTML = "";

    if(users.length === 0) {
        resultsContainer.innerHTML = "<p class='text-xs text-gray-500 text-center py-2'>Kullanıcı bulunamadı.</p>";
        return;
    }

    users.forEach(user => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100";
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
        resultsContainer.appendChild(div);
    });
}

function showUserProfile(user) {
    const profileImg = document.getElementById('modalProfileImg');
    const profileName = document.getElementById('modalProfileName');
    const profileUsername = document.getElementById('modalProfileUsername');
    
    if(profileImg) profileImg.src = user.photoURL || ADMIN_DEFAULT.avatar;
    if(profileName) profileName.innerText = user.displayName || 'İsimsiz';
    if(profileUsername) profileUsername.innerText = "@" + (user.username || 'kullanici');
    
    let actionsContainer = document.getElementById('profileActions');
    if(actionsContainer) {
        actionsContainer.innerHTML = `
            <div class="flex gap-2 mt-4 pt-3 border-t">
                <button onclick="banUser('${user.id}', '${user.displayName || 'Kullanıcı'}')" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2">
                    <i class="fa-solid fa-ban"></i> Banla
                </button>
            </div>
        `;
    }

    const modalEl = document.getElementById('userProfileModal');
    if(modalEl) modalEl.style.display = 'flex';
}

window.banUser = async function(userId, userName) {
    if(!confirm(`"${userName}" adlı kullanıcıyı banlamak istediğinize emin misiniz?`)) return;
    try {
        await db.collection('bannedUsers').doc(userId).set({
            bannedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Kullanıcı başarıyla banlandı.");
    } catch(e) {
        alert("Banlama işleminde hata oluştu: " + e.message);
    }
};

if(deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
        if (!confirm("Gmail hesabınızı ve site kaydınızı silmek istediğinize emin misiniz?")) return;
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
}

if(submitPostBtn) {
    submitPostBtn.addEventListener('click', async () => {
        const content = postContent.value.trim();
        if (!content) return alert("Lütfen bir şeyler yazın!");

        let isAdmin = currentUser.email === ADMIN_DEFAULT.email || localStorage.getItem("isAdmin") === "true";

        let pollData = null;
        if (isPoll && isPoll.checked) {
            pollData = { question: content, yes: [], no: [] };
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
        if(isPoll) isPoll.checked = false;
        loadPosts();
    });
}

function loadPosts() {
    if(!postsContainer) return;
    db.collection('posts').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        postsContainer.innerHTML = "";
        snapshot.forEach((doc) => {
            const post = doc.data();
            const postId = doc.id;
            
            let isDeleted = post.deletedUser === true;
            let displayName = isDeleted ? "Kullanıcı Yok" : getDisplayName(post);
            let displayPhoto = isDeleted ? "https://via.placeholder.com/40?text=X" : (post.userPhoto && post.userPhoto !== "" ? post.userPhoto : "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName) + "&background=random");

            let pollHtml = "";
            if (post.poll) {
                const yesCount = post.poll.yes.length;
                const noCount = post.poll.no.length;
                const hasVotedYes = currentUser && post.poll.yes.includes(currentUser.uid);
                const hasVotedNo = currentUser && post.poll.no.includes(currentUser.uid);

                pollHtml = `
                    <div class="poll-area mt-3 p-3 bg-gray-50 rounded-xl">
                        <p class="mb-2 text-sm font-medium"><strong>Anket:</strong> ${post.poll.question}</p>
                        <div class="flex gap-2 poll-buttons">
                            <button onclick="votePoll('${postId}', 'yes')" class="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded-lg" ${hasVotedYes ? 'disabled' : ''}>Evet (${yesCount})</button>
                            <button onclick="votePoll('${postId}', 'no')" class="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg" ${hasVotedNo ? 'disabled' : ''}>Hayır (${noCount})</button>
                        </div>
                    </div>
                `;
            }

            postsContainer.innerHTML += `
                <div class="post-card bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-100">
                    <div class="flex items-center gap-3 mb-3 post-header">
                        <img src="${displayPhoto}" class="w-10 h-10 rounded-full object-cover border post-avatar" onerror="this.src='https://via.placeholder.com/40'">
                        <div class="post-user-info">
                            <h4 class="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                                ${displayName} ${post.isAdmin ? '<span class="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold admin-badge">YÖNETİCİ</span>' : ''}
                            </h4>
                            <span class="text-[11px] text-gray-400">${post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString('tr-TR') : 'Yükleniyor...'}</span>
                        </div>
                    </div>
                    <div class="post-body text-sm text-gray-700 leading-relaxed">${post.content}</div>
                    ${pollHtml}
                </div>
            `;
        });
    });
}

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
