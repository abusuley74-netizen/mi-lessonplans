import React, { useRef } from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LessonPreview = ({ lessonData }) => {
  const printRef = useRef();
  const navigate = useNavigate();

  if (!lessonData || !lessonData.content || Object.keys(lessonData.content).length === 0) return null;

  const content = lessonData.content;

  return (
    <div className="bg-white border border-[#E4DFD5] rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#F2EFE8] p-4 flex items-center justify-between border-b border-[#E4DFD5] no-print">
        <h3 className="font-heading font-semibold text-[#1A2E16]">Lesson Plan Preview</h3>
        <button
          onClick={() => navigate('/myhub')}
          className="go-to-myhub-blink"
          data-testid="go-to-myhub-btn"
        >
          Now go to MyHub
        </button>
        <style>{`
          .go-to-myhub-blink {
            padding: 8px 20px;
            font-size: 14px;
            font-weight: 700;
            color: #fff;
            background: #2D5A27;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            animation: myhubBlink 1.2s ease-in-out infinite;
            transition: transform 0.2s;
          }
          .go-to-myhub-blink:hover {
            transform: scale(1.05);
            background: #21441C;
          }
          @keyframes myhubBlink {
            0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(45,90,39,0.5); }
            50% { opacity: 0.7; box-shadow: 0 0 16px 4px rgba(45,90,39,0.4); }
          }
        `}</style>
      </div>

      {/* Content */}
      <div ref={printRef} className="p-6 sm:p-8 print-content">
        {/* Meta Info */}
        <div className="mb-6 pb-6 border-b border-[#E4DFD5]">
          <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-4">
            {lessonData.topic}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-[#7A8A76] uppercase tracking-wide">Syllabus</span>
              <p className="text-[#1A2E16] font-medium">{lessonData.syllabus}</p>
            </div>
            <div>
              <span className="text-xs text-[#7A8A76] uppercase tracking-wide">Subject</span>
              <p className="text-[#1A2E16] font-medium">{lessonData.subject}</p>
            </div>
            <div>
              <span className="text-xs text-[#7A8A76] uppercase tracking-wide">Grade</span>
              <p className="text-[#1A2E16] font-medium">{lessonData.grade}</p>
            </div>
            <div>
              <span className="text-xs text-[#7A8A76] uppercase tracking-wide">Date</span>
              <p className="text-[#1A2E16] font-medium">
                {new Date(lessonData.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Zanzibar Format */}
        {lessonData.syllabus === 'Zanzibar' && (
          <div className="space-y-6">
            <Section title="General Learning Outcome" content={content.generalOutcome} />
            
            <div className="grid sm:grid-cols-2 gap-4">
              <Section title="Main Topic" content={content.mainTopic} />
              <Section title="Sub Topic" content={content.subTopic} />
            </div>
            
            <Section title="Specific Learning Outcome" content={content.specificOutcome} />
            <Section title="Learning Resources" content={content.learningResources} />
            <Section title="References" content={content.references} />

            <h3 className="font-heading text-lg font-semibold text-[#1A2E16] pt-4">
              Lesson Development
            </h3>

            {content.introductionActivities && (
              <ActivityTable 
                title="Introduction" 
                data={content.introductionActivities} 
              />
            )}

            {content.newKnowledgeActivities && (
              <ActivityTable 
                title="Building New Knowledge" 
                data={content.newKnowledgeActivities} 
              />
            )}

            <Section title="Teacher's Evaluation" content={content.teacherEvaluation} />
            <Section title="Pupil's Work" content={content.pupilWork} />
            <Section title="Remarks" content={content.remarks} />
          </div>
        )}

        {/* Tanzania Mainland Format */}
        {lessonData.syllabus === 'Tanzania Mainland' && (
          <div className="space-y-6">
            <Section title="Main Competence" content={content.mainCompetence} />
            <Section title="Specific Competence" content={content.specificCompetence} />
            
            <div className="grid sm:grid-cols-2 gap-4">
              <Section title="Main Activity" content={content.mainActivity} />
              <Section title="Specific Activity" content={content.specificActivity} />
            </div>
            
            <Section title="Teaching Resources" content={content.teachingResources} />
            <Section title="References" content={content.references} />

            <h3 className="font-heading text-lg font-semibold text-[#1A2E16] pt-4">
              Teaching and Learning Process
            </h3>

            {content.stages && Object.entries(content.stages).map(([stage, data]) => (
              <ActivityTable 
                key={stage}
                title={stage.charAt(0).toUpperCase() + stage.slice(1).replace(/([A-Z])/g, ' $1')} 
                data={data} 
              />
            ))}

            <Section title="Remarks" content={content.remarks} />
          </div>
        )}

        {/* Success Badge */}
        <div className="mt-8 pt-6 border-t border-[#E4DFD5] flex items-center justify-center gap-2 text-[#2D5A27]">
          <Check className="w-5 h-5" />
          <span className="font-medium">Generated with mi-lessonplan.site AI</span>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, content }) => (
  <div>
    <h4 className="text-sm font-semibold text-[#2D5A27] uppercase tracking-wide mb-2">
      {title}
    </h4>
    <p className="text-[#1A2E16] bg-[#F2EFE8] p-3 rounded-lg">
      {content || 'Not specified'}
    </p>
  </div>
);

const ActivityTable = ({ title, data }) => (
  <div className="border border-[#E4DFD5] rounded-lg overflow-hidden">
    <div className="bg-[#2D5A27] text-white px-4 py-2 flex justify-between items-center">
      <span className="font-medium">{title}</span>
      <span className="text-sm opacity-80">{data.time}</span>
    </div>
    <div className="divide-y divide-[#E4DFD5]">
      <div className="p-4">
        <span className="text-xs text-[#7A8A76] uppercase tracking-wide">Teaching Activities</span>
        <p className="text-[#1A2E16] mt-1">{data.teachingActivities}</p>
      </div>
      <div className="p-4">
        <span className="text-xs text-[#7A8A76] uppercase tracking-wide">Learning Activities</span>
        <p className="text-[#1A2E16] mt-1">{data.learningActivities}</p>
      </div>
      <div className="p-4">
        <span className="text-xs text-[#7A8A76] uppercase tracking-wide">Assessment</span>
        <p className="text-[#1A2E16] mt-1">{data.assessment}</p>
      </div>
    </div>
  </div>
);

export default LessonPreview;
