import { SecureStorage, InputValidator } from '../utils/security.js';

export class StorageService {
  constructor(namespace) {
    this.namespace = namespace;
    this.secureStorage = new SecureStorage('ats');
    this.backupInterval = null;
    this.setupAutoBackup();
  }

  _key() {
    return `wf:${this.namespace}`;
  }

  getAll() {
    try {
      // 먼저 보안 저장소에서 시도
      const secureData = this.secureStorage.getItem(this.namespace);
      if (secureData && Array.isArray(secureData)) {
        return secureData.map(item => ({ ...item })); // 얕은 복사
      }

      // 폴백: 기존 localStorage
      const raw = localStorage.getItem(this._key());
      if (!raw) return [];
      
      const parsed = JSON.parse(raw) || [];
      
      // 보안 저장소로 마이그레이션
      if (parsed.length > 0) {
        this.secureStorage.setItem(this.namespace, parsed);
        localStorage.removeItem(this._key());
      }
      
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Storage getAll error:', error);
      return this.restoreFromBackup() || [];
    }
  }

  setAll(items) {
    try {
      const validItems = Array.isArray(items) ? items : [];
      
      // 각 아이템 검증
      const validated = validItems.map(item => this.validateItem(item));
      
      // 보안 저장소에 저장
      const success = this.secureStorage.setItem(this.namespace, validated);
      
      if (!success) {
        // 폴백: 기존 localStorage
        localStorage.setItem(this._key(), JSON.stringify(validated));
      }
      
      // 백업 생성
      this.createBackup(validated);
      
    } catch (error) {
      console.error('Storage setAll error:', error);
      // 응급 저장
      try {
        localStorage.setItem(`${this._key()}_emergency`, JSON.stringify(items || []));
      } catch (emergencyError) {
        console.error('Emergency save failed:', emergencyError);
      }
    }
  }

  validateItem(item) {
    if (!item || typeof item !== 'object') {
      return item; // 비객체는 그대로 반환
    }

    const validated = { ...item };

    // 문자열 필드 검증
    Object.keys(validated).forEach(key => {
      const value = validated[key];
      
      if (typeof value === 'string') {
        const validation = InputValidator.validateInput(value, {
          maxLength: 10000,
          allowHTML: false,
          allowSQL: false
        });
        
        if (!validation.valid) {
          console.warn(`Invalid data in field ${key}:`, validation.error);
          validated[key] = value.replace(/[<>]/g, ''); // 기본 정화
        }
      }
    });

    // 타임스탬프 추가
    if (!validated.updatedAt) {
      validated.updatedAt = new Date().toISOString();
    }

    return validated;
  }

  upsert(item, idField = 'id') {
    try {
      const validatedItem = this.validateItem(item);
      const list = this.getAll();
      const idx = list.findIndex(i => i[idField] === validatedItem[idField]);
      
      if (idx >= 0) {
        // 업데이트
        list[idx] = {
          ...list[idx],
          ...validatedItem,
          updatedAt: new Date().toISOString()
        };
      } else {
        // 추가
        if (!validatedItem[idField]) {
          validatedItem[idField] = this.generateId();
        }
        validatedItem.createdAt = validatedItem.createdAt || new Date().toISOString();
        list.push(validatedItem);
      }
      
      this.setAll(list);
      return validatedItem;
    } catch (error) {
      console.error('Storage upsert error:', error);
      throw new Error('Failed to save item: ' + error.message);
    }
  }

  delete(id, idField = 'id') {
    try {
      const list = this.getAll();
      const filtered = list.filter(i => i[idField] !== id);
      
      if (list.length === filtered.length) {
        console.warn(`Item with ${idField}=${id} not found`);
        return false;
      }
      
      this.setAll(filtered);
      return true;
    } catch (error) {
      console.error('Storage delete error:', error);
      throw new Error('Failed to delete item: ' + error.message);
    }
  }

  // 추가 메서드들
  generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  createBackup(data) {
    try {
      const backup = {
        timestamp: Date.now(),
        data: data,
        namespace: this.namespace
      };
      localStorage.setItem(`backup_${this._key()}`, JSON.stringify(backup));
    } catch (error) {
      console.warn('Backup creation failed:', error);
    }
  }

  restoreFromBackup() {
    try {
      const backupData = localStorage.getItem(`backup_${this._key()}`);
      if (!backupData) return null;

      const backup = JSON.parse(backupData);
      
      // 1주일 이상 된 백업은 무시
      if (Date.now() - backup.timestamp > 7 * 24 * 60 * 60 * 1000) {
        return null;
      }

      console.log('Restoring from backup for', this.namespace);
      return backup.data || [];
    } catch (error) {
      console.error('Backup restoration failed:', error);
      return null;
    }
  }

  setupAutoBackup() {
    // 5분마다 백업
    this.backupInterval = setInterval(() => {
      const data = this.getAll();
      if (data.length > 0) {
        this.createBackup(data);
      }
    }, 5 * 60 * 1000);
  }

  cleanup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  // 통계
  getStats() {
    const data = this.getAll();
    return {
      namespace: this.namespace,
      itemCount: data.length,
      dataSize: JSON.stringify(data).length
    };
  }
}


