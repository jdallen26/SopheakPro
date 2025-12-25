// javascript
// File: static/controls/js/advanced-combo.js
export class AdvancedCombo {
    constructor(rootEl, options = {}) {
        this.root = rootEl;
        this.input = this.root && this.root.querySelector('.combo-input');
        this.list = this.root && this.root.querySelector('.combo-list');
        this.tags = this.root && this.root.querySelector('.combo-tags');
        this.hiddenSingle = this.root && this.root.querySelector('.combo-hidden-id');
        this.hiddenMulti = this.root && this.root.querySelector('.combo-hidden-ids');
        this.hiddenText = this.root && this.root.querySelector('.combo-hidden-text');

        // default options
        const defaultOptions = {
            fetcher: async () => [],
            multi: false,
            showCheckbox: false,
            showIcon: true,
            allowFreeText: true,
            debounceMs: 160,
            minChars: 0,
            maxItems: 200,
            onChange: () => {
            },
            confirmCreate: false,
            createHandler: null,
            appendToBody: true
        };

        // merge defaults with caller-supplied options (caller wins)
        const opts = Object.assign({}, defaultOptions, options);

        // initialize instance options to defaults first so setOptions can be used safely
        this.fetcher = defaultOptions.fetcher;
        this.multi = defaultOptions.multi;
        this.showCheckbox = defaultOptions.showCheckbox;
        this.showIcon = defaultOptions.showIcon;
        this.allowFreeText = defaultOptions.allowFreeText;
        this.debounceMs = defaultOptions.debounceMs;
        this.minChars = defaultOptions.minChars;
        this.maxItems = defaultOptions.maxItems;
        this.onChange = defaultOptions.onChange;
        this.confirmCreate = defaultOptions.confirmCreate;
        this.createHandler = defaultOptions.createHandler;
        this.appendToBody = defaultOptions.appendToBody;

        // apply caller options via setOptions (prevents "not used" warning and keeps a single update path)
        this.setOptions(opts);

        // internal state
        this.items = [];
        this.highlight = -1;
        this.selected = [];
        this._boundDocClick = this._onDocClick.bind(this);
        this._createModalInstance = null;

        // helpers for body-append behavior
        this._movedToBody = false;
        this._placeholder = null;
        this._boundReposition = this._positionList.bind(this);

        this._init();
    }

    // allow updating options after construction
    setOptions(newOptions = {}) {
        const merged = Object.assign({
            fetcher: this.fetcher,
            multi: this.multi,
            showCheckbox: this.showCheckbox,
            showIcon: this.showIcon,
            allowFreeText: this.allowFreeText,
            debounceMs: this.debounceMs,
            minChars: this.minChars,
            maxItems: this.maxItems,
            onChange: this.onChange,
            confirmCreate: this.confirmCreate,
            createHandler: this.createHandler,
            appendToBody: this.appendToBody
        }, newOptions);

        this.fetcher = typeof merged.fetcher === 'function' ? merged.fetcher : this.fetcher;
        this.multi = !!merged.multi;
        this.showCheckbox = !!merged.showCheckbox;
        this.showIcon = !!merged.showIcon;
        this.allowFreeText = !!merged.allowFreeText;
        this.debounceMs = Number(merged.debounceMs) || this.debounceMs;
        this.minChars = Number(merged.minChars) || this.minChars;
        this.maxItems = Number(merged.maxItems) || this.maxItems;
        this.onChange = typeof merged.onChange === 'function' ? merged.onChange : this.onChange;
        this.confirmCreate = !!merged.confirmCreate;
        this.createHandler = typeof merged.createHandler === 'function' ? merged.createHandler : this.createHandler;
        this.appendToBody = !!merged.appendToBody;
    }

    _init() {
        if (!this.input || !this.list) return;
        this.input.setAttribute('role', 'combobox');
        this.input.setAttribute('aria-autocomplete', 'list');
        this.input.setAttribute('aria-expanded', 'false');
        this.list.hidden = true;
        // clear inline position so moving to body works consistently
        this.list.style.position = this.list.style.position || '';
        this._attachEvents();
    }

