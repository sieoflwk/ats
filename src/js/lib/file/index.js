/**
 * @fileoverview 파일 관련 유틸리티
 * 파일 읽기, 변환, 압축, 검증 등
 */

/**
 * 파일 읽기 유틸리티
 */
export const reader = {
  /**
   * 파일을 텍스트로 읽기
   * @param {File} file - 파일 객체
   * @param {string} encoding - 인코딩 (기본: UTF-8)
   * @returns {Promise<string>}
   */
  readAsText(file, encoding = 'UTF-8') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      
      reader.readAsText(file, encoding);
    });
  },

  /**
   * 파일을 Data URL로 읽기
   * @param {File} file - 파일 객체
   * @returns {Promise<string>}
   */
  readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      
      reader.readAsDataURL(file);
    });
  },

  /**
   * 파일을 ArrayBuffer로 읽기
   * @param {File} file - 파일 객체
   * @returns {Promise<ArrayBuffer>}
   */
  readAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * 이미지 파일의 메타데이터 읽기
   * @param {File} file - 이미지 파일
   * @returns {Promise<Object>}
   */
  readImageMetadata(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('이미지 파일이 아닙니다'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          size: file.size,
          type: file.type,
          name: file.name
        });
      };
      
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  }
};

/**
 * 파일 변환 유틸리티
 */
export const converter = {
  /**
   * Data URL을 Blob으로 변환
   * @param {string} dataURL - Data URL
   * @returns {Blob}
   */
  dataURLToBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  },

  /**
   * Blob을 Data URL로 변환
   * @param {Blob} blob - Blob 객체
   * @returns {Promise<string>}
   */
  blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('변환 실패'));
      reader.readAsDataURL(blob);
    });
  },

  /**
   * 파일을 Base64로 변환
   * @param {File} file - 파일 객체
   * @returns {Promise<string>}
   */
  fileToBase64(file) {
    return this.reader.readAsDataURL(file).then(dataURL => {
      return dataURL.split(',')[1]; // Base64 부분만 반환
    });
  },

  /**
   * Base64를 파일로 변환
   * @param {string} base64 - Base64 문자열
   * @param {string} filename - 파일명
   * @param {string} mimeType - MIME 타입
   * @returns {File}
   */
  base64ToFile(base64, filename, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    return new File([blob], filename, { type: mimeType });
  }
};

/**
 * 이미지 처리 유틸리티
 */
export const image = {
  /**
   * 이미지 리사이즈
   * @param {File} file - 이미지 파일
   * @param {Object} options - 옵션
   * @returns {Promise<File>}
   */
  resize(file, options = {}) {
    const { 
      maxWidth = 800, 
      maxHeight = 600, 
      quality = 0.8,
      format = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('이미지 파일이 아닙니다'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 비율 유지하면서 리사이즈
        let { width, height } = this.calculateResizeRatio(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // Blob으로 변환
        canvas.toBlob((blob) => {
          const resizedFile = new File([blob], file.name, {
            type: format,
            lastModified: Date.now()
          });
          resolve(resizedFile);
        }, format, quality);
      };

      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * 리사이즈 비율 계산
   * @param {number} originalWidth - 원본 너비
   * @param {number} originalHeight - 원본 높이
   * @param {number} maxWidth - 최대 너비
   * @param {number} maxHeight - 최대 높이
   * @returns {Object}
   * @private
   */
  calculateResizeRatio(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;

    // 너비가 최대값을 초과하는 경우
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    // 높이가 최대값을 초과하는 경우
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  },

  /**
   * 이미지 압축
   * @param {File} file - 이미지 파일
   * @param {number} quality - 품질 (0-1)
   * @returns {Promise<File>}
   */
  compress(file, quality = 0.7) {
    return this.resize(file, { 
      maxWidth: 1920, 
      maxHeight: 1080, 
      quality 
    });
  },

  /**
   * 이미지 자르기
   * @param {File} file - 이미지 파일
   * @param {Object} cropArea - 자르기 영역 {x, y, width, height}
   * @returns {Promise<File>}
   */
  crop(file, cropArea) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        ctx.drawImage(
          img,
          cropArea.x, cropArea.y, cropArea.width, cropArea.height,
          0, 0, cropArea.width, cropArea.height
        );

        canvas.toBlob((blob) => {
          const croppedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(croppedFile);
        }, file.type, 0.8);
      };

      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * 썸네일 생성
   * @param {File} file - 이미지 파일
   * @param {number} size - 썸네일 크기
   * @returns {Promise<string>}
   */
  generateThumbnail(file, size = 150) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = size;
        canvas.height = size;

        // 정사각형으로 자르기 (중앙 기준)
        const minDimension = Math.min(img.width, img.height);
        const sx = (img.width - minDimension) / 2;
        const sy = (img.height - minDimension) / 2;

        ctx.drawImage(
          img,
          sx, sy, minDimension, minDimension,
          0, 0, size, size
        );

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => reject(new Error('썸네일 생성 실패'));
      img.src = URL.createObjectURL(file);
    });
  }
};

/**
 * 파일 검증 유틸리티
 */
