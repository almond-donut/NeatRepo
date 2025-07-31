// lib/ai/actions/handleInterviewAnswer.ts

import { AIResponse, UserContext, InterviewState } from '../types';

/**
 * Generates a personalized README from the interview answers.
 */
function generatePersonalReadme(answers: Record<string, string>, repositories: any[]): string {
  let readme = `# Hello, I'm `;
  
  // Extract name from the first answer
  const nameMatch = answers.name_and_passion?.match(/(?:I'm|I am|My name is|Call me)\s+([A-Za-z]+)/i);
  const name = nameMatch ? nameMatch[1] : 'a Developer';
  
  readme += `${name}! 👋\n\n`;
  
  // Add a dynamic intro based on their passion
  if (answers.name_and_passion) {
    const passionText = answers.name_and_passion.replace(/(?:I'm|I am|My name is|Call me)\s+[A-Za-z]+[,.]?\s*/i, '');
    readme += `## � What Drives Me\n\n${passionText}\n\n`;
  }
  
  // Add hobbies section
  if (answers.hobbies_and_interests) {
    readme += `## 🎯 Beyond the Code\n\nWhen I'm not crafting solutions in code, you'll find me ${answers.hobbies_and_interests.toLowerCase()}. I believe these experiences make me a more creative and well-rounded developer!\n\n`;
  }
  
  // Add coding journey
  if (answers.coding_journey) {
    readme += `## 🚀 My Coding Journey\n\n${answers.coding_journey}\n\n`;
  }

  // Add tech stack
  if (answers.tech_stack_and_preferences) {
    readme += `## 🛠️ My Tech Arsenal\n\n${answers.tech_stack_and_preferences}\n\n`;
  }

  // Add featured project
  if (answers.proudest_achievement) {
    readme += `## 🏆 Project I'm Most Proud Of\n\n${answers.proudest_achievement}\n\n`;
  }

  // Add problem solving approach
  if (answers.problem_solving_approach) {
    readme += `## 🧠 How I Tackle Challenges\n\n${answers.problem_solving_approach}\n\n`;
  }

  // Add collaboration style
  if (answers.collaboration_style) {
    readme += `## 🤝 Working Together\n\n${answers.collaboration_style}\n\n`;
  }

  // Add repository showcase
  if (repositories && repositories.length > 0) {
    readme += `## 📈 Featured Repositories\n\n`;
    const topRepos = repositories.slice(0, 6);
    topRepos.forEach(repo => {
      const stars = repo.stargazers_count > 0 ? ` ⭐ ${repo.stargazers_count}` : '';
      readme += `- **[${repo.name}](${repo.html_url})**${stars} - ${repo.description || 'A showcase of my development skills'}\n`;
    });
    readme += `\n`;
  }

  // Add future aspirations
  if (answers.future_dreams) {
    readme += `## 🌟 Future Aspirations\n\n${answers.future_dreams}\n\n`;
  }

  // Add contact footer
  readme += `## 📬 Let's Connect!\n\n`;
  readme += `I'm always excited to collaborate on interesting projects or discuss new opportunities. Feel free to reach out!\n\n`;
  
  // Add GitHub stats
  readme += `---\n\n`;
  readme += `### 📊 GitHub Stats\n\n`;
  readme += `![GitHub Stats](https://github-readme-stats.vercel.app/api?username=YOUR_USERNAME&show_icons=true&theme=radical)\n\n`;
  readme += `![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=YOUR_USERNAME&layout=compact&theme=radical)\n\n`;
  
  readme += `*This personalized README was crafted through an AI-powered interview with NeatRepo - showcasing not just my code, but who I am as a developer and person.* ✨`;

  return readme;
}


/**
 * Handles a user's answer during a portfolio interview.
 */
export async function handleInterviewAnswer(
  context: UserContext,
  params: { answer: string }
): Promise<AIResponse> {
  const { interviewState } = context;
  const { answer } = params;

  if (!interviewState || !interviewState.isActive) {
    return {
      message: "There's no interview currently active. Say 'start interview' to begin.",
      success: false,
    };
  }

  // Create a new state object to avoid direct mutation
  const newInterviewState: InterviewState = JSON.parse(JSON.stringify(interviewState));

  // Store the answer
  const currentQuestionId = newInterviewState.questions[newInterviewState.currentQuestion].id;
  newInterviewState.answers[currentQuestionId] = answer;

  // Move to the next question
  newInterviewState.currentQuestion++;

  // Check if the interview is complete
  if (newInterviewState.currentQuestion >= newInterviewState.questions.length) {
    newInterviewState.isActive = false;
    const personalReadme = generatePersonalReadme(newInterviewState.answers, context.repositories);
    
    return {
      message: `🎉 Interview Complete! I've generated your personalized README based on our conversation:

---

${personalReadme}`,
      success: true,
      data: { 
        interviewState: newInterviewState,
        portfolioReadme: personalReadme,
        interviewActive: false,
        progress: 100
      },
    };
  }

  // Ask the next question
  const nextQuestion = newInterviewState.questions[newInterviewState.currentQuestion];
  const progress = ((newInterviewState.currentQuestion + 1) / newInterviewState.questions.length) * 100;
  const questionNumber = newInterviewState.currentQuestion + 1;
  const totalQuestions = newInterviewState.questions.length;
  
  // Generate encouraging transition messages
  const encouragements = [
    "Thanks for sharing that! 😊",
    "Great insight! 🌟", 
    "Love hearing about that! 💫",
    "Awesome response! 🚀",
    "Fantastic! 🎯",
    "Really appreciate that perspective! ✨",
    "That's so interesting! 🤔"
  ];
  
  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
  
  return {
    message: `${randomEncouragement}

**Question ${questionNumber} of ${totalQuestions}:**
${nextQuestion.question}`,
    success: true,
    data: { 
      interviewState: newInterviewState,
      interviewActive: true,
      progress: progress
    },
  };
}
