---
type: "always_apply"
---

CRITICAL DEBUGGING AND IMPLEMENTATION RULES:

1. **NO SUMMARY-ONLY RESPONSES**: Never provide analysis or explanations without implementing actual fixes. If you identify an issue, you MUST implement the solution.

2. **MANDATORY DEBUGGING PROCESS**: When encountering any problem, you MUST follow this exact sequence:
   - Use `sequentialthinking_Sequential_thinking` to analyze the root cause thoroughly
   - Use `codebase-retrieval` to gather all relevant code context and implementation details
   - Implement the fix using `str-replace-editor` 
   - Push changes to GitHub using git commands
   - Wait exactly 5 minutes for Vercel deployment, then wait another 5 minutes for safety
   - Test the fix using browser automation to verify it works

3. **DEPLOYMENT AND TESTING CYCLE**: After every code change:
   - Commit and push to GitHub immediately
   - Wait 10 minutes total (5 + 5) for Vercel auto-deployment
   - Test the live application at https://neatrepo.vercel.app using browser tools
   - If the fix doesn't work, repeat the entire debugging cycle

4. **NO SHORTCUTS**: Do not skip any step in the debugging process. Do not assume fixes work without testing them on the live deployment.

5. **ITERATIVE APPROACH**: If the first fix attempt fails, immediately start the cycle again: debug → implement → push → wait → test → repeat until resolved.

This applies to all technical issues, especially OAuth authentication, database connectivity, and UI state synchronization problems.
