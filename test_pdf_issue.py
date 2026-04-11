#!/usr/bin/env python3
"""Test PDF generation issue"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Mock the _html_to_pdf function
def _html_to_pdf(html: str) -> bytes:
    """Convert HTML to PDF using weasyprint"""
    import weasyprint
    pdf_bytes = weasyprint.HTML(string=html).write_pdf()
    return pdf_bytes

# Test with a simple HTML
test_html = """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; margin: 30px; }
h1 { color: #1a2e16; }
</style></head>
<body>
<h1>Test PDF</h1>
<p>This is a test PDF document.</p>
</body></html>"""

print("Testing PDF generation...")
try:
    pdf_bytes = _html_to_pdf(test_html)
    print(f"✓ PDF generated: {len(pdf_bytes)} bytes")
    print(f"✓ PDF starts with: {pdf_bytes[:20]}")
    
    # Check if it's a valid PDF
    if pdf_bytes.startswith(b'%PDF'):
        print("✓ Valid PDF header found")
    else:
        print("✗ Invalid PDF header")
        
    # Save to file for inspection
    with open("/tmp/test_pdf.pdf", "wb") as f:
        f.write(pdf_bytes)
    print(f"✓ PDF saved to /tmp/test_pdf.pdf")
    
    # Now test with the actual HTML from build_download_content
    print("\nTesting with lesson HTML...")
    lesson_html = """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; margin: 30px; line-height: 1.7; color: #1f2937; background: #fff; }
      h1 { font-size: 22pt; color: #1a2e16; text-align: center; border-bottom: 3px solid #2D5A27; padding-bottom: 12px; margin-bottom: 8px; }
      h2 { font-size: 14pt; color: #2D5A27; margin: 20px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
      h3 { font-size: 12pt; color: #4a5b46; margin: 14px 0 6px; }
      .subtitle { text-align: center; color: #6b7280; font-size: 11pt; margin-bottom: 20px; }
      .meta-table { width: 100%; border-collapse: collapse; margin: 15px 0 25px; }
      .meta-table td { padding: 6px 12px; border: 1px solid #d1d5db; font-size: 10pt; }
      .meta-table td:first-child { font-weight: bold; background: #f8f6f1; width: 140px; color: #2D5A27; }
      .section { margin: 16px 0; padding: 14px 18px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fafaf8; }
      .section-title { font-weight: bold; font-size: 11pt; color: #2D5A27; margin-bottom: 8px; border-bottom: 1px dashed #d1d5db; padding-bottom: 4px; }
      .section p { margin: 4px 0; font-size: 10pt; }
      .content { line-height: 1.8; font-size: 11pt; }
      .footer { text-align: center; margin-top: 30px; padding-top: 12px; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 9pt; }
      table.data { width: 100%; border-collapse: collapse; margin: 10px 0; }
      table.data th { background: #2D5A27; color: #fff; padding: 8px 6px; border: 1px solid #1a2e16; font-size: 9pt; text-align: center; }
      table.data td { border: 1px solid #999; padding: 6px; vertical-align: top; font-size: 9pt; }
    </style></head><body>
        <h1>ZANZIBAR LESSON PLAN</h1>
        <table class="meta-table">
          <tr><td>Subject</td><td>Mathematics</td></tr>
          <tr><td>Grade / Class</td><td>Form 2</td></tr>
          <tr><td>Topic</td><td>Algebra</td></tr>
          <tr><td>Syllabus</td><td>Zanzibar</td></tr>
          <tr><td>Date</td><td>2024-01-01</td></tr>
        </table>
        <div class="section"><div class="section-title">Generaloutcome</div><p>Students will understand algebraic expressions</p></div>
        <div class="footer">Generated & Shared via Mi-LessonPlan</div>
        </body></html>"""
    
    pdf_bytes2 = _html_to_pdf(lesson_html)
    print(f"✓ Lesson PDF generated: {len(pdf_bytes2)} bytes")
    
    with open("/tmp/test_lesson.pdf", "wb") as f:
        f.write(pdf_bytes2)
    print(f"✓ Lesson PDF saved to /tmp/test_lesson.pdf")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()