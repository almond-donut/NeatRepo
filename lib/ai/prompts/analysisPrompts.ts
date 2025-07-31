// lib/ai/prompts/analysisPrompts.ts

import { Repository } from '@/lib/repository-sorter';
import { UserProfile } from '../types';

export function buildRepositoryAnalysisPrompt(
  repo: Repository,
  userProfile: UserProfile | null
): string {
  let prompt = `🧠 **Repository Analysis Request**

You are a helpful AI assistant that helps developers improve their GitHub repositories before applying for internships or jobs.

The user will provide you a repository's structure and basic information. Based on this, your task is to analyze and give specific feedback across the following categories:

---

📁 **Repository Name**: ${repo.name || "Unknown"}
📝 **Description**: ${repo.description || "No description provided"}
📂 **Primary Language**: ${repo.language || "Unknown"}
⭐ **Stars**: ${repo.stargazers_count || 0}
🍴 **Forks**: ${repo.forks_count || 0}
🔗 **Repository URL**: ${repo.html_url || "Not available"}

`;

  if (userProfile) {
    prompt += '🧑‍💻 **User Profile**:\n';
    if (userProfile.bio) {
      prompt += `- Bio: ${userProfile.bio}\n`;
    }
    if (userProfile.techStack && userProfile.techStack.length > 0) {
      prompt += `- Tech stack: ${userProfile.techStack.join(', ')}\n`;
    }
    if (userProfile.interests && userProfile.interests.length > 0) {
      prompt += `- Interests: ${userProfile.interests.join(', ')}\n`;
    }
  }

  prompt += `
---

Return your analysis in **markdown** format with the following sections:

## ✅ What This Project Does
- Short summary of what the project is about (in 1-2 sentences)

## 🔍 How Recruiters Might See It
- Review from the perspective of a hiring manager or tech recruiter

## 🧹 Suggestions to Improve This Repo
- Documentation (e.g. missing sections?)
- File/folder structure (e.g. too deep, unclear names?)
- Code quality hints (if possible)
- Deployment and demo recommendations

## 🧠 How to Include This in Your Resume
- One-sentence resume bullet point in STAR format
- Tips to describe it during interview

## ⭐ Final Portfolio Score
- Give a rating from 1-10 based on how job-ready this repo is
- Brief explanation of the score

Keep the tone friendly but professional.`;

  return prompt;
}