export const validator = {
  /**
   * 파일 타입 검증
   * @param {File} file - 파일 객체
   * @param {string[]} allowedTypes - 허용된 MIME 타입들
   * @returns {boolean}
   */
  validateType(file, allowedTypes) {
    return allowedTypes.includes(file.type);
  },

  /**
   * 파일 크기 검증
   * @param {File} file - 파일 객체
   * @param {number} maxSize - 최대 크기 (bytes)
   * @returns {boolean}
   */
  validateSize(file, maxSize) {
    return file.size <= maxSize;
  },

  /**
   * 파일명 검증
   * @param {File} file - 파일 객체
   * @param {RegExp} pattern - 파일명 패턴
   * @returns {boolean}
   */
  validateName(file, pattern) {
    return pattern.test(file.name);
  },

  /**
   * 이미지 크기 검증
   * @param {File} file - 이미지 파일
   * @param {Object} constraints - 제약조건 {minWidth, maxWidth, minHeight, maxHeight}
   * @returns {Promise<boolean>}
   */
  async validateImageSize(file, constraints) {
    try {
      const metadata = await reader.readImageMetadata(file);
      const { minWidth = 0, maxWidth = Infinity, minHeight = 0, maxHeight = Infinity } = constraints;
      
      return metadata.width >= minWidth && metadata.width <= maxWidth &&
             metadata.height >= minHeight && metadata.height <= maxHeight;
    } catch (error) {
      return false;
    }
  },

  /**
   * 파일 확장자 검증
   * @param {File} file - 파일 객체
   * @param {string[]} allowedExtensions - 허용된 확장자들
   * @returns {boolean}
   */
  validateExtension(file, allowedExtensions) {
    const extension = file.name.split('.').pop().toLowerCase();
    return allowedExtensions.map(ext => ext.toLowerCase()).includes(extension);
  },

  /**
   * 악성 파일 검사 (기본적인 체크)
   * @param {File} file - 파일 객체
   * @returns {Promise<boolean>}
   */
  async validateSecurity(file) {
    const dangerousExtensions = [
      'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'ws', 'wsf'
    ];
    
    const extension = file.name.split('.').pop().toLowerCase();
    
    // 위험한 확장자 체크
    if (dangerousExtensions.includes(extension)) {
      return false;
    }

    // 파일 시그니처 체크 (간단한 버전)
    try {
      const buffer = await reader.readAsArrayBuffer(file.slice(0, 1024));
      const bytes = new Uint8Array(buffer);
      
      // 실행파일 시그니처 체크
      if (bytes.length >= 2) {
        // PE 헤더 (Windows 실행파일)
        if (bytes[0] === 0x4D && bytes[1] === 0x5A) {
          return false;
        }
        
        // ELF 헤더 (Linux 실행파일)
        if (bytes[0] === 0x7F && bytes[1] === 0x45 && bytes[2] === 0x4C && bytes[3] === 0x46) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
};

/**
 * 파일 유틸리티
 */
export const utils = {
  /**
   * 파일 크기를 읽기 쉬운 형태로 포맷팅
   * @param {number} bytes - 바이트 수
   * @param {number} decimals - 소수점 자리수
   * @returns {string}
   */
  formatSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * 파일 확장자 추출
   * @param {string} filename - 파일명
   * @returns {string}
   */
  getExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  },

  /**
   * 파일명에서 확장자 제거
   * @param {string} filename - 파일명
   * @returns {string}
   */
  removeExtension(filename) {
    return filename.replace(/\.[^/.]+$/, '');
  },

  /**
   * 안전한 파일명 생성
   * @param {string} filename - 원본 파일명
   * @returns {string}
   */
  sanitizeFilename(filename) {
    // 위험한 문자들 제거/치환
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .trim();
  },

  /**
   * MIME 타입에서 파일 확장자 추측
   * @param {string} mimeType - MIME 타입
   * @returns {string}
   */
  getExtensionFromMimeType(mimeType) {
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'text/plain': 'txt',
      'text/html': 'html',
      'text/css': 'css',
      'text/javascript': 'js',
      'application/json': 'json',
      'application/pdf': 'pdf',
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'video/mp4': 'mp4',
      'audio/mpeg': 'mp3'
    };

    return mimeToExt[mimeType] || 'bin';
  },

  /**
   * 파일 다운로드
   * @param {Blob|File} blob - 다운로드할 파일
   * @param {string} filename - 파일명
   */
  download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * 다중 파일 ZIP으로 압축 후 다운로드
   * @param {Array<{file: Blob, name: string}>} files - 파일 배열
   * @param {string} zipName - ZIP 파일명
   */
  async downloadAsZip(files, zipName = 'files.zip') {
    // 실제 구현에서는 JSZip 라이브러리 사용 권장
    console.warn('ZIP compression requires JSZip library');
    
    // 간단한 구현 (실제로는 JSZip 사용)
    if (files.length === 1) {
      this.download(files[0].file, files[0].name);
    } else {
      // 다중 파일의 경우 개별 다운로드
      files.forEach(({ file, name }) => {
        setTimeout(() => this.download(file, name), 100);
      });
    }
  }
};
