# Empathy Buddy Foundation Layer

## Overview
A backend-only foundation for an anonymous voice expression sharing platform where users can upload voice recordings and listen to others' expressions anonymously.

## Application Structure

### Onboarding Screen
- Initial screen displayed when the application opens
- Contains a simple language selection dropdown or buttons for user preference (frontend-only selection, no backend persistence)
- Displays brief placeholder text explaining the empathy ritual concept
- Includes a continue button that navigates to the Home screen

### Home Screen
- Central navigation hub with one main question: "Do you want to express or listen?"
- Contains three navigation buttons:
  - **Express**: Navigate to the existing ExpressTab component with full audio recording functionality
  - **Listen**: Navigate to the existing ListenTab component with full audio playback and response functionality  
  - **Archive**: Navigate to archive view
- Serves as the main routing point for all application flows

### Express Screen
- Uses the existing ExpressTab component with all original audio recording, playback, upload, and moderation behavior preserved
- Displays gentle guidance message before recording (placeholder text)
- Maintains all existing functionality including recording controls, preview playback, upload process, and moderation feedback
- Requires selecting one empathy request (framed as requests to the listener) before submission:
  1. **Presence** – "I don't need words. I just want to be heard and held in presence."
  2. **Reflection** – "Please reflect back what you hear I'm feeling, without advice or fixing."
  3. **Needs Guessing** – "Please help me identify the needs behind what I'm expressing."
- Returns user to Home screen after successful submission
- Includes navigation back to Home screen

### Listen Screen  
- Uses the existing ListenTab component with all original audio assignment, playback, and response functionality preserved
- When an expression is assigned, displays:
  - The empathy request type with corresponding guidance text shown before playback
  - The expressor's recorded audio for playback via existing audio player
- Enforces empathy rules based on the expressor's request:
  1. **Presence**: Shows guidance text "Your role is to listen fully and offer presence, without words." After full playback completion, shows one button labeled "I listened with presence" that completes the ritual and returns to Home
  2. **Reflection**: Shows guidance text "Reflect back what you hear the person is feeling, without advice or fixing." After full playback completion, displays the existing voice response recording interface; submission returns to Home
  3. **Needs Guessing**: Shows guidance text "Gently guess the needs you hear behind what was expressed, using tentative language." After full playback completion, displays the existing voice response recording interface; submission returns to Home
- Requires full audio playback completion before any response controls become active
- Maintains all existing backend connectivity and audio handling
- Includes navigation back to Home screen
- **Playback Limit Rules**:
  - Each assigned expression can be played at most three times
  - Playback count is tracked on the frontend only (no backend persistence)
  - Listen count increments only after successful, full playback completion
  - After the third completed playback, disable further playback gracefully
  - Display message after third completed playback: "You've listened fully. Take a moment, then respond in the way that was requested."
  - Response option remains available after the first completed playback
- **Audio Loading and Error Handling**:
  - Audio element is initially assumed playable when the Listen view loads
  - No error or limit message should appear until a user initiates playback and an actual playback failure occurs
  - Genuine audio-loading failures display an error message only after playback failure detection
  - Audio blob URLs must remain persistent and accessible for all subsequent playbacks within the three-play limit
  - Audio must never revert to "Unable to load audio" state after a successful playback

### Archive Screen
- Placeholder view for stored expressions and responses
- Includes navigation back to Home screen

### Navigation Flow
- Application opens to Onboarding screen
- Onboarding screen navigates to Home screen
- Home screen provides navigation to Express, Listen, and Archive sections
- Express and Listen screens connect to their respective existing functional components
- Each section can return to Home screen via back navigation

## Core Entities

### AnonymousUser
- Minimal session tracking entity without persistent identity or profile data
- Used for temporary association with expressions and responses during a session

### Expression
- Represents an uploaded voice recording from a user
- Contains audio blob reference, processing status, moderation status, empathy request type, and timestamps
- Status can be: pending, assigned, completed, or rejected
- Moderation status can be: unchecked, safe, or unsafe
- Empathy request type can be: Presence, Reflection, or Needs Guessing
- **Critical**: The `audioBlobId` field must be preserved across all status updates and assignment operations
- **Critical**: Audio blob metadata including duration and format must be maintained consistently throughout the expression lifecycle

### Response
- Represents a listener's audio reply to an assigned expression
- Links to the original expression and contains audio blob reference with timestamps

## Audio Storage
- Backend must handle blob storage for discrete short audio recordings
- Audio uploads are limited to 60 seconds maximum duration
- System must support upload and retrieval of audio files
- **Critical**: Audio blob references must remain valid and accessible for playback throughout the entire expression lifecycle
- **Critical**: Blob URLs must be consistently generated and maintained for both preview and playback operations

