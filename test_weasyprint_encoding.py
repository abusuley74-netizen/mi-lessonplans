#!/usr/bin/env python3
import weasyprint

# Test with Arabic text
arabic_html = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: Arial, sans-serif; padding: 20px; }
h1 { color: #333; }
p { color: #666; }
</style>
</head>
<body>
<h1>Test Arabic Lesson</h1>
<p>السلام عليكم - This is Arabic text</p>
<p>مرحبا بكم في درس اللغة العربية</p>
<p>This is mixed text with Arabic: مرحبا</p>
<p>Swahili with special chars: nyambë, ng'ombe</p>
<p>Emojis: 📚 ✅ ✨</p>
<p>Smart quotes: "hello" 'world'</p>
</body>
</html>"""

print("Testing Arabic text encoding in weasyprint...")
print("Method 1: Passing string directly (original method)")
try:
    pdf_bytes = weasyprint.HTML(string=arabic_html).write_pdf()
    print(f"✓ PDF generated successfully: {len(pdf_bytes)} bytes")
    if pdf_bytes.startswith(b'%PDF'):
        print("✓ Valid PDF header found")
    else:
        print("✗ Invalid PDF header")
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\nMethod 2: Passing string as UTF-8 bytes (our fix)")
try:
    pdf_bytes = weasyprint.HTML(string=arabic_html.encode('utf-8')).write_pdf()
    print(f"✓ PDF generated successfully: {len(pdf_bytes)} bytes")
    if pdf_bytes.startswith(b'%PDF'):
        print("✓ Valid PDF header found")
    else:
        print("✗ Invalid PDF header")
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

# Test with just Latin-1 text
latin_html = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: Arial, sans-serif; padding: 20px; }
</style>
</head>
<body>
<h1>Test Latin Text</h1>
<p>This is plain English text without special characters.</p>
</body>
</html>"""

print("\nTesting Latin text encoding in weasyprint...")
try:
    pdf_bytes = weasyprint.HTML(string=latin_html.encode('utf-8')).write_pdf()
    print(f"✓ PDF generated successfully: {len(pdf_bytes)} bytes")
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")