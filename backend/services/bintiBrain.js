// Binti Hamdani Intelligence Engine
// This gives Binti deep curriculum expertise for Tanzanian education

const knowledgeBase = require('../data/binti_knowledge_base');

class BintiBrain {
  constructor() {
    this.knowledge = knowledgeBase;
  }

  /**
   * Detect the educational level from a class name (e.g., "Form 6", "Standard 3")
   */
  detectLevel(className) {
    if (!className) {
      return { 
        category: "unknown", 
        bloom_verbs: ["learn", "understand"],
        activity_duration: "30 minutes",
        teaching_methods: ["general instruction"],
        assessment: ["general assessment"],
        forbidden: []
      };
    }

    const lower = className.toLowerCase().trim();
    
    // Check for exact matches first
    for (const [level, data] of Object.entries(this.knowledge.LEVEL_MATRIX)) {
      if (lower === level || lower.includes(level)) {
        return { level, ...data };
      }
    }

    // Check for partial matches (e.g., "form 6" in "Form 6 Advanced")
    for (const [level, data] of Object.entries(this.knowledge.LEVEL_MATRIX)) {
      const levelParts = level.split(' ');
      if (levelParts.some(part => lower.includes(part))) {
        return { level, ...data };
      }
    }

    // Default for unknown levels
    if (lower.includes("form") || lower.includes("standard")) {
      // Generic secondary/primary
      if (lower.includes("form")) {
        return {
          level: "form_generic",
          category: "secondary",
          bloom_verbs: ["apply", "analyze", "evaluate"],
          activity_duration: "35-40 minutes",
          teaching_methods: ["inquiry-based", "discussion", "practice"],
          assessment: ["essays", "tests", "projects"],
          forbidden: ["basic conversations", "simple matching"]
        };
      } else {
        return {
          level: "standard_generic",
          category: "primary",
          bloom_verbs: ["identify", "describe", "explain"],
          activity_duration: "20-25 minutes",
          teaching_methods: ["guided practice", "group work", "hands-on"],
          assessment: ["oral questions", "worksheets", "observations"],
          forbidden: ["complex analysis", "advanced theory"]
        };
      }
    }

    return { 
      category: "unknown", 
      bloom_verbs: ["learn", "understand"],
      activity_duration: "30 minutes",
      teaching_methods: ["general instruction"],
      assessment: ["general assessment"],
      forbidden: []
    };
  }

  /**
   * Detect subject from subject name
   */
  detectSubject(subjectName) {
    if (!subjectName) {
      return null;
    }

    const lower = subjectName.toLowerCase().trim();
    
    for (const [subject, data] of Object.entries(this.knowledge.SUBJECT_PATTERNS)) {
      if (data.detection_keywords.some(keyword => lower.includes(keyword))) {
        return { subject, ...data };
      }
    }

    return null;
  }

  /**
   * Get syllabus focus based on level, subject, and syllabus type
   */
  getSyllabusFocus(syllabus, subject, level) {
    const subjectData = this.detectSubject(subject);
    if (!subjectData) return null;

    // Determine level key for syllabus focus
    let levelKey = "";
    const lowerLevel = level.toLowerCase();
    
    if (lowerLevel.includes("form 5") || lowerLevel.includes("form 6")) {
      levelKey = "form_5_6";
    } else if (lowerLevel.includes("form 3") || lowerLevel.includes("form 4")) {
      levelKey = "form_3_4";
    } else if (lowerLevel.includes("form 1") || lowerLevel.includes("form 2")) {
      levelKey = "form_1_2";
    } else if (lowerLevel.includes("standard 5") || lowerLevel.includes("standard 6") || lowerLevel.includes("standard 7")) {
      levelKey = "std_5_7";
    } else if (lowerLevel.includes("standard 1") || lowerLevel.includes("standard 2") || lowerLevel.includes("standard 3") || lowerLevel.includes("standard 4")) {
      levelKey = "std_1_4";
    } else {
      levelKey = "general";
    }

    // Special handling for Arabic in Zanzibar
    if (subject.toLowerCase() === "arabic" && syllabus === "Zanzibar") {
      return subjectData.syllabus_focus_zanzibar?.[levelKey] || subjectData.syllabus_focus?.[levelKey] || [];
    }

    return subjectData.syllabus_focus?.[levelKey] || [];
  }

