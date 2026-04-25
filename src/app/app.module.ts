import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FooterModule } from './features/footer/footer.module';
import { NavComponent } from './core/nav/nav.component';
import { CursorComponent } from './shared/cursor/cursor.component';
import { NotificationComponent } from './shared/notification/notification.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

// ✅ FIX: import standalone component
import { AuthModalComponent } from './core/auth/auth-modal/auth-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    CursorComponent,
    NotificationComponent,
  ],

  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    CommonModule,
    AppRoutingModule,

    // ✅ FIX: standalone component must be in imports
    AuthModalComponent,

    // Footer feature module — exports FooterComponent as <app-footer>
    FooterModule,
  ],

  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],

  bootstrap: [AppComponent],
})
export class AppModule {}