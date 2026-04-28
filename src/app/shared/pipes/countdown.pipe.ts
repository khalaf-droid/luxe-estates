import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'countdown',
  pure: false // Requires impure true so it updates on simple detectChanges ticks
})
export class CountdownPipe implements PipeTransform {
  transform(endsAt: string | Date | undefined): string {
    if (!endsAt) return '';
    
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return '0s';

    const pad = (n: number) => n.toString().padStart(2, '0');
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0 || d > 0) parts.push(`${pad(h)}h`);
    if (m > 0 || h > 0 || d > 0) parts.push(`${pad(m)}m`);
    parts.push(`${pad(s)}s`);

    return parts.join(' ');
  }
}
