/*!
 * SMTables v1.0.0 - Simple Magic Tables (Development Version)
 * Single file, zero-dependency table library
 * Export: CSV (with escaping) | Copy: TSV (Excel-ready)
 * @copyright 2025 Ali Musthofa
 * @license MIT
 * @link https://github.com/alicom13/smtables
 */

(function() {
    'use strict';
    
    console.log('🚀 SMTables v1.0.0 loaded');
    
    // ==================== CSS STYLES ====================
    const smtCSS = `
    /* CONTAINER & CONTROLS */
    .smt-container { margin-bottom:1rem }
    .smt-controls { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.75rem; margin-bottom:1rem }
    .smt-search { flex:1; min-width:200px }
    .smt-search input { width:100%; padding:.375rem .75rem; border:1px solid #ccc; border-radius:4px; font-family:inherit }
    .smt-controls-right { display:flex; align-items:center; gap:.75rem }
    
    /* EXPORT BUTTONS - CSS ICONS */
    .smt-btn-group { display:flex; align-items:center; gap:0; border:1px solid #ccc; border-radius:4px; overflow:hidden; background:#fff }
    .smt-btn { background:#fff; border:none; padding:0; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center; height:2rem; width:2rem; transition:background-color .2s; border-right:1px solid #eee; position:relative }
    .smt-btn:last-child { border-right:none }
    .smt-btn:hover { background:#f0f0f0 }
    
    /* CSS ICONS */
    .smt-btn.selected::before { content:"\\2713" }
    .smt-btn.csv::before { content:"\\1F4CE" }  /* CSV icon */
    .smt-btn.copy::before { content:"\\1F4C4" } /* Page icon */
    
    /* PAGINATION CONTROLS */
    .smt-pagination-controls { display:flex; align-items:center; gap:.75rem }
    .smt-selection { white-space:nowrap }
    .smt-perpage select { padding:.25rem .5rem; border:1px solid #ccc; border-radius:4px; background:#fff; cursor:pointer; font-family:inherit }
    
    /* PAGINATION */
    .smt-pagination { display:flex; justify-content:center; align-items:center; gap:.5rem; margin-top:1rem; flex-wrap:wrap }
    .smt-pagination button { padding:.375rem .75rem; border:1px solid #ccc; background:#fff; border-radius:4px; cursor:pointer; font-family:inherit }
    .smt-pagination button.active { background:#007bff; color:#fff; border-color:#007bff }
    .smt-pagination button:disabled { opacity:.5; cursor:not-allowed }
    
    /* TABLE SORTING */
    .smtables th { cursor:pointer; user-select:none; position:relative }
    .smtables th.smt-sort-asc::after { content:" \\2191"; font-weight:700; margin-left:.25rem }
    .smtables th.smt-sort-desc::after { content:" \\2193"; font-weight:700; margin-left:.25rem }
    
    /* UTILITY */
    .smt-loading, .smt-empty { text-align:center; padding:2rem }
    .smt-info { margin-top:.5rem; text-align:center }
    
    /* RESPONSIVE */
    @media (max-width:768px){
        .smt-controls{flex-direction:column;align-items:stretch}
        .smt-search{min-width:100%}
        .smt-controls-right{width:100%;justify-content:space-between}
        .smt-pagination-controls{order:-1;width:100%;justify-content:space-between;margin-bottom:.5rem}
    }
    @media (max-width:480px){
        .smt-controls-right{flex-direction:column;gap:.5rem}
        .smt-pagination-controls{flex-direction:row;justify-content:space-between}
        .smt-btn-group{width:100%;justify-content:center}
    }
    `;
    
    // ==================== SMTABLES CLASS ====================
    class SMTables {
        constructor(table, perPage = 10) {
            console.log('📊 SMTables constructor called', { table, perPage });
            
            if (!table) {
                console.error('❌ Table element is required');
                throw new Error('Table element is required');
            }
            
            // Inject CSS sekali saja
            if (!document.querySelector('#smt-styles')) {
                console.log('🎨 Injecting SMTables CSS');
                const style = document.createElement('style');
                style.id = 'smt-styles';
                style.textContent = smtCSS;
                document.head.appendChild(style);
            }
            
            // Add smtables class to table
            table.classList.add('smtables');
            console.log('✅ Added "smtables" class to table');
            
            this.table = table;
            this.tbody = table.querySelector("tbody");
            this.rows = Array.from(this.tbody.querySelectorAll("tr"));
            this.filteredRows = [...this.rows];
            this.page = 1;
            this.perPage = perPage;
            this.sortColumn = null;
            this.sortDirection = "asc";
            this.searchTerm = '';
            
            this.checkboxState = new WeakMap();
            this.searchHandler = this.debounce(this.setSearch.bind(this), 300);
            
            console.log(`📈 Table initialized with ${this.rows.length} rows, ${perPage} per page`);
            
            this.createControls();
            this.enableSorting();
            this.initCheckboxes();
            this.render();
        }
        
        createControls() {
            console.log('🔧 Creating SMTables controls');
            
            const container = document.createElement("div");
            container.className = "smt-container";
            
            const wrap = document.createElement("div");
            wrap.className = "smt-controls";
            
            const searchContainer = document.createElement("div");
            searchContainer.className = "smt-search";
            
            this.searchBox = document.createElement("input");
            this.searchBox.type = "search";
            this.searchBox.placeholder = "Search...";
            this.searchBox.addEventListener('input', (e) => this.searchHandler(e.target.value));
            console.log('🔍 Search box created');
            
            const controlsRight = document.createElement("div");
            controlsRight.className = "smt-controls-right";
            
            // Export Button Group
            const exportGroup = document.createElement("div");
            exportGroup.className = "smt-btn-group";
            
            // Export Selected Button
            const selectedBtn = document.createElement("button");
            selectedBtn.className = "smt-btn selected";
            selectedBtn.title = "Export Selected Rows (CSV)";
            selectedBtn.setAttribute('aria-label', 'Export selected rows');
            selectedBtn.onclick = () => this.exportSelected();
            
            // CSV Export Button
            this.csvBtn = document.createElement("button");
            this.csvBtn.className = "smt-btn csv";
            this.csvBtn.title = "Export to CSV (comma separated)";
            this.csvBtn.setAttribute('aria-label', 'Export to CSV');
            this.csvBtn.onclick = () => this.exportToCSV();
            
            // Copy Button (TSV for Excel)
            this.copyBtn = document.createElement("button");
            this.copyBtn.className = "smt-btn copy";
            this.copyBtn.title = "Copy to Clipboard (Excel-ready)";
            this.copyBtn.setAttribute('aria-label', 'Copy to clipboard');
            this.copyBtn.onclick = () => this.copyToClipboard();
            
            exportGroup.appendChild(selectedBtn);
            exportGroup.appendChild(this.csvBtn);
            exportGroup.appendChild(this.copyBtn);
            console.log('📤 Export buttons created: Selected, CSV, Copy');
            
            // Pagination Controls Wrapper
            const paginationControls = document.createElement("div");
            paginationControls.className = "smt-pagination-controls";
            
            // Selection Counter
            this.selectionCounter = document.createElement("span");
            this.selectionCounter.className = "smt-selection";
            this.updateSelectionCounter();
            
            // Per Page Select
            this.perPageSelect = document.createElement("select");
            this.perPageSelect.className = "smt-perpage";
            this.perPageSelect.setAttribute('aria-label', 'Rows per page');
            
            this.perPageSelect.innerHTML = 
                '<option value="5">5</option>' +
                '<option value="10" selected>10</option>' +
                '<option value="20">20</option>' +
                '<option value="50">50</option>' +
                '<option value="100">100</option>';
            
            this.perPageSelect.value = this.perPage;
            this.perPageSelect.addEventListener('change', () => {
                console.log(`📊 Per page changed to ${this.perPageSelect.value}`);
                this.perPage = parseInt(this.perPageSelect.value);
                this.page = 1;
                this.render();
            });
            
            paginationControls.appendChild(this.selectionCounter);
            paginationControls.appendChild(this.perPageSelect);
            
            searchContainer.appendChild(this.searchBox);
            controlsRight.appendChild(exportGroup);
            controlsRight.appendChild(paginationControls);
            
            wrap.appendChild(searchContainer);
            wrap.appendChild(controlsRight);
            container.appendChild(wrap);
            
            this.table.parentNode.insertBefore(container, this.table);
            container.appendChild(this.table);
            
            this.paginationContainer = document.createElement("div");
            this.paginationContainer.className = "smt-pagination";
            container.appendChild(this.paginationContainer);
            
            this.infoContainer = document.createElement("div");
            this.infoContainer.className = "smt-info";
            container.appendChild(this.infoContainer);
            
            this.updateInfo();
            console.log('✅ SMTables controls created successfully');
        }
        
        enableSorting() {
            const sortableHeaders = this.table.querySelectorAll("thead th");
            console.log(`🔄 Enabling sorting for ${sortableHeaders.length} headers`);
            
            sortableHeaders.forEach((th, index) => {
                if (th.querySelector("input, select, button")) {
                    console.log(`⏭️ Skipping sorting for header ${index} (contains input/select/button)`);
                    return;
                }
                th.style.cursor = "pointer";
                th.setAttribute('role', 'button');
                th.setAttribute('aria-label', `Sort by ${th.textContent.trim()}`);
                th.addEventListener("click", () => this.handleSort(index));
                console.log(`✅ Sorting enabled for header: "${th.textContent.trim()}"`);
            });
        }
        
        handleSort(index) {
            console.log(`⬆️ Sorting column ${index}, current direction: ${this.sortDirection}`);
            
            const headers = this.table.querySelectorAll("thead th");
            headers.forEach(th => {
                th.classList.remove('smt-sort-asc', 'smt-sort-desc');
                th.removeAttribute('aria-sort');
            });
            
            if (this.sortColumn === index) {
                this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
                console.log(`🔄 Toggling sort direction to: ${this.sortDirection}`);
            } else {
                this.sortColumn = index;
                this.sortDirection = "asc";
                console.log(`🎯 New sort column: ${index}, direction: asc`);
            }
            
            headers[index].classList.add('smt-sort-' + this.sortDirection);
            headers[index].setAttribute('aria-sort', this.sortDirection === 'asc' ? 'ascending' : 'descending');
            this.sortRows();
            this.render();
        }
        
        sortRows() {
            if (this.sortColumn === null) {
                console.log('⏭️ No sort column selected, skipping sort');
                return;
            }
            
            console.log(`🔢 Sorting ${this.filteredRows.length} rows by column ${this.sortColumn} (${this.sortDirection})`);
            this.filteredRows.sort((a, b) => {
                const cellA = a.children[this.sortColumn];
                const cellB = b.children[this.sortColumn];
                
                if (!cellA || !cellB) return 0;
                
                const textA = cellA.textContent.trim().toLowerCase();
                const textB = cellB.textContent.trim().toLowerCase();
                const numA = parseFloat(textA);
                const numB = parseFloat(textB);
                
                if (!isNaN(numA) && !isNaN(numB)) {
                    console.log(`📊 Numeric sort: ${numA} vs ${numB}`);
                    return this.sortDirection === "asc" ? numA - numB : numB - numA;
                }
                
                console.log(`🔤 Text sort: "${textA}" vs "${textB}"`);
                return this.sortDirection === "asc" ? textA.localeCompare(textB) : textB.localeCompare(textA);
            });
            
            console.log('✅ Sorting completed');
        }
        
        debounce(func, wait) {
            console.log(`⏱️ Creating debounced function with ${wait}ms delay`);
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
        
        setSearch(value) {
            console.log(`🔍 Searching for: "${value}"`);
            this.searchTerm = value.toLowerCase().trim();
            this.filteredRows = this.rows.filter(tr => 
                tr.textContent.toLowerCase().includes(this.searchTerm)
            );
            console.log(`📊 Search results: ${this.filteredRows.length} of ${this.rows.length} rows match`);
            
            if (this.sortColumn !== null) this.sortRows();
            this.page = 1;
            this.render();
        }
        
        paginateRows() {
            const start = (this.page - 1) * this.perPage;
            const end = start + this.perPage;
            console.log(`📄 Pagination: page ${this.page}, showing rows ${start + 1} to ${Math.min(end, this.filteredRows.length)}`);
            return this.filteredRows.slice(start, end);
        }
        
        renderTable() {
            console.log('🎨 Rendering table');
            
            const existingEmpty = this.tbody.querySelector('.smt-empty');
            if (existingEmpty) {
                console.log('🗑️ Removing existing empty state');
                existingEmpty.remove();
            }
            
            // Hide all rows
            this.rows.forEach(tr => tr.style.display = "none");
            
            if (this.filteredRows.length === 0) {
                console.log('📭 No data to display, showing empty state');
                this.showEmptyState();
                return;
            }
            
            const visibleRows = this.paginateRows();
            console.log(`👁️ Showing ${visibleRows.length} visible rows`);
            
            // Show only paginated rows
            visibleRows.forEach(tr => tr.style.display = "");
            
            this.restoreCheckboxes();
            this.updateRowNumbers(visibleRows);
            this.updateSelectionCounter();
            this.updateInfo();
        }
        
        showEmptyState() {
            console.log('📭 Creating empty state row');
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'smt-empty';
            emptyRow.setAttribute('aria-live', 'polite');
            const colCount = this.table.querySelectorAll('thead th').length;
            emptyRow.innerHTML = '<td colspan="' + colCount + '">No data found</td>';
            this.tbody.appendChild(emptyRow);
        }
        
        updateRowNumbers(visibleRows) {
            const startNumber = (this.page - 1) * this.perPage + 1;
            console.log(`🔢 Updating row numbers starting from ${startNumber}`);
            
            visibleRows.forEach((row, index) => {
                const numberCell = row.querySelector('.row-number');
                if (numberCell) {
                    const newNumber = startNumber + index;
                    if (numberCell.textContent != newNumber) {
                        console.log(`🔄 Row ${index}: ${numberCell.textContent} → ${newNumber}`);
                    }
                    numberCell.textContent = newNumber;
                }
            });
        }
        
        updateInfo() {
            const total = this.filteredRows.length;
            const start = total === 0 ? 0 : (this.page - 1) * this.perPage + 1;
            const end = Math.min(this.page * this.perPage, total);
            
            const infoText = `Showing ${start} to ${end} of ${total} entries`;
            console.log(`ℹ️ Info: ${infoText}`);
            
            this.infoContainer.textContent = infoText;
            this.infoContainer.setAttribute('aria-live', 'polite');
        }
        
        renderPagination() {
            const totalPages = Math.ceil(this.filteredRows.length / this.perPage);
            console.log(`📖 Pagination: ${totalPages} total pages, current page: ${this.page}`);
            
            if (totalPages <= 1) {
                console.log('⏭️ Single page, hiding pagination');
                this.paginationContainer.innerHTML = '';
                return;
            }
            
            const prevDisabled = this.page === 1;
            const nextDisabled = this.page >= totalPages;
            
            console.log(`◀️ Previous button: ${prevDisabled ? 'disabled' : 'enabled'}`);
            console.log(`▶️ Next button: ${nextDisabled ? 'disabled' : 'enabled'}`);
            
            let paginationHTML = `<button class="pagination-prev" ${prevDisabled ? 'disabled' : ''} aria-label="Previous page">‹</button>`;
            
            const pages = this.getVisiblePages(totalPages);
            console.log(`📄 Page buttons: ${pages.join(', ')}`);
            
            pages.forEach(pageNum => {
                if (pageNum === '...') {
                    paginationHTML += '<button class="pagination-ellipsis" disabled aria-hidden="true">...</button>';
                } else {
                    const activeClass = pageNum === this.page ? 'active' : '';
                    const currentPage = pageNum === this.page ? 'aria-current="page"' : '';
                    paginationHTML += `<button class="pagination-number ${activeClass}" ${currentPage} aria-label="Page ${pageNum}">${pageNum}</button>`;
                }
            });
            
            paginationHTML += `<button class="pagination-next" ${nextDisabled ? 'disabled' : ''} aria-label="Next page">›</button>`;
            
            this.paginationContainer.innerHTML = paginationHTML;
            
            // Add event listeners
            this.paginationContainer.querySelector('button:first-child').addEventListener('click', () => {
                if (!prevDisabled) {
                    console.log('◀️ Previous page clicked');
                    this.page--;
                    this.render();
                }
            });
            
            this.paginationContainer.querySelector('button:last-child').addEventListener('click', () => {
                if (!nextDisabled) {
                    console.log('▶️ Next page clicked');
                    this.page++;
                    this.render();
                }
            });
            
            this.paginationContainer.querySelectorAll('button:not(:first-child):not(:last-child)').forEach((btn) => {
                if (!btn.disabled && btn.textContent !== '...') {
                    btn.addEventListener('click', () => {
                        const pageNum = parseInt(btn.textContent);
                        console.log(`📄 Page ${pageNum} clicked`);
                        this.page = pageNum;
                        this.render();
                    });
                }
            });
        }
        
        getVisiblePages(totalPages) {
            console.log(`🔢 Calculating visible pages for ${totalPages} total pages, current: ${this.page}`);
            
            if (totalPages <= 7) {
                const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                console.log(`📄 Showing all pages: ${pages.join(', ')}`);
                return pages;
            }
            
            if (this.page <= 4) {
                const pages = [1, 2, 3, 4, 5, '...', totalPages];
                console.log(`📄 Early pages: ${pages.join(', ')}`);
                return pages;
            }
            
            if (this.page >= totalPages - 3) {
                const pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                console.log(`📄 Late pages: ${pages.join(', ')}`);
                return pages;
            }
            
            const pages = [1, '...', this.page - 1, this.page, this.page + 1, '...', totalPages];
            console.log(`📄 Middle pages: ${pages.join(', ')}`);
            return pages;
        }
        
        initCheckboxes() {
            console.log('☑️ Initializing checkbox handling');
            
            this.tbody.addEventListener("change", e => {
                const checkbox = e.target;
                if (checkbox.type === "checkbox") {
                    console.log(`☑️ Checkbox ${checkbox.checked ? 'checked' : 'unchecked'}, value: ${checkbox.value}`);
                    this.checkboxState.set(checkbox, checkbox.checked);
                    this.updateSelectionCounter();
                }
            });
            
            const selectAll = this.table.querySelector("thead input[type=checkbox]");
            if (selectAll) {
                console.log('✅ Found "Select All" checkbox in header');
                selectAll.addEventListener("change", e => {
                    const isChecked = e.target.checked;
                    console.log(`☑️ "Select All" ${isChecked ? 'checked' : 'unchecked'}`);
                    
                    this.paginateRows().forEach(tr => {
                        const cb = tr.querySelector("input[type=checkbox]");
                        if (cb) {
                            cb.checked = isChecked;
                            this.checkboxState.set(cb, isChecked);
                        }
                    });
                    this.updateSelectionCounter();
                });
            } else {
                console.log('ℹ️ No "Select All" checkbox found in header');
            }
        }
        
        restoreCheckboxes() {
            console.log('🔄 Restoring checkbox states');
            let restoredCount = 0;
            
            this.paginateRows().forEach(tr => {
                const cb = tr.querySelector("input[type=checkbox]");
                if (cb && this.checkboxState.has(cb)) {
                    cb.checked = this.checkboxState.get(cb);
                    restoredCount++;
                }
            });
            
            console.log(`✅ Restored ${restoredCount} checkbox states`);
            this.updateSelectAllCheckbox();
        }
        
        updateSelectAllCheckbox() {
            const selectAll = this.table.querySelector("thead input[type=checkbox]");
            if (selectAll) {
                const visibleCheckboxes = this.paginateRows()
                    .map(tr => tr.querySelector("input[type=checkbox]"))
                    .filter(cb => cb);
                
                console.log(`👁️ Visible checkboxes: ${visibleCheckboxes.length}`);
                
                if (visibleCheckboxes.length === 0) {
                    console.log('⏭️ No visible checkboxes, disabling "Select All"');
                    selectAll.checked = false;
                    selectAll.disabled = true;
                } else {
                    selectAll.disabled = false;
                    const allChecked = visibleCheckboxes.every(cb => cb.checked);
                    console.log(`☑️ "Select All" state: ${allChecked ? 'checked' : 'unchecked'} (${visibleCheckboxes.filter(cb => cb.checked).length}/${visibleCheckboxes.length} checked)`);
                    selectAll.checked = allChecked;
                }
            }
        }
        
        updateSelectionCounter() {
            const selected = this.getSelectedCount();
            const total = this.filteredRows.length;
            const text = `${selected} of ${total} selected`;
            
            console.log(`📊 Selection: ${text}`);
            
            this.selectionCounter.textContent = text;
            this.selectionCounter.setAttribute('aria-live', 'polite');
        }
        
        getSelectedCount() {
            let count = 0;
            this.filteredRows.forEach(row => {
                const checkbox = row.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) count++;
            });
            return count;
        }
        
        exportSelected() {
            console.log('📤 Export Selected triggered');
            const selectedRows = this.getSelectedRows();
            
            if (selectedRows.length === 0) {
                console.warn('⚠️ No rows selected for export');
                alert('No data selected! Check the rows you want to export.');
                return;
            }
            
            console.log(`📤 Exporting ${selectedRows.length} selected rows`);
            const data = this.getExportData(selectedRows);
            console.log('📊 Export data:', data);
            
            const csv = this.convertToCSV(data);
            console.log('📄 Generated CSV:', csv.substring(0, 100) + '...');
            
            this.downloadFile(csv, 'selected-data-' + this.getTimestamp() + '.csv', 'text/csv');
            console.log('✅ Export Selected completed');
            alert(`Successfully exported ${selectedRows.length} selected rows as CSV!`);
        }
        
        getSelectedRows() {
            const selected = [];
            this.filteredRows.forEach(row => {
                const checkbox = row.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) selected.push(row);
            });
            return selected;
        }
        
        getSelectedIds() {
            const ids = this.getSelectedRows().map(row => {
                const checkbox = row.querySelector('input[type="checkbox"]');
                return checkbox ? checkbox.value : null;
            }).filter(id => id !== null);
            
            console.log(`🆔 Selected IDs: ${ids.join(', ')}`);
            return ids;
        }
        
        copyToClipboard() {
            console.log('📋 Copy to Clipboard triggered');
            const data = this.getExportData();
            console.log('📊 Copy data:', data);
            
            const tsv = this.convertToTSV(data);
            console.log('📄 Generated TSV (first 100 chars):', tsv.substring(0, 100) + '...');
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                console.log('📋 Using modern Clipboard API');
                navigator.clipboard.writeText(tsv)
                    .then(() => {
                        console.log('✅ Clipboard write successful');
                        alert('Data copied to clipboard (Excel-ready)! Paste directly into Excel.');
                    })
                    .catch(err => {
                        console.error('❌ Clipboard API failed:', err);
                        this.fallbackCopy(tsv);
                    });
            } else {
                console.log('📋 Using fallback copy method');
                this.fallbackCopy(tsv);
            }
        }
        
        fallbackCopy(text) {
            console.log('📋 Executing fallback copy');
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            const success = document.execCommand('copy');
            console.log(`📋 execCommand('copy') ${success ? 'succeeded' : 'failed'}`);
            
            document.body.removeChild(textarea);
            alert('Data copied to clipboard (Excel-ready)! Paste directly into Excel.');
        }
        
        getTableHeaders() {
            const headers = [];
            this.table.querySelectorAll('thead th').forEach(th => {
                if (!th.querySelector('input[type="checkbox"]') &&
                    th.textContent.trim().toLowerCase() !== 'no' &&
                    !th.classList.contains('no-export')) {
                    headers.push(th.textContent.trim());
                }
            });
            
            console.log(`📋 Export headers: ${headers.join(', ')}`);
            return headers;
        }
        
        getExportData(rows = null) {
            const dataRows = rows || this.filteredRows;
            const headers = this.getTableHeaders();
            
            console.log(`📊 Preparing export data for ${dataRows.length} rows`);
            
            return dataRows.map((row, rowIndex) => {
                const obj = {};
                const cells = row.querySelectorAll('td');
                let dataIndex = 0;
                
                this.table.querySelectorAll('thead th').forEach((th, i) => {
                    if (!th.querySelector('input[type="checkbox"]') &&
                        th.textContent.trim().toLowerCase() !== 'no' &&
                        !th.classList.contains('no-export') &&
                        cells[i] && headers[dataIndex]) {
                        
                        const cell = cells[i].cloneNode(true);
                        cell.querySelector('button')?.remove();
                        obj[headers[dataIndex]] = cell.textContent.trim();
                        dataIndex++;
                    }
                });
                
                if (rowIndex < 3) { // Log first 3 rows for debugging
                    console.log(`📝 Row ${rowIndex + 1}:`, obj);
                }
                
                return obj;
            });
        }
        
        exportToCSV() {
            console.log('📤 Export to CSV triggered');
            const data = this.getExportData();
            console.log(`📊 Exporting ${data.length} rows`);
            
            const csv = this.convertToCSV(data);
            console.log('📄 Generated CSV (first 100 chars):', csv.substring(0, 100) + '...');
            
            this.downloadFile(csv, 'table-export-' + this.getTimestamp() + '.csv', 'text/csv');
            console.log('✅ Export to CSV completed');
        }
        
        convertToCSV(data) {
            console.log(`🔄 Converting ${data.length} rows to CSV`);
            
            if (data.length === 0) {
                console.log('📭 Empty data, returning empty CSV');
                return '';
            }
            
            const headers = Object.keys(data[0]);
            console.log(`📋 CSV headers: ${headers.join(', ')}`);
            
            const csvRows = [
                headers.join(','),
                ...data.map((row, index) => {
                    const rowValues = headers.map(header => {
                        const value = row[header] || '';
                        const escaped = value.toString().replace(/"/g, '""');
                        const needsQuotes = escaped.includes(',') || escaped.includes('\n') || escaped.includes('"');
                        
                        if (needsQuotes && index < 3) {
                            console.log(`📝 Row ${index + 1}, "${header}": "${value}" → "${escaped}" (quoted)`);
                        }
                        
                        return needsQuotes ? '"' + escaped + '"' : escaped;
                    });
                    
                    if (index < 3) {
                        console.log(`📄 Row ${index + 1} CSV: ${rowValues.join(',')}`);
                    }
                    
                    return rowValues.join(',');
                })
            ];
            
            const result = csvRows.join('\n');
            console.log(`✅ CSV conversion complete: ${result.length} characters, ${data.length + 1} lines`);
            return result;
        }
        
        convertToTSV(data) {
            console.log(`🔄 Converting ${data.length} rows to TSV (Excel-ready)`);
            
            if (data.length === 0) {
                console.log('📭 Empty data, returning empty TSV');
                return '';
            }
            
            const headers = Object.keys(data[0]);
            console.log(`📋 TSV headers: ${headers.join(' | ')}`);
            
            const tsvRows = [
                headers.join('\t'),
                ...data.map((row, index) => {
                    const rowValues = headers.map(header => {
                        const value = row[header] || '';
                        const cleaned = value.toString().replace(/\t/g, ' ');
                        
                        if (index < 3 && value.includes('\t')) {
                            console.log(`⚠️ Row ${index + 1}, "${header}": Tab replaced in "${value}"`);
                        }
                        
                        return cleaned;
                    });
                    
                    if (index < 3) {
                        console.log(`📄 Row ${index + 1} TSV: ${rowValues.join(' | ')}`);
                    }
                    
                    return rowValues.join('\t');
                })
            ];
            
            const result = tsvRows.join('\n');
            console.log(`✅ TSV conversion complete: ${result.length} characters, ${data.length + 1} lines`);
            console.log('💡 TSV format ready for Excel paste');
            return result;
        }
        
        downloadFile(content, filename, mimeType) {
            console.log(`💾 Downloading file: ${filename}, type: ${mimeType}, size: ${content.length} bytes`);
            
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            console.log('✅ File download initiated');
        }
        
        getTimestamp() {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            console.log(`⏰ Generated timestamp: ${timestamp}`);
            return timestamp;
        }
        
        render() {
            console.log('🎬 Full render triggered');
            console.time('render');
            
            this.renderTable();
            this.renderPagination();
            
            console.timeEnd('render');
            console.log('✅ Render complete');
        }
        
        updateData(newRows) {
            console.log('🔄 updateData() called with:', newRows);
            
            if (Array.isArray(newRows)) {
                console.log(`📊 Updating with array of ${newRows.length} rows`);
                this.rows = newRows;
            } else if (typeof newRows === 'string') {
                console.log('📝 Updating with HTML string');
                this.tbody.innerHTML = newRows;
                this.rows = Array.from(this.tbody.querySelectorAll("tr"));
            } else if (newRows instanceof NodeList) {
                console.log(`📊 Updating with NodeList of ${newRows.length} rows`);
                this.rows = Array.from(newRows);
            } else {
                console.error('❌ Invalid data format for updateData:', typeof newRows);
                return;
            }
            
            this.filteredRows = [...this.rows];
            this.page = 1;
            console.log(`✅ Data updated: ${this.rows.length} total rows`);
            this.render();
        }
        
        destroy() {
            console.log('🗑️ Destroying SMTables instance');
            
            const container = this.table.parentNode;
            if (container.classList.contains('smt-container')) {
                console.log('✅ Found SMTables container, removing...');
                const grandParent = container.parentNode;
                grandParent.insertBefore(this.table, container);
                container.remove();
                console.log('✅ Container removed');
            }
            
            this.table.classList.remove('smtables');
            console.log('✅ "smtables" class removed from table');
            console.log('✅ SMTables instance destroyed');
        }
    }
    
    // ==================== AUTO INITIALIZATION ====================
    document.addEventListener("DOMContentLoaded", () => {
        console.log('🚀 DOM loaded, auto-initializing SMTables');
        
        window.smtables = [];
        const tables = document.querySelectorAll(".smtables");
        console.log(`🔍 Found ${tables.length} tables with class "smtables"`);
        
        tables.forEach((table, index) => {
            try {
                console.log(`📊 Initializing table ${index + 1}/${tables.length}`);
                const instance = new SMTables(table, 10);
                window.smtables.push(instance);
                console.log(`✅ Table ${index + 1} initialized successfully`);
            } catch (error) {
                console.error(`❌ Failed to initialize table ${index + 1}:`, error);
            }
        });
        
        console.log(`✅ Auto-initialization complete. ${window.smtables.length} tables initialized.`);
        console.log('💡 Access all instances via window.smtables');
    });
    
    // ==================== GLOBAL EXPORT ====================
    if (typeof window !== 'undefined') {
        console.log('🌍 Exposing SMTables to window object');
        window.SMTables = SMTables;
        console.log('✅ SMTables class available globally');
    }
    
    if (typeof module !== 'undefined' && module.exports) {
        console.log('📦 Exporting SMTables for CommonJS');
        module.exports = SMTables;
    }
    
    console.log('🎉 SMTables v1.0.0 development version loaded successfully!');
    
})();
