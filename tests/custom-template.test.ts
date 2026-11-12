import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CUSTOM_TEMPLATE_CONFIG,
  normalizeCustomTemplateConfig,
  buildTemplateExtractionPrompt,
  sanitizeTemplateHtml,
  scopeTemplateCss,
  renderCustomHtmlDocument,
} from '../src/lib/custom-template';

test('normalizeCustomTemplateConfig returns clean defaults when given empty or non-object input', () => {
  const fromNull = normalizeCustomTemplateConfig(null);
  assert.equal(fromNull.headerStyle, DEFAULT_CUSTOM_TEMPLATE_CONFIG.headerStyle);
  assert.equal(fromNull.palette.primaryColor, '#2563eb');
  assert.equal(fromNull.labels.invoiceTitle, 'INVOICE');
  assert.ok(typeof fromNull.updatedAt === 'string' && fromNull.updatedAt.length > 0);
});

test('normalizeCustomTemplateConfig expands 3-char hex colors and rejects malformed values', () => {
  const normalized = normalizeCustomTemplateConfig({
    headerStyle: 'top_banner',
    tableStyle: 'bordered_grid',
    fontStyle: 'serif',
    accentWidthPx: 99,
    palette: {
      primaryColor: '#ABC',
      secondaryColor: 'javascript:alert(1)',
      headerTextColor: '#FFFFFF',
      pageBackground: 'rgb(0,0,0)',
      surfaceTint: '#f1f5f9',
      borderColor: '#cbd5e1',
      textColor: '#111827',
      mutedTextColor: 'invalid-color',
    },
  });

  assert.equal(normalized.headerStyle, 'top_banner');
  assert.equal(normalized.tableStyle, 'bordered_grid');
  assert.equal(normalized.fontStyle, 'serif');
  assert.equal(normalized.accentWidthPx, 12); // clamped max
  assert.equal(normalized.palette.primaryColor, '#aabbcc');
  assert.equal(normalized.palette.secondaryColor, DEFAULT_CUSTOM_TEMPLATE_CONFIG.palette.secondaryColor);
  assert.equal(normalized.palette.headerTextColor, '#ffffff');
  assert.equal(normalized.palette.pageBackground, DEFAULT_CUSTOM_TEMPLATE_CONFIG.palette.pageBackground);
  assert.equal(normalized.palette.mutedTextColor, DEFAULT_CUSTOM_TEMPLATE_CONFIG.palette.mutedTextColor);
});

test('normalizeCustomTemplateConfig strips HTML angle brackets and clamps invalid enums', () => {
  const normalized = normalizeCustomTemplateConfig({
    name: '<script>alert(1)</script> My Studio Format',
    headerStyle: 'hacked_layout',
    tableStyle: 'unknown_table',
    labels: {
      invoiceTitle: '  TAX   <b>INVOICE</b>  ',
      grandTotalLabel: 'Balance Due Now',
    },
  });

  assert.equal(normalized.headerStyle, DEFAULT_CUSTOM_TEMPLATE_CONFIG.headerStyle);
  assert.equal(normalized.tableStyle, DEFAULT_CUSTOM_TEMPLATE_CONFIG.tableStyle);
  assert.ok(!normalized.name.includes('<') && !normalized.name.includes('>'));
  assert.equal(normalized.labels.invoiceTitle, 'TAX bINVOICE/b');
  assert.equal(normalized.labels.grandTotalLabel, 'Balance Due Now');
});

test('buildTemplateExtractionPrompt includes tweak instructions and visual diff critique mode cleanly', () => {
  const prompt = buildTemplateExtractionPrompt('Use emerald header banner and add item numbers');
  assert.ok(prompt.includes('Use emerald header banner and add item numbers'));
  const plainPrompt = buildTemplateExtractionPrompt('');
  assert.ok(!plainPrompt.includes('USER CUSTOMIZATION'));
  const critiquePrompt = buildTemplateExtractionPrompt(
    '',
    { htmlTemplate: '<div class="sc-doc">old</div>', cssStyles: '.sc-doc{}' },
    true
  );
  assert.ok(critiquePrompt.includes('VISUAL DIFF SELF-CRITIQUE MODE'));
});

