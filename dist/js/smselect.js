/*!
 * SMSelect.js v1.0.1
 * Simple Magic Select - Optimized
 * Author: @alicom13
 * License: MIT
 */

class SMSelect {
  constructor(element, options = {}) {
    this.container = element;
    this.multiple = options.multiple || element.getAttribute('sms-multiple') === 'true';
    this.selectedValues = [];

    this.container.innerHTML = `
      <div class="sms-selected">Pilih opsi</div>
      <div class="sms-items sms-hide">
        <input type="text" class="sms-search" placeholder="Cari...">
        <div class="sms-container"></div>
      </div>
    `;

    const opts = JSON.parse(this.container.getAttribute('sms-single') || '[]');
    const optsCont = this.container.querySelector('.sms-container');
    opts.forEach(o => {
      const div = document.createElement('div');
      div.textContent = o.label;
      div.dataset.value = o.value;
      div.dataset.label = o.label;
      optsCont.appendChild(div);
    });

    if (!document.getElementById('sm-select-style')) {
      const style = document.createElement('style');
      style.id = 'sm-select-style';
      style.innerHTML = `.sm-select{position:relative;width:250px;font-family:Arial,sans-serif;cursor:pointer}.sms-selected{background:#f0f0f0;padding:8px 12px;border:1px solid #ccc;border-radius:4px;min-height:30px}.sms-items{position:absolute;background:#fff;border:1px solid #ccc;border-top:none;width:100%;z-index:99;max-height:200px;overflow-y:auto;border-radius:0 0 4px 4px}.sms-search{width:100%;box-sizing:border-box;padding:6px 10px;border:none;border-bottom:1px solid #ccc}.sms-container div{padding:8px 12px}.sms-container div:hover{background:#f0f0f0}.sms-hide{display:none}.sms-active{background:#e0e0e0!important}`;
      document.head.appendChild(style);
    }

    this.selected = this.container.querySelector('.sms-selected');
    this.itemsContainer = this.container.querySelector('.sms-items');
    this.searchInput = this.container.querySelector('.sms-search');
    this.options = Array.from(this.container.querySelectorAll('.sms-container div'));

    this.selected.onclick = () => {
      this.itemsContainer.classList.toggle('sms-hide');
      if (!this.itemsContainer.classList.contains('sms-hide')) {
        this.searchInput.value = '';
        this.searchInput.focus();
      }
    };

    this.searchInput.oninput = () => {
      const filter = this.searchInput.value.toLowerCase();
      this.options.forEach(opt => opt.style.display = opt.textContent.toLowerCase().includes(filter) ? '' : 'none');
    };

    this.options.forEach(option => {
      option.onclick = e => {
        const val = e.target.dataset.value;
        const lbl = e.target.dataset.label;

        if (this.multiple) {
          const idx = this.selectedValues.indexOf(val);
          if (idx > -1) {
            this.selectedValues.splice(idx, 1);
            e.target.classList.remove('sms-active');
          } else {
            this.selectedValues.push(val);
            e.target.classList.add('sms-active');
          }
          this.selected.textContent = this.selectedValues.length ? this.options.filter(o => this.selectedValues.includes(o.dataset.value)).map(o => o.dataset.label).join(', ') : 'Pilih opsi';
        } else {
          this.options.forEach(opt => opt.classList.remove('sms-active'));
          e.target.classList.add('sms-active');
          this.selectedValues = [val];
          this.selected.textContent = lbl;
          this.itemsContainer.classList.add('sms-hide');
        }

        this.container.dispatchEvent(new CustomEvent('change', { detail: { values: this.selectedValues } }));
      };
    });

    document.addEventListener('click', e => {
      if (!this.container.contains(e.target)) this.itemsContainer.classList.add('sms-hide');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sm-select').forEach(el => new SMSelect(el));
});
