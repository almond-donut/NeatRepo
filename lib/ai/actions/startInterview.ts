// lib/ai/actions/startInterview.ts

import { AIResponse, UserContext, InterviewQuestion } from '../types';

const interviewQuestions: InterviewQuestion[] = [
  {
    id: 'name_and_passion',
    question: 'Hi there! 👋 Let\'s start with the basics - what\'s your name, and what do you love most about coding? What makes you jump out of bed excited to write code?'
  },
  {
    id: 'hobbies_and_interests',
    question: 'Great! Now tell me, what do you do when you\'re not coding? Any hobbies, interests, or activities that fuel your creativity? I\'m curious about the person behind the programmer! 🎨'
  },
  {
    id: 'coding_journey',
    question: 'Love hearing about that! 🌟 Now, let\'s dive into your coding story - what sparked your journey into programming? Was there a particular moment or project that made you think "This is it, this is what I want to do"?'
  },
  {
    id: 'tech_stack_and_preferences',
    question: 'Fantastic journey! 🚀 What technologies or programming languages make you feel most at home? Are there any tools or frameworks you\'re particularly excited about or want to master?'
  },
  {
    id: 'proudest_achievement',
    question: 'Awesome choices! 💪 Looking at your repositories, which project makes you proudest? Tell me the story - what challenges did you overcome, what did you learn, and why does it mean so much to you?'
  },
  {
    id: 'problem_solving_approach',
    question: 'That\'s impressive! 🧠 Everyone has their unique approach to tackling tough problems. How do you usually approach a challenging bug or a complex feature? What\'s your problem-solving superpower?'
  },
  {
    id: 'collaboration_style',
    question: 'Smart approach! 🤝 Tell me about your collaboration style - do you prefer pair programming, code reviews, leading teams, or working solo? What brings out your best work in a team environment?'
  },
  {
    id: 'future_dreams',
    question: 'Perfect! 🌈 Finally, let\'s talk dreams and aspirations - where do you see yourself in the next few years? What kind of impact do you hope to make through your code? Any wild ideas or projects you\'d love to tackle?'
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
  const progress = (1 / interviewQuestions.length) * 100;

  return {
    message: `🎉 Welcome to your Personal README Interview! 

This quick interview will help me create a personalized README that showcases not just your code, but YOU as a developer and person.

We'll go through ${interviewQuestions.length} fun questions that should take about 5-10 minutes. Ready? Let's dive in!

**Question 1 of ${interviewQuestions.length}:**
${firstQuestion.question}`,
    success: true,
    data: { 
      interviewState: newInterviewState,
      interviewActive: true,
      progress: progress
    },
  };
}
