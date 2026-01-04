// CSS untuk tabel responsif
const tableCSS = `
/* Container tabel */
.dtable-container {
  overflow-x: auto;
  margin: 20px 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Tabel utama */
.dtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.dtable th,
.dtable td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.dtable th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #4a6bdf;
}

.dtable tr:hover {
  background-color: #f8fbff;
}

/* Baris detail */
.dtable-detail-row {
  display: none;
}

.dtable-detail-content {
  padding: 10px 5px;
  background: #f9fbfd;
  border-left: 4px solid #4a6bdf;
}

.dtable-detail-item {
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
}

.dtable-detail-label {
  font-weight: 600;
  min-width: 130px;
  color: #2c3e50;
  margin-right: 15px;
}

.dtable-detail-value {
  flex: 1;
  color: #444;
}

/* DESKTOP (≥ 769px): Semua kolom terlihat */
@media (min-width: 769px) {
  .dtable {
    min-width: auto;
  }
  
  .hide-on-mobile {
    display: table-cell !important;
  }
  
  .mobile-only {
    display: none !important;
  }
  
  .dtable-detail-row {
    display: none !important;
  }
}

/* MOBILE (≤ 768px): Sembunyikan kolom tertentu */
@media (max-width: 768px) {
  .dtable-container {
    border: 1px solid #e0e0e0;
  }
  
  .dtable {
    min-width: 100%;
  }
  
  .hide-on-mobile {
    display: none;
  }
  
  .mobile-only {
    display: table-cell;
  }
  
  .action-column {
    text-align: center;
    width: 55px;
    background-color: #f8f9fa;
  }
  
  .expand-icon {
    color: #4a6bdf;
    font-size: 16px;
    font-weight: bold;
    display: inline-block;
    transition: transform 0.3s;
  }
  
  .expanded .expand-icon {
    transform: rotate(90deg);
  }
}
`;

// Inject CSS ke dokumen
function injectTableCSS() {
  if (!document.querySelector('#dtable-css')) {
    const style = document.createElement('style');
    style.id = 'dtable-css';
    style.textContent = tableCSS;
    document.head.appendChild(style);
  }
}

// Inisialisasi semua tabel
function initDetailTables() {
  injectTableCSS();
  
  const tables = document.querySelectorAll('table.dtable');
  
  tables.forEach((table, index) => {
    try {
      // Setup ID unik
      if (!table.id) {
        table.id = 'dtable-' + Date.now() + '-' + index;
      }
      
      // Setup tabel
      setupTable(table);
    } catch (err) {
      console.warn('Gagal setup tabel:', err);
    }
  });
}

// Setup satu tabel
function setupTable(table) {
  // Tambah wrapper container
  if (!table.parentElement.classList.contains('dtable-container')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'dtable-container';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  }
  
  // Tambah kolom aksi untuk mobile
  addActionColumn(table);
  
  // Setup event klik
  setupRowClicks(table);
}

// Tambah kolom aksi
function addActionColumn(table) {
  const headerRow = table.querySelector('thead tr');
  const dataRows = table.querySelectorAll('tbody tr');
  
  // Skip jika sudah ada kolom aksi
  if (headerRow.querySelector('.action-column')) return;
  
  // Tambah header kolom aksi
  const actionHeader = document.createElement('th');
  actionHeader.className = 'action-column mobile-only';
  actionHeader.innerHTML = '<span class="expand-icon">›</span>';
  headerRow.appendChild(actionHeader);
  
  // Tambah sel aksi di setiap baris
  dataRows.forEach(row => {
    const actionCell = document.createElement('td');
    actionCell.className = 'action-column mobile-only';
    actionCell.innerHTML = '<span class="expand-icon">›</span>';
    row.appendChild(actionCell);
  });
}

// Setup event klik
function setupRowClicks(table) {
  const rows = table.querySelectorAll('tbody tr:not(.dtable-detail-row)');
  
  rows.forEach(row => {
    row.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        toggleDetail(this);
      }
    });
  });
}

// Toggle detail di mobile
function toggleDetail(row) {
  const icon = row.querySelector('.expand-icon');
  let detailRow = row.nextElementSibling;
  
  // Cek jika sudah ada detail
  if (!detailRow || !detailRow.classList.contains('dtable-detail-row')) {
    detailRow = createDetailRow(row);
    row.parentNode.insertBefore(detailRow, row.nextSibling);
  }
  
  // Toggle tampilkan/sembunyikan
  if (detailRow.style.display === 'table-row') {
    // Sembunyikan
    detailRow.style.display = 'none';
    row.classList.remove('expanded');
  } else {
    // Sembunyikan detail lain di tabel yang sama
    const table = row.closest('table');
    table.querySelectorAll('.dtable-detail-row').forEach(r => {
      r.style.display = 'none';
    });
    
    // Remove expanded class dari semua baris
    table.querySelectorAll('tr.expanded').forEach(r => {
      r.classList.remove('expanded');
    });
    
    // Tampilkan detail ini
    detailRow.style.display = 'table-row';
    row.classList.add('expanded');
  }
}

// Buat baris detail
function createDetailRow(row) {
  const detailRow = document.createElement('tr');
  detailRow.className = 'dtable-detail-row';
  detailRow.style.display = 'none';
  
  const detailCell = document.createElement('td');
  const table = row.closest('table');
  const headers = table.querySelectorAll('thead th');
  const cells = row.querySelectorAll('td');
  
  let detailHTML = '<div class="dtable-detail-content">';
  
  // Kumpulkan data dari kolom tersembunyi
  cells.forEach((cell, index) => {
    if (cell.classList.contains('action-column')) return; // Skip kolom aksi
    
    if (cell.classList.contains('hide-on-mobile')) {
      const headerText = headers[index] ? 
        headers[index].textContent.replace('›', '').trim() : 
        'Kolom ' + (index + 1);
      
      const cellText = cell.innerHTML || cell.textContent;
      
      detailHTML += `
        <div class="dtable-detail-item">
          <span class="dtable-detail-label">${headerText}:</span>
          <span class="dtable-detail-value">${cellText}</span>
        </div>
      `;
    }
  });
  
  detailHTML += '</div>';
  detailCell.colSpan = row.cells.length;
  detailCell.innerHTML = detailHTML;
  detailRow.appendChild(detailCell);
  
  return detailRow;
}

// Handle window resize
window.addEventListener('resize', function() {
  if (window.innerWidth > 768) {
    // Sembunyikan semua detail di desktop
    document.querySelectorAll('.dtable-detail-row').forEach(row => {
      row.style.display = 'none';
    });
    
    // Remove expanded class
    document.querySelectorAll('tr.expanded').forEach(row => {
      row.classList.remove('expanded');
    });
  }
});

// Auto-init saat halaman siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDetailTables);
} else {
  initDetailTables();
}
