# Changelog

All notable changes to NeatRepo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 🎯 **AI Interview Progress Bar Feature** - Complete 6-question interview flow for generating personalized portfolio READMEs
  - Real-time progress tracking (0% to 100%)
  - State persistence across page refreshes
  - Full conversation history maintained
  - Download functionality for generated README
  - Professional formatting with sections for personal intro, tech journey, goals, and projects
  - Proper UI state management between interview mode and normal mode

### Fixed
- 🔒 **CRITICAL: OAuth Session Mixing Bug** - Fixed users being logged into wrong accounts during multi-user testing
  - Added session validation in auth state changes to detect user ID mismatches
  - Implemented complete localStorage/sessionStorage cleanup during sign-out
  - Enhanced middleware session validation with user property checks
  - Removed problematic cookie domain configuration for Vercel deployment
  - Added comprehensive logging for session integrity monitoring
  - **SECURITY IMPACT**: Prevents cross-user data contamination and unauthorized account access
- 🎭 **Personality Mode Persistence Bug** - Fixed critic mode automatically reverting to nice mode after inactivity
  - Added localStorage persistence for personality mode state
  - Loads saved personality mode on component mount
  - Saves personality mode whenever it changes
  - Professional state management like major web applications
- 🔧 **OAuth Error URL Cleanup Bug** - Fixed OAuth error parameters persisting in URL after browser refresh
  - Added automatic URL cleanup on page load
  - Removes error, error_code, and error_description parameters
  - Uses window.history.replaceState() for clean URL management
  - Professional OAuth error handling similar to Facebook/Google authentication flows
- 🔧 **JSX Syntax Errors** - Removed commented AuthGuard tags that were breaking builds
- 🎤 **Interview Start Flow** - Fixed parsing logic to properly recognize "start interview" commands
- 📊 **Progress Bar Display** - Added useEffect to sync interview UI state from localStorage on page load
- 🔄 **Interview State Management** - Improved state synchronization between localStorage and UI components

### Technical Improvements
- Enhanced AI parsing logic with proper fallback handling
- Improved interview state persistence and recovery
- Better error handling for interview flow edge cases
- Optimized progress calculation and display
- **Professional State Management** - Enterprise-grade localStorage persistence with error handling
- **Clean URL Management** - Automatic OAuth error parameter cleanup for better UX
- **Session Resilience** - User preferences persist across long inactivity periods

## [Previous Releases]

### Core Features (Production Ready)
- 🔄 **Multi-Account GitHub Management** - Facebook/Google-style account switching for work/hobby accounts
- 🔐 **Flexible Authentication** - Support for both OAuth and Personal Access Tokens
- 📊 **Repository Management** - View, sort, and manage repositories with bulk operations
- 🗑️ **Bulk Delete Functionality** - Delete multiple repositories with confirmation dialogs
- 🎨 **Personality Modes** - Different UI personalities for enhanced user experience
- 🔄 **Auto-refresh Dashboard** - Real-time updates of repository data
- ⚡ **Performance Optimizations** - Sub-2-second loading with intelligent caching
- 🌙 **Dark/Light Theme** - Complete theme switching support
- 📱 **Responsive Design** - Mobile-friendly interface
- 🔒 **Row Level Security** - Secure multi-user data access with Supabase RLS

### Authentication & Security
- OAuth integration with GitHub
- Personal Access Token support with secure storage
- Session management with manual signout
- Token validation and permission checking
- Secure profile management across multiple accounts

### User Experience
- Intuitive repository browsing without requiring PAT
- Warning system for limited functionality without authentication
- Drag-and-drop repository reordering
- Advanced sorting and filtering options
- Real-time status updates and notifications

### Infrastructure
- Vercel deployment with automatic builds
- Supabase backend with PostgreSQL
- TypeScript for type safety
- Next.js 14 with App Router
- Tailwind CSS for styling
- Comprehensive error handling and logging

---

## Development Notes

### Recent Development Focus
- ✅ AI interview feature implementation and testing
- ✅ Progress bar functionality and state management
- ✅ Build system stability and error resolution
- ✅ User experience improvements for interview flow

### Known Issues
- AI interview context retention could be improved for better conversation flow

### Recently Fixed Issues ✅
- ~~OAuth session mixing between users~~ - **RESOLVED** with comprehensive session validation and cleanup
- ~~Personality mode reset after inactivity~~ - **RESOLVED** with localStorage persistence
- ~~OAuth error parameters persisting in URL after refresh~~ - **RESOLVED** with automatic URL cleanup

### Next Priorities
- Enhanced AI conversation context and memory
- Additional portfolio README templates and customization options
- Performance optimizations for large repository collections

---

*Last Updated: January 27, 2025*
