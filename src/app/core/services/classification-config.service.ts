import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * Config format: { categories: string[], merchants?: string[], patterns?: { pattern: string, type: string, category?: string, confidence: string }[] }
 * Loaded from /config/classification-config.json (from public/config/).
 */
export interface ClassificationConfig {
  categories: string[];
  merchants?: string[];
  patterns?: Array<{
    pattern: string;
    type: string;
    category?: string;
    confidence: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class ClassificationConfigService {
  private readonly http = inject(HttpClient);
  private config: ClassificationConfig | null = null;
  private loadPromise: Promise<ClassificationConfig> | null = null;

  load(): Promise<ClassificationConfig> {
    if (this.config) return Promise.resolve(this.config);
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this.http
      .get<ClassificationConfig>('/config/classification-config.json')
      .toPromise()
      .then((c) => {
        this.config = c ?? { categories: [] };
        return this.config;
      });
    return this.loadPromise;
  }

  getCategories(): string[] {
    return this.config?.categories ?? [];
  }

  getMerchants(): string[] {
    return this.config?.merchants ?? [];
  }

  getPatterns(): ClassificationConfig['patterns'] {
    return this.config?.patterns ?? [];
  }
}