## Assignment Logic
- Backend implements refined random assignment of unlistened, safe expressions to listeners
- Assignment logic must prefer expressions not created by the current caller
- If no expressions from other users exist, allow assignment of the caller's own expression for testing purposes
- Each expression can only be assigned once to prevent duplicate assignments
- Once assigned, expressions are marked as "assigned" to prevent reassignment
- System tracks association between listeners and assigned expressions for response submission
- Returns neutral state or null when no eligible expressions are available for assignment
- **Critical Fix**: Assignment operations must preserve the original `audioBlobId` and all audio metadata when updating expression status from pending to assigned
- **Critical Fix**: All status update operations must carry forward the existing `audioBlobId` field and audio metadata to prevent data loss
- **Critical Fix**: Self-fallback logic must return expressions with the same complete data structure including valid `audioBlobId` references and playable audio metadata
- **Critical Fix**: Both normal and self-fallback assignments must return identical audio data structures with valid, playable blob URLs

## Moderation System
- Basic safety check performed on all uploaded recordings
- Unsafe recordings are marked as "rejected" and require re-recording
- Safe recordings proceed to normal flow and are marked as "safe"
- Moderation status determines if expressions can be assigned to listeners

## Backend Operations
- Store and retrieve expressions with their metadata including empathy request type
- Store and retrieve responses linked to expressions
- Manage audio blob upload and retrieval with consistent blob URL generation
- Handle refined expression assignment to anonymous users with caller preference logic
- Process moderation checks on uploaded content
- Track expression status throughout the workflow
- **Critical Fix**: Ensure all expression update operations preserve the `audioBlobId` field and audio metadata when modifying other properties
- **Critical Fix**: Assignment function must verify and return expressions with valid, playable `audioBlobId` references and consistent audio metadata
- **Critical Fix**: Status transitions (pending → assigned → completed) must maintain audio blob reference integrity and metadata consistency
- **Critical Fix**: Audio blob handling must ensure the same blob captured during recording is preserved through preview, upload, and backend storage without re-encoding or data loss

## Data Persistence
- All expressions, responses, and their associated metadata must be stored in the backend
- Audio files are stored as blobs with references maintained in the entities
- Session associations between anonymous users and their assigned expressions
- Empathy request selection must be stored with each expression
- **Critical Fix**: Audio blob references must remain intact and accessible throughout the expression lifecycle
- **Critical Fix**: Audio metadata including duration, format, and blob URLs must be consistently maintained across all operations

## Frontend Audio Flow Requirements
- **Express Flow**: Recorded audio blob must be preserved and playable immediately after recording for preview functionality
- **Express Flow**: The same audio blob used for preview must be uploaded to backend without re-encoding or data loss
- **Listen Flow**: Assigned expressions must return valid and playable `audioBlobId` with proper blob URL references
- **Listen Flow**: Playback must use proper blob URLs and display accurate duration and timing information
- **Listen Flow**: Audio must maintain loaded state after successful playback and never revert to error states
- **Listen Flow**: Playback count tracking must be maintained in frontend state only (no backend persistence required)
- **Listen Flow Audio State Management**: 
  - Audio element is initially assumed playable when the Listen view loads
  - No error or limit message should appear until user initiates playback and actual failure occurs
  - Listen count increments only after successful, full playback completion
  - Three-playback limit message and playback disable occurs only after third completed playback
  - Genuine audio-loading failures display error message only after playback failure detection
- **Consistency**: Both normal and self-fallback assignments must return identical audio data structures with valid blob URLs
- **Audio Continuity**: The same audio blob must maintain continuity throughout the full flow from capture to preview to upload to backend assignment and final playback

## UI Requirements
- All action buttons must have black text on pure white backgrounds with visible shadows for contrast against white surroundings
- The "Start Recording" button and all similar primary action buttons must use black text on pure white background with visible shadow styling
- Button disabled states must use light gray text with subtle borders while maintaining visibility against white backgrounds
- Button text must maintain clear contrast ratios following WCAG AA accessibility standards
- Buttons must have consistent styling across all components including ExpressTab, ListenTab, and AudioRecorder
- Button styles must include consistent padding, rounded corners, and hover/focus states using Tailwind classes
- All action buttons including "Start Recording," "Stop," "Play," and other controls must follow the black text on white background styling consistently to prevent white-on-white visibility issues
- All buttons must remain visible and accessible in both light and dark themes
- Application content language is English

## Component Integration Requirements
- Replace placeholder Express page with existing ExpressTab component functionality
- Replace placeholder Listen page with existing ListenTab component functionality
- Preserve all existing audio recording, playback, upload, and moderation behavior in both components
- Maintain all existing backend connectivity and API interactions
- Ensure proper navigation integration between Home screen and functional components
- Do not modify or refactor any existing audio system logic or backend connectivity
