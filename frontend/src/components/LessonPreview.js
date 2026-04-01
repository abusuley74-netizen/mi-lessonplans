import React, { useRef } from 'react';
import { Printer, Download, Share2, Check } from 'lucide-react';

const LessonPreview = ({ lessonData }) => {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = generateTextContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonData.subject}_${lessonData.topic}_lesson_plan.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareData = {
      title: `${lessonData.subject} Lesson Plan: ${lessonData.topic}`,
      text: `Check out this lesson plan for ${lessonData.subject} - ${lessonData.topic}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert('Lesson plan info copied to clipboard!');
    }
  };

  const generateTextContent = () => {
    let text = `LESSON PLAN\n`;
    text += `============\n\n`;
    text += `Syllabus: ${lessonData.syllabus}\n`;
    text += `Subject: ${lessonData.subject}\n`;
    text += `Grade: ${lessonData.grade}\n`;
    text += `Topic: ${lessonData.topic}\n`;
    text += `Date: ${new Date(lessonData.created_at).toLocaleDateString()}\n\n`;
    
    const content = lessonData.content;
    
    if (lessonData.syllabus === 'Zanzibar') {
      text += `GENERAL LEARNING OUTCOME:\n${content.generalOutcome || ''}\n\n`;
      text += `MAIN TOPIC: ${content.mainTopic || ''}\n`;
      text += `SUB TOPIC: ${content.subTopic || ''}\n\n`;
      text += `SPECIFIC LEARNING OUTCOME:\n${content.specificOutcome || ''}\n\n`;
      text += `LEARNING RESOURCES:\n${content.learningResources || ''}\n\n`;
      text += `REFERENCES:\n${content.references || ''}\n\n`;
      
      if (content.introductionActivities) {
        text += `INTRODUCTION (${content.introductionActivities.time}):\n`;
        text += `Teaching Activities: ${content.introductionActivities.teachingActivities}\n`;
        text += `Learning Activities: ${content.introductionActivities.learningActivities}\n`;
        text += `Assessment: ${content.introductionActivities.assessment}\n\n`;
      }
      
      if (content.newKnowledgeActivities) {
        text += `BUILDING NEW KNOWLEDGE (${content.newKnowledgeActivities.time}):\n`;
        text += `Teaching Activities: ${content.newKnowledgeActivities.teachingActivities}\n`;
        text += `Learning Activities: ${content.newKnowledgeActivities.learningActivities}\n`;
        text += `Assessment: ${content.newKnowledgeActivities.assessment}\n\n`;
      }
      
      text += `TEACHER'S EVALUATION:\n${content.teacherEvaluation || ''}\n\n`;
      text += `PUPIL'S WORK:\n${content.pupilWork || ''}\n\n`;
      text += `REMARKS:\n${content.remarks || ''}\n`;
    } else {
      text += `MAIN COMPETENCE:\n${content.mainCompetence || ''}\n\n`;
      text += `SPECIFIC COMPETENCE:\n${content.specificCompetence || ''}\n\n`;
      text += `MAIN ACTIVITY:\n${content.mainActivity || ''}\n\n`;
      text += `SPECIFIC ACTIVITY:\n${content.specificActivity || ''}\n\n`;
      text += `TEACHING RESOURCES:\n${content.teachingResources || ''}\n\n`;
      text += `REFERENCES:\n${content.references || ''}\n\n`;
      
      if (content.stages) {
        Object.entries(content.stages).forEach(([stage, data]) => {
          text += `${stage.toUpperCase()} (${data.time}):\n`;
          text += `Teaching Activities: ${data.teachingActivities}\n`;
          text += `Learning Activities: ${data.learningActivities}\n`;
          text += `Assessment: ${data.assessment}\n\n`;
        });
      }
      
      text += `REMARKS:\n${content.remarks || ''}\n`;
    }
    
    return text;
  };

  const content = lessonData.content;

  return (
    <div className="bg-white border border-[#E4DFD5] rounded-xl shadow-sm overflow-hidden">
      {/* Header Actions */}
      <div className="bg-[#F2EFE8] p-4 flex items-center justify-between border-b border-[#E4DFD5] no-print">
        <h3 className="font-heading font-semibold text-[#1A2E16]">Lesson Plan Preview</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-[#E4DFD5] rounded-lg text-[#4A5B46] hover:bg-[#FDFBF7] transition-colors"
            data-testid="print-btn"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-[#E4DFD5] rounded-lg text-[#4A5B46] hover:bg-[#FDFBF7] transition-colors"
            data-testid="download-btn"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#2D5A27] text-white rounded-lg hover:bg-[#21441C] transition-colors"
            data-testid="share-btn"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
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
          <span className="font-medium">Generated with MiLesson Plan AI</span>
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
