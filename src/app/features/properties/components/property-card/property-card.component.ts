// ─────────────────────────────────────────────────────────────────────────────
// LUXE ESTATES — Property Card Component
// Visual reference: Template/index.html — .property-card (lines 418–531)
// ─────────────────────────────────────────────────────────────────────────────

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

import { Property } from '../../models/property.model';
import { PropertiesService } from '../../services/properties.service';

@Component({
  selector: 'app-property-card',
  templateUrl: './property-card.component.html',
  styleUrls: ['./property-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyCardComponent implements OnInit {
  // ── Inputs ─────────────────────────────────────────────────────────────────
  @Input() property!: Property;

  // isFirst → parent grid marks first card → CSS gives it span 2 + 16/9 ratio
  @Input() isFirst = false;

  // ── Outputs ────────────────────────────────────────────────────────────────
  @Output() viewDetails      = new EventEmitter<Property>();
  @Output() scheduleViewing  = new EventEmitter<Property>();
  @Output() favoriteToggled  = new EventEmitter<string>();   // emits property._id

  // ── Local state ────────────────────────────────────────────────────────────
  isFavorited  = false;
  imageError   = false;   // true when image fails to load → show placeholder

  constructor(
    private propertiesService: PropertiesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Restore favorite state from localStorage on init
    this.isFavorited = this.propertiesService.isFavorited(this.property._id);
  }

  // ── Price — delegate to service (currency-aware) ──────────────────────────
  get formattedPrice(): string {
    return this.propertiesService.formatPrice(
      this.property.price,
      this.property.currency,
      this.property.status
    );
  }

  // ── Badge CSS class — matches Template tag variants ───────────────────────
  // Template line 456: .property-tag.rent { background: var(--sapphire) }
  get tagClass(): string {
    return this.property.status === 'for-rent' ? 'rent' : '';
  }

  // ── Badge label ────────────────────────────────────────────────────────────
  get tagLabel(): string {
    return this.property.status === 'for-rent' ? 'For Rent' : 'For Sale';
  }

  // ── Favorite toggle ────────────────────────────────────────────────────────
  onFavoriteClick(event: MouseEvent): void {
    event.stopPropagation();
    this.isFavorited = !this.isFavorited;
    this.cdr.markForCheck();          // required with OnPush
    this.favoriteToggled.emit(this.property._id);
  }

  // ── View Details ──────────────────────────────────────────────────────────
  onViewDetails(event: MouseEvent): void {
    event.stopPropagation();
    this.viewDetails.emit(this.property);
  }

  // ── Schedule Viewing (from action button on card) ─────────────────────────
  onScheduleViewing(event: MouseEvent): void {
    event.stopPropagation();
    this.scheduleViewing.emit(this.property);
  }

  // ── Image error fallback ──────────────────────────────────────────────────
  onImageError(): void {
    this.imageError = true;
  }
}
