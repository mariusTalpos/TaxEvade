import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ClassificationAiService } from '../../services/classification-ai.service';

const POLL_INTERVAL_MS = 30_000;

@Component({
  selector: 'app-ai-status-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ai-status" [class.ai-status--checking]="status() === 'checking'"
      [class.ai-status--up]="status() === 'up'" [class.ai-status--down]="status() === 'down'">
      @switch (status()) {
        @case ('checking') {
          <span class="ai-status__dot" aria-hidden="true"></span>
          <span>Checking AI…</span>
        }
        @case ('up') {
          <span class="ai-status__dot" aria-hidden="true"></span>
          <span>AI ready</span>
        }
        @case ('down') {
          <span class="ai-status__dot" aria-hidden="true"></span>
          <span>AI unavailable</span>
          <button type="button" class="ai-status__retry" (click)="check()">Retry</button>
        }
      }
    </span>
  `,
  styles: [
    `
      .ai-status {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.875rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
      }
      .ai-status__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .ai-status--checking .ai-status__dot {
        background: #888;
        animation: pulse 1s ease-in-out infinite;
      }
      .ai-status--up .ai-status__dot {
        background: #2e7d32;
      }
      .ai-status--down .ai-status__dot {
        background: #c62828;
      }
      .ai-status__retry {
        margin-left: 0.25rem;
        padding: 0.1rem 0.35rem;
        font-size: 0.75rem;
        cursor: pointer;
        border: 1px solid currentColor;
        border-radius: 3px;
        background: transparent;
      }
      .ai-status__retry:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `,
  ],
})
export class AiStatusIndicatorComponent implements OnInit, OnDestroy {
  private readonly ai = inject(ClassificationAiService);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  readonly status = signal<'checking' | 'up' | 'down'>('checking');

  ngOnInit(): void {
    this.check();
    this.pollTimer = setInterval(() => this.check(), POLL_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.pollTimer != null) {
      clearInterval(this.pollTimer);
    }
  }

  async check(): Promise<void> {
    this.status.set('checking');
    const up = await this.ai.isAvailable();
    this.status.set(up ? 'up' : 'down');
  }
}
