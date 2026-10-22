// ==========================================
// KONFIGURASI REPO KAMU
// ==========================================
const GITHUB_USER = "antiapri239-rgb";
const GITHUB_REPO = "Affiliatequ";
const GITHUB_BRANCH = "main";
const CONTENT_FOLDER = "src/content/blog";
// ==========================================

const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${CONTENT_FOLDER}?ref=${GITHUB_BRANCH}`;
let allArticles = []; 
let currentFilter = 'ALL';
let currentSearch = '';

async function fetchArticles() {
  const tbody = document.getElementById('table-body');
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Gagal akses GitHub API.");
    const files = await response.json();

    const mdFiles = files.filter(file => file.name.endsWith('.md') || file.name.endsWith('.mdx'));
    
    if (mdFiles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="loading">Belum ada artikel.</td></tr>';
      return;
    }

    for (const file of mdFiles) {
      const rawResponse = await fetch(file.download_url);
      const markdownText = await rawResponse.text();

      const titleMatch = markdownText.match(/title:\s*["']?(.*?)["']?\n/);
      const draftMatch = markdownText.match(/draft:\s*(true|false)/);
      const dateMatch = markdownText.match(/(pubDate|publish_date|date):\s*["']?(.*?)["']?\n/);

      const title = titleMatch ? titleMatch[1] : file.name;
      const isDraft = draftMatch ? draftMatch[1] === 'true' : false;
      
      let dateStr = "-";
      let isFutureDate = false;

      if (dateMatch && dateMatch[2]) {
        const d = new Date(dateMatch[2]);
        if (!isNaN(d)) {
          dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          // Cek apakah tanggal di masa depan (hari ini 22 Okt 2026)
          if (d > new Date()) isFutureDate = true;
        }
      }

      // LOGIKA BARU: Cek Jadwal dulu, baru Draft
      let status = 'PUBLISHED';
      if (isFutureDate) {
        status = 'SCHEDULED';
      } else if (isDraft) {
        status = 'DRAFT';
      }

      allArticles.push({
        title: title,
        date: dateStr,
        status: status
      });
    }

    renderTable();
    
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="3" style="color:red; text-align:center;">Error: ${error.message}</td></tr>`;
  }
}

function renderTable() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';

  // Filter berdasarkan tombol DAN pencarian
  const filtered = allArticles.filter(article => {
    const matchStatus = currentFilter === 'ALL' || article.status === currentFilter;
    const matchSearch = article.title.toLowerCase().includes(currentSearch);
    return matchStatus && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="loading">Nggak ada artikel yang cocok.</td></tr>';
    return;
  }

  filtered.forEach(article => {
    let badgeClass = 'badge-published';
    if (article.status === 'DRAFT') badgeClass = 'badge-draft';
    if (article.status === 'SCHEDULED') badgeClass = 'badge-scheduled';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${article.title}</td>
      <td class="date-text">${article.date}</td>
      <td><span class="badge ${badgeClass}">${article.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Event Listeners buat Search & Filter
document.getElementById('searchInput').addEventListener('input', (e) => {
  currentSearch = e.target.value.toLowerCase();
  renderTable();
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Hapus class active dari semua tombol
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    // Tambahin class active ke tombol yang diklik
    e.target.classList.add('active');
    
    currentFilter = e.target.getAttribute('data-filter');
    renderTable();
  });
});

fetchArticles();
