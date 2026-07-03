# PingedYet 🚀

**PingedYet** is a futuristic, highly gamified full-stack job application tracker built with React Native (Expo) and the MERN stack. Designed with a cyber-navy cosmic HUD aesthetic, it features ambient glowing bokeh orbs, floating stars, and a circular progress radar to make tracking career opportunities engaging and interactive.

---

## ✨ Features

- **Circular Orbit HUD Progress**: Gamified target tracking widget displaying concentric scanning rings (dash indicators, orbital boundaries) and a satellite core matching your progress towards a weekly logging target.
- **Interactive Outcomes Timeline**: A stylized visual tracker node system mapping candidates through recruitment stages (Applied ➔ Shortlisted ➔ Assessment ➔ Interview Attended ➔ Selected/Rejected Outcomes).
- **Ambient Bokeh Lighting**: Soft atmospheric background glows and floating cyber stars that render across all views for a cyberpunk interface depth.
- **Cross-Platform Compatibility**: Supports native mobile (iOS, Android) and responsive native Web platforms with custom platform-specific native datepickers.
- **Security Protocols**: Built-in verification blocks credentials leakages.

---

## 🛠️ Tech Stack

### Frontend (Mobile & Web)
- **Core**: React Native (Expo SDK 57)
- **Navigation**: React Navigation (Native Stack & Bottom Tabs)
- **Graphics**: Expo Linear Gradient, Vector Icons
- **Interaction**: Cursor Sparkles, Background Particle Orbs

### Backend & Database
- **Server**: Node.js, Express
- **Database**: MongoDB (Mongoose schemas)
- **Authentication**: JWT token storage & encrypted credentials verification

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)
- [Expo Go app](https://expo.dev/client) (for testing on physical mobile devices)

### 2. Installation
Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/Boomi12/PingedYet.git
cd PingedYet

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 3. Environment Variables Setup
Create a `.env` file inside the `backend` directory using `backend/.env.example` as a template:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_secret
```

### 4. Running the Project

#### Start the Backend Server:
```bash
cd backend
npm run dev
```

#### Start the React Native / Expo Frontend:
```bash
# Return to the root folder
cd ..
npm start
```
- Tap `w` to launch the native Web browser portal.
- Scan the Metro QR code with your Expo Go app to test on iOS or Android.

---

## 🔒 License
This project is licensed under the MIT License.
