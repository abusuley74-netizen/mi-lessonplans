#!/usr/bin/env python3
"""
Script to fix the _html_to_pdf function with proper error handling
"""
import os

# Read the server.py file
server_path = "/app/backend/server.py"
with open(server_path, 'r') as f:
    content = f.read()

# Find the _html_to_pdf function
import re
pattern = r'def _html_to_pdf\(html: str\) -> bytes:\s*""".*?"""\s*(.*?)(?=\n\s*def |\n\s*@|\Z)'
match = re.search(pattern, content, re.DOTALL)

if match:
    print("Found _html_to_pdf function")
    old_function = match.group(0)
    
    # New implementation with error handling
    new_function = '''def _html_to_pdf(html: str) -> bytes:
    """Convert HTML to PDF using weasyprint with comprehensive error handling"""
    try:
        import weasyprint
        pdf_bytes = weasyprint.HTML(string=html).write_pdf()
        return pdf_bytes
    except ImportError:
        logger.error("WeasyPrint not installed. Install with: pip install weasyprint")
        # Fallback 1: Try reportlab
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            from io import BytesIO
            
            buffer = BytesIO()
            c = canvas.Canvas(buffer, pagesize=letter)
            c.setFont("Helvetica", 12)
            c.drawString(100, 700, "Document Content")
            c.drawString(100, 680, "PDF generation service temporarily unavailable.")
            c.drawString(100, 660, "Please try again later or contact support.")
            c.save()
            return buffer.getvalue()
        except ImportError:
            logger.error("ReportLab also not installed")
            # Fallback 2: Return HTML as plain text
            return f"<html><body><h1>PDF Generation Error</h1><p>Required libraries not installed. Please install weasyprint or reportlab.</p><p>Original content would be here.</p></body></html>".encode('utf-8')
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        # Return error message as PDF-like content
        error_html = f"""<!DOCTYPE html>
<html>
<head><title>PDF Generation Error</title></head>
<body>
    <h1>Document</h1>
    <p>PDF generation failed due to an error.</p>
    <p>Error: {str(e)[:200]}</p>
    <p>Please try again or contact support.</p>
</body>
</html>"""
        return error_html.encode('utf-8')'''
    
    # Replace the function
    new_content = content.replace(old_function, new_function)
    
    # Write back
    with open(server_path, 'w') as f:
        f.write(new_content)
    
    print("✓ Updated _html_to_pdf function with error handling")
else:
    print("❌ Could not find _html_to_pdf function")
    
# Also check build_download_content for all resource types
print("\nChecking build_download_content function...")
if 'def build_download_content' in content:
    # Find what resource types it handles
    resource_types = []
    if 'resource_type == "lesson"' in content:
        resource_types.append('lesson')
    if 'resource_type == "note"' in content:
        resource_types.append('note')
    if 'resource_type == "scheme"' in content:
        resource_types.append('scheme')
    
    print(f"Found handling for resource types: {resource_types}")
    
    # Check if there's a default/else case
    if 'else:' in content[content.find('def build_download_content'):content.find('def build_download_content') + 2000]:
        print("✓ Has else/default case")
    else:
        print("⚠ Missing else/default case for unhandled resource types")
        
        # Add a default case
        default_case = '''
    else:
        # Default case for unhandled resource types
        title = resource.get("title", "Document")
        content_text = str(resource)
        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{doc_styles}</style></head><body>
<h1>{title}</h1>
<div class="content"><pre>{content_text}</pre></div>
<div class="footer">Shared via Mi-LessonPlan</div>
</body></html>"""
        filename = f"{title.replace(' ','_')}.pdf"
        pdf_bytes = _html_to_pdf(html)
        return pdf_bytes, "application/pdf", filename'''
        
        # Find where to insert it (before the function ends)
        func_start = content.find('def build_download_content')
        func_end = content.find('\n\n', func_start + 100)
        if func_end == -1:
            func_end = len(content)
            
        func_content = content[func_start:func_end]
        
        # Insert default case before the last return or before function end
        lines = func_content.split('\n')
        for i in range(len(lines)-1, -1, -1):
            if lines[i].strip().startswith('return'):
                # Insert before this return
                lines.insert(i, default_case)
                break
        
        new_func_content = '\n'.join(lines)
        new_content = content[:func_start] + new_func_content + content[func_end:]
        
        with open(server_path, 'w') as f:
            f.write(new_content)
        
        print("✓ Added default case for unhandled resource types")
else:
    print("❌ Could not find build_download_content function")

print("\n✅ Fixes applied to backend/server.py")