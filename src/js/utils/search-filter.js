/**
 * 고급 검색 및 필터링 유틸리티
 */

export class SearchFilter {
  constructor(data = [], options = {}) {
    this.originalData = [...data];
    this.filteredData = [...data];
    this.searchableFields = options.searchableFields || [];
    this.sortField = null;
    this.sortDirection = 'asc';
    this.filters = new Map();
    this.searchQuery = '';
    this.pagination = {
      page: 1,
      limit: options.pageSize || 10,
      total: data.length
    };
  }

  // 데이터 업데이트
  updateData(newData) {
    this.originalData = [...newData];
    this.filteredData = [...newData];
    this.pagination.total = newData.length;
    this.applyAllFilters();
    return this;
  }

  // 텍스트 검색
  search(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.applyAllFilters();
    return this;
  }

  // 필터 추가/업데이트
  setFilter(key, value, type = 'exact') {
    if (value === null || value === undefined || value === '') {
      this.filters.delete(key);
    } else {
      this.filters.set(key, { value, type });
    }
    this.applyAllFilters();
    return this;
  }

  // 날짜 범위 필터
  setDateRangeFilter(field, startDate, endDate) {
    if (!startDate && !endDate) {
      this.filters.delete(field);
    } else {
      this.filters.set(field, {
        type: 'dateRange',
        start: startDate ? new Date(startDate) : null,
        end: endDate ? new Date(endDate) : null
      });
    }
    this.applyAllFilters();
    return this;
  }

  // 숫자 범위 필터
  setRangeFilter(field, min, max) {
    if (min === null && max === null) {
      this.filters.delete(field);
    } else {
      this.filters.set(field, {
        type: 'range',
        min: min !== null ? Number(min) : null,
        max: max !== null ? Number(max) : null
      });
    }
    this.applyAllFilters();
    return this;
  }

  // 다중 선택 필터
  setMultiSelectFilter(field, values) {
    if (!values || values.length === 0) {
      this.filters.delete(field);
    } else {
      this.filters.set(field, {
        type: 'multiSelect',
        values: Array.isArray(values) ? values : [values]
      });
    }
    this.applyAllFilters();
    return this;
  }

  // 정렬
  sort(field, direction = 'asc') {
    this.sortField = field;
    this.sortDirection = direction;
    this.applySorting();
    return this;
  }

  // 페이지네이션
  paginate(page, limit = this.pagination.limit) {
    this.pagination.page = Math.max(1, page);
    this.pagination.limit = Math.max(1, limit);
    return this;
  }

  // 모든 필터 적용
  applyAllFilters() {
    let result = [...this.originalData];

    // 텍스트 검색 적용
    if (this.searchQuery) {
      result = this.applyTextSearch(result);
    }

    // 개별 필터 적용
    for (const [field, filter] of this.filters) {
      result = this.applyFilter(result, field, filter);
    }

    // 정렬 적용
    if (this.sortField) {
      result = this.applySortingToData(result);
    }

    this.filteredData = result;
    this.pagination.total = result.length;
    this.pagination.page = Math.min(this.pagination.page, this.getTotalPages());

    return this;
  }

  // 텍스트 검색 적용
  applyTextSearch(data) {
    if (!this.searchQuery) return data;

    return data.filter(item => {
      // 지정된 검색 필드가 있으면 해당 필드만 검색
      if (this.searchableFields.length > 0) {
        return this.searchableFields.some(field => {
          const value = this.getNestedValue(item, field);
          return this.matchesSearchQuery(value);
        });
      }

      // 모든 문자열 필드 검색
      return this.searchInObject(item);
    });
  }

  // 객체 내 재귀 검색
  searchInObject(obj, depth = 0) {
    if (depth > 3) return false; // 무한 재귀 방지

    for (const value of Object.values(obj)) {
      if (typeof value === 'string' && this.matchesSearchQuery(value)) {
        return true;
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (this.searchInObject(value, depth + 1)) {
          return true;
        }
      }
      if (Array.isArray(value)) {
        if (value.some(item => 
          typeof item === 'string' ? this.matchesSearchQuery(item) : 
          typeof item === 'object' ? this.searchInObject(item, depth + 1) : false
        )) {
          return true;
        }
      }
    }
    return false;
  }

  // 검색 쿼리 매칭
  matchesSearchQuery(value) {
    if (!value) return false;
    return String(value).toLowerCase().includes(this.searchQuery);
  }