test('sanitizeTemplateHtml removes scripts, event handlers, and dangerous URLs while preserving inline SVG', () => {
  const raw = `<div class="sc-doc" onclick="alert(1)"><svg viewBox="0 0 100 20"><polygon points="0,0 100,0 80,20 0,20" fill="var(--sc-primary)"/></svg><a href="javascript:alert(2)">Bad</a><script>evil()</script><img src="https://example.com/x.png" onerror="steal()" /></div>`;
  const clean = sanitizeTemplateHtml(raw);
  assert.ok(!clean.includes('<script'));
  assert.ok(!clean.includes('onclick'));
  assert.ok(!clean.includes('onerror'));
  assert.ok(!clean.includes('javascript:'));
  assert.ok(clean.includes('<svg viewBox="0 0 100 20">'));
  assert.ok(clean.includes('<polygon points="0,0 100,0 80,20 0,20"'));
});

test('scopeTemplateCss isolates selectors under .sc-custom-doc and blocks @import or expression()', () => {
  const rawCss = `
    @import url("https://evil.com/steal.css");
    body { margin: 0; font-family: Georgia, serif; }
    .hdr, h1 { color: var(--sc-primary); background: linear-gradient(90deg, #111, #333); }
    .bad { width: expression(alert(1)); }
  `;
  const scoped = scopeTemplateCss(rawCss, '.sc-custom-doc');
  assert.ok(!scoped.includes('@import'));
  assert.ok(!scoped.includes('expression('));
  assert.ok(scoped.includes('.sc-custom-doc {'));
  assert.ok(scoped.includes('.sc-custom-doc .hdr, .sc-custom-doc h1 {'));
});

test('renderCustomHtmlDocument renders items loop, org phone/website/tagline, and HTML-escapes client text', () => {
  const config = normalizeCustomTemplateConfig({
    renderMode: 'html',
    htmlTemplate: `<div class="sc-doc"><h1>{{doc.typeLabel}} {{doc.number}}</h1><p>{{org.phone}} {{org.website}} {{#hasOrgTagline}}{{org.tagline}}{{/hasOrgTagline}}</p><div>{{client.name}}</div><table><tbody>{{#items}}<tr><td>{{item.description}}</td><td>{{item.lineTotal}}</td></tr>{{/items}}</tbody></table><div>{{totals.grandTotal}}</div>{{#hasNotes}}<p>{{doc.notes}}</p>{{/hasNotes}}</div>`,
    cssStyles: `.sc-doc { color: var(--sc-text); }`,
  });
  const doc = {
    invoiceNumber: 'INV-007',
    currency: 'USD',
    issueDate: '2026-11-12T00:00:00.000Z',
    dueDate: '2026-11-26T00:00:00.000Z',
    organizationSnapshot: {
      name: 'Studio Alpha',
      email: 'hi@alpha.io',
      phone: '+1 555-0101',
      website: 'https://alpha.io',
      tagline: 'Creative Engineering',
    },
    clientSnapshot: { name: 'Acme <script>alert(1)</script> Co', email: 'c@acme.io' },
    items: [
      { description: 'Web & Brand Design', quantity: 1, unitPriceCents: 150000, discountCents: 0, lineTaxCents: 0, lineTotalCents: 150000 },
    ],
    subtotalCents: 150000,
    totalDiscountCents: 0,
    totalTaxCents: 0,
    grandTotalCents: 150000,
    paidCents: 0,
    balanceDueCents: 150000,
    notes: '',
  };

  const { html, scopedCss } = renderCustomHtmlDocument(config, doc, 'invoice');
  assert.ok(html.includes('INVOICE INV-007'));
  assert.ok(html.includes('+1 555-0101'));
  assert.ok(html.includes('https://alpha.io'));
  assert.ok(html.includes('Creative Engineering'));
  assert.ok(html.includes('Acme &lt;script&gt;alert(1)&lt;/script&gt; Co'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('Web &amp; Brand Design'));
  assert.ok(html.includes('$1,500.00'));
  assert.ok(!html.includes('<p></p>'));
  assert.ok(scopedCss.includes('.sc-custom-doc .sc-doc {'));
});

