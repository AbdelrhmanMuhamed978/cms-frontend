import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [RouterLink, NzCardModule, NzGridModule, NzIconModule],
  templateUrl: './admin-home.component.html'
})
export class AdminHomeComponent {}