    _attachEvents() {
        // input change (debounced)
        this.input.addEventListener('input', this._debounce(() => this._onInput(), this.debounceMs));
        // keyboard
        this.input.addEventListener('keydown', (e) => this._onKeyDown(e));
        // open on focus (acts like a native select box)
        this.input.addEventListener('focus', () => {
            if (this.input.value.trim().length >= this.minChars || this.minChars === 0) {
                // trigger fetch immediately (bypass debounce for better UX on focus)
                this._onInput();
            }
        });
        // also open on click when closed (useful if the user clicks the field)
        this.input.addEventListener('click', () => {
            if (this.list.hidden && (this.input.value.trim().length >= this.minChars || this.minChars === 0)) {
                this._onInput();
            }
        });
        // list click -> select
        this.list.addEventListener('click', (e) => {
            const li = e.target.closest('.combo-item');
            if (!li) return;
            const idx = Number(li.dataset.index);
            this._toggleSelect(idx);
        });
        // close when clicking outside
        document.addEventListener('click', this._boundDocClick);
        // tags remove handler (for multi)
        if (this.tags) {
            this.tags.addEventListener('click', (e) => {
                if (e.target.matches('.combo-tag-remove')) {
                    const id = e.target.closest('.combo-tag').dataset.id;
                    this._removeSelectedById(id);
                }
            });
        }
    }

    async _onInput() {
        const q = this.input.value.trim();
        if (q.length < this.minChars) {
            this._close();
            return;
        }
        this._renderNote('Loading\u2026');
        try {
            const items = await this.fetcher(q);
            this.items = Array.isArray(items) ? items.slice(0, this.maxItems) : [];
            if (this.items.length === 0) this._renderNote('No results');
            else this._renderItems();
        } catch (err) {
            console.error('AdvancedCombo fetcher error', err);
            this._renderNote('Error');
        }
    }

    _onKeyDown(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this._move(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this._move(-1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.highlight >= 0) this._toggleSelect(this.highlight);
            else if (this.allowFreeText && this.input.value.trim()) this._handleFreeTextCommit(this.input.value.trim());
        } else if (e.key === 'Escape') {
            this._close();
        } else if (e.key === 'Backspace' && this.multi && !this.input.value && this.selected.length) {
            this._removeSelectedById(this.selected[this.selected.length - 1].id);
        }
    }

    async _handleFreeTextCommit(text) {
        if (this.confirmCreate) {
            const ok = await this._promptCreate(text);
            if (!ok) return;
        }

        if (this.createHandler) {
            try {
                const created = await this.createHandler(text);
                if (created && created.id !== undefined) {
                    const item = {
                        id: String(created.id),
                        label: created.label || String(created.id),
                        icon: created.icon || '',
                        meta: created.meta || ''
                    };
                    if (this.multi) {
                        this.selected.push({id: item.id, label: item.label});
                        this._renderTags();
                    } else {
                        this.selected = [{id: item.id, label: item.label}];
                        this.input.value = item.label;
                    }
                    this._writeHidden();
                    this.onChange(this.getValue());
                    return;
                }
            } catch (err) {
                console.error('createHandler error', err);
            }
        }

        if (this.multi) {
            this.selected.push({id: '', label: text});
            this.input.value = '';
            this._renderTags();
        } else {
            this.selected = [{id: '', label: text}];
            this._writeHidden();
        }
        this._close();
        this.onChange(this.getValue());
    }

    _promptCreate(text) {
        return new Promise((resolve) => {
            const modal = this._ensureCreateModal();
            modal.querySelector('.advanced-combo-create-message').textContent = `Create and save "${text}" to database?`;
            const confirmBtn = modal.querySelector('.advanced-combo-create-confirm');
            const cancelBtn = modal.querySelector('.advanced-combo-create-cancel');

            const onConfirm = () => {
                cleanup();
                resolve(true);
            };
            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            function cleanup() {
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                bootstrap.Modal.getInstance(modal).hide();
            }

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
            bootstrap.Modal.getOrCreateInstance(modal).show();
        });
    }

