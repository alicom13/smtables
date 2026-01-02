# 🚀 SMTables v1.0.0

**Simple Magic Tables** - Transform any HTML table into a feature-rich datatable with just one class!

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![File Size](https://img.shields.io/badge/Size-4.1KB-minified-brightgreen)](https://github.com/alicom13/smtables)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen)](https://github.com/alicom13/smtables)

## ✨ Demo
👉 [Live Demo](https://alicom13.github.io/smtables/demo.html)

## 📋 Quick Start

### 1. Include the Library
```html
<!-- Just one file! -->
<script src="smtables.min.js"></script>
```
### 2. Tabel satu halaman
Custom Pakai ID Custom #SatuHalaman
butuh library dom, dibawah ini contoh pakai smdom.min.js
```js
s$.ready(() => {
    const tableEl = document.querySelector('#SatuHalaman');
    if (!tableEl || !window.smtables) return;

    const smt = window.smtables.find(t => t.table === tableEl);
    if (!smt) return;

    const table = s$(tableEl);
    const tbody = table.find('tbody');
    const container = table.closest('.smt-container');

    const originalRender = smt.render.bind(smt);

    function reorderDOM() {
        smt.filteredRows.forEach(tr => {
            tbody.get(0).appendChild(tr);
        });
    }

    function applyAllMode() {
        smt.filteredRows.forEach(tr => {
            tr.style.display = '';
        });

        container.find('.smt-pagination').hide();
        container.find('.smt-perpage').hide();

        const total = getRowCheckboxes().length;
        container.find('.smt-info')
            .text(`Showing all ${total} entries`);

        updateCounter();
    }

    function getRowCheckboxes() {
        return table.find('tbody input[type="checkbox"]');
    }

    function updateCounter() {
        const total = getRowCheckboxes().length;
        const checked = getRowCheckboxes().filter(':checked').length;

        container.find('.smt-selection')
            .text(`${checked} of ${total} selected`);

        const selectAll = table.find('thead input[type="checkbox"]');
        selectAll.prop('checked', total > 0 && checked === total);
    }

    smt.render = function () {
        originalRender();
        reorderDOM();
        applyAllMode();
    };

    smt.render();

    const selectAll = table.find('thead input[type="checkbox"]');

    selectAll.off('change').on('change', function () {
        const checked = this.checked;
        getRowCheckboxes().each(cb => {
            s$(cb).prop('checked', checked);
        });
        updateCounter();
    });

    table.find('tbody').off('change').on('change', 'input[type="checkbox"]', () => {
        updateCounter();
    });
});

````
