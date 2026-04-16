// Binti Hamdani Curriculum Knowledge Base
// This database gives Binti deep curriculum expertise for Tanzanian education

module.exports = {
  // PART 1: LEVEL DETECTION SYSTEM
  LEVEL_MATRIX: {
    // PRIMARY SCHOOL (Standard 1-7)
    "standard 1": {
      category: "early_primary",
      bloom_verbs: ["identify", "name", "point to", "match", "color", "trace", "repeat", "recognize"],
      activity_duration: "5-10 minutes",
      teaching_methods: ["play-based", "singing", "games", "storytelling", "drawing"],
      assessment: ["observation", "oral response", "drawing", "matching"],
      forbidden: ["essays", "critical analysis", "independent research", "abstract concepts"]
    },
    "standard 2": {
      category: "early_primary",
      bloom_verbs: ["identify", "name", "describe", "list", "order", "compare", "sort"],
      activity_duration: "10-15 minutes",
      teaching_methods: ["guided discovery", "pair work", "hands-on", "visual aids"],
      assessment: ["oral questions", "picture labeling", "simple written answers"],
      forbidden: ["essays", "critical analysis", "research projects"]
    },
    "standard 3": {
      category: "mid_primary",
      bloom_verbs: ["describe", "explain", "summarize", "classify", "organize", "demonstrate"],
      activity_duration: "15-20 minutes",
      teaching_methods: ["group work", "demonstration", "inquiry-based", "role play simple"],
      assessment: ["short answer", "matching", "fill blanks", "oral presentation"],
      forbidden: ["complex essays", "formal debates", "statistical analysis"]
    },
    "standard 4": {
      category: "mid_primary",
      bloom_verbs: ["explain", "summarize", "classify", "compare", "differentiate", "solve"],
      activity_duration: "15-20 minutes",
      teaching_methods: ["collaborative learning", "experiments", "projects simple"],
      assessment: ["short paragraph", "multiple choice", "problem solving"],
      forbidden: ["long essays", "independent thesis", "advanced grammar"]
    },
    "standard 5": {
      category: "upper_primary",
      bloom_verbs: ["apply", "analyze", "differentiate", "construct", "investigate", "organize"],
      activity_duration: "20-25 minutes",
      teaching_methods: ["project-based", "peer teaching", "debates simple", "research basic"],
      assessment: ["paragraph writing", "simple reports", "presentations"],
      forbidden: ["complex citations", "abstract theories"]
    },
    "standard 6": {
      category: "upper_primary",
      bloom_verbs: ["apply", "analyze", "evaluate", "justify", "critique simple", "design"],
      activity_duration: "20-25 minutes",
      teaching_methods: ["inquiry-based", "case studies simple", "group investigation"],
      assessment: ["essays basic", "projects", "quizzes", "peer assessment"],
      forbidden: ["dissertation-level", "advanced statistics"]
    },
    "standard 7": {
      category: "upper_primary",
      bloom_verbs: ["analyze", "evaluate", "create", "design", "justify", "critique"],
      activity_duration: "25-30 minutes",
      teaching_methods: ["student-led", "research projects", "presentations", "debates"],
      assessment: ["essays", "reports", "oral exams", "portfolio"],
      forbidden: ["university-level theory"]
    },

    // SECONDARY SCHOOL (Form 1-4)
    "form 1": {
      category: "lower_secondary",
      bloom_verbs: ["apply", "analyze", "differentiate", "construct", "demonstrate", "solve"],
      activity_duration: "25-30 minutes",
      teaching_methods: ["inquiry-based", "cooperative learning", "demonstration", "guided practice"],
      assessment: ["short essays", "problem sets", "lab reports basic", "presentations"],
      forbidden: ["advanced literary criticism", "complex statistical analysis"]
    },
    "form 2": {
      category: "lower_secondary",
      bloom_verbs: ["apply", "analyze", "evaluate", "justify", "compare complex", "synthesize basic"],
      activity_duration: "30-35 minutes",
      teaching_methods: ["project-based", "case studies", "peer tutoring", "discussion"],
      assessment: ["essays", "lab reports", "research basic", "oral defense"],
      forbidden: ["thesis-level", "post-modern theory"]
    },
    "form 3": {
      category: "upper_secondary",
      bloom_verbs: ["analyze", "evaluate", "create", "justify", "critique", "synthesize"],
      activity_duration: "35-40 minutes",
      teaching_methods: ["seminar-style", "independent research", "debates advanced", "problem-based"],
      assessment: ["analytical essays", "research papers", "exams prep", "portfolio"],
      forbidden: ["PhD-level abstraction"]
    },
    "form 4": {
      category: "upper_secondary",
      bloom_verbs: ["evaluate", "create", "critique", "defend", "synthesize advanced", "theorize basic"],
      activity_duration: "35-40 minutes",
      teaching_methods: ["student-led seminars", "mock exams", "research projects", "peer review"],
      assessment: ["mock NECTA", "research papers", "presentations", "portfolios"],
      forbidden: ["university-level specialization"]
    },

    // ADVANCED LEVEL (Form 5-6)
    "form 5": {
      category: "advanced_preuniversity",
      bloom_verbs: ["critique", "evaluate", "synthesize advanced", "theorize", "deconstruct", "propose"],
      activity_duration: "40-45 minutes",
      teaching_methods: ["lecture-discussion", "independent study", "research intensive", "academic writing"],
      assessment: ["essays", "research proposals", "critical reviews", "presentations academic"],
      forbidden: ["basic conversations", "simple paragraphs", "rote memorization"]
    },
    "form 6": {
      category: "advanced_preuniversity",
      bloom_verbs: ["deconstruct", "evaluate critically", "synthesize across disciplines", "theorize advanced", "publish ready"],
      activity_duration: "45-50 minutes",
      teaching_methods: ["seminar", "tutorial", "independent thesis", "peer review academic"],
      assessment: ["dissertation chapters", "academic papers", "conference presentations", "comprehensive exams"],
      forbidden: ["high school level content", "basic skills"]
    }
  },

  // PART 2: SUBJECT PATTERNS (What Makes Each Subject Unique)
  SUBJECT_PATTERNS: {
    // ========== LANGUAGES ==========
    "arabic": {
      detection_keywords: ["arabic", "لغة عربية", "عربي", "lugha ya kiarabu"],
      syllabus_focus_zanzibar: {
        form_5_6: ["Prosody (العروض)", "Rhetoric (البلاغة)", "Pre-Islamic Poetry", "Umayyad Poetry", "Abbasid Poetry", "Modern Literature", "Literary Criticism", "Maqamat", "Classical Prose"],
        form_3_4: ["Grammar (النحو)", "Morphology (الصرف)", "Reading Comprehension", "Essay Writing", "Translation", "Modern Texts"],
        form_1_2: ["Alphabet", "Basic Vocabulary", "Simple Sentences", "Greetings", "Family", "School", "Daily Routines"],
        std_5_7: ["Letters", "Numbers", "Colors", "Basic Reading", "Simple Stories", "Religious Phrases"],
        std_1_4: ["Letter Recognition", "Sounds", "Basic Words", "Simple Greetings"]
      },
      forbidden_topics_zanzibar_form_6: ["Basic conversations at market", "Personal letters", "Simple paragraph writing", "Role-play daily situations", "Read aloud only"],
      required_structures: ["Poetry analysis", "Rhetorical device identification", "Literary age comparison", "Critical evaluation"],
      language_of_instruction: "Arabic (classical/modern standard)"
    },
    
    "kiswahili": {
      detection_keywords: ["kiswahili", "swahili", "lugha", "sarufi", "fasihi", "insha"],
      syllabus_focus: {
        form_5_6: ["Fasihi Simulizi", "Fasihi Andishi", "Uchambuzi wa Tungo", "Nadhari na Kina", "Uhakiki", "Isimu", "Tamthilia", "Riwaya", "Ushairi"],
        form_3_4: ["Sarufi", "Ufahamu", "Insha", "Fasihi (Nguzo)", "Misamiati", "Methali", "Vitendawili"],
        form_1_2: ["Sarufi Msingi", "Ufahamu Rahisi", "Insha Fupi", "Misamiati ya Kawaida"],
        std_5_7: ["Kusoma", "Kuandika", "Sarufi Msingi", "Methali", "Vitendawili", "Mashairi Rahisi"],
        std_1_4: ["Herufi", "Maneno Rahisi", "Sentensi Fupi", "Kusoma kwa Mdomo"]
      },
      forbidden_topics_form_6: ["Alphabet learning", "Basic greetings as main content", "Simple word matching"],
      required_structures: ["Literary analysis", "Poetry scanning", "Essay writing advanced", "Critical response"],
      language_of_instruction: "Swahili (standard)"
    },
    
    "english": {
      detection_keywords: ["english", "language", "literature", "grammar", "composition", "reading"],
      syllabus_focus: {
        form_5_6: ["Advanced Grammar", "Literary Criticism", "Poetry Analysis (Metaphysical, Romantic, Modern)", "Drama (Shakespeare, Modern)", "Prose (Novels, Short Stories)", "Essay Writing Academic", "Research Skills"],
        form_3_4: ["Grammar (Tenses, Parts of Speech)", "Reading Comprehension", "Summary Writing", "Letter Writing", "Creative Writing", "Literature (Poetry, Prose, Drama basic)"],
        form_1_2: ["Basic Grammar", "Vocabulary Building", "Simple Reading", "Paragraph Writing", "Oral Skills"],
        std_5_7: ["Alphabet", "Basic Words", "Simple Sentences", "Reading Practice", "Basic Writing"],
        std_1_4: ["Letters", "Phonics", "Basic Vocabulary", "Simple Greetings"]
      },
      language_of_instruction: "English"
    },

    // ========== MATHEMATICS ==========
    "mathematics": {
      detection_keywords: ["math", "mathematics", "hisabati", "algebra", "geometry", "calculus", "arithmetic"],
      syllabus_focus: {
        form_5_6: ["Calculus (Differentiation, Integration)", "Algebra (Matrices, Vectors, Complex Numbers)", "Geometry (Coordinate, Analytical)", "Statistics (Probability, Distributions)", "Trigonometry (Advanced)", "Logic and Set Theory"],
        form_3_4: ["Algebra (Linear Equations, Quadratic)", "Geometry (Angles, Shapes, Transformations)", "Trigonometry (Basic)", "Statistics (Mean, Median, Mode)", "Probability (Basic)", "Arithmetic (Ratio, Proportion)"],
        form_1_2: ["Arithmetic (Operations, Fractions, Decimals)", "Algebra (Simple Equations)", "Geometry (Basic Shapes)", "Measurement (Length, Area, Volume)"],
        std_5_7: ["Multiplication", "Division", "Fractions", "Decimals", "Percentages", "Basic Geometry", "Word Problems"],
        std_1_4: ["Counting", "Addition", "Subtraction", "Number Recognition", "Shapes", "Simple Word Problems"]
      },
      problem_types: ["Routine problems", "Non-routine problems", "Real-world applications", "Investigations"],
      required_skills: ["Problem solving", "Reasoning", "Communication", "Representation", "Connections"],
      language_of_instruction: "English/Kiswahili"
    },

    // ========== SCIENCES ==========
    "science": {
      detection_keywords: ["science", "sayansi", "biology", "chemistry", "physics", "general science"],
      syllabus_focus: {
        form_5_6_biology: ["Cell Biology", "Genetics", "Evolution", "Ecology", "Human Physiology", "Plant Physiology", "Biotechnology"],
        form_5_6_chemistry: ["Atomic Structure", "Chemical Bonding", "Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Analytical Chemistry"],
        form_5_6_physics: ["Mechanics", "Thermodynamics", "Waves", "Electricity", "Magnetism", "Modern Physics", "Quantum Basics"],
        form_3_4: ["Cells", "Classification", "Human Body Systems", "Plants", "Ecology", "Simple Chemistry (Acids, Bases)", "Simple Physics (Force, Motion, Energy)"],
        form_1_2: ["Introduction to Science", "Living Things", "Non-living Things", "Basic Measurements", "Simple Machines"],
        std_5_7: ["Human Body", "Plants", "Animals", "Environment", "Simple Experiments", "Health"],
        std_1_4: ["My Body", "Plants around us", "Animals", "Weather", "Water", "Air"]
      },
      practical_requirements: ["Experiments", "Observations", "Data collection", "Lab safety", "Report writing"],
      language_of_instruction: "English"
    },

    // ========== HUMANITIES ==========
    "history": {
      detection_keywords: ["history", "historia", "tanzania history", "world history", "african history"],
      syllabus_focus: {
        form_5_6: ["Pre-colonial African Kingdoms", "Colonialism in Africa", "Independence Movements", "Post-independence Challenges", "World Wars", "Cold War", "Tanzania History Detailed"],
        form_3_4: ["East African History", "Trade Routes", "Colonial Rule", "Independence", "Nationalism", "Tanzania After Independence"],
        form_1_2: ["Introduction to History", "Sources of History", "Early Humans", "Development of Agriculture", "Local History"],
        std_5_7: ["Tanzania History Basics", "Important Leaders", "Independence Story", "Cultural Heritage"]
      },
      key_themes: ["Causation", "Change and continuity", "Historical interpretation", "Evidence analysis", "Empathy"],
      language_of_instruction: "English/Kiswahili"
    },
    
    "geography": {
      detection_keywords: ["geography", "jiografia", "physical geography", "human geography", "map reading"],
      syllabus_focus: {
        form_5_6: ["Physical Geography (Geomorphology, Climatology, Hydrology)", "Human Geography (Population, Settlement, Economic)", "Map Reading Advanced", "Research Methods", "Environmental Issues"],
        form_3_4: ["Map Reading", "Climate", "Vegetation", "Population", "Agriculture", "Mining", "Tourism", "Conservation"],
        form_1_2: ["Introduction to Geography", "Solar System", "Weather", "Major Landforms", "Map Basics"],
        std_5_7: ["Tanzania Map", "Weather and Seasons", "Natural Resources", "Agriculture", "Minerals"]
      },
      required_skills: ["Map interpretation", "Data analysis", "Fieldwork", "Graph interpretation", "Case study analysis"],
      language_of_instruction: "English/Kiswahili"
    },
    
    "civics": {
      detection_keywords: ["civics", "uraia", "government", "constitution", "citizenship", "human rights"],
      syllabus_focus: {
        form_5_6: ["Political Systems", "Constitutions", "International Relations", "Human Rights Advanced", "Governance", "Democracy", "Elections", "Tanzania Government Structure"],
        form_3_4: ["Citizenship", "Human Rights", "Responsibilities", "Government Structure", "Local Government", "National Symbols", "Constitution Basics"],
        form_1_2: ["Introduction to Civics", "Being a Good Citizen", "School Rules", "Community", "Rights of a Child"],
        std_5_7: ["National Identity", "Leadership", "Rules and Laws", "Patriotism", "Social Issues"]
      },
      key_concepts: ["Rights", "Responsibilities", "Democracy", "Rule of law", "Participation", "Equality"],
      language_of_instruction: "Kiswahili/English"
    },

    // ========== COMMERCE & BUSINESS ==========
    "commerce": {
      detection_keywords: ["commerce", "biashara", "business", "trade", "economics basic"],
      syllabus_focus: {
        form_5_6: ["Business Management", "Marketing", "Accounting Advanced", "Entrepreneurship", "International Trade", "Business Law Basics", "Economics Principles"],
        form_3_4: ["Introduction to Commerce", "Trade (Home, International)", "Aids to Trade", "Business Organizations", "Banking", "Insurance", "Communication"],
        form_1_2: ["Introduction to Business", "Needs and Wants", "Production", "Exchange", "Money Basics"]
      },
      required_skills: ["Calculation", "Analysis", "Decision making", "Business communication", "Ethical reasoning"],
      language_of_instruction: "English"
    },

    "bookkeeping": {
      detection_keywords: ["bookkeeping", "accounting", "ledger", "journal", "financial", "books of accounts"],
      syllabus_focus: {
        form_5_6: ["Financial Accounting Advanced", "Cost Accounting", "Management Accounting", "Auditing Basics", "Financial Statements", "Partnerships", "Companies"],
        form_3_4: ["Double Entry", "Ledgers", "Journals", "Trial Balance", "Cash Book", "Bank Reconciliation", "Simple Financial Statements"],
        form_1_2: ["Introduction to Bookkeeping", "Assets and Liabilities", "Capital", "Income and Expenses", "Simple Recording"]
      },
      required_skills: ["Accuracy", "Analysis", "Interpretation", "Ethical practice", "Mathematical proficiency"],
      language_of_instruction: "English"
    },

    // ========== COMPUTER SCIENCE ==========
    "computer science": {
      detection_keywords: ["computer", "ict", "information technology", "programming", "computing", "technology"],
      syllabus_focus: {
        form_5_6: ["Programming (Python/Java)", "Data Structures", "Algorithms", "Database Design", "Networks", "Web Development", "Cybersecurity Basics", "Software Engineering"],
        form_3_4: ["Computer Components", "Operating Systems", "Word Processing", "Spreadsheets", "Presentations", "Internet Basics", "Email", "Safety and Ethics"],
        form_1_2: ["Introduction to Computers", "Parts of a Computer", "Basic Operations", "Typing", "Simple Software Use"]
      },
      required_skills: ["Problem solving", "Logical thinking", "Typing", "Software navigation", "Ethical use"],
      language_of_instruction: "English"
    }
  },

  // PART 3: SYLLABUS STRUCTURE PATTERNS (The Format)
  SYLLABUS_STRUCTURE: {
    // PRIMARY (Standard 1-7)
    primary: {
      weeks_per_term: 15,
      terms_per_year: 3,
      total_weeks: 45,
      lesson_duration: "30-35 minutes",
      scheme_columns: ["Week", "Topic", "Sub-topic", "Learning Objectives", "Teaching Activities", "Learning Resources", "Assessment", "Remarks"],
      lesson_structure: {
        introduction: "5-7 minutes",
        main_activity: "15-20 minutes",
        conclusion: "5-8 minutes"
      }
    },
    
    // SECONDARY (Form 1-4)
    secondary: {
      weeks_per_term: 15,
      terms_per_year: 3,
      total_weeks: 45,
      lesson_duration: "40 minutes",
      scheme_columns_zanzibar: ["Main Competence", "Specific Competences", "Learning Activities", "Specific Activities", "Month", "Week", "Number of Periods", "Teaching and Learning Methods", "Teaching and Learning Resources", "Assessment Tools", "References", "Remarks"],
      scheme_columns_mainland: ["Main Competence (Umahiri Mkuu)", "Specific Competence (Umahiri Mahususi)", "Main Activity (Shughuli Kuu)", "Specific Activity (Shughuli Mahususi)", "Month", "Week", "Number of Periods", "Teaching & Learning Methods", "Teaching & Learning Resources", "Assessment Tools", "References", "Remarks"],
      lesson_structure: {
        introduction: "5-8 minutes",
        main_activity: "25-30 minutes",
        conclusion: "5-7 minutes"
      }
    },
    
    // ADVANCED (Form 5-6)
    advanced: {
      weeks_per_term: 15,
      terms_per_year: 2,  // Form 5-6 has 2 terms per year (sometimes 3)
      total_weeks: 30-36,
      lesson_duration: "60-80 minutes (double period)",
      scheme_columns_same_as_secondary: true,
      lesson_structure: {
        introduction: "10 minutes",
        main_activity: "40-50 minutes",
        conclusion: "10-15 minutes",
        includes: ["Lecture component", "Student discussion", "Independent work", "Assessment integration"]
      }
    }
  },

  // PART 4: NECTA EXAM PATTERNS (For Assessment)
  NECTA_PATTERNS: {
    // Form 4 (CSEE - Certificate of Secondary Education Examination)
    form_4_csee: {
      subjects_tested: ["Mathematics", "English", "Kiswahili", "Biology", "Chemistry", "Physics", "History", "Geography", "Civics", "Bookkeeping", "Commerce", "Arabic", "French", "Literature"],
      question_patterns: {
        section_a: "Multiple choice / Matching (20-30 marks)",
        section_b: "Short answer questions (30-40 marks)",
        section_c: "Essay / Structured questions (30-40 marks)"
      },
      bloom_levels: ["Knowledge (20%)", "Comprehension (30%)", "Application (30%)", "Analysis/Evaluation (20%)"],
      time_per_subject: "2-3 hours"
    },
    
    // Form 6 (ACSEE - Advanced Certificate of Secondary Education Examination)
    form_6_acsee: {
      subjects_tested: ["Advanced Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "Commerce", "Accountancy", "Arabic", "English", "Kiswahili", "French"],
      question_patterns: {
        section_a: "Objective / Short answer (20-30 marks)",
        section_b: "Structured questions requiring analysis (40-50 marks)",
        section_c: "Essay / Extended response requiring critical thinking (30-40 marks)"
      },
      bloom_levels: ["Knowledge (10%)", "Comprehension (15%)", "Application (25%)", "Analysis (25%)", "Evaluation (15%)", "Synthesis/Creation (10%)"],
      time_per_subject: "3 hours"
    }
  },

  // PART 5: QUICK REFERENCE FOR BINTI (The Cheat Sheet)
  BINTI_QUICK_RULES: {
    // LEVEL DETECTION (from class name)
    level_rules: {
      "standard 1-2": "EARLY PRIMARY - Play-based, basic literacy, 5-10 min activities",
      "standard 3-4": "MID PRIMARY - Guided discovery, simple writing, 10-15 min activities", 
      "standard 5-7": "UPPER PRIMARY - Independent work, paragraphs, 15-25 min activities",
      "form 1-2": "LOWER SECONDARY - Analysis begins, essays short, 25-35 min activities",
      "form 3-4": "UPPER SECONDARY - Evaluation, research basic, exam focus, 35-40 min activities",
      "form 5-6": "ADVANCED - Critical thinking, thesis prep, independent research, 40-50 min activities"
    },
    
    // SYLLABUS DETECTION
    syllabus_rules: {
      "Zanzibar": "Uses 'Main Competence' column, more literary focus for Arabic, Islamic context integrated",
      "Tanzania Mainland": "Uses 'Umahiri Mkuu' column, follows TIE strictly, Kiswahili emphasis"
    },
    
    // SUBJECT QUICK GUIDES
    subject_quick_guides: {
      "Arabic_Form6_Zanzibar": "FORBID basic convos. REQUIRE prosody (العروض), rhetoric (البلاغة), literary ages, criticism",
      "Arabic_Form3-4": "Focus on grammar (النحو), morphology (الصرف), reading comp, translation",
      "Mathematics_Form6": "Calculus, Algebra, Geometry, Statistics - problem solving focus",
      "Mathematics_Form4": "Algebra, Geometry, Trig, Probability - exam technique",
      "English_Form6": "Literary criticism, advanced grammar, essay writing, research skills",
      "Kiswahili_Form6": "Fasihi (simulizi na andishi), uhakiki, isimu, tamthilia",
      "History_Form6": "African kingdoms, colonialism, independence movements, Cold War",
      "Geography_Form6": "Physical geography, human geography, map reading, research",
      "Civics_Form6": "Governance, human rights, democracy, constitutions, international relations",
      "Commerce_Form6": "Business management, marketing, accounting, entrepreneurship",
      "Bookkeeping_Form6": "Financial accounting, cost accounting, auditing, financial statements",
      "Science_Form3-4": "Cells, human body, plants, ecology, simple chemistry, physics basics",
      "Computer_Form6": "Programming, data structures, algorithms, databases, networks"
    },
    
    // FORBIDDEN PATTERNS (Binti should never generate these for advanced levels)
    forbidden_for_advanced: [
      "Basic conversation at the market",
      "Personal letter writing", 
      "Simple paragraph about my family",
      "Role-play greetings",
      "Read the text aloud as main activity",
      "Match the words with pictures",
      "Color the correct answer",
      "Basic vocabulary list of 10 words"
    ],
    
    // REQUIRED PATTERNS FOR ADVANCED LEVELS
    required_for_advanced: [
      "Analyze the rhetorical devices in...",
      "Critique the author's argument using...",
      "Evaluate the effectiveness of...",
      "Compare and contrast the literary styles of...",
      "Scan the poetic meter of...",
      "Differentiate between the literary schools of...",
      "Justify your interpretation using textual evidence",
      "Synthesize information from multiple sources"
    ]
  }
};
