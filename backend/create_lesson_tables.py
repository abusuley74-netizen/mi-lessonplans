#!/usr/bin/env python3
"""
Create MongoDB collections for Lesson Plan Intelligence System
"""
import os
import sys
from pathlib import Path
from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime

ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(ROOT_DIR / '.env')

def create_lesson_collections():
    """Create MongoDB collections for lesson plan intelligence system"""
    
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    print(f"Connecting to MongoDB database: {db_name}")
    
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=60000)
    db = client[db_name]
    
    # 1. Create lesson_memory collection
    if 'lesson_memory' not in db.list_collection_names():
        db.create_collection('lesson_memory')
        print("✅ Created lesson_memory collection")
    
    # Create indexes for lesson_memory
    lesson_memory = db['lesson_memory']
    lesson_memory.create_index([('prompt_hash', ASCENDING)], unique=True)
    lesson_memory.create_index([
        ('syllabus', ASCENDING),
        ('subject', ASCENDING),
        ('grade', ASCENDING),
        ('topic', ASCENDING)
    ], name='idx_lesson_lookup')
    lesson_memory.create_index([('usage_count', DESCENDING)])
    lesson_memory.create_index([('last_used', DESCENDING)])
    print("✅ Created indexes for lesson_memory")
    
    # 2. Create lesson_templates collection
    if 'lesson_templates' not in db.list_collection_names():
        db.create_collection('lesson_templates')
        print("✅ Created lesson_templates collection")
    
    # Create indexes for lesson_templates
    lesson_templates = db['lesson_templates']
    lesson_templates.create_index([
        ('syllabus', ASCENDING),
        ('subject', ASCENDING),
        ('grade', ASCENDING)
    ])
    lesson_templates.create_index([('priority', DESCENDING)])
    print("✅ Created indexes for lesson_templates")
    
    # 3. Seed some initial lesson templates
    seed_initial_templates(lesson_templates)
    
    print("\n🎉 Lesson plan collections created successfully!")
    print(f"   - lesson_memory: {lesson_memory.count_documents({})} documents")
    print(f"   - lesson_templates: {lesson_templates.count_documents({})} templates")
    
    return True

def seed_initial_templates(collection):
    """Seed initial lesson templates for common topics"""
    
    templates = [
        {
            'syllabus': 'Zanzibar',
            'subject': 'Mathematics',
            'grade': 'Standard 5',
            'topic_pattern': '%fractions%',
            'template_json': {
                'lesson_title': 'Introduction to Fractions',
                'duration': '60 minutes',
                'learning_objectives': [
                    'Define what a fraction is',
                    'Identify numerator and denominator',
                    'Represent fractions using diagrams'
                ],
                'materials': ['Fraction circles', 'Chart paper', 'Markers'],
                'prior_knowledge': 'Basic understanding of whole numbers and division',
                'introduction': {
                    'duration': '5 min',
                    'activity': 'Show a pizza cut into slices. Ask: "If we have 1 pizza and cut it into 4 equal slices, what do we call each piece?"'
                },
                'main_activity': {
                    'duration': '40 min',
                    'activity': 'Hands-on activity with fraction circles. Students create different fractions and compare sizes.'
                },
                'conclusion': {
                    'duration': '10 min',
                    'activity': 'Group discussion: "Why are fractions important in real life?"'
                },
                'differentiation': {
                    'support': 'Use concrete manipulatives and one-on-one guidance',
                    'extension': 'Challenge students to add simple fractions with same denominator'
                },
                'assessment': 'Worksheet with fraction identification and drawing',
                'remarks': 'Focus on concrete understanding before moving to abstract'
            },
            'priority': 10,
            'created_at': datetime.utcnow()
        },
        {
            'syllabus': 'Tanzania Mainland',
            'subject': 'Kiswahili',
            'grade': 'Standard 3',
            'topic_pattern': '%salamu%',
            'template_json': {
                'lesson_title': 'Salamu na Maamkuzi',
                'duration': '60 minutes',
                'learning_objectives': [
                    'Kutambua aina mbalimbali za salamu',
                    'Kutumia salamu kwa usahihi katika mazingira tofauti',
                    'Kujibu salamu kwa adabu'
                ],
                'materials': ['Kadi za picha', 'Mchezo wa kuigiza', 'Redio'],
                'prior_knowledge': 'Ufahamu wa msamiati wa kawaida wa Kiswahili',
                'introduction': {
                    'duration': '5 min',
                    'activity': 'Mwalimu anaanza kwa kusema "Habari za asubuhi?" na kuangalia majibu ya wanafunzi'
                },
                'main_activity': {
                    'duration': '40 min',
                    'activity': 'Wanafunzi wanaigiza mazungumzo ya salamu katika mazingira tofauti (shuleni, nyumbani, sokoni)'
                },
                'conclusion': {
                    'duration': '10 min',
                    'activity': 'Majadiliano: "Kwa nini salamu ni muhimu katika jamii?"'
                },
                'differentiation': {
                    'support': 'Toa mifano ya moja kwa moja na kurudia',
                    'extension': 'Wanafunzi waweza kuunda mazungumzo yao wenyewe'
                },
                'assessment': 'Uigizaji na maswali ya mdomo',
                'remarks': 'Kuzingatia utamaduni wa Kiswahili katika salamu'
            },
            'priority': 8,
            'created_at': datetime.utcnow()
        },
        {
            'syllabus': 'Zanzibar',
            'subject': 'Arabic',
            'grade': 'Form 6',
            'topic_pattern': '%شعر%',
            'template_json': {
                'lesson_title': 'تحليل الشعر العربي الكلاسيكي',
                'duration': '90 minutes',
                'learning_objectives': [
                    'تحليل بنية القصيدة العربية التقليدية',
                    'تحديد الصور البلاغية في النص الشعري',
                    'نقد الرسالة الأدبية للقصيدة'
                ],
                'materials': ['نصوص شعرية كلاسيكية', 'قاموس عربي', 'وسائط متعددة'],
                'prior_knowledge': 'معرفة أساسية باللغة العربية الفصحى والمصطلحات الأدبية',
                'introduction': {
                    'duration': '10 min',
                    'activity': 'عرض قصيدة مختارة ومناقشة الانطباعات الأولية'
                },
                'main_activity': {
                    'duration': '60 min',
                    'activity': 'تحليل جماعي للقصيدة: البنية، الصور البلاغية، الرسالة'
                },
                'conclusion': {
                    'duration': '15 min',
                    'activity': 'مناقشة نقدية: "ما مدى أهمية الشعر الكلاسيكي في العصر الحديث؟"'
                },
                'differentiation': {
                    'support': 'توفير ترجمة إنجليزية مساعدة',
                    'extension': 'مقارنة مع شعراء معاصرين'
                },
                'assessment': 'تحليل كتابي لقصيدة جديدة',
                'remarks': 'التركيز على التحليل النقدي وليس الحفظ'
            },
            'priority': 9,
            'created_at': datetime.utcnow()
        }
    ]
    
    # Insert templates if they don't exist
    for template in templates:
        existing = collection.find_one({
            'syllabus': template['syllabus'],
            'subject': template['subject'],
            'grade': template['grade'],
            'topic_pattern': template['topic_pattern']
        })
        
        if not existing:
            collection.insert_one(template)
    
    print(f"✅ Seeded {len(templates)} initial lesson templates")

if __name__ == '__main__':
    try:
        create_lesson_collections()
        print("\n✨ Lesson Plan Intelligence System database setup complete!")
    except Exception as e:
        print(f"❌ Error creating lesson collections: {e}")
        sys.exit(1)