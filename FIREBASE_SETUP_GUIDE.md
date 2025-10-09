# Firebase Setup Guide for ForgeArena

Follow these steps to set up Firebase for your ForgeArena project.

## Step 1: Create a Firebase Project

1. **Go to Firebase Console**
   - Navigate to [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Add project" or "Create a project"
   - Enter a project name (e.g., "forge-arena" or "forge-arena-dev")
   - Choose whether to enable Google Analytics (optional for this prototype)
   - Click "Create project"

## Step 2: Set Up Firestore Database

1. **Enable Firestore**
   - In your Firebase project dashboard, click on "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" for now (we'll apply security rules later)
   - Select a location for your database (choose one close to your users)
   - Click "Done"

## Step 3: Register Your Web App

1. **Add Web App**
   - In your Firebase project dashboard, click the web icon (`</>`) 
   - Enter an app nickname (e.g., "ForgeArena Web App")
   - You can optionally set up Firebase Hosting later
   - Click "Register app"

2. **Copy Configuration**
   - Firebase will show you a configuration object that looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```
   - **Copy this entire configuration object** - you'll need it in the next step

## Step 4: Configure Environment Variables

1. **Create Environment File**
   - In your project, copy the example file:
   ```bash
   copy firebase.env.example client\.env
   ```
   
2. **Fill in Your Configuration**
   - Open `client\.env` in a text editor
   - Replace the placeholder values with your actual Firebase configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=AIzaSyC...
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   REACT_APP_API_URL=http://localhost:5000/api
   ```

## Step 5: Apply Firestore Security Rules

1. **Go to Firestore Rules**
   - In Firebase Console, go to "Firestore Database" → "Rules" tab

2. **Replace Default Rules**
   - Copy the contents of `firestore.rules` file from your project
   - Paste them into the Firebase Console rules editor
   - Click "Publish"

## Step 6: Initialize Sample Data (Optional)

You can manually add some sample data to test the connection:

1. **Go to Firestore Data Tab**
   - In Firebase Console, go to "Firestore Database" → "Data" tab

2. **Create Collections**
   - Create a collection called `users`
   - Add a document with ID `TestWarrior` and these fields:
   ```json
   {
     "username": "TestWarrior",
     "level": 1,
     "xp": 0,
     "strength": 10,
     "endurance": 10,
     "agility": 10,
     "gym": "Test Gym",
     "workoutStreak": 0,
     "equipment": {},
     "inventory": []
   }
   ```

3. **Create Raid Boss Collection**
   - Create a collection called `raidBoss`
   - Add a document with ID `current` and these fields:
   ```json
   {
     "name": "The Titan Squat",
     "description": "A massive boss that can only be defeated through the power of squats!",
     "totalHP": 1000,
     "currentHP": 800,
     "participants": 5
   }
   ```

## Step 7: Test Your Setup

1. **Start Your Application**
   ```bash
   npm run dev
   ```

2. **Check Console**
   - Open your browser's developer console
   - Look for "Firebase initialized successfully" message
   - If you see errors, check your environment variables

3. **Test Functionality**
   - Try logging a workout
   - Check if data persists after refreshing the page
   - If Firebase is working, data should persist; if not, it will fall back to mock data

## Step 8: Enable Authentication (Optional)

If you want to add user authentication later:

1. **Enable Authentication**
   - In Firebase Console, go to "Authentication"
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Enable "Email/Password" or other providers you want

## Troubleshooting

### Common Issues:

1. **"Firebase not initialized" error**
   - Check that your `.env` file is in the `client/` directory
   - Verify all environment variables are set correctly
   - Restart your development server after changing `.env`

2. **Permission denied errors**
   - Check that your Firestore rules are applied correctly
   - Make sure you're in "test mode" initially

3. **Data not persisting**
   - Check browser console for errors
   - Verify your Firebase project ID matches your configuration
   - The app will fall back to mock data if Firebase fails

### Getting Help:

- Check the browser console for detailed error messages
- Verify your Firebase configuration in the Firebase Console
- Make sure your Firestore database is in the same region you selected

---

Once you complete these steps, your ForgeArena app will be connected to Firebase and ready for persistent data storage!
