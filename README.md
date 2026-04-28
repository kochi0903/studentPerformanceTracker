# Student Performance Tracker

Live Coding Bootcamp Management for instructors to track and rate student performance.

## Prerequisites
- Node.js 18+
- Firebase Account

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Firebase Setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Google Sign-In)
3. Enable Firestore Database
4. Deploy the security rules from `firebase/security.rules`
5. Create a `.env.local` file in the root directory based on `.env.example` (or use the following variables):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Development

Run the development server:
```bash
npm run dev
```

## Build

Build for production:
```bash
npm run build
```

## Security Rules Deployment

To deploy security rules using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```
