let listings = [
    {
        id: 1001,
        title: "Merkezi Konumda Ara Kat 3+1 Satılık Daire",
        category: "Emlak",
        price: 3450000,
        location: "İstanbul / Sultanbeyli",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=500",
        details: { rooms: "3+1", sqm: "135 m²" },
        date: "12 Ağustos 2026"
    },
    {
        id: 1002,
        title: "Hatasız Boyasız Aile Aracı - Otomatik Vites",
        category: "Vasıta",
        price: 980000,
        location: "Ankara / Çankaya",
        image: "https://images.unsplash.com/photo-1550355191-aa866153207d?auto=format&fit=crop&q=80&w=500",
        details: { year: 2021, km: "45.000" },
        date: "13 Ağustos 2026"
    }
];

window.onload = function() {
    renderDynamicFilters();
    renderModalDynamicFields();
    applyFilters();
};

function onCategoryChange() {
    renderDynamicFilters();
    applyFilters();
}

function renderDynamicFilters() {
    const cat = document.getElementById('filterCategory').value;
    const area = document.getElementById('dynamicFilterArea');
    area.innerHTML = '';
    if (cat === 'Emlak') {
        area.innerHTML = `<div><label class="block text-xs font-bold text-gray-600 uppercase mb-1">Oda Sayısı</label><input type="text" id="filterRooms" placeholder="Örn: 3+1" class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs outline-none"></div>`;
    } else if (cat === 'Vasıta') {
        area.innerHTML = `<div><label class="block text-xs font-bold text-gray-600 uppercase mb-1">Maksimum KM</label><input type="number" id="filterKm" placeholder="100000" class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs outline-none"></div>`;
    }
}

function onModalCategoryChange() {
    renderModalDynamicFields();
}

function renderModalDynamicFields() {
    const cat = document.getElementById('newCategory').value;
    const area = document.getElementById('modalDynamicFields');
    area.innerHTML = '';
    if (cat === 'Emlak') {
        area.innerHTML = `<div class="grid grid-cols-2 gap-2"><div><label class="block text-xs font-bold text-gray-600 mb-1">Oda</label><input type="text" id="modalRooms" placeholder="3+1" required class="w-full border rounded-lg p-2 text-xs"></div><div><label class="block text-xs font-bold text-gray-600 mb-1">m²</label><input type="text" id="modalSqm" placeholder="120" required class="w-full border rounded-lg p-2 text-xs"></div></div>`;
    } else if (cat === 'Vasıta') {
        area.innerHTML = `<div class="grid grid-cols-2 gap-2"><div><label class="block text-xs font-bold text-gray-600 mb-1">Yıl</label><input type="number" id="modalYear" placeholder="2022" required class="w-full border rounded-lg p-2 text-xs"></div><div><label class="block text-xs font-bold text-gray-600 mb-1">KM</label><input type="text" id="modalKm" placeholder="50.000" required class="w-full border rounded-lg p-2 text-xs"></div></div>`;
    } else {
        area.innerHTML = `<div><label class="block text-xs font-bold text-gray-600 mb-1">Durum</label><input type="text" id="modalCondition" placeholder="Sıfır / İkinci El" required class="w-full border rounded-lg p-2 text-xs"></div>`;
    }
}

function applyFilters() {
    const category = document.getElementById('filterCategory').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    const minPrice = Number(document.getElementById('minPrice').value) || 0;
    const maxPrice = Number(document.getElementById('maxPrice').value) || Infinity;
    const sort = document.getElementById('sortOrder').value;

    let filtered = listings.filter(item => {
        const matchCat = category === 'Tümü' || item.category === category;
        const matchSearch = item.title.toLowerCase().includes(search) || item.location.toLowerCase().includes(search);
        const matchPrice = item.price >= minPrice && item.price <= maxPrice;
        return matchCat && matchSearch && matchPrice;
    });

    if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else filtered.sort((a, b) => b.id - a.id);

    renderListings(filtered);
}

function renderListings(items) {
    const container = document.getElementById('listingContainer');
    const countSpan = document.getElementById('resultCount');
    container.innerHTML = '';
    countSpan.innerText = `${items.length} ilan listeleniyor`;

    if (items.length === 0) {
        container.innerHTML = `<div class="bg-white p-8 rounded-xl text-center text-gray-400 text-sm border">Arama kriterlerinize uygun ilan bulunamadı.</div>`;
        return;
    }

    items.forEach(item => {
        let badgeInfo = item.category === 'Emlak' ? `${item.details.rooms} • ${item.details.sqm}` : (item.category === 'Vasıta' ? `${item.details.year} • ${item.details.km} km` : 'İkinci El');
        container.innerHTML += `
            <div class="bg-white border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row gap-4 hover:shadow-md transition">
                <div class="w-full sm:w-48 h-36 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start gap-2">
                            <h4 class="text-blue-900 font-bold text-sm sm:text-base">${item.title}</h4>
                            <span class="text-xs text-gray-500 whitespace-nowrap">${item.date}</span>
                        </div>
                        <div class="text-xs text-gray-500 mt-1 mb-2">${badgeInfo}</div>
                    </div>
                    <div class="flex items-end justify-between border-t pt-2">
                        <div class="text-xs text-gray-600"><i class="fa-solid fa-location-dot text-red-500 mr-1"></i>${item.location}</div>
                        <div class="text-lg font-black text-gray-900">${item.price.toLocaleString('tr-TR')} TL</div>
                    </div>
                </div>
            </div>
        `;
    });
}

function openAddModal() { document.getElementById('addModal').classList.remove('hidden'); }
function closeAddModal() { document.getElementById('addModal').classList.add('hidden'); }
function resetFilters() {
    document.getElementById('filterCategory').value = 'Tümü';
    document.getElementById('searchInput').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    onCategoryChange();
}

function handleListingSubmit(e) {
    e.preventDefault();
    const cat = document.getElementById('newCategory').value;
    let details = cat === 'Emlak' ? { rooms: document.getElementById('modalRooms').value, sqm: document.getElementById('modalSqm').value } : (cat === 'Vasıta' ? { year: document.getElementById('modalYear').value, km: document.getElementById('modalKm').value } : { condition: document.getElementById('modalCondition').value });

    listings.unshift({
        id: listings.length + 1001,
        title: document.getElementById('newTitle').value,
        category: cat,
        price: Number(document.getElementById('newPrice').value),
        location: document.getElementById('newLocation').value,
        image: document.getElementById('newImage').value,
        details: details,
        date: "Bugün"
    });
    applyFilters();
    closeAddModal();
    document.getElementById('addListingForm').reset();
}