    _ensureCreateModal() {
        if (this._createModalInstance) return this._createModalInstance;
        const html = `
      <div class="modal fade advanced-combo-create-modal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-sm modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Create Item</h5>
            </div>
            <div class="modal-body">
              <p class="advanced-combo-create-message"></p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary advanced-combo-create-cancel">Cancel</button>
              <button type="button" class="btn btn-primary advanced-combo-create-confirm">Create</button>
            </div>
          </div>
        </div>
      </div>
    `;
        const container = document.createElement('div');
        container.innerHTML = html;
        const modalEl = container.firstElementChild;
        document.body.appendChild(modalEl);
        this._createModalInstance = modalEl;
        return modalEl;
    }

    _move(delta) {
        if (!this.items.length) return;
        this.highlight = (this.highlight + delta + this.items.length) % this.items.length;
        this._updateHighlight();
    }

    _updateHighlight() {
        const children = Array.from(this.list.querySelectorAll('.combo-item'));
        children.forEach((c, i) => c.setAttribute('aria-selected', i === this.highlight ? 'true' : 'false'));
        const el = children[this.highlight];
        if (el) el.scrollIntoView({block: 'nearest'});
    }

    _toggleSelect(idx) {
        const item = this.items[idx];
        if (!item) return;
        const idStr = String(item.id || '');
        if (this.multi) {
            const found = this.selected.find(s => s.id === idStr);
            if (found) this._removeSelectedById(idStr);
            else this.selected.push({id: idStr, label: item.label});
            this._renderTags();
        } else {
            this.selected = [{id: idStr, label: item.label}];
            this.input.value = item.label;
            this._close();
        }
        this._writeHidden();
        this.onChange(this.getValue());
    }

    _removeSelectedById(id) {
        this.selected = this.selected.filter(s => s.id !== String(id));
        if (this.multi) this._renderTags();
        this._writeHidden();
        this.onChange(this.getValue());
    }

    _commitFreeText() {
        if (this.allowFreeText && this.input.value.trim()) this._handleFreeTextCommit(this.input.value.trim());
    }

    _renderItems() {
        this.highlight = -1;
        this.list.innerHTML = this.items.map((it, idx) => {
            const icon = this.showIcon && it.icon ? `<img src="${this._esc(it.icon)}" class="combo-icon" alt="">` : '';
            const checkbox = this.multi && this.showCheckbox ? `<input class="combo-item-check" type="checkbox" tabindex="-1" ${this.selected.find(s => s.id === String(it.id)) ? 'checked' : ''}>` : '';
            const meta = it.meta ? `<span class="combo-meta">${this._esc(it.meta)}</span>` : '';
            return `<li class="combo-item" data-index="${idx}" role="option" aria-selected="false">
                ${checkbox}
                ${icon}
                <div class="combo-label">${this._esc(it.label)}</div>
                ${meta}
              </li>`;
        }).join('');
        this._open();
    }

    _renderNote(text) {
        this.list.innerHTML = `<li class="combo-note" role="option" aria-disabled="true">${this._esc(text)}</li>`;
        this._open();
    }

    _open() {
        if (this.appendToBody && !this._movedToBody) {
            this._moveListToBody();
        }
        this.list.hidden = false;
        this.input.setAttribute('aria-expanded', 'true');
        if (this.appendToBody) {
            this._positionList();
            window.addEventListener('resize', this._boundReposition);
            window.addEventListener('scroll', this._boundReposition, true);
        }
    }

    _close() {
        this.list.hidden = true;
        this.input.setAttribute('aria-expanded', 'false');
        this.highlight = -1;
        if (this.appendToBody && this._movedToBody) {
            this._restoreListToRoot();
        }
        if (this.appendToBody) {
            window.removeEventListener('resize', this._boundReposition);
            window.removeEventListener('scroll', this._boundReposition, true);
        }
    }