  /**
   * Check if level is advanced (Form 5-6)
   */
  isAdvancedLevel(className) {
    if (!className) return false;
    const lower = className.toLowerCase();
    return lower.includes("form 5") || lower.includes("form 6");
  }

  /**
   * Get forbidden topics for a specific level, subject, and syllabus
   */
  getForbiddenTopics(className, subject, syllabus) {
    const isAdvanced = this.isAdvancedLevel(className);
    const subjectLower = subject?.toLowerCase() || "";
    
    // Advanced level forbidden topics
    if (isAdvanced) {
      const advancedForbidden = [...this.knowledge.BINTI_QUICK_RULES.forbidden_for_advanced];
      
      // Special rules for Arabic in Zanzibar at advanced level
      if (subjectLower === "arabic" && syllabus === "Zanzibar") {
        const subjectData = this.detectSubject(subject);
        if (subjectData?.forbidden_topics_zanzibar_form_6) {
          advancedForbidden.push(...subjectData.forbidden_topics_zanzibar_form_6);
        }
      }
      
      // Subject-specific forbidden topics
      const subjectData = this.detectSubject(subject);
      if (subjectData?.forbidden_topics_form_6) {
        advancedForbidden.push(...subjectData.forbidden_topics_form_6);
      }
      
      return advancedForbidden;
    }

    // Level-specific forbidden topics
    const levelInfo = this.detectLevel(className);
    return levelInfo.forbidden || [];
  }

  /**
   * Get required Bloom's taxonomy verbs for a level
   */
  getRequiredVerbs(className) {
    const levelInfo = this.detectLevel(className);
    return levelInfo.bloom_verbs || ["understand", "know"];
  }

  /**
   * Get teaching methods for a level
   */
  getTeachingMethods(className) {
    const levelInfo = this.detectLevel(className);
    return levelInfo.teaching_methods || ["direct instruction", "guided practice"];
  }

  /**
   * Get assessment methods for a level
   */
  getAssessmentMethods(className) {
    const levelInfo = this.detectLevel(className);
    return levelInfo.assessment || ["written test", "oral questions"];
  }

  /**
   * Get activity duration for a level
   */
  getActivityDuration(className) {
    const levelInfo = this.detectLevel(className);
    return levelInfo.activity_duration || "30 minutes";
  }

  /**
   * Get syllabus structure for a level
   */
  getSyllabusStructure(level, syllabus) {
    const lowerLevel = level.toLowerCase();
    
    if (lowerLevel.includes("standard")) {
      return this.knowledge.SYLLABUS_STRUCTURE.primary;
    } else if (lowerLevel.includes("form 5") || lowerLevel.includes("form 6")) {
      return this.knowledge.SYLLABUS_STRUCTURE.advanced;
    } else if (lowerLevel.includes("form")) {
      return this.knowledge.SYLLABUS_STRUCTURE.secondary;
    }
    
    return this.knowledge.SYLLABUS_STRUCTURE.secondary;
  }

  /**
   * Get NECTA exam patterns for a level
   */
  getNECTAPatterns(level) {
    const lowerLevel = level.toLowerCase();
    
    if (lowerLevel.includes("form 4")) {
      return this.knowledge.NECTA_PATTERNS.form_4_csee;
    } else if (lowerLevel.includes("form 6")) {
      return this.knowledge.NECTA_PATTERNS.form_6_acsee;
    }
    
    return null;
  }

