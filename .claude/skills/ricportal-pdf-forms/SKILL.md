---
name: ricportal-pdf-forms
description: Use when creating or changing any PDF form in RICPortal (Enrollment Form, Purchase Request, Summary of Disbursement, Transmittal Checklist)
---
PDFs are generated on the server with pdfmake in server/src/modules/pdf/. Rules:
- Follow the layout in the phase file exactly: header texts, column order, widths, row counts.
- Keep form text exactly as on the official copy. Signature lines stay blank except the
  printed names set in Settings.
- Tables repeat their header on every page. Totals appear on the last page.
- Confirm the peso sign renders; if not, print "PHP" everywhere.
- Money uses the shared formatter: thousands separators, two decimals.
- Test with 0, 1, many and overflow rows. A test checks the file starts with %PDF.
- The Developer compares the PDF with the official form photo before the phase gate.
