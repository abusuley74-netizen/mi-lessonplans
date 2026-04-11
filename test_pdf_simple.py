#!/usr/bin/env python3
"""
Simple test for PDF generation
"""
import sys
import os

def test_weasyprint():
    """Test if weasyprint works"""
    print("Testing WeasyPrint...")
    try:
        import weasyprint
        print("✓ WeasyPrint imported successfully")
        
        # Test simple HTML to PDF
        html = """
        <!DOCTYPE html>
        <html>
        <head><title>Test</title></head>
        <body><h1>Test PDF</h1></body>
        </html>
        """
        
        pdf = weasyprint.HTML(string=html)
        pdf_bytes = pdf.write_pdf()
        
        print(f"✓ Generated PDF: {len(pdf_bytes)} bytes")
        if pdf_bytes.startswith(b'%PDF'):
            print("✓ Valid PDF header found")
        else:
            print(f"⚠ Not a valid PDF: {pdf_bytes[:20]}")
        
        return True
        
    except Exception as e:
        print(f"❌ WeasyPrint error: {e}")
        return False

def test_reportlab():
    """Test if reportlab works as fallback"""
    print("\nTesting ReportLab fallback...")
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        from io import BytesIO
        
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        c.setFont("Helvetica", 12)
        c.drawString(100, 700, "Test Document")
        c.save()
        pdf_bytes = buffer.getvalue()
        
        print(f"✓ Generated PDF with ReportLab: {len(pdf_bytes)} bytes")
        if pdf_bytes.startswith(b'%PDF'):
            print("✓ Valid PDF header found")
        else:
            print(f"⚠ Not a valid PDF: {pdf_bytes[:20]}")
        
        return True
        
    except Exception as e:
        print(f"❌ ReportLab error: {e}")
        return False

def main():
    print("=" * 60)
    print("PDF Generation Test")
    print("=" * 60)
    
    weasyprint_ok = test_weasyprint()
    reportlab_ok = test_reportlab()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    if weasyprint_ok:
        print("✅ WeasyPrint is working")
    else:
        print("❌ WeasyPrint failed - may need system dependencies")
        print("   Try: apt-get install python3-weasyprint or equivalent")
    
    if reportlab_ok:
        print("✅ ReportLab is working (good fallback)")
    else:
        print("❌ ReportLab also failed")
    
    if not weasyprint_ok and not reportlab_ok:
        print("\n⚠ Both PDF libraries failed!")
        print("  The download endpoint will return 500 errors.")
        print("  Install at least one of: weasyprint or reportlab")
    
    return weasyprint_ok or reportlab_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)