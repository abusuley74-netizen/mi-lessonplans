#!/usr/bin/env python3
import sys
sys.path.insert(0, '/app/backend')

import os
os.environ['MONGO_URL'] = 'mongodb://localhost:27017'
os.environ['DB_NAME'] = 'test_db'

# Mock the database functions to avoid actual DB connection
import asyncio
from unittest.mock import AsyncMock, patch

# Test the _build_lesson_html function with Arabic content
from server import _build_lesson_html

# Create a test lesson with Arabic content
arabic_lesson = {
    "syllabus": "Zanzibar",
    "subject": "اللغة العربية",
    "grade": "Form 1",
    "topic": "الضماير",
    "content": {
        "generalOutcome": "سيتمكن الطلاب من فهم واستخدام الضمائر العربية الأساسية",
        "mainTopic": "الضمائر العربية",
        "subTopic": "الضمائر المنفصلة والمتصلة",
        "specificOutcome": "1. التعرف على أنواع الضمائر العربية\n2. استخدام الضمائر في جمل بسيطة\n3. التمييز بين الضمائر المنفصلة والمتصلة",
        "learningResources": "الكتاب المدرسي، السبورة، البطاقات التعليمية",
        "references": "كتاب اللغة العربية للصف الأول، دليل المعلم",
        "introductionActivities": {
            "time": "10 دقائق",
            "teachingActivities": "مراجعة الدرس السابق، طرح أسئلة عن الضمائر",
            "learningActivities": "الإجابة على الأسئلة، مشاركة المعرفة السابقة",
            "assessment": "الأسئلة الشفهية لتقييم المعرفة السابقة"
        },
        "newKnowledgeActivities": {
            "time": "25 دقيقة",
            "teachingActivities": "شرح أنواع الضمائر، تقديم أمثلة، توجيه التمارين",
            "learningActivities": "الاستماع، تدوين الملاحظات، حل التمارين، طرح الأسئلة",
            "assessment": "مراقبة التمارين، تقديم التغذية الراجعة"
        },
        "teacherEvaluation": "",
        "pupilWork": "إكمال التمارين في الدفتر",
        "remarks": ""
    },
    "form_data": {
        "dayDate": "15/04/2026",
        "session": "Morning",
        "class": "Form 1",
        "periods": "2",
        "time": "40",
        "enrolledGirls": "15",
        "enrolledBoys": "20",
        "presentGirls": "14",
        "presentBoys": "18"
    }
}

print("Testing Arabic lesson HTML generation...")
try:
    html = _build_lesson_html(arabic_lesson, for_word=False)
    print(f"✓ HTML generated successfully: {len(html)} characters")
    
    # Check if Arabic text is preserved
    if "السلام" in html or "الضمائر" in html or "العربية" in html:
        print("✓ Arabic text preserved in HTML")
    else:
        print("✗ Arabic text might not be preserved")
        
    # Check for charset declaration
    if 'charset="utf-8"' in html.lower() or 'charset=utf-8' in html.lower():
        print("✓ UTF-8 charset declared")
    else:
        print("✗ UTF-8 charset not found")
        
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

# Test with Tanzania Mainland syllabus
mainland_lesson = {
    "syllabus": "Tanzania Mainland",
    "subject": "اللغة العربية",
    "grade": "Standard 5",
    "topic": "الحروف العربية",
    "content": {
        "mainCompetence": "تطوير فهم واستخدام الحروف العربية",
        "specificCompetence": "سيتمكن الطلاب من التعرف على الحروف العربية وكتابتها",
        "mainActivity": "الاستكشاف التفاعلي للحروف العربية",
        "specificActivity": "المناقشة الجماعية، الممارسة الفردية، العروض",
        "teachingResources": "الكتاب المدرسي، الرسوم البيانية، أوراق العمل",
        "references": "منهج اللغة العربية للصف الخامس، دليل المعلم",
        "stages": {
            "introduction": {
                "time": "10 دقائق",
                "teachingActivities": "تحية الطلاب، مراجعة الدرس السابق، تقديم الموضوع",
                "learningActivities": "الرد على الأسئلة، الربط بالمعرفة السابقة",
                "assessment": "الأسئلة والأجوبة لتقييم الاستعداد"
            },
            "competenceDevelopment": {
                "time": "20 دقيقة",
                "teachingActivities": "شرح المفاهيم، التوضيح، توجيه الأنشطة",
                "learningActivities": "الاستماع، المشاركة، الممارسة في مجموعات",
                "assessment": "مراقبة المشاركة، التحقق من الفهم"
            },
            "design": {
                "time": "10 دقائق",
                "teachingActivities": "تخصيص المهمة، تقديم التوجيه",
                "learningActivities": "التخطيط وتصميم الحلول/الردود",
                "assessment": "مراجعة التصاميم، تقديم التغذية الراجعة"
            },
            "realisation": {
                "time": "10 دقائق",
                "teachingActivities": "تسهيل العروض، التلخيص",
                "learningActivities": "تقديم العمل، مناقشة النتائج",
                "assessment": "تقييم العروض والفهم"
            }
        },
        "remarks": ""
    },
    "form_data": {
        "dayDate": "15/04/2026",
        "session": "Morning",
        "class": "Standard 5",
        "periods": "2",
        "time": "40",
        "enrolledGirls": "12",
        "enrolledBoys": "15",
        "presentGirls": "11",
        "presentBoys": "14"
    }
}

print("\nTesting Tanzania Mainland Arabic lesson HTML generation...")
try:
    html = _build_lesson_html(mainland_lesson, for_word=False)
    print(f"✓ HTML generated successfully: {len(html)} characters")
    
    # Check if Arabic text is preserved
    if "الحروف" in html or "العربية" in html:
        print("✓ Arabic text preserved in HTML")
    else:
        print("✗ Arabic text might not be preserved")
        
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n✓ All tests completed!")