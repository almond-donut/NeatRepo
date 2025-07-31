// lib/ai/actions/startInterview.ts

import { AIResponse, UserContext, InterviewQuestion } from '../types';

const interviewQuestions: InterviewQuestion[] = [
  {
    id: 'passion',
    question: 'To start, what are you most passionate about in technology? What gets you excited to build things?'
  },
  {
    id: 'journey',
    question: 'Tell me a bit about your journey. What first got you into coding and development?'
  },
  {
    id: 'proudest_project',
    question: 'Looking at your repositories, which project are you most proud of and why? Tell me the story behind it.'
  },
  {
    id: 'biggest_challenge',
    question: 'What has been the biggest challenge you\'ve faced on a project, and how did you overcome it?'
  },
  {
    id: 'future_goals',
    question: 'Finally, what are your future goals? What kind of impact do you hope to make as a developer?'
  }
];

/**
 * Handles starting a new portfolio interview.
 */
export async function handleStartInterview(
  context: UserContext,
  params: {}
): Promise<AIResponse> {
  
  // Initialize the interview state
  const newInterviewState = {
    isActive: true,
    currentQuestion: 0,
    questions: interviewQuestions,
    answers: {},
  };

  const firstQuestion = interviewQuestions[0];

  return {
    message: `Let's begin your portfolio interview! Here is your first question:\n\n${firstQuestion.question}`,
    success: true,
    data: { interviewState: newInterviewState }, // Return the new state so the UI can update
  };
}
