# Offline semantic output review

This review adds `tests/e2e/deep-output-oracles.spec.ts` to the existing regression suites. Its 16 scenarios test the actual downloaded bytes or interpreted results rather than filenames or success messages. Browser execution is pending in the coordinating run; none of these new scenarios is marked PASS merely because it was written.

| Tools | Independent evidence added | Limits |
|---|---|---|
| QR code generator | Download PNG, sample modules, independently traverse version-one data cells, remove QR masks and recover `hello world` byte payload | Pristine version 1 byte fixture only; does not certify damaged symbols, all versions, error correction, scanner devices or Unicode payload decoding |
| Barcode generator | Download SVG, recover bar/space widths, decode Code 128 B `ABC123`, validate start/stop patterns and modulo-103 checksum | One ASCII Code B fixture; no claims for extended bytes, set switches or physical scanner quality |
| Sitemap generator | Download XML, parse with XML parser, verify namespace and exact ampersand-containing URLs, duplicate removal and stale-output clearing | No live search-engine submission or full sitemap protocol acceptance |
| Meta tag generator | Download HTML, parse output back into title/description containing Urdu, emoji, quotes and markup characters; ensure no injected scripts | One escaping fixture; not a complete SEO audit |
| XML formatter | Reparse namespaced mixed text, entities and CDATA; compare actual semantic values | Not all XML dialects, DTDs or schema validation |
| JavaScript minifier | Execute only a fixed trusted generated fixture; compare template strings, regex and arithmetic results | Never evaluates user source; not all JavaScript syntax/semantics |
| CSS minifier | Interpret generated stylesheet in browser; compare computed calc width, custom property, padding and color | One declaration fixture; not every CSS property or target browser |
| HTML minifier | Reparse whitespace-sensitive preformatted text and embedded JSON; verify exact payload and comment removal | No general DOM/layout fidelity certification |
| JWT decoder | Decode Unicode/nested/false/zero claims, compare parsed object | Decoding does not verify JWT signature or authenticity |
| Hash/MD5/SHA256 generators | Compare Unicode UTF-8 hashes against independent Node crypto | Hash correctness for fixture only; MD5 is not suitable for security signatures |
| Mortgage calculator | Independent month-by-month amortization recurrence; terminal balance accounts for cents rounding; empty clears result | Fixed-rate principal/interest only, no financial advice or fee/tax modeling |
| Data storage converter | Assert exact GiB-to-bits and bits-to-decimal-GB physical unit identities | Selected units and magnitudes only |
| Time zone converter | Autumn New York repeated local hour maps to distinct offsets; Karachi result verified | Selected instants/zones; no ambiguous local-time input support |
| Profit calculator | Verify loss/margin/markup and omission of undefined zero-denominator ratios | Simple revenue/cost arithmetic only |

Existing calculator, converter, text/developer, SEO and utility suites were inspected before adding these oracles. No dependencies, package manifests or existing source behavior were changed by this review. These tests strengthen scoped evidence and do not justify calling all 137 tools perfect or production ready. The browser run and any reproduced failures must be recorded by the coordinating execution before final sign-off.


2026-10-16 update: the real Chromium quality scenarios described above now PASS in the full 153-test run, with zero skips. Coverage is limited to the asserted fixtures; see QA_REPORT.md for remaining acceptance.