  // 개별 필터 적용
  applyFilter(data, field, filter) {
    return data.filter(item => {
      const value = this.getNestedValue(item, field);

      switch (filter.type) {
        case 'exact':
          return value === filter.value;

        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());

        case 'startsWith':
          return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());

        case 'dateRange':
          const itemDate = new Date(value);
          if (isNaN(itemDate)) return false;
          
          const start = filter.start;
          const end = filter.end;
          
          if (start && end) {
            return itemDate >= start && itemDate <= end;
          } else if (start) {
            return itemDate >= start;
          } else if (end) {
            return itemDate <= end;
          }
          return true;

        case 'range':
          const numValue = Number(value);
          if (isNaN(numValue)) return false;
          
          if (filter.min !== null && filter.max !== null) {
            return numValue >= filter.min && numValue <= filter.max;
          } else if (filter.min !== null) {
            return numValue >= filter.min;
          } else if (filter.max !== null) {
            return numValue <= filter.max;
          }
          return true;

        case 'multiSelect':
          return filter.values.includes(value);

        case 'boolean':
          return Boolean(value) === Boolean(filter.value);

        case 'custom':
          return filter.predicate(value, item);

        default:
          return true;
      }
    });
  }

  // 정렬 적용
  applySorting() {
    this.applyAllFilters();
    return this;
  }

  applySortingToData(data) {
    if (!this.sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = this.getNestedValue(a, this.sortField);
      const bValue = this.getNestedValue(b, this.sortField);

      let result = 0;

      // null/undefined 처리
      if (aValue == null && bValue == null) {
        result = 0;
      } else if (aValue == null) {
        result = 1;
      } else if (bValue == null) {
        result = -1;
      }
      // 날짜 비교
      else if (this.isDate(aValue) && this.isDate(bValue)) {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        result = dateA.getTime() - dateB.getTime();
      }
      // 숫자 비교
      else if (typeof aValue === 'number' && typeof bValue === 'number') {
        result = aValue - bValue;
      }
      // 문자열 비교
      else {
        result = String(aValue).localeCompare(String(bValue), 'ko', { numeric: true });
      }

      return this.sortDirection === 'desc' ? -result : result;
    });
  }

  // 중첩된 객체 값 가져오기
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  // 날짜 판별
  isDate(value) {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime()) && 
           (typeof value === 'string' && 
            (value.includes('-') || value.includes('/') || value.includes('T')));
  }

  // 결과 가져오기
  getResults() {
    const start = (this.pagination.page - 1) * this.pagination.limit;
    const end = start + this.pagination.limit;
    
    return {
      data: this.filteredData.slice(start, end),
      pagination: {
        ...this.pagination,
        totalPages: this.getTotalPages(),
        hasNext: this.pagination.page < this.getTotalPages(),
        hasPrev: this.pagination.page > 1
      },
      meta: {
        total: this.originalData.length,
        filtered: this.filteredData.length,
        searchQuery: this.searchQuery,
        activeFilters: Array.from(this.filters.entries()),
        sortField: this.sortField,
        sortDirection: this.sortDirection
      }
    };
  }

  // 전체 페이지 수
  getTotalPages() {
    return Math.ceil(this.filteredData.length / this.pagination.limit);
  }

  // 필터 초기화
  clearFilters() {
    this.filters.clear();
    this.searchQuery = '';
    this.applyAllFilters();
    return this;
  }

  // 특정 필터 제거
  removeFilter(key) {
    this.filters.delete(key);
    this.applyAllFilters();
    return this;
  }

  // 필터 상태 가져오기
  getFilterState() {
    return {
      search: this.searchQuery,
      filters: Object.fromEntries(this.filters),
      sort: {
        field: this.sortField,
        direction: this.sortDirection
      },
      pagination: { ...this.pagination }
    };
  }

  // 필터 상태 복원
  restoreFilterState(state) {
    if (state.search) this.searchQuery = state.search;
    if (state.filters) {
      this.filters = new Map(Object.entries(state.filters));
    }
    if (state.sort) {
      this.sortField = state.sort.field;
      this.sortDirection = state.sort.direction;
    }
    if (state.pagination) {
      this.pagination = { ...this.pagination, ...state.pagination };
    }
    this.applyAllFilters();
    return this;
  }

  // 고유 값 목록 가져오기 (필터 옵션용)
  getUniqueValues(field) {
    const values = this.originalData
      .map(item => this.getNestedValue(item, field))
      .filter(value => value !== null && value !== undefined);
    
    return [...new Set(values)].sort();
  }

  // 통계 정보
  getStats() {
    return {
      totalItems: this.originalData.length,
      filteredItems: this.filteredData.length,
      currentPage: this.pagination.page,
      totalPages: this.getTotalPages(),
      itemsPerPage: this.pagination.limit,
      activeFiltersCount: this.filters.size,
      hasSearch: Boolean(this.searchQuery)
    };
  }
}

// 빠른 검색 헬퍼 함수들
export function quickSearch(data, query, fields = []) {
  const filter = new SearchFilter(data, { searchableFields: fields });
  return filter.search(query).getResults().data;
}

export function quickSort(data, field, direction = 'asc') {
  const filter = new SearchFilter(data);
  return filter.sort(field, direction).getResults().data;
}

export function quickFilter(data, filters) {
  const filter = new SearchFilter(data);
  
  Object.entries(filters).forEach(([field, config]) => {
    if (typeof config === 'object' && config.type) {
      switch (config.type) {
        case 'dateRange':
          filter.setDateRangeFilter(field, config.start, config.end);
          break;
        case 'range':
          filter.setRangeFilter(field, config.min, config.max);
          break;
        case 'multiSelect':
          filter.setMultiSelectFilter(field, config.values);
          break;
        default:
          filter.setFilter(field, config.value, config.type);
      }
    } else {
      filter.setFilter(field, config);
    }
  });
  
  return filter.getResults().data;
}