  /**
   * Generate a curriculum intelligence summary for a teaching context
   */
  generateIntelligenceSummary(context) {
    const { subject, grade, syllabus, topic } = context;
    
    const levelInfo = this.detectLevel(grade);
    const subjectInfo = this.detectSubject(subject);
    const isAdvanced = this.isAdvancedLevel(grade);
    const forbiddenTopics = this.getForbiddenTopics(grade, subject, syllabus);
    const syllabusFocus = this.getSyllabusFocus(syllabus, subject, grade);
    const nectaPatterns = this.getNECTAPatterns(grade);
    
    return {
      level: {
        name: grade,
        category: levelInfo.category,
        isAdvanced,
        bloom_verbs: levelInfo.bloom_verbs,
        activity_duration: levelInfo.activity_duration,
        teaching_methods: levelInfo.teaching_methods,
        assessment_methods: levelInfo.assessment
      },
      subject: subjectInfo ? {
        name: subjectInfo.subject,
        language_of_instruction: subjectInfo.language_of_instruction,
        required_skills: subjectInfo.required_skills || [],
        required_structures: subjectInfo.required_structures || []
      } : null,
      syllabus: {
        type: syllabus,
        focus_topics: syllabusFocus,
        structure: this.getSyllabusStructure(grade, syllabus)
      },
      constraints: {
        forbidden_topics: forbiddenTopics,
        required_patterns: isAdvanced ? this.knowledge.BINTI_QUICK_RULES.required_for_advanced : []
      },
      assessment: nectaPatterns ? {
        exam_type: nectaPatterns,
        preparation_focus: "Align with NECTA requirements"
      } : null,
      quick_guide: this.knowledge.BINTI_QUICK_RULES.subject_quick_guides[`${subject}_${grade.replace(' ', '')}_${syllabus}`] || 
                   `Teach ${subject} at ${grade} level following ${syllabus} syllabus`
    };
  }

  /**
   * Validate a lesson plan against curriculum rules
   */
  validateLessonPlan(lessonPlan, context) {
    const { subject, grade, syllabus } = context;
    const intelligence = this.generateIntelligenceSummary(context);
    const issues = [];
    const warnings = [];
    const strengths = [];

    // Check for forbidden content
    const forbiddenTopics = intelligence.constraints.forbidden_topics;
    const lessonText = JSON.stringify(lessonPlan).toLowerCase();
    
    forbiddenTopics.forEach(topic => {
      if (lessonText.includes(topic.toLowerCase())) {
        issues.push(`Contains forbidden content: "${topic}"`);
      }
    });

    // Check for required Bloom's verbs
    const requiredVerbs = intelligence.level.bloom_verbs;
    const hasRequiredVerbs = requiredVerbs.some(verb => 
      lessonText.includes(verb.toLowerCase())
    );
    
    if (!hasRequiredVerbs && requiredVerbs.length > 0) {
      warnings.push(`Consider using Bloom's verbs like: ${requiredVerbs.join(', ')}`);
    } else if (hasRequiredVerbs) {
      strengths.push(`Uses appropriate Bloom's taxonomy verbs`);
    }

    // Check syllabus focus
    const syllabusFocus = intelligence.syllabus.focus_topics;
    if (syllabusFocus && syllabusFocus.length > 0) {
      const hasSyllabusFocus = syllabusFocus.some(topic => 
        lessonText.includes(topic.toLowerCase())
      );
      
      if (!hasSyllabusFocus) {
        warnings.push(`Consider aligning with syllabus focus topics: ${syllabusFocus.slice(0, 3).join(', ')}...`);
      } else {
        strengths.push(`Aligned with syllabus focus topics`);
      }
    }

    // Check for advanced level requirements
    if (intelligence.level.isAdvanced) {
      const requiredPatterns = intelligence.constraints.required_patterns;
      const hasAdvancedPatterns = requiredPatterns.some(pattern => 
        lessonText.includes(pattern.toLowerCase().split('...')[0])
      );
      
      if (!hasAdvancedPatterns && requiredPatterns.length > 0) {
        issues.push(`Advanced level requires critical thinking patterns like: ${requiredPatterns[0]}`);
      } else if (hasAdvancedPatterns) {
        strengths.push(`Includes advanced critical thinking patterns`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      strengths,
      intelligence_summary: intelligence
    };
  }
}

module.exports = BintiBrain;