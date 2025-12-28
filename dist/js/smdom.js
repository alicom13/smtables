/*!
 * SMDom v2.0.0 - Simple Magic Dom
 * Single file, zero-dependency dom library 
 * @copyright 2025 Ali Musthofa
 * @license MIT
 * @link https://github.com/alicom13/smtables
 */
const s$ = (selector) => { 
  const elements = typeof selector === 'string' 
    ? document.querySelectorAll(selector)
    : (selector.length ? selector : [selector]);
  
  return {
    elements: Array.from(elements),
    
    // Events
    on: function(event, fn) {
      this.elements.forEach(el => el.addEventListener(event, fn));
      return this;
    },
    
    off: function(event, fn) {
      this.elements.forEach(el => el.removeEventListener(event, fn));
      return this;
    },
    
    // Content
    text: function(str) {
      if (str === undefined) return this.elements[0]?.textContent;
      this.elements.forEach(el => el.textContent = str);
      return this;
    },
    
    html: function(str) {
      if (str === undefined) return this.elements[0]?.innerHTML;
      this.elements.forEach(el => el.innerHTML = str);
      return this;
    },
    
    val: function(value) {
      if (value === undefined) return this.elements[0]?.value;
      this.elements.forEach(el => el.value = value);
      return this;
    },
    
    // Styling
    css: function(prop, value) {
      if (typeof prop === 'object') {
        this.elements.forEach(el => Object.assign(el.style, prop));
      } else if (value === undefined) {
        return this.elements[0]?.style[prop];
      } else {
        this.elements.forEach(el => el.style[prop] = value);
      }
      return this;
    },
    
    addClass: function(className) {
      this.elements.forEach(el => el.classList.add(className));
      return this;
    },
    
    removeClass: function(className) {
      this.elements.forEach(el => el.classList.remove(className));
      return this;
    },
    
    toggleClass: function(className) {
      this.elements.forEach(el => el.classList.toggle(className));
      return this;
    },
    
    hasClass: function(className) {
      return this.elements[0]?.classList.contains(className);
    },
    
    // Attributes
    attr: function(name, value) {
      if (value === undefined) return this.elements[0]?.getAttribute(name);
      this.elements.forEach(el => el.setAttribute(name, value));
      return this;
    },
    
    removeAttr: function(name) {
      this.elements.forEach(el => el.removeAttribute(name));
      return this;
    },
    
    data: function(key, value) {
      if (value === undefined) return this.elements[0]?.dataset[key];
      this.elements.forEach(el => el.dataset[key] = value);
      return this;
    },
    
    // DOM Manipulation
    append: function(content) {
      this.elements.forEach(el => {
        if (typeof content === 'string') {
          el.insertAdjacentHTML('beforeend', content);
        } else {
          el.appendChild(content);
        }
      });
      return this;
    },
    
    prepend: function(content) {
      this.elements.forEach(el => {
        if (typeof content === 'string') {
          el.insertAdjacentHTML('afterbegin', content);
        } else {
          el.insertBefore(content, el.firstChild);
        }
      });
      return this;
    },
    
    remove: function() {
      this.elements.forEach(el => el.remove());
      return this;
    },
    
    empty: function() {
      this.elements.forEach(el => el.innerHTML = '');
      return this;
    },
    
    // Traversal
    parent: function() {
      return s$(this.elements.map(el => el.parentElement).filter(Boolean));
    },
    
    children: function() {
      const children = [];
      this.elements.forEach(el => children.push(...el.children));
      return s$(children);
    },
    
    find: function(selector) {
      const found = [];
      this.elements.forEach(el => found.push(...el.querySelectorAll(selector)));
      return s$(found);
    },
    
    closest: function(selector) {
      return s$(this.elements.map(el => el.closest(selector)).filter(Boolean));
    },
    
    // Utilities
    each: function(fn) {
      this.elements.forEach((el, i) => fn(el, i));
      return this;
    },
    
    filter: function(fn) {
      return s$(this.elements.filter(fn));
    },
    
    first: function() {
      return s$(this.elements[0] || []);
    },
    
    last: function() {
      return s$(this.elements[this.elements.length - 1] || []);
    },
    
    eq: function(index) {
      return s$(this.elements[index] || []);
    },
    
    // Display
    show: function() {
      this.elements.forEach(el => el.style.display = '');
      return this;
    },
    
    hide: function() {
      this.elements.forEach(el => el.style.display = 'none');
      return this;
    },
    
    toggle: function() {
      this.elements.forEach(el => {
        el.style.display = el.style.display === 'none' ? '' : 'none';
      });
      return this;
    }
  };
};

// Ajax helper
s$.ajax = function(url, options = {}) {
  return fetch(url, {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.data ? JSON.stringify(options.data) : undefined
  }).then(res => options.json !== false ? res.json() : res.text());
};

// Ready helper
s$.ready = function(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
};
