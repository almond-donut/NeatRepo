#!/usr/bin/env node

const { Octokit } = require("@octokit/rest");
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join('=');
        }
      }
    }
  } catch (error) {
    console.error('Error reading .env.local:', error.message);
  }
}

loadEnvFile();

async function checkTokenPermissions() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error('❌ GITHUB_TOKEN not found in .env.local');
    process.exit(1);
  }

  console.log('🔍 Checking GitHub token permissions...');
  console.log('📝 Token:', token.substring(0, 10) + '...');

  const octokit = new Octokit({
    auth: token,
  });

  try {
    // 1. Check authenticated user
    console.log('\n1️⃣ Checking authenticated user...');
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}`);
    console.log(`📧 Email: ${user.email || 'Not public'}`);
    console.log(`🔗 Profile: ${user.html_url}`);

    // 2. Check token scopes
    console.log('\n2️⃣ Checking token scopes...');
    const response = await octokit.request('HEAD /');
    const scopes = response.headers['x-oauth-scopes'];
    console.log(`🔐 Token scopes: ${scopes || 'No scopes found'}`);

    // 3. Check if we can list repositories
    console.log('\n3️⃣ Checking repository access...');
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 5,
      sort: 'updated'
    });
    console.log(`📚 Found ${repos.length} repositories (showing first 5)`);
    
    repos.forEach((repo, index) => {
      console.log(`   ${index + 1}. ${repo.name} (${repo.private ? 'private' : 'public'})`);
      console.log(`      Permissions: admin=${repo.permissions?.admin}, push=${repo.permissions?.push}, pull=${repo.permissions?.pull}`);
    });

    // 4. Check specific repository permissions for pengetesan-delete
    console.log('\n4️⃣ Checking specific repository: pengetesan-delete...');
    try {
      const { data: repo } = await octokit.rest.repos.get({
        owner: user.login,
        repo: 'pengetesan-delete'
      });
      console.log(`✅ Repository found: ${repo.full_name}`);
      console.log(`🔐 Permissions: admin=${repo.permissions?.admin}, push=${repo.permissions?.push}, pull=${repo.permissions?.pull}`);
      
      if (repo.permissions?.admin) {
        console.log('✅ You have ADMIN access - can delete repository');
      } else {
        console.log('❌ You do NOT have ADMIN access - cannot delete repository');
      }
    } catch (error) {
      if (error.status === 404) {
        console.log('❌ Repository "pengetesan-delete" not found');
        console.log('   Possible reasons:');
        console.log('   - Repository does not exist');
        console.log('   - Repository name is incorrect');
        console.log('   - You do not have access to this repository');
      } else {
        console.log(`❌ Error checking repository: ${error.message}`);
      }
    }

    // 5. List all repositories to find the correct name
    console.log('\n5️⃣ Listing all repositories to find correct names...');
    const { data: allRepos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated'
    });
    
    console.log(`📚 Total repositories: ${allRepos.length}`);
    console.log('🔍 Looking for repositories with "delete" or "test" in name:');
    
    const testRepos = allRepos.filter(repo => 
      repo.name.toLowerCase().includes('delete') || 
      repo.name.toLowerCase().includes('test') ||
      repo.name.toLowerCase().includes('pengetesan')
    );
    
    if (testRepos.length > 0) {
      testRepos.forEach(repo => {
        console.log(`   📁 ${repo.name} (${repo.private ? 'private' : 'public'})`);
        console.log(`      Admin: ${repo.permissions?.admin ? '✅' : '❌'}`);
        console.log(`      Full name: ${repo.full_name}`);
      });
    } else {
      console.log('   No repositories found with "delete", "test", or "pengetesan" in name');
    }

  } catch (error) {
    console.error('❌ Error checking token permissions:', error.message);
    if (error.status === 401) {
      console.error('🔐 Token is invalid or expired');
    } else if (error.status === 403) {
      console.error('🚫 Token does not have sufficient permissions');
    }
  }
}

checkTokenPermissions().catch(console.error);
