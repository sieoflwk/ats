export class StorageService {
  constructor(namespace) {
    this.namespace = namespace;
  }

  _key() {
    return `wf:${this.namespace}`;
  }

  getAll() {
    const raw = localStorage.getItem(this._key());
    if (!raw) return [];
    try { return JSON.parse(raw) || []; } catch { return []; }
  }

  setAll(items) {
    localStorage.setItem(this._key(), JSON.stringify(items || []));
  }

  upsert(item, idField = 'id') {
    const list = this.getAll();
    const idx = list.findIndex(i => i[idField] === item[idField]);
    if (idx >= 0) list[idx] = item; else list.push(item);
    this.setAll(list);
    return item;
  }

  delete(id, idField = 'id') {
    const list = this.getAll().filter(i => i[idField] !== id);
    this.setAll(list);
  }
}


