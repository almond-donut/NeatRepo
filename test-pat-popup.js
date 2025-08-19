// PAT Popup Test Script
// Run this in browser console to test the PAT popup fix

console.log('🧪 PAT POPUP TEST SCRIPT');

// Function to clear all PAT-related localStorage
function clearPATStorage() {
  const keys = Object.keys(localStorage);
  const patKeys = keys.filter(key => 
    key.includes('token_popup_dismissed_') || 
    key.includes('token_popup_skipped_permanently_')
  );
  
  console.log('🧹 Clearing PAT localStorage keys:', patKeys);
  patKeys.forEach(key => localStorage.removeItem(key));
  
  console.log('✅ PAT localStorage cleared');
}

// Function to check current PAT storage state
function checkPATStorage() {
  const keys = Object.keys(localStorage);
  const patKeys = keys.filter(key => 
    key.includes('token_popup_dismissed_') || 
    key.includes('token_popup_skipped_permanently_')
  );
  
  console.log('🔍 Current PAT localStorage state:');
  patKeys.forEach(key => {
    console.log(`  ${key}: ${localStorage.getItem(key)}`);
  });
  
  if (patKeys.length === 0) {
    console.log('  No PAT localStorage keys found');
  }
}

// Function to simulate fresh user test
function simulateFreshUser() {
  console.log('🆕 Simulating fresh user test...');
  clearPATStorage();
  console.log('✅ Ready for fresh user test - refresh page and login with new GitHub account');
}

// Export functions to global scope for easy testing
window.clearPATStorage = clearPATStorage;
window.checkPATStorage = checkPATStorage;
window.simulateFreshUser = simulateFreshUser;

console.log('🎯 Available test functions:');
console.log('  clearPATStorage() - Clear all PAT localStorage');
console.log('  checkPATStorage() - Check current PAT localStorage state');
console.log('  simulateFreshUser() - Clear storage and prepare for fresh user test');

// Run initial check
checkPATStorage();