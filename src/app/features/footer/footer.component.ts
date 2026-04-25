// ============================================================
// LUXE ESTATES — Footer Component
// Based on reference design: Template/index.html <footer>
// Coding rules: §1, §2.2 (2fr 1fr 1fr 1fr grid), §3.2 buttons,
//               §5.1 SCSS imports, §5.7 RTL logical props
// ============================================================

import { Component } from '@angular/core';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {

  readonly currentYear = new Date().getFullYear();

  // ── Social Icons ─────────────────────────────────────────
  // Text placeholders per task spec — no SVG dependency needed
  readonly socialLinks = [
    { label: '𝕏',  href: '#', ariaLabel: 'X (Twitter)' },
    { label: 'IG', href: '#', ariaLabel: 'Instagram'    },
    { label: 'IN', href: '#', ariaLabel: 'LinkedIn'     },
    { label: 'YT', href: '#', ariaLabel: 'YouTube'      },
  ];

  // ── Navigation Columns (template lines 1772–1803) ────────
  readonly columns: FooterColumn[] = [
    {
      title: 'Properties',
      links: [
        { label: 'For Sale',          href: '#' },
        { label: 'For Rent',          href: '#' },
        { label: 'Villas',            href: '#' },
        { label: 'Auctions',          href: '#' },
        { label: 'New Developments',  href: '#' },
        { label: 'Commercial',        href: '#' },
        { label: 'Off-Plan',          href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us',  href: '#' },
        { label: 'Our Team',  href: '#' },
        { label: 'Careers',   href: '#' },
        { label: 'Press',     href: '#' },
        { label: 'Partners',  href: '#' },
        { label: 'Contact',   href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy',    href: '#' },
        { label: 'Terms of Service',  href: '#' },
        { label: 'Cookie Policy',     href: '#' },
        { label: 'AML Policy',        href: '#' },
        { label: 'API Access',        href: '#' },
      ],
    },
  ];
}
