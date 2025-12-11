/*!
 * SMTables v1.0.0 - Simple Magic Tables
 * Single file, zero-dependency table library
 * Export: CSV (with escaping) | Copy: TSV (Excel-ready)
 * @copyright 2025 Ali Musthofa
 * @license MIT
 * @link https://github.com/alicom13/smtables
 */

(function() {
    'use strict';
    
    const smtCSS = `.smt-container{margin-bottom:1rem}.smt-controls{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.75rem;margin-bottom:1rem}.smt-search{flex:1;min-width:200px}.smt-search input{width:100%;padding:.375rem .75rem;border:1px solid #ccc;border-radius:4px;font-family:inherit}.smt-controls-right{display:flex;align-items:center;gap:.75rem}.smt-btn-group{display:flex;align-items:center;gap:0;border:1px solid #ccc;border-radius:4px;overflow:hidden;background:#fff}.smt-btn{background:#fff;border:none;padding:0;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;height:2rem;width:2rem;transition:background-color .2s;border-right:1px solid #eee;position:relative}.smt-btn:last-child{border-right:none}.smt-btn:hover{background:#f0f0f0}.smt-btn.selected::before{content:"\\2713"}.smt-btn.csv::before{content:"\\1F4CE"}.smt-btn.copy::before{content:"\\1F4C4"}.smt-pagination-controls{display:flex;align-items:center;gap:.75rem}.smt-selection{white-space:nowrap}.smt-perpage select{padding:.25rem .5rem;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;font-family:inherit}.smt-pagination{display:flex;justify-content:center;align-items:center;gap:.5rem;margin-top:1rem;flex-wrap:wrap}.smt-pagination button{padding:.375rem .75rem;border:1px solid #ccc;background:#fff;border-radius:4px;cursor:pointer;font-family:inherit}.smt-pagination button.active{background:#007bff;color:#fff;border-color:#007bff}.smt-pagination button:disabled{opacity:.5;cursor:not-allowed}.smtables th{cursor:pointer;user-select:none;position:relative}.smtables th.smt-sort-asc::after{content:" \\2191";font-weight:700;margin-left:.25rem}.smtables th.smt-sort-desc::after{content:" \\2193";font-weight:700;margin-left:.25rem}.smt-loading,.smt-empty{text-align:center;padding:2rem}.smt-info{margin-top:.5rem;text-align:center}@media (max-width:768px){.smt-controls{flex-direction:column;align-items:stretch}.smt-search{min-width:100%}.smt-controls-right{width:100%;justify-content:space-between}.smt-pagination-controls{order:-1;width:100%;justify-content:space-between;margin-bottom:.5rem}}@media (max-width:480px){.smt-controls-right{flex-direction:column;gap:.5rem}.smt-pagination-controls{flex-direction:row;justify-content:space-between}.smt-btn-group{width:100%;justify-content:center}}`;
    
    class SMTables {
        constructor(table, perPage = 10) {
            if (!table) throw new Error('Table element is required');
            if (!document.querySelector('#smt-styles')) {
                const style = document.createElement('style');
                style.id = 'smt-styles';
                style.textContent = smtCSS;
                document.head.appendChild(style);
            }
            table.classList.add('smtables');
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
            this.createControls();
            this.enableSorting();
            this.initCheckboxes();
            this.render();
        }
        createControls() {
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
            const controlsRight = document.createElement("div");
            controlsRight.className = "smt-controls-right";
            const exportGroup = document.createElement("div");
            exportGroup.className = "smt-btn-group";
            const selectedBtn = document.createElement("button");
            selectedBtn.className = "smt-btn selected";
            selectedBtn.title = "Export Selected Rows (CSV)";
            selectedBtn.setAttribute('aria-label', 'Export selected rows');
            selectedBtn.onclick = () => this.exportSelected();
            this.csvBtn = document.createElement("button");
            this.csvBtn.className = "smt-btn csv";
            this.csvBtn.title = "Export to CSV (comma separated)";
            this.csvBtn.setAttribute('aria-label', 'Export to CSV');
            this.csvBtn.onclick = () => this.exportToCSV();
            this.copyBtn = document.createElement("button");
            this.copyBtn.className = "smt-btn copy";
            this.copyBtn.title = "Copy to Clipboard (Excel-ready)";
            this.copyBtn.setAttribute('aria-label', 'Copy to clipboard');
            this.copyBtn.onclick = () => this.copyToClipboard();
            exportGroup.appendChild(selectedBtn);
            exportGroup.appendChild(this.csvBtn);
            exportGroup.appendChild(this.copyBtn);
            const paginationControls = document.createElement("div");
            paginationControls.className = "smt-pagination-controls";
            this.selectionCounter = document.createElement("span");
            this.selectionCounter.className = "smt-selection";
            this.updateSelectionCounter();
            this.perPageSelect = document.createElement("select");
            this.perPageSelect.className = "smt-perpage";
            this.perPageSelect.setAttribute('aria-label', 'Rows per page');
            this.perPageSelect.innerHTML = '<option value="5">5</option><option value="10" selected>10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option>';
            this.perPageSelect.value = this.perPage;
            this.perPageSelect.addEventListener('change', () => {
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
        }
        enableSorting() {
            this.table.querySelectorAll("thead th").forEach((th, index) => {
                if (th.querySelector("input, select, button")) return;
                th.style.cursor = "pointer";
                th.setAttribute('role', 'button');
                th.setAttribute('aria-label', `Sort by ${th.textContent.trim()}`);
                th.addEventListener("click", () => this.handleSort(index));
            });
        }
        handleSort(index) {
            const headers = this.table.querySelectorAll("thead th");
            headers.forEach(th => {
                th.classList.remove('smt-sort-asc', 'smt-sort-desc');
                th.removeAttribute('aria-sort');
            });
            if (this.sortColumn === index) {
                this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
            } else {
                this.sortColumn = index;
                this.sortDirection = "asc";
            }
            headers[index].classList.add('smt-sort-' + this.sortDirection);
            headers[index].setAttribute('aria-sort', this.sortDirection === 'asc' ? 'ascending' : 'descending');
            this.sortRows();
            this.render();
        }
        sortRows() {
            if (this.sortColumn === null) return;
            this.filteredRows.sort((a, b) => {
                const cellA = a.children[this.sortColumn];
                const cellB = b.children[this.sortColumn];
                if (!cellA || !cellB) return 0;
                const textA = cellA.textContent.trim().toLowerCase();
                const textB = cellB.textContent.trim().toLowerCase();
                const numA = parseFloat(textA);
                const numB = parseFloat(textB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return this.sortDirection === "asc" ? numA - numB : numB - numA;
                }
                return this.sortDirection === "asc" ? textA.localeCompare(textB) : textB.localeCompare(textA);
            });
        }
        debounce(func, wait) {
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
            this.searchTerm = value.toLowerCase().trim();
            this.filteredRows = this.rows.filter(tr => tr.textContent.toLowerCase().includes(this.searchTerm));
            if (this.sortColumn !== null) this.sortRows();
            this.page = 1;
            this.render();
        }
        paginateRows() {
            const start = (this.page - 1) * this.perPage;
            return this.filteredRows.slice(start, start + this.perPage);
        }
        renderTable() {
            const existingEmpty = this.tbody.querySelector('.smt-empty');
            if (existingEmpty) existingEmpty.remove();
            this.rows.forEach(tr => tr.style.display = "none");
            if (this.filteredRows.length === 0) {
                this.showEmptyState();
                return;
            }
            const visibleRows = this.paginateRows();
            visibleRows.forEach(tr => tr.style.display = "");
            this.restoreCheckboxes();
            this.updateRowNumbers(visibleRows);
            this.updateSelectionCounter();
            this.updateInfo();
        }
        showEmptyState() {
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'smt-empty';
            emptyRow.setAttribute('aria-live', 'polite');
            const colCount = this.table.querySelectorAll('thead th').length;
            emptyRow.innerHTML = '<td colspan="' + colCount + '">No data found</td>';
            this.tbody.appendChild(emptyRow);
        }
        updateRowNumbers(visibleRows) {
            const startNumber = (this.page - 1) * this.perPage + 1;
            visibleRows.forEach((row, index) => {
                const numberCell = row.querySelector('.row-number');
                if (numberCell) numberCell.textContent = startNumber + index;
            });
        }
        updateInfo() {
            const total = this.filteredRows.length;
            const start = total === 0 ? 0 : (this.page - 1) * this.perPage + 1;
            const end = Math.min(this.page * this.perPage, total);
            this.infoContainer.textContent = `Showing ${start} to ${end} of ${total} entries`;
            this.infoContainer.setAttribute('aria-live', 'polite');
        }
        renderPagination() {
            const pag = this.paginationContainer;
            const totalPages = Math.ceil(this.filteredRows.length / this.perPage);
            if (totalPages <= 1) {
                pag.innerHTML = '';
                return;
            }
            const prevDisabled = this.page === 1;
            const nextDisabled = this.page >= totalPages;
            let paginationHTML = `<button class="pagination-prev" ${prevDisabled ? 'disabled' : ''} aria-label="Previous page">‹</button>`;
            const pages = this.getVisiblePages(totalPages);
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
            pag.innerHTML = paginationHTML;
            pag.querySelector('button:first-child').addEventListener('click', () => {
                if (!prevDisabled) {
                    this.page--;
                    this.render();
                }
            });
            pag.querySelector('button:last-child').addEventListener('click', () => {
                if (!nextDisabled) {
                    this.page++;
                    this.render();
                }
            });
            pag.querySelectorAll('button:not(:first-child):not(:last-child)').forEach((btn) => {
                if (!btn.disabled && btn.textContent !== '...') {
                    btn.addEventListener('click', () => {
                        this.page = parseInt(btn.textContent);
                        this.render();
                    });
                }
            });
        }
        getVisiblePages(totalPages) {
            if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
            if (this.page <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
            if (this.page >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            return [1, '...', this.page - 1, this.page, this.page + 1, '...', totalPages];
        }
        initCheckboxes() {
            this.tbody.addEventListener("change", e => {
                const checkbox = e.target;
                if (checkbox.type === "checkbox") {
                    this.checkboxState.set(checkbox, checkbox.checked);
                    this.updateSelectionCounter();
                }
            });
            const selectAll = this.table.querySelector("thead input[type=checkbox]");
            if (selectAll) {
                selectAll.addEventListener("change", e => {
                    const isChecked = e.target.checked;
                    this.paginateRows().forEach(tr => {
                        const cb = tr.querySelector("input[type=checkbox]");
                        if (cb) {
                            cb.checked = isChecked;
                            this.checkboxState.set(cb, isChecked);
                        }
                    });
                    this.updateSelectionCounter();
                });
            }
        }
        restoreCheckboxes() {
            this.paginateRows().forEach(tr => {
                const cb = tr.querySelector("input[type=checkbox]");
                if (cb && this.checkboxState.has(cb)) cb.checked = this.checkboxState.get(cb);
            });
            this.updateSelectAllCheckbox();
        }
        updateSelectAllCheckbox() {
            const selectAll = this.table.querySelector("thead input[type=checkbox]");
            if (selectAll) {
                const visibleCheckboxes = this.paginateRows()
                    .map(tr => tr.querySelector("input[type=checkbox]"))
                    .filter(cb => cb);
                if (visibleCheckboxes.length === 0) {
                    selectAll.checked = false;
                    selectAll.disabled = true;
                } else {
                    selectAll.disabled = false;
                    const allChecked = visibleCheckboxes.every(cb => cb.checked);
                    selectAll.checked = allChecked;
                }
            }
        }
        updateSelectionCounter() {
            const selected = this.getSelectedCount();
            const total = this.filteredRows.length;
            this.selectionCounter.textContent = `${selected} of ${total} selected`;
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
            const selectedRows = this.getSelectedRows();
            if (selectedRows.length === 0) {
                alert('No data selected! Check the rows you want to export.');
                return;
            }
            const data = this.getExportData(selectedRows);
            const csv = this.convertToCSV(data);
            this.downloadFile(csv, 'selected-data-' + this.getTimestamp() + '.csv', 'text/csv');
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
            return this.getSelectedRows().map(row => {
                const checkbox = row.querySelector('input[type="checkbox"]');
                return checkbox ? checkbox.value : null;
            }).filter(id => id !== null);
        }
        copyToClipboard() {
            const data = this.getExportData();
            const tsv = this.convertToTSV(data);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(tsv)
                    .then(() => alert('Data copied to clipboard (Excel-ready)! Paste directly into Excel.'))
                    .catch(() => this.fallbackCopy(tsv));
            } else {
                this.fallbackCopy(tsv);
            }
        }
        fallbackCopy(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
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
            return headers;
        }
        getExportData(rows = null) {
            const dataRows = rows || this.filteredRows;
            const headers = this.getTableHeaders();
            return dataRows.map(row => {
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
                return obj;
            });
        }
        exportToCSV() {
            const data = this.getExportData();
            const csv = this.convertToCSV(data);
            this.downloadFile(csv, 'table-export-' + this.getTimestamp() + '.csv', 'text/csv');
        }
        convertToCSV(data) {
            if (data.length === 0) return '';
            const headers = Object.keys(data[0]);
            const csvRows = [
                headers.join(','),
                ...data.map(row => headers.map(header => {
                    const value = row[header] || '';
                    const escaped = value.toString().replace(/"/g, '""');
                    return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"') 
                        ? '"' + escaped + '"' 
                        : escaped;
                }).join(','))
            ];
            return csvRows.join('\n');
        }
        convertToTSV(data) {
            if (data.length === 0) return '';
            const headers = Object.keys(data[0]);
            const tsvRows = [
                headers.join('\t'),
                ...data.map(row => headers.map(header => {
                    const value = row[header] || '';
                    return value.toString().replace(/\t/g, ' ');
                }).join('\t'))
            ];
            return tsvRows.join('\n');
        }
        downloadFile(content, filename, mimeType) {
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
        }
        getTimestamp() {
            return new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        }
        render() {
            this.renderTable();
            this.renderPagination();
        }
        updateData(newRows) {
            if (Array.isArray(newRows)) {
                this.rows = newRows;
            } else if (typeof newRows === 'string') {
                this.tbody.innerHTML = newRows;
                this.rows = Array.from(this.tbody.querySelectorAll("tr"));
            } else if (newRows instanceof NodeList) {
                this.rows = Array.from(newRows);
            } else {
                return;
            }
            this.filteredRows = [...this.rows];
            this.page = 1;
            this.render();
        }
        destroy() {
            const container = this.table.parentNode;
            if (container.classList.contains('smt-container')) {
                const grandParent = container.parentNode;
                grandParent.insertBefore(this.table, container);
                container.remove();
            }
            this.table.classList.remove('smtables');
        }
    }
    
    document.addEventListener("DOMContentLoaded", () => {
        window.smtables = [];
        document.querySelectorAll(".smtables").forEach(table => {
            try {
                const instance = new SMTables(table, 10);
                window.smtables.push(instance);
            } catch {}
        });
    });
    
    if (typeof window !== 'undefined') {
        window.SMTables = SMTables;
    }
    
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SMTables;
    }
    
})();
