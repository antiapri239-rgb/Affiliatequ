// ==========================================
// KONFIGURASI REPO KAMU
// ==========================================
const GITHUB_USER = "antiapri239-rgb";
const GITHUB_REPO = "Affiliatequ";
const GITHUB_BRANCH = "main";
const CONTENT_FOLDER = "src/content/blog";
// ==========================================

const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${CONTENT_FOLDER}?ref=${GITHUB_BRANCH}`;
let allArticles = []; // Simpan data buat fitur search

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

      // Regex buat narik data
      const titleMatch = markdownText.match(/title:\s*["']?(.*?)["']?\n/);
      const draftMatch = markdownText.match(/draft:\s*(true|false)/);
      const dateMatch = markdownText.match(/(pubDate|publish_date|date):\s*["']?(.*?)["']?\n/);

      const title = titleMatch ? titleMatch[1] : file.name;
      const isDraft = draftMatch ? draftMatch[1] === 'true' : false;
      
      // Format tanggal (kalau ada)
      let dateStr = "-";
      if (dateMatch && dateMatch[2]) {
        const d = new Date(dateMatch[2]);
        if (!isNaN(d)) {
          dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      }

      allArticles.push({
        title: title,
        date: dateStr,
        isDraft: isDraft
      });
    }

    renderTable(allArticles, tbody);
    setupSearch(tbody);
    
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="3" style="color:red; text-align:center;">Error: ${error.message}</td></tr>`;
  }
}

function renderTable(data, tbody) {
  tbody.innerHTML = '';
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="loading">Artikel nggak ditemukan.</td></tr>';
    return;
  }

  data.forEach(article => {
    const statusText = article.isDraft ? 'DRAFT' : 'PUBLISHED';
    const badgeClass = article.isDraft ? 'badge-draft' : 'badge-published';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${article.title}</td>
      <td class="date-text">${article.date}</td>
      <td><span class="badge ${badgeClass}">${statusText}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function setupSearch(tbody) {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = allArticles.filter(article => 
      article.title.toLowerCase().includes(keyword)
    );
    renderTable(filtered, tbody);
  });
}

fetchArticles();
