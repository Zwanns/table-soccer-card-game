import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PRIVACY_POLICY_URL } from '../privacyPolicy';

describe('public privacy policy', () => {
  it('uses the exact HTTPS URL without identifiers, query parameters or fragments', () => {
    expect(PRIVACY_POLICY_URL).toBe('https://total-soccer-mundial.vercel.app/privacy.html');
    const url = new URL(PRIVACY_POLICY_URL);
    expect(url.protocol).toBe('https:');
    expect(url.pathname).toBe('/privacy.html');
    expect(url.search).toBe('');
    expect(url.hash).toBe('');
    expect(url.username).toBe('');
    expect(url.password).toBe('');
  });

  it('provides a standalone English page with the fixed date and contact section', () => {
    expect(existsSync('public/privacy.html')).toBe(true);
    const html = readFileSync('public/privacy.html', 'utf8');
    expect(html).toContain('<html lang="en">');
    expect(html).toMatch(/<meta charset="UTF-8"\s*\/?\s*>/i);
    expect(html).toContain('name="viewport"');
    expect(html).toContain('<title>Privacy Policy — Total Soccer: Mundial</title>');
    expect(html).toContain('Privacy Policy for Total Soccer: Mundial');
    expect(html).toContain('Effective date: October 10, 2026');
    expect(html).toContain('<h2 id="contact">Contact</h2>');
    expect(html).toMatch(/<p class="contact">[^<]+<\/p>/);
    for (const heading of [
      'Information We Collect', 'Local Game Data', 'Analytics and Advertising',
      'Accounts and Payments', 'Network Access and Android System Services',
      'External Links', 'Data Retention and Deletion', "Children's Privacy",
      'Security', 'Changes to This Privacy Policy'
    ]) {
      expect(html).toContain(`>${heading}</h2>`);
    }
  });

  it('requires no scripts, Phaser, cookies, or external font and tracking resources', () => {
    const html = readFileSync('public/privacy.html', 'utf8');
    expect(html).not.toMatch(/<\s*(script|canvas|iframe|img|link|object|embed|video|audio)\b/i);
    expect(html).not.toMatch(/\b(?:src|srcset|on\w+)\s*=/i);
    expect(html).not.toMatch(/@import|url\s*\(|document\.cookie|phaser/i);
    expect(html).toContain('<style>');
    expect(html).toContain('@media (max-width: 600px)');
  });
});
