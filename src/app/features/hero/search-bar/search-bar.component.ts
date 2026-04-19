import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent {
  @Output() explore = new EventEmitter<void>();

  activeChip: string | null = null;

  chips = ['Villas', 'Apartments', 'Penthouses', 'Estates'];

  searchForm: FormGroup;

  propertyTypes = ['All Types', 'Villa', 'Apartment', 'Penthouse', 'Estate'];
  listingTypes = ['For Sale', 'For Rent'];
  budgets = [
    'Any Budget',
    'Up to $500K',
    '$500K – $1M',
    '$1M – $3M',
    '$3M – $10M',
    '$10M+',
  ];

  constructor(private fb: FormBuilder) {
    this.searchForm = this.fb.group({
      location: [''],
      propertyType: ['All Types'],
      listingType: ['For Sale'],
      budget: ['Any Budget'],
    });
  }

  selectChip(chip: string): void {
    this.activeChip = this.activeChip === chip ? null : chip;
    // Sync chip with form
    if (this.activeChip) {
      const typeMap: Record<string, string> = {
        Villas: 'Villa',
        Apartments: 'Apartment',
        Penthouses: 'Penthouse',
        Estates: 'Estate',
      };
      this.searchForm.patchValue({ propertyType: typeMap[this.activeChip] });
    } else {
      this.searchForm.patchValue({ propertyType: 'All Types' });
    }
  }

  onExplore(): void {
    this.explore.emit();
  }
}
