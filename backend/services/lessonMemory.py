#!/usr/bin/env python3
"""
Lesson Plan Memory Service for storing and retrieving generated lesson plans
"""
import hashlib
import json
from datetime import datetime
from typing import Dict, Any, Optional

class LessonMemory:
    def __init__(self, db):
        self.db = db
    
    def normalize(self, prompt_context: Dict[str, Any]) -> str:
        """Normalize prompt context to create a hash key"""
        syllabus = prompt_context.get('syllabus', '')
        subject = prompt_context.get('subject', '')
        grade = prompt_context.get('grade', '')
        topic = prompt_context.get('topic', '')
        user_guidance = prompt_context.get('user_guidance', '')
        negative_constraints = prompt_context.get('negative_constraints', '')
        
        normalized = f"syllabus:{syllabus}|"
        normalized += f"subject:{subject.lower().strip()}|"
        normalized += f"grade:{grade}|"
        normalized += f"topic:{topic.lower().strip()}|"
        
        if user_guidance:
            cleaned = user_guidance.lower().replace('\s+', ' ').strip()
            normalized += f"guidance:{cleaned}|"
        
        if negative_constraints:
            cleaned = negative_constraints.lower().replace('\s+', ' ').strip()
            normalized += f"negative:{cleaned}|"
        
        return hashlib.sha256(normalized.encode()).hexdigest()
    
    async def get_or_generate(self, prompt_context: Dict[str, Any], generate_function) -> Dict[str, Any]:
        """
        Get lesson from memory or generate fresh
        
        Args:
            prompt_context: Dictionary with syllabus, subject, grade, topic, user_guidance, negative_constraints
            generate_function: Async function that generates lesson plan when not in memory
        
        Returns:
            Dictionary with lesson data and metadata
        """
        prompt_hash = self.normalize(prompt_context)
        
        # Check exact memory match
        exact_match = await self.db.lesson_memory.find_one({"prompt_hash": prompt_hash})
        
        if exact_match:
            # Update usage count and timestamp
            await self.db.lesson_memory.update_one(
                {"_id": exact_match["_id"]},
                {
                    "$inc": {"usage_count": 1},
                    "$set": {"last_used": datetime.utcnow()}
                }
            )
            
            return {
                "source": "memory",
                "type": "exact",
                "data": exact_match.get("generated_lesson", {}),
                "usage_count": exact_match.get("usage_count", 0) + 1
            }
        
        # Check template match (for common topics)
        syllabus = prompt_context.get('syllabus', '')
        subject = prompt_context.get('subject', '')
        grade = prompt_context.get('grade', '')
        topic = prompt_context.get('topic', '').lower()
        
        # Find templates that match the syllabus, subject, and grade
        templates = await self.db.lesson_templates.find({
            "syllabus": syllabus,
            "subject": subject,
            "grade": grade
        }).to_list(length=10)
        
        # Check if any template pattern matches the topic
        matched_template = None
        for template in templates:
            pattern = template.get('topic_pattern', '').replace('%', '.*')
            if pattern and re.search(pattern, topic, re.IGNORECASE):
                matched_template = template
                break
        
        if matched_template:
            return {
                "source": "template",
                "type": "premade",
                "data": matched_template.get('template_json', {}),
                "usage_count": 0
            }
        
        # Generate fresh lesson
        generated_data = await generate_function()
        
        # Store in memory
        await self.db.lesson_memory.insert_one({
            "prompt_hash": prompt_hash,
            "syllabus": syllabus,
            "subject": subject,
            "grade": grade,
            "topic": topic,
            "user_guidance_hash": hashlib.sha256(
                prompt_context.get('user_guidance', '').encode()
            ).hexdigest() if prompt_context.get('user_guidance') else None,
            "negative_constraints_hash": hashlib.sha256(
                prompt_context.get('negative_constraints', '').encode()
            ).hexdigest() if prompt_context.get('negative_constraints') else None,
            "generated_lesson": generated_data,
            "usage_count": 1,
            "last_used": datetime.utcnow(),
            "created_at": datetime.utcnow()
        })
        
        return {
            "source": "generated",
            "type": "fresh",
            "data": generated_data,
            "usage_count": 1
        }
    
    async def get_suggestions(self, syllabus: str, subject: str, grade: str, limit: int = 10) -> list:
        """
        Get memory suggestions for a given syllabus, subject, and grade
        
        Args:
            syllabus: Syllabus type
            subject: Subject name
            grade: Grade/class level
            limit: Maximum number of suggestions
        
        Returns:
            List of suggestion dictionaries
        """
        suggestions = await self.db.lesson_memory.find({
            "syllabus": syllabus,
            "subject": subject,
            "grade": grade
        }).sort([("usage_count", -1), ("last_used", -1)]).limit(limit).to_list(length=limit)
        
        result = []
        for suggestion in suggestions:
            result.append({
                "topic": suggestion.get("topic", ""),
                "user_guidance_hash": suggestion.get("user_guidance_hash"),
                "usage_count": suggestion.get("usage_count", 0),
                "last_used": suggestion.get("last_used"),
                "preview": self._create_preview(suggestion.get("generated_lesson", {}))
            })
        
        return result
    
    def _create_preview(self, lesson_data: Dict[str, Any]) -> str:
        """Create a preview text from lesson data"""
        if not lesson_data:
            return ""
        
        title = lesson_data.get("lesson_title", "")
        objectives = lesson_data.get("learning_objectives", [])
        
        preview = f"{title}: "
        if objectives and len(objectives) > 0:
            preview += objectives[0]
            if len(objectives) > 1:
                preview += f" + {len(objectives)-1} more objectives"
        
        return preview[:200] + ("..." if len(preview) > 200 else "")

# Import regex module
import re