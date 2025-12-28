/*!
 * SMDom v2.0.0 - Simple Magic Dom
 * Zero-dependency, lightweight DOM manipulation library
 * @copyright 2025 Ali Musthofa
 * @license MIT
 * @link https://github.com/alicom13/smtables
 */
(function(window) {
  'use strict';

  const s$ = function(selector) {
    const elements = typeof selector === 'string' 
      ? document.querySelectorAll(selector)
      : selector?.nodeType ? [selector]
      : selector?.length >= 0 ? Array.from(selector)
      : [];
    
    return {
      elements: Array.from(elements),
      length: elements.length,
      
      // === Events ===
      on(event, handler) {
        this.elements.forEach(el => el.addEventListener(event, handler));
        return this;
      },
      
      off(event, handler) {
        this.elements.forEach(el => el.removeEventListener(event, handler));
        return this;
      },
      
      trigger(eventName, detail) {
        this.elements.forEach(el => {
          el.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
        });
        return this;
      },
      
      // === Content ===
      text(value) {
        if (value === undefined) return this.elements[0]?.textContent || '';
        this.elements.forEach(el => el.textContent = value);
        return this;
      },
      
      html(value) {
        if (value === undefined) return this.elements[0]?.innerHTML || '';
        this.elements.forEach(el => el.innerHTML = value);
        return this;
      },
      
      val(value) {
        if (value === undefined) return this.elements[0]?.value || '';
        this.elements.forEach(el => el.value = value);
        return this;
      },
      
      // === Styling ===
      css(prop, value) {
        if (typeof prop === 'object') {
          this.elements.forEach(el => Object.assign(el.style, prop));
          return this;
        }
        if (value === undefined) {
          return this.elements[0] ? getComputedStyle(this.elements[0])[prop] : '';
        }
        this.elements.forEach(el => el.style[prop] = value);
        return this;
      },
      
      addClass(className) {
        this.elements.forEach(el => el.classList.add(...className.split(' ')));
        return this;
      },
      
      removeClass(className) {
        this.elements.forEach(el => el.classList.remove(...className.split(' ')));
        return this;
      },
      
      toggleClass(className) {
        this.elements.forEach(el => el.classList.toggle(className));
        return this;
      },
      
      hasClass(className) {
        return this.elements[0]?.classList.contains(className) || false;
      },
      
      // === Attributes ===
      attr(name, value) {
        if (typeof name === 'object') {
          this.elements.forEach(el => {
            Object.keys(name).forEach(key => el.setAttribute(key, name[key]));
          });
          return this;
        }
        if (value === undefined) return this.elements[0]?.getAttribute(name) || '';
        if (value === null) return this.removeAttr(name);
        this.elements.forEach(el => el.setAttribute(name, value));
        return this;
      },
      
      removeAttr(name) {
        this.elements.forEach(el => el.removeAttribute(name));
        return this;
      },
      
      prop(name, value) {
        if (value === undefined) return this.elements[0]?.[name];
        this.elements.forEach(el => el[name] = value);
        return this;
      },
      
      data(key, value) {
        if (value === undefined) return this.elements[0]?.dataset[key];
        this.elements.forEach(el => el.dataset[key] = value);
        return this;
      },
      
      // === DOM Manipulation ===
      append(content) {
        this.elements.forEach(el => {
          if (typeof content === 'string') {
            el.insertAdjacentHTML('beforeend', content);
          } else if (content?.elements) {
            content.elements.forEach(child => el.appendChild(child.cloneNode(true)));
          } else {
            el.appendChild(content.cloneNode ? content.cloneNode(true) : content);
          }
        });
        return this;
      },
      
      prepend(content) {
        this.elements.forEach(el => {
          if (typeof content === 'string') {
            el.insertAdjacentHTML('afterbegin', content);
          } else if (content?.elements) {
            content.elements.forEach(child => el.insertBefore(child.cloneNode(true), el.firstChild));
          } else {
            el.insertBefore(content.cloneNode ? content.cloneNode(true) : content, el.firstChild);
          }
        });
        return this;
      },
      
      after(content) {
        this.elements.forEach(el => {
          if (typeof content === 'string') {
            el.insertAdjacentHTML('afterend', content);
          } else {
            el.parentNode?.insertBefore(content.cloneNode ? content.cloneNode(true) : content, el.nextSibling);
          }
        });
        return this;
      },
      
      before(content) {
        this.elements.forEach(el => {
          if (typeof content === 'string') {
            el.insertAdjacentHTML('beforebegin', content);
          } else {
            el.parentNode?.insertBefore(content.cloneNode ? content.cloneNode(true) : content, el);
          }
        });
        return this;
      },
      
      remove() {
        this.elements.forEach(el => el.remove());
        return this;
      },
      
      empty() {
        this.elements.forEach(el => el.innerHTML = '');
        return this;
      },
      
      clone() {
        return s$(this.elements.map(el => el.cloneNode(true)));
      },
      
      // === Traversal ===
      parent() {
        return s$(this.elements.map(el => el.parentElement).filter(Boolean));
      },
      
      children(selector) {
        const children = [];
        this.elements.forEach(el => children.push(...Array.from(el.children)));
        return selector ? s$(children).filter(selector) : s$(children);
      },
      
      find(selector) {
        const found = [];
        this.elements.forEach(el => found.push(...el.querySelectorAll(selector)));
        return s$(found);
      },
      
      closest(selector) {
        return s$(this.elements.map(el => el.closest(selector)).filter(Boolean));
      },
      
      siblings(selector) {
        const siblings = [];
        this.elements.forEach(el => {
          Array.from(el.parentElement?.children || []).forEach(sibling => {
            if (sibling !== el) siblings.push(sibling);
          });
        });
        return selector ? s$(siblings).filter(selector) : s$(siblings);
      },
      
      next(selector) {
        const next = this.elements.map(el => el.nextElementSibling).filter(Boolean);
        return selector ? s$(next).filter(selector) : s$(next);
      },
      
      prev(selector) {
        const prev = this.elements.map(el => el.previousElementSibling).filter(Boolean);
        return selector ? s$(prev).filter(selector) : s$(prev);
      },
      
      // === Filtering & Iteration ===
      filter(selector) {
        if (typeof selector === 'function') {
          return s$(this.elements.filter(selector));
        }
        return s$(this.elements.filter(el => el.matches(selector)));
      },
      
      not(selector) {
        if (typeof selector === 'function') {
          return s$(this.elements.filter((el, i) => !selector(el, i)));
        }
        return s$(this.elements.filter(el => !el.matches(selector)));
      },
      
      is(selector) {
        return this.elements.some(el => el.matches(selector));
      },
      
      each(callback) {
        this.elements.forEach((el, i) => callback.call(el, el, i));
        return this;
      },
      
      map(callback) {
        return this.elements.map((el, i) => callback.call(el, el, i));
      },
      
      eq(index) {
        return s$(this.elements[index < 0 ? this.elements.length + index : index] || []);
      },
      
      first() {
        return s$(this.elements[0] || []);
      },
      
      last() {
        return s$(this.elements[this.elements.length - 1] || []);
      },
      
      get(index) {
        return index === undefined ? this.elements : this.elements[index];
      },
      
      // === Display ===
      show() {
        this.elements.forEach(el => {
          const display = el.dataset.originalDisplay || '';
          el.style.display = display;
          delete el.dataset.originalDisplay;
        });
        return this;
      },
      
      hide() {
        this.elements.forEach(el => {
          if (el.style.display !== 'none') {
            el.dataset.originalDisplay = el.style.display;
          }
          el.style.display = 'none';
        });
        return this;
      },
      
      toggle() {
        this.elements.forEach(el => {
          if (getComputedStyle(el).display === 'none') {
            this.show();
          } else {
            this.hide();
          }
        });
        return this;
      },
      
      fadeIn(duration = 400) {
        this.elements.forEach(el => {
          el.style.opacity = '0';
          el.style.display = '';
          let start = null;
          const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            el.style.opacity = Math.min(progress / duration, 1);
            if (progress < duration) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        });
        return this;
      },
      
      fadeOut(duration = 400) {
        this.elements.forEach(el => {
          let start = null;
          const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            el.style.opacity = Math.max(1 - progress / duration, 0);
            if (progress < duration) {
              requestAnimationFrame(animate);
            } else {
              el.style.display = 'none';
            }
          };
          requestAnimationFrame(animate);
        });
        return this;
      },
      
      // === Position & Dimensions ===
      offset() {
        const el = this.elements[0];
        if (!el) return { top: 0, left: 0 };
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top + window.pageYOffset,
          left: rect.left + window.pageXOffset
        };
      },
      
      position() {
        const el = this.elements[0];
        return el ? { top: el.offsetTop, left: el.offsetLeft } : { top: 0, left: 0 };
      },
      
      width(value) {
        if (value === undefined) {
          return this.elements[0]?.offsetWidth || 0;
        }
        this.elements.forEach(el => el.style.width = typeof value === 'number' ? value + 'px' : value);
        return this;
      },
      
      height(value) {
        if (value === undefined) {
          return this.elements[0]?.offsetHeight || 0;
        }
        this.elements.forEach(el => el.style.height = typeof value === 'number' ? value + 'px' : value);
        return this;
      },
      
      scrollTop(value) {
        if (value === undefined) {
          return this.elements[0]?.scrollTop || 0;
        }
        this.elements.forEach(el => el.scrollTop = value);
        return this;
      },
      
      scrollLeft(value) {
        if (value === undefined) {
          return this.elements[0]?.scrollLeft || 0;
        }
        this.elements.forEach(el => el.scrollLeft = value);
        return this;
      }
    };
  };

  // === Static Methods ===
  s$.ajax = function(url, options = {}) {
    const config = {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.data ? (options.json !== false ? JSON.stringify(options.data) : options.data) : undefined
    };
    
    if (options.json !== false && options.method !== 'GET') {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return fetch(url, config).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return options.json !== false ? res.json() : res.text();
    });
  };

  s$.ready = function(callback) {
    if (document.readyState !== 'loading') {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  };

  s$.create = function(tag, props = {}) {
    const el = document.createElement(tag);
    if (props.text) el.textContent = props.text;
    if (props.html) el.innerHTML = props.html;
    if (props.class) el.className = props.class;
    if (props.attr) Object.keys(props.attr).forEach(key => el.setAttribute(key, props.attr[key]));
    if (props.css) Object.assign(el.style, props.css);
    return s$(el);
  };

  s$.parseHTML = function(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return s$(template.content.children);
  };

  // Export
  if (typeof window !== 'undefined') {
    window.s$ = s$;
  }
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = s$;
  }

})(typeof window !== 'undefined' ? window : this);
