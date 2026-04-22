import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-become-agent',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './become-agent.component.html',
  styleUrls: ['./become-agent.component.scss']
})
export class BecomeAgentComponent implements OnInit {
  
  private fb = inject(FormBuilder);
  private router = inject(Router);

  upgradeForm!: FormGroup;
  isLoading = false;

  // ─── متغيرات لحفظ الملفات (الصور) قبل الرفع ───
  selectedIdCard: File | null = null;
  selectedLogo: File | null = null;

  ngOnInit(): void {
    this.buildForm();
  }

  // ─── بناء الفورم وقواعد التحقق (Validators) ───
  private buildForm(): void {
    this.upgradeForm = this.fb.group({
      companyName: ['', Validators.required],
      // رقم التليفون: أرقام فقط من 10 لـ 15 رقم
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      // رقم الحساب البنكي (IBAN): حروف وأرقام فقط 
      iban: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{15,34}$')]],
      // نبذة تعريفية: على الأقل 30 حرف عشان يكون شكلها بروفيشنال
      bio: ['', [Validators.required, Validators.minLength(30)]]
    });
  }

  // ─── دالة التقاط الملفات لما اليوزر يختار صورة ───
  onFileSelected(event: any, fileType: 'idCard' | 'logo'): void {
    const file = event.target.files[0];
    if (file) {
      // التأكد إن الملف صورة
      if (!file.type.match(/image\/*/)) {
        this.showNotification('Please upload valid image files only.', 'error');
        return;
      }
      
      // حفظ الملف في المتغير المناسب
      if (fileType === 'idCard') {
        this.selectedIdCard = file;
      } else {
        this.selectedLogo = file;
      }
    }
  }

  // ─── دالة الإرسال (Submit) ───
  onSubmit(): void {
    // 1. لو الفورم ناقصة أو مفيش صور مرفوعة
    if (this.upgradeForm.invalid || !this.selectedIdCard || !this.selectedLogo) {
      this.upgradeForm.markAllAsTouched();
      this.showNotification('Please fill all required fields and upload documents.', 'error');
      return;
    }

    this.isLoading = true;

    // 2. استخدام FormData لدمج النصوص مع الصور (عشان نقدر نبعتها للباك إند)
    const formData = new FormData();
    formData.append('companyName', this.upgradeForm.value.companyName);
    formData.append('phone', this.upgradeForm.value.phone);
    formData.append('iban', this.upgradeForm.value.iban);
    formData.append('bio', this.upgradeForm.value.bio);
    formData.append('idCard', this.selectedIdCard);
    formData.append('logo', this.selectedLogo);

    // 💡 هنا هنحاكي إرسال البيانات للباك إند (مؤقتاً لحد ما نربط الـ API)
    setTimeout(() => {
      this.isLoading = false;
      this.showNotification('Welcome to the Elite! Your account is now upgraded to Seller.', 'success');
      
      // ✅ تحديث الجلسة في الـ LocalStorage برمجياً (السحر اللي اتكلمنا عليه)
      const userData = localStorage.getItem('luxe_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        parsedUser.role = 'Seller'; // ترقية الدور
        localStorage.setItem('luxe_user', JSON.stringify(parsedUser));
      }

      // ✅ توجيه اليوزر لصفحة إضافة عقار جديد
      // (تأكد إن الراوت ده موجود عندك، أو غيره لاسم لوحة التحكم بتاعتك)
      this.router.navigate(['/add-property']);
    }, 2000);
  }

  // ─── دوال مساعدة للواجهة ───
  isFieldInvalid(field: string): boolean {
    const ctrl = this.upgradeForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  // ─── إشعار الـ Toast المطابق للـ Design System ───
  private showNotification(message: string, type: 'success' | 'error'): void {
    const el = document.createElement('div');
    const color = type === 'success' ? '#27AE60' : '#C0392B';
    const icon = type === 'success' ? '✓' : '✕';

    el.className = 'luxe-toast';
    el.style.cssText = `
      position: fixed; top: 100px; right: 24px; background: rgba(10, 10, 15, 0.98);
      border: 1px solid #333; border-left: 3px solid ${color}; color: #FAFAF8;
      padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
      min-width: 320px; z-index: 100000; font-family: 'DM Sans', sans-serif;
      font-size: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      animation: slideInRight 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    `;
    el.innerHTML = `<div style="display: flex; align-items: center; gap: 12px;"><span style="color: ${color}; font-weight: bold; font-size: 16px;">${icon}</span><span>${message}</span></div>`;
    document.body.appendChild(el);
    setTimeout(() => { if (document.body.contains(el)) el.remove(); }, 4000);
  }
}