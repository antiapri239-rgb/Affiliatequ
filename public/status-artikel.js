// ==========================================
// KONFIGURASI REPO KAMU
// ==========================================
const GITHUB_USER = "antiapri239-rgb";
const GITHUB_REPO = "Affiliatequ";
const GITHUB_BRANCH = "main";
const CONTENT_FOLDER = "src/content/blog";
// ==========================================

const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${CONTENT_FOLDER}?ref=${GITHUB_BRANCH}`;

async function fetchArticles() {
  const tbody = document.getElementById('table-body');
  
  try {
    // 1. Ambil daftar file dari GitHub API
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Gagal akses GitHub API. Cek Username/Repo/Folder.");
    const files = await response.json();

    // 2. Filter cuma file .md atau .mdx
    const mdFiles = files.filter(file => file.name.endsWith('.md') || file.name.endsWith('.mdx'));
    tbody.innerHTML = ''; 

    if (mdFiles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" class="loading">Belum ada artikel di folder ini.</td></tr>';
      return;
    }

    // 3. Looping setiap file buat narik isinya
    for (const file of mdFiles) {
      const rawResponse = await fetch(file.download_url);
      const markdownText = await rawResponse.text();

      // Ambil data dari Frontmatter
      // Cek title (bisa pakai tanda kutip atau enggak)
      const titleMatch = markdownText.match(/title:\s*["']?(.*?)["']?\n/);
      // Cek draft: true atau draft: false
      const draftMatch = markdownText.match(/draft:\s*(true|false)/);
      
      const title = titleMatch ? titleMatch[1] : file.name;
      const isDraft = draftMatch ? draftMatch[1] === 'true' : false;
      
      // Tentukan status & class badge
      const statusText = isDraft ? 'DRAFT' : 'PUBLISHED';
      const badgeClass = isDraft ? 'badge-draft' : 'badge-published';

      // Buat baris tabel
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${title}</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
      `;
      tbody.appendChild(tr);
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="2" style="color:red; text-align:center;">Error: ${error.message}</td></tr>`;
  }
}

// Jalankan fungsi saat halaman dimuat
fetchArticles();
