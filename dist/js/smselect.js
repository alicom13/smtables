/*!
 * SMSelect.js v1.0
 * Simple Magic Select
 * Author: Ali
 * License: MIT
 */

class SMSelect {
  constructor(element, options = { multiple: false, single: true }) {
    this.container = element;
    this.multiple = options.multiple;
    this.single = options.single;
    this.selectedValues = [];

    // Buat struktur HTML
    this.container.innerHTML = `
      <div class="select-selected">Pilih opsi</div>
      <div class="select-items select-hide">
        <input type="text" class="select-search" placeholder="Cari...">
        <div class="options-container"></div>
      </div>
    `;

    // Ambil opsi dari data-options
    const dataOptions = this.container.dataset.options;
    const optionsArr = dataOptions ? JSON.parse(dataOptions) : [];
    const optionsContainer = this.container.querySelector('.options-container');
    optionsContainer.innerHTML = '';
    optionsArr.forEach(opt => {
      const div = document.createElement('div');
      div.textContent = opt.label;
      div.dataset.value = opt.value;
      optionsContainer.appendChild(div);
    });

    // Inject minimal CSS
    if (!document.getElementById('sm-select-style')) {
      const style = document.createElement('style');
      style.id = 'sm-select-style';
      style.innerHTML = `
        .sm-select {position:relative;width:250px;font-family:Arial,sans-serif;cursor:pointer}
        .select-selected {background:#f0f0f0;padding:8px 12px;border:1px solid #ccc;border-radius:4px;min-height:30px}
        .select-items {position:absolute;background:#fff;border:1px solid #ccc;border-top:none;width:100%;z-index:99;max-height:200px;overflow-y:auto;border-radius:0 0 4px 4px}
        .select-search {width:100%;box-sizing:border-box;padding:6px 10px;border:none;border-bottom:1px solid #ccc}
        .select-items div {padding:8px 12px}
        .select-items div:hover {background:#f0f0f0}
        .select-hide {display:none}
      `;
      document.head.appendChild(style);
    }

    // Elemen penting
    this.selected = this.container.querySelector('.select-selected');
    this.itemsContainer = this.container.querySelector('.select-items');
    this.searchInput = this.container.querySelector('.select-search');
    this.options = Array.from(this.container.querySelectorAll('.options-container div'));

    // Toggle dropdown
    this.selected.addEventListener('click', () => {
      this.itemsContainer.classList.toggle('select-hide');
      if (!this.itemsContainer.classList.contains('select-hide')) this.searchInput.focus();
    });

    // Filter search
    this.searchInput.addEventListener('input', () => {
      const filter = this.searchInput.value.toLowerCase();
      this.options.forEach(opt => {
        opt.style.display = opt.textContent.toLowerCase().includes(filter) ? 'block' : 'none';
      });
    });

    // Klik opsi
    this.options.forEach(option => {
      option.addEventListener('click', e => {
        const value = e.target.dataset.value;
        const text = e.target.textContent;

        if (this.single) {
          this.options.forEach(opt => opt.style.backgroundColor = '');
          e.target.style.backgroundColor = '#e0e0e0';
          this.selectedValues = [value];
          this.selected.textContent = text;
          this.itemsContainer.classList.add('select-hide');
        } else if (this.multiple) {
          if (this.selectedValues.includes(value)) {
            this.selectedValues = this.selectedValues.filter(v => v !== value);
            e.target.style.backgroundColor = '';
          } else {
            this.selectedValues.push(value);
            e.target.style.backgroundColor = '#e0e0e0';
          }
          this.selected.textContent = this.selectedValues.length ? this.selectedValues.join(', ') : 'Pilih opsi';
        }

        // Trigger custom change event
        this.container.dispatchEvent(new CustomEvent('change', { detail: { values: this.selectedValues } }));
      });
    });

    // Tutup dropdown jika klik di luar
    document.addEventListener('click', e => {
      if (!this.container.contains(e.target)) this.itemsContainer.classList.add('select-hide');
    });
  }
}

// Auto-inisialisasi jika ada elemen class sm-select
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sm-select').forEach(el => {
    const multiple = el.dataset.multiple === 'true';
    const single = el.dataset.single !== 'false';
    new SMSelect(el, { multiple, single });
  });
});
