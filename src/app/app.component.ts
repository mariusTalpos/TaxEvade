import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AiStatusIndicatorComponent } from './core/components/ai-status-indicator/ai-status-indicator.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet, AiStatusIndicatorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {}