    _moveListToBody() {
        if (!this.list || this._movedToBody) return;
        this._placeholder = document.createComment('advanced-combo-list-placeholder');
        this.list.parentNode.insertBefore(this._placeholder, this.list);

        const s = this.list.style;

        // structural / positioning
        s.boxSizing = 'border-box';
        s.position = 'absolute';
        s.zIndex = '999999';

        // immediate non-important hints
        s.minWidth = '120px';
        s.pointerEvents = 'auto';
        s.backgroundClip = 'padding-box';

        // use setProperty(..., 'important') to override stylesheet !important rules
        s.setProperty('background-color', '#ffffff', 'important');
        s.setProperty('opacity', '1', 'important');
        s.setProperty('list-style', 'none', 'important');
        s.setProperty('margin', '0', 'important');
        s.setProperty('padding', '0 0 0 5px', 'important');
        s.setProperty('color', '#212529', 'important');
        s.setProperty('border', '1px solid rgba(0, 0, 0, .12)', 'important');
        s.setProperty('max-height', '40vh', 'important');
        s.setProperty('overflow', 'auto', 'important');
        s.setProperty('box-shadow', '0 .25rem .5rem rgba(0,0,0,.08)', 'important');
        s.setProperty('border-bottom-left-radius', '.25rem', 'important');
        s.setProperty('border-bottom-right-radius', '.25rem', 'important');

        // paint/layer hints
        s.setProperty('-webkit-transform', 'translateZ(0)', 'important');
        s.setProperty('transform', 'translateZ(0)', 'important');
        s.setProperty('-webkit-backface-visibility', 'hidden', 'important');
        s.setProperty('backface-visibility', 'hidden', 'important');

        // ensure the root keeps layout if needed
        this.root.style.position = this.root.style.position || 'relative';

        // move the list into document.body once
        document.body.appendChild(this.list);
        this._movedToBody = true;
    }

    _restoreListToRoot() {
        if (!this._movedToBody) return;
        this.list.style.position = '';
        this.list.style.left = '';
        this.list.style.top = '';
        this.list.style.width = '';
        this.list.style.maxHeight = '';
        this.list.style.zIndex = '';
        if (this._placeholder && this._placeholder.parentNode) {
            this._placeholder.parentNode.insertBefore(this.list, this._placeholder);
            this._placeholder.parentNode.removeChild(this._placeholder);
            this._placeholder = null;
        } else {
            this.root.appendChild(this.list);
        }
        this._movedToBody = false;
    }

    _positionList() {
        if (!this._movedToBody || !this.input || !this.list) return;
        const rect = this.input.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        this.list.style.left = (rect.left + scrollX) + 'px';
        this.list.style.top = (rect.bottom + scrollY + 4) + 'px';
        this.list.style.width = Math.max(rect.width, 120) + 'px';
        this.list.style.maxHeight = '40vh';
        this.list.style.overflow = 'auto';
    }

    _writeHidden() {
        if (!this.hiddenSingle || !this.hiddenMulti || !this.hiddenText) return;
        if (this.multi) {
            this.hiddenMulti.value = JSON.stringify(this.selected);
            this.hiddenSingle.value = this.selected.length ? this.selected[0].id || '' : '';
            this.hiddenText.value = this.selected.map(s => s.label).join(', ');
        } else {
            const first = this.selected[0];
            this.hiddenSingle.value = first ? first.id || '' : '';
            this.hiddenText.value = first ? first.label || '' : '';
            this.hiddenMulti.value = JSON.stringify(first ? [first] : []);
        }
    }

    getValue() {
        if (this.multi) return this.selected.slice();
        return this.selected[0] ? {...this.selected[0]} : null;
    }

    destroy() {
        document.removeEventListener('click', this._boundDocClick);
        if (this.appendToBody && this._movedToBody) this._restoreListToRoot();
        window.removeEventListener('resize', this._boundReposition);
        window.removeEventListener('scroll', this._boundReposition, true);
    }

    _onDocClick(e) {
        if (!this.root.contains(e.target) && !this.list.contains(e.target)) this._close();
    }

    _renderTags() {
        if (!this.tags) return;
        this.tags.innerHTML = this.selected.map(s => {
            const id = this._esc(s.id || '');
            const label = this._esc(s.label || '');
            return `<span class="combo-tag" data-id="${id}">
                    <span class="combo-tag-label">${label}</span>
                    <button type="button" class="combo-tag-remove" aria-label="Remove">&times;</button>
                </span>`;
        }).join('');
        if (this.input) this.input.value = '';
    }

    _debounce(fn, ms) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    _esc(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
}
