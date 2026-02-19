# 🚀 I Like Being Social - Full-Stack Discord Clone

A complete, feature-rich Discord clone designed for school use with **easy redeployment** if blocked. Built with modern web technologies and a proper backend for full functionality.

## ✨ Features

### 🔐 Authentication & Users
- User registration and login with JWT authentication
- Secure password hashing with bcrypt
- User profiles with status (online/offline/away/dnd)
- Custom status messages
- User search functionality

### 💬 Servers & Channels
- Create unlimited servers (public or private)
- Server invite codes with regeneration
- Multiple text channels per server
- Channel creation and management
- Server discovery for public servers
- Server member list with roles
- Server ownership and permissions

### 👥 Friends & Direct Messages
- Send and accept friend requests
- Friend list with online/offline status
- Direct messaging with friends
- DM history and persistence
- Pending friend requests view

### 🎨 Roles & Permissions
- Create custom roles with colors
- Role-based permissions system
- Role hierarchy and positioning
- Member role assignment

### 💬 Messaging Features
- Real-time messaging with Socket.io
- Message editing and deletion
- "User is typing..." indicators
- Emoji picker integration
- Message timestamps
- Edited message indicators
- Infinite scroll message history

### 🎯 Additional Features
- Server folders for organization
- Public server discovery
- Member sidebar with online status
- Beautiful Discord-like UI
- Responsive design
- Real-time updates across all clients

## 🔧 Technology Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Socket.io Client** - Real-time communication
- **Emoji Mart** - Emoji picker
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.io** - Real-time WebSocket server
- **Better-SQLite3** - Fast, embedded database
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing

## 🌐 Why This Architecture?

This app uses a **traditional backend** instead of a decentralized solution because:
- Proper authentication and user management
- Role-based permissions and security
- Message persistence and history
- Server ownership and moderation
- Friend system with privacy
- Easy to redeploy on free hosting platforms

## 📦 Installation & Setup

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/i-like-being-social.git
cd i-like-being-social
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```
Edit `.env` and change the `JWT_SECRET` to a secure random string.

4. **Run in development:**
```bash
npm run dev
```
This starts both the backend (port 3001) and frontend (port 5173).

5. **Access the app:**
Open http://localhost:5173 in your browser.

## 🚀 Deployment

Since this app requires a backend, you need to deploy both the frontend and backend. Here are the best free options:

### Option 1: Render.com (Recommended)

1. **Create a Render account** at https://render.com

2. **Deploy the backend:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Build Command:** `npm install`
     - **Start Command:** `node server/index.js`
     - **Environment Variables:**
       - `JWT_SECRET`: (generate a random string)
       - `CLIENT_URL`: (your frontend URL, e.g., https://yourapp.onrender.com)
   - Click "Create Web Service"

3. **Deploy the frontend:**
   - Click "New" → "Static Site"
   - Connect your GitHub repository
   - Settings:
     - **Build Command:** `npm install && npm run build`
     - **Publish Directory:** `dist`
     - **Environment Variables:**
       - `VITE_API_URL`: (your backend URL + /api, e.g., https://yourapi.onrender.com/api)
   - Click "Create Static Site"

### Option 2: Railway.app

1. **Create a Railway account** at https://railway.app

2. **Deploy:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect and deploy both services
   - Add environment variables in the dashboard

### Option 3: Vercel (Frontend) + Render (Backend)

1. **Deploy backend on Render** (see Option 1)
2. **Deploy frontend on Vercel:**
   - Connect GitHub repo
   - Add `VITE_API_URL` environment variable
   - Deploy

### Environment Variables

**Backend (.env):**
```
PORT=3001
JWT_SECRET=your-super-secret-key-change-this
CLIENT_URL=https://your-frontend-url.com
```

**Frontend (Vite):**
```
VITE_API_URL=https://your-backend-url.com/api
```

## 🔄 Redeploying If Blocked

If your site gets blocked at school:

1. **Fork the repository** with a new name
2. **Deploy to a different platform:**
   - If on Render, deploy to Railway
   - If on Railway, deploy to Render
   - Use Vercel, Netlify, or Fly.io
3. **Update environment variables** with new URLs
4. **Share the new URL** with your friends

**Important:** The database is stored in the backend's SQLite file. To migrate data:
- Download the `server/database/chat.db` file from your old deployment
- Upload it to your new deployment

Alternatively, start fresh - users just need to re-register.

## 🎨 Customization

### Change Discord Colors

Edit `tailwind.config.js`:
```js
colors: {
  discord: {
    dark: '#202225',
    darker: '#2f3136',
    darkest: '#36393f',
    blurple: '#5865F2',  // Change this!
    green: '#3ba55d',
    // ...
  }
}
```

### Add Default Channels

When a server is created, default channels are added in `server/routes/servers.js`:
```js
db.prepare('INSERT INTO channels (server_id, name, position) VALUES (?, ?, ?)').run(serverId, 'general', 0)
db.prepare('INSERT INTO channels (server_id, name, position) VALUES (?, ?, ?)').run(serverId, 'random', 1)
// Add more default channels here
```

### Modify Permissions

Edit the permissions system in `server/routes/servers.js` to add custom permission levels.

## 🛡️ Privacy & Security

- Passwords are hashed with bcrypt (never stored in plain text)
- JWT tokens for secure authentication
- Server-based permissions and access control
- Private servers require invite codes
- DMs are only visible to participants
- Message deletion and editing for your own messages
- SQLite database with proper data isolation

**Important:** This is a learning project. For production use:
- Use HTTPS (SSL/TLS)
- Add rate limiting
- Implement CAPTCHA for registration
- Add email verification
- Use PostgreSQL instead of SQLite for scalability
- Add content moderation
- Implement proper backup systems

## 📱 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with WebSocket support

## 🐛 Troubleshooting

**"Cannot connect to server"**
- Check if backend is running on port 3001
- Verify `VITE_API_URL` environment variable
- Check CORS settings in `server/index.js`

**"Database locked" error**
- SQLite doesn't support multiple writers well
- For production, migrate to PostgreSQL

**Messages not appearing**
- Check browser console for errors
- Verify Socket.io connection
- Check if you're in the correct channel

## 🤝 Contributing

Feel free to fork and customize! Some ideas:
- Voice channels
- Video calls
- File uploads
- Rich text formatting
- Message reactions
- Server templates
- User blocking
- Moderation tools

## 📄 License

MIT License - free to use and modify.

## ⚠️ Disclaimer

This is an educational project. Use responsibly and follow your school's policies. The developers are not responsible for misuse.
