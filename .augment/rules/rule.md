---
type: "always_apply"
---

After implementing and pushing the fix, verify that the solution is working correctly by following this validation process:

1. **Push changes and wait for deployment**: Commit and push your code changes to GitHub, then wait exactly 10 minutes (5 minutes for Vercel deployment + 5 minutes safety buffer) for the deployment to complete.

2. **Test the live application**: Navigate to https://neatrepo.vercel.app/dashboard using browser automation and perform a hard refresh (Ctrl+F5 or equivalent) to bypass any caching issues.

3. **Verify the fix worked**: Check that:
   - The dashboard header no longer shows "No account" and instead displays the authenticated user information
   - The repository count shows the actual number of repositories (not 0) for the authenticated GitHub user
   - The loading state resolves properly without getting stuck in "Getting ready..." or "Loading..." indefinitely

4. **If validation fails**: If either the header still shows "No account" OR the repository count remains at 0, then the task has failed. In this case:
   - Immediately restart the debugging cycle: analyze → implement → push → wait → test → repeat
   - Use sequential thinking to identify the root cause of the remaining authentication or repository fetching issues
   - Continue iterating until both the authentication state AND repository display are working correctly

5. **Success criteria**: The fix is only considered complete when BOTH conditions are met:
   - User authentication is properly displayed in the header
   - Actual repository data is loaded and displayed (non-zero count for users with repositories)

Never implement temporary workarounds, patches, or band-aid solutions. This is a production-ready web application that will serve many users, so all fixes must be:

1. **Production-grade**: Implement proper, permanent solutions that address root causes rather than symptoms
2. **Scalable**: Solutions must work reliably under load with multiple concurrent users
3. **Maintainable**: Code should be clean, well-documented, and follow established patterns
4. **Robust**: Include proper error handling, validation, and edge case management
5. **Security-conscious**: Follow security best practices and never compromise user data or system integrity

When debugging issues like the OAuth authentication flow or repository display problems, identify and fix the underlying architectural or logic problems rather than adding timeouts, bypasses, or temporary patches. The goal is to create a stable, professional application that users can depend on.

CRITICAL DEBUGGING AND IMPLEMENTATION RULES:

1. **NO SUMMARY-ONLY RESPONSES**: Never provide analysis or explanations without implementing actual fixes. If you identify an issue, you MUST implement the solution.

make sure you push it first, you often forgot

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
