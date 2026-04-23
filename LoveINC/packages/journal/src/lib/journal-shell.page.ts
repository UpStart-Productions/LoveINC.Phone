import { Component } from '@angular/core';
import { IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-journal-shell',
  templateUrl: './journal-shell.page.html',
  standalone: true,
  imports: [IonRouterOutlet],
})
export class JournalShellPage {}
