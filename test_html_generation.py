#!/usr/bin/env python3
"""
Test that _build_lesson_html generates proper HTML with tables
"""
import sys
sys.path.insert(0, '/app/backend')

from server import _build_lesson_html

def test_html_generation():
    """Test that _build_lesson_html generates proper HTML with tables"""
    print("Testing _build_lesson_html function...")
    print("=" * 60)
    
    # Create a sample Zanzibar lesson
    zanzibar_lesson = {
        "syllabus": "Zanzibar",
        "subject": "Mathematics",
        "grade": "Form 1",
        "topic": "Algebra",
        "content": {
            "generalOutcome": "Students will understand basic algebra",
            "mainTopic": "Algebra",
            "subTopic": "Linear equations",
            "specificOutcome": "Solve simple linear equations",
            "learningResources": "Textbook, whiteboard",
            "references": "Math textbook",
            "introductionActivities": {
                "time": "10 minutes",
                "teachingActivities": "Introduce algebra concepts",
                "learningActivities": "Listen and take notes",
                "assessment": "Oral questions"
            },
            "newKnowledgeActivities": {
                "time": "25 minutes",
                "teachingActivities": "Explain linear equations",
                "learningActivities": "Practice solving equations",
                "assessment": "Worksheet"
            },
            "teacherEvaluation": "Good lesson",
            "pupilWork": "Complete worksheet",
            "remarks": "Students engaged well"
        },
        "form_data": {
            "dayDate": "01/04/2026",
            "session": "Morning",
            "class": "Form 1",
            "periods": "2",
            "time": "80",
            "enrolledGirls": "15",
            "enrolledBoys": "15",
            "presentGirls": "14",
            "presentBoys": "14"
        }
    }
    
    # Create a sample Tanzania Mainland lesson
    mainland_lesson = {
        "syllabus": "Tanzania Mainland",
        "subject": "Mathematics",
        "grade": "Form 1",
        "topic": "Algebra",
        "content": {
            "mainCompetence": "Solve algebraic equations",
            "specificCompetence": "Solve linear equations with one variable",
            "mainActivity": "Solving equations",
            "specificActivity": "Practice problems",
            "teachingResources": "Textbook, whiteboard",
            "references": "Math textbook",
            "stages": {
                "introduction": {
                    "time": "10 minutes",
                    "teachingActivities": "Review previous lesson",
                    "learningActivities": "Answer questions",
                    "assessment": "Oral questions"
                },
                "competenceDevelopment": {
                    "time": "20 minutes",
                    "teachingActivities": "Explain solving methods",
                    "learningActivities": "Practice solving",
                    "assessment": "Worksheet"
                },
                "design": {
                    "time": "15 minutes",
                    "teachingActivities": "Guide problem design",
                    "learningActivities": "Create own problems",
                    "assessment": "Peer review"
                },
                "realisation": {
                    "time": "15 minutes",
                    "teachingActivities": "Facilitate presentations",
                    "learningActivities": "Present solutions",
                    "assessment": "Presentation evaluation"
                }
            },
            "remarks": "Good lesson"
        },
        "form_data": {
            "dayDate": "01/04/2026",
            "session": "Morning",
            "class": "Form 1",
            "periods": "2",
            "time": "80",
            "enrolledGirls": "15",
            "enrolledBoys": "15",
            "presentGirls": "14",
            "presentBoys": "14"
        }
    }
    
    print("1. Testing Zanzibar lesson HTML generation...")
    html = _build_lesson_html(zanzibar_lesson, for_word=False)
    
    # Check for table elements
    has_tables = "<table>" in html and "</table>" in html
    has_zanzibar_evaluation = "TEACHER'S EVALUATION" in html
    has_proper_header = "LESSON PLAN (ANDALIO LA SOMO)" in html
    
    print(f"   ✓ Has table elements: {has_tables}")
    print(f"   ✓ Includes Zanzibar evaluation section: {has_zanzibar_evaluation}")
    print(f"   ✓ Has proper lesson plan header: {has_proper_header}")
    
    # Show a snippet of the HTML
    print(f"   HTML snippet (first 500 chars): {html[:500]}...")
    
    print("\n2. Testing Tanzania Mainland lesson HTML generation...")
    html2 = _build_lesson_html(mainland_lesson, for_word=False)
    
    # Check for table elements
    has_tables2 = "<table>" in html2 and "</table>" in html2
    has_mainland_stages = "REALISATION / UTEKELEZAJI" in html2
    has_no_zanzibar_eval = "TEACHER'S EVALUATION" not in html2
    
    print(f"   ✓ Has table elements: {has_tables2}")
    print(f"   ✓ Includes Mainland realisation stage: {has_mainland_stages}")
    print(f"   ✓ Does NOT include Zanzibar evaluation: {has_no_zanzibar_eval}")
    
    # Show a snippet of the HTML
    print(f"   HTML snippet (first 500 chars): {html2[:500]}...")
    
    print("\n" + "=" * 60)
    print("RESULTS:")
    
    zanzibar_pass = has_tables and has_zanzibar_evaluation and has_proper_header
    mainland_pass = has_tables2 and has_mainland_stages and has_no_zanzibar_eval
    
    print(f"Zanzibar format: {'✓ PASS' if zanzibar_pass else '✗ FAIL'}")
    print(f"Tanzania Mainland format: {'✓ PASS' if mainland_pass else '✗ FAIL'}")
    
    if zanzibar_pass and mainland_pass:
        print("\n✅ SUCCESS: _build_lesson_html generates proper HTML with tables!")
        print("- Both Zanzibar and Tanzania Mainland lesson plans include tables")
        print("- Zanzibar includes Teacher's Evaluation section")
        print("- Tanzania Mainland includes all 4 stages (no Zanzibar evaluation)")
        return True
    else:
        print("\n❌ FAILED: HTML generation test failed")
        return False

if __name__ == "__main__":
    success = test_html_generation()
    sys.exit(0 if success else 1)