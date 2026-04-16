import os
import json
import re
import httpx
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

def get_fallback_lesson_content(syllabus: str, subject: str, grade: str, topic: str) -> Dict[str, Any]:
    """Generate fallback lesson content when AI service is unavailable"""
    return {
        "title": f"{topic} - {subject} {grade}",
        "learningObjectives": [
            f"Understand basic concepts of {topic}",
            f"Apply {topic} knowledge to simple problems",
            f"Demonstrate understanding through activities"
        ],
        "teachingActivities": [
            f"Introduction to {topic} (10 minutes)",
            f"Group discussion about {topic} (15 minutes)",
            f"Practice exercises (15 minutes)"
        ],
        "assessmentMethods": [
            "Oral questions",
            "Written exercises",
            "Group presentation"
        ],
        "resources": [
            "Textbook",
            "Whiteboard",
            "Worksheets"
        ],
        "teacherEvaluation": "",
        "remarks": ""
    }

async def _generate_lesson_with_intelligence(prompt: str, syllabus: str, subject: str, grade: str, topic: str) -> Dict[str, Any]:
    """Generate lesson content using enhanced intelligence prompt"""
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        logger.warning("No DEEPSEEK_API_KEY found, using fallback content")
        return get_fallback_lesson_content(syllabus, subject, grade, topic)
    
    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert Tanzanian education curriculum designer. Create practical lesson plans. Be concise but comprehensive. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 4096
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                logger.error(f"DeepSeek API error: {response.status_code} - {response.text}")
                return get_fallback_lesson_content(syllabus, subject, grade, topic)
            
            data = response.json()
            response_text = data["choices"][0]["message"]["content"]
            
            # Try to extract JSON from the response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                content = json.loads(json_match.group())
                # Force teacherEvaluation and remarks to be empty for teacher input
                if "teacherEvaluation" in content:
                    content["teacherEvaluation"] = ""
                if "remarks" in content:
                    content["remarks"] = ""
                return content
            else:
                logger.warning("Could not parse AI response, using fallback")
                return get_fallback_lesson_content(syllabus, subject, grade, topic)
            
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        return get_fallback_lesson_content(syllabus, subject, grade, topic)

async def generate_with_intelligence(prompt: str, system_prompt: str = "", temperature: float = 0.7) -> str:
    """Generate text response using AI intelligence (wrapper for Binti chat)"""
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        logger.warning("No DEEPSEEK_API_KEY found, using fallback response")
        return "Hujambo! I'm Binti Hamdani, your curriculum expert. I'm here to help you create excellent lesson plans and schemes of work. Please tell me what subject and grade you're teaching."
    
    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": "deepseek-chat",
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 2048
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                logger.error(f"DeepSeek API error: {response.status_code} - {response.text}")
                return "Samahani, I'm having some technical difficulties. Please try again or proceed with generating your lesson plan directly."
            
            data = response.json()
            response_text = data["choices"][0]["message"]["content"]
            
            return response_text
            
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        return "Samahani, I'm having trouble thinking right now. Please try again or proceed with generating your lesson plan directly."