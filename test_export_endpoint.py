#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, '/app/backend')

# Set up environment
os.environ['MONGO_URL'] = 'mongodb://localhost:27017'
os.environ['DB_NAME'] = 'test_db'

# Mock the database functions to avoid actual DB calls
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

# Create a mock lesson with Arabic content
mock_lesson = {
    "lesson_id": "lesson_592f328f8158",
    "user_id": "test_user",
    "title": "Arabic Lesson Test",
    "syllabus": "Zanzibar",
    "subject": "اللغة العربية",  # Arabic subject
    "grade": "Grade 5",
    "topic": "الضمائر العربية",  # Arabic pronouns
    "content": {
        "generalOutcome": "فهم واستخدام الضمائر العربية",  # Understanding and using Arabic pronouns
        "mainTopic": "الضمائر العربية",
        "subTopic": "الضمائر المنفصلة",
        "specificOutcome": "يجب أن يكون الطلاب قادرين على تحديد واستخدام الضمائر المنفصلة",
        "learningResources": "الكتاب المدرسي، السبورة، البطاقات التعليمية",
        "references": "كتاب اللغة العربية للصف الخامس",
        "introductionActivities": {
            "time": "10 دقائق",
            "teachingActivities": "مراجعة الدرس السابق، تقديم الضمائر الجديدة",
            "learningActivities": "الاستماع، الإجابة على الأسئلة",
            "assessment": "الأسئلة الشفهية"
        },
        "newKnowledgeActivities": {
            "time": "25 دقيقة",
