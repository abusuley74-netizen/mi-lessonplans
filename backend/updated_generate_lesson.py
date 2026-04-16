async def generate_lesson(
    request: GenerateLessonRequest,
    user: User = Depends(get_current_user)
):
    """Generate a new lesson plan using AI with intelligence features"""
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    plan = _get_user_plan(user_doc or {})
    limit = PLAN_LIMITS.get(plan)
    
    if limit is not None:
        usage = await _get_lesson_usage(user.user_id, plan)
        if usage["used"] >= limit:
            raise HTTPException(
                status_code=403, 
                detail=f"{plan.title()} plan limit reached ({limit} lessons/month). Please upgrade to generate more lessons."
            )
    
    # Check if intelligence services are available
    if not LESSON_INTELLIGENCE_AVAILABLE:
        # Fall back to original generation
        content = await generate_lesson_with_ai(
            request.syllabus,
            request.subject,
            request.grade,
            request.topic
        )
    else:
        try:
            # Use lesson intelligence services
            prompt_builder = LessonPromptBuilder(
                syllabus=request.syllabus,
                grade=request.grade,
                subject=request.subject,
                topic=request.topic,
                user_guidance=request.user_guidance,
                negative_constraints=request.negative_constraints
            )
            
            # Build enhanced prompt
            prompt = await prompt_builder.build(db)
            
            # Initialize memory service
            memory = LessonMemory(db)
            
            if request.check_memory:
                # Try memory first
                prompt_context = {
                    "syllabus": request.syllabus,
                    "grade": request.grade,
                    "subject": request.subject,
                    "topic": request.topic,
                    "user_guidance": request.user_guidance,
                    "negative_constraints": request.negative_constraints,
                    "user_prompt": f"{request.syllabus} {request.grade} {request.subject} {request.topic}"
                }
                
                async def generate_fresh():
                    return await _generate_lesson_with_intelligence(
                        prompt, request.syllabus, request.subject, 
                        request.grade, request.topic
                    )
                
                memory_result = await memory.get_or_generate(prompt_context, generate_fresh)
                
                content = memory_result["data"]
                memory_source = memory_result["source"]
                memory_type = memory_result["type"]
                usage_count = memory_result["usage_count"]
            else:
                # Skip memory, always generate fresh
                content = await _generate_lesson_with_intelligence(
                    prompt, request.syllabus, request.subject, 
                    request.grade, request.topic
                )
                memory_source = "fresh"
                memory_type = "none"
                usage_count = 0
            
            # Add memory metadata to content
            content["_memory"] = {
                "source": memory_source,
                "type": memory_type,
                "usage_count": usage_count
            }
            
        except Exception as e:
            logger.error(f"Lesson intelligence generation failed: {e}")
            # Fall back to original generation
            content = await generate_lesson_with_ai(
                request.syllabus,
                request.subject,
                request.grade,
                request.topic
            )
    
    # Create lesson plan
    lesson = LessonPlan(
        user_id=user.user_id,
        title=request.topic,
        syllabus=request.syllabus,
        subject=request.subject,
        grade=request.grade,
        topic=request.topic,
        content=content,
        form_data=request.form_data or {}
    )
    
    lesson_doc = lesson.model_dump()
    lesson_doc["created_at"] = lesson_doc["created_at"].isoformat()
    lesson_doc["updated_at"] = lesson_doc["updated_at"].isoformat()
    
    await db.lesson_plans.insert_one(lesson_doc)
    
    # Increment lesson period count
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"lesson_period_count": 1}}
    )
    
    # Return without _id
    lesson_doc.pop("_id", None)
    return lesson_doc