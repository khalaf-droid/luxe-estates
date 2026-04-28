import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

export interface SearchPayload {
  location?: string;
  type?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
}

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

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

  constructor() {
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
    const { location, propertyType, listingType, budget } = this.searchForm.value;
    
    const payload: SearchPayload = {
      location: location || undefined,
      type: propertyType === 'All Types' ? undefined : propertyType.toLowerCase(),
      listingType: listingType === 'For Sale' ? 'for-sale' : 'for-rent',
      ...this.budgetToRange(budget)
    };

    // Clean query params
    const queryParams = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v != null && v !== '')
    );

    this.router.navigate(['/properties'], {
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  private budgetToRange(budget: string): { minPrice?: number; maxPrice?: number } {
    switch (budget) {
      case 'Up to $500K':
        return { maxPrice: 500000 };
      case '$500K – $1M':
        return { minPrice: 500000, maxPrice: 1000000 };
      case '$1M – $3M':
        return { minPrice: 1000000, maxPrice: 3000000 };
      case '$3M – $10M':
        return { minPrice: 3000000, maxPrice: 10000000 };
      case '$10M+':
        return { minPrice: 10000000 };
      default:
        return {};
    }
  }
}
