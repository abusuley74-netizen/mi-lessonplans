#!/usr/bin/env python3
import re

# Read the server.py file
with open('/app/backend/server.py', 'r') as f:
    content = f.read()

# Find the build_download_content function and replace the lesson section
# We need to find the exact section for lesson plans
lesson_section_start = '    if resource_type == "lesson":'
lesson_section_end = '    elif resource_type == "note":'

# Find the position
start_idx = content.find(lesson_section_start)
if start_idx == -1:
    print("ERROR: Could not find lesson section start")
    exit(1)

# Find the end of the lesson section (start of note section)
end_idx = content.find(lesson_section_end, start_idx)
if end_idx == -1:
    print("ERROR: Could not find lesson section end")
    exit(1)

# Extract the current lesson section
current_lesson_section = content[start_idx:end_idx]
print("Current lesson section:")
print(current_lesson_section)
print("\n" + "="*80 + "\n")

# Create the new lesson section
new_lesson_section = '''    if resource_type == "lesson":
        # Use the same _build_lesson_html function that export_lesson_txt uses
        # This ensures proper table formatting for both Zanzibar and Tanzania Mainland
        html = _build_lesson_html(resource, for_word=False)
        subject = resource.get("subject", "")
        topic = resource.get("topic", "")
        filename = f"{subject.replace(' ', '_')}_{topic.replace(' ', '_')}_lesson.pdf"
        pdf_bytes = _html_to_pdf(html)
        return pdf_bytes, "application/pdf", filename'''

# Replace the section
new_content = content[:start_idx] + new_lesson_section + content[end_idx:]

# Write back to file
with open('/app/backend/server.py', 'w') as f:
    f.write(new_content)

print("Successfully updated build_download_content function!")
print("Lesson plans in shared links will now use proper table formatting.")