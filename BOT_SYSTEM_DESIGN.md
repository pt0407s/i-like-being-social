# 🤖 Bot System Architecture Design

## Overview

This document outlines the architecture for implementing a Discord-like bot system that allows users to create and code their own bots.

## Database Schema (Already Added)

```sql
-- Users table already has bot support
CREATE TABLE users (
  is_bot BOOLEAN DEFAULT 0,
  bot_owner_id INTEGER,
  -- ... other fields
);

-- Bot tokens and metadata
CREATE TABLE bots (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,  -- Links to users table
  token_hash TEXT NOT NULL,   -- Hashed bot token
  permissions INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Bot Creation Flow

### 1. User Creates a Bot

```javascript
// POST /api/bots
{
  "name": "MyBot",
  "description": "A helpful bot"
}

// Response
{
  "bot": {
    "id": 123,
    "user_id": 456,  // Bot account ID
    "name": "MyBot",
    "token": "BOT_abc123xyz..."  // ONLY shown once!
  }
}
```

**Backend Process:**
1. Create a new user account with `is_bot = 1`
2. Generate a secure random token
3. Hash and store the token
4. Return the bot details with the **unhashed token** (only shown once)
5. User must save this token to use their bot

### 2. Bot Authentication

Bots authenticate differently than users:

```javascript
// Regular user auth
Authorization: Bearer <JWT_TOKEN>

// Bot auth
Authorization: Bot <BOT_TOKEN>
```

**Middleware:**
```javascript
export function authenticateBotToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  const type = authHeader && authHeader.split(' ')[0]

  if (type === 'Bot') {
    // Verify bot token
    const tokenHash = hashToken(token)
    const bot = db.prepare('SELECT * FROM bots WHERE token_hash = ?').get(tokenHash)
    
    if (!bot) {
      return res.status(401).json({ error: 'Invalid bot token' })
    }
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(bot.user_id)
    req.user = user
    req.isBot = true
    next()
  } else {
    // Regular JWT auth
    authenticateToken(req, res, next)
  }
}
```

### 3. Adding Bot to Server

**OAuth2-like Flow:**

```
https://yourapp.com/oauth/authorize?
  client_id=BOT_USER_ID&
  permissions=8&
  scope=bot
```

User clicks "Authorize" → Bot added to server

**Or Simple Invite Code:**
- Server owner generates bot invite link
- Bot automatically joins when link is used

### 4. Bot API Endpoints

```javascript
// Get bot info
GET /api/bots/:botId

// Regenerate token (invalidates old one)
POST /api/bots/:botId/regenerate

// Delete bot
DELETE /api/bots/:botId

// Get bot's servers
GET /api/bots/:botId/servers
```

## Bot Gateway (WebSocket)

Bots connect to a separate WebSocket namespace to receive events:

```javascript
// Bot connects
const socket = io('https://yourapp.com/bot', {
  auth: { token: 'BOT_abc123xyz...' }
})

// Bot receives events
socket.on('MESSAGE_CREATE', (message) => {
  console.log('New message:', message)
})

socket.on('MEMBER_JOIN', (member) => {
  console.log('New member:', member)
})

socket.on('CHANNEL_CREATE', (channel) => {
  console.log('New channel:', channel)
})
```

### Event Types

- `MESSAGE_CREATE` - New message sent
- `MESSAGE_UPDATE` - Message edited
- `MESSAGE_DELETE` - Message deleted
- `MEMBER_JOIN` - User joined server
- `MEMBER_LEAVE` - User left server
- `MEMBER_UPDATE` - Member role changed
- `CHANNEL_CREATE` - Channel created
- `CHANNEL_UPDATE` - Channel updated
- `CHANNEL_DELETE` - Channel deleted
- `ROLE_CREATE` - Role created
- `ROLE_UPDATE` - Role updated
- `ROLE_DELETE` - Role deleted

## Bot Permissions System

Permissions are stored as bit flags:

```javascript
const Permissions = {
  READ_MESSAGES: 1 << 0,      // 1
  SEND_MESSAGES: 1 << 1,      // 2
  MANAGE_MESSAGES: 1 << 2,    // 4
  EMBED_LINKS: 1 << 3,        // 8
  ATTACH_FILES: 1 << 4,       // 16
  MENTION_EVERYONE: 1 << 5,   // 32
  MANAGE_CHANNELS: 1 << 6,    // 64
  MANAGE_ROLES: 1 << 7,       // 128
  KICK_MEMBERS: 1 << 8,       // 256
  BAN_MEMBERS: 1 << 9,        // 512
  ADMINISTRATOR: 1 << 10      // 1024
}

// Check if bot has permission
function hasPermission(botPermissions, permission) {
  return (botPermissions & permission) === permission
}

// Grant permission
botPermissions |= Permissions.SEND_MESSAGES

// Revoke permission
botPermissions &= ~Permissions.SEND_MESSAGES
```

## Example Bot Code (For Users)

### Simple Bot Library

```javascript
// bot-client.js
class BotClient {
  constructor(token) {
    this.token = token
    this.socket = null
    this.handlers = new Map()
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event).push(handler)
  }

  async login() {
    this.socket = io('https://yourapp.com/bot', {
      auth: { token: this.token }
    })

    this.socket.on('connect', () => {
      console.log('Bot connected!')
    })

    // Forward all events to handlers
    this.socket.onAny((event, data) => {
      const handlers = this.handlers.get(event) || []
      handlers.forEach(handler => handler(data))
    })
  }

  async sendMessage(channelId, content) {
    return fetch('https://yourapp.com/api/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ channelId, content })
    })
  }

  async deleteMessage(messageId) {
    return fetch(`https://yourapp.com/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bot ${this.token}`
      }
    })
  }

  async kickMember(serverId, userId) {
    return fetch(`https://yourapp.com/api/moderation/servers/${serverId}/kick/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${this.token}`
      }
    })
  }
}

module.exports = BotClient
```

### Example Bot Usage

```javascript
const BotClient = require('./bot-client')

const bot = new BotClient('BOT_abc123xyz...')

// Respond to !ping command
bot.on('MESSAGE_CREATE', async (message) => {
  if (message.content === '!ping') {
    await bot.sendMessage(message.channel_id, 'Pong! 🏓')
  }
})

// Welcome new members
bot.on('MEMBER_JOIN', async (member) => {
  const welcomeChannel = '123'  // General channel ID
  await bot.sendMessage(
    welcomeChannel,
    `Welcome to the server, ${member.username}! 👋`
  )
})

// Auto-moderate spam
bot.on('MESSAGE_CREATE', async (message) => {
  if (message.content.includes('spam')) {
    await bot.deleteMessage(message.id)
    await bot.sendMessage(
      message.channel_id,
      `${message.username}, please don't spam!`
    )
  }
})

// Start the bot
bot.login()
```

## Implementation Steps

### Phase 1: Basic Bot Support
1. ✅ Add bot tables to database
2. Create bot creation endpoint
3. Implement bot token authentication
4. Add bot badge to UI

### Phase 2: Bot Gateway
1. Create separate Socket.io namespace for bots
2. Implement event system
3. Send events to connected bots
4. Add heartbeat/reconnection logic

### Phase 3: Bot Permissions
1. Implement permission bit flags
2. Add permission checks to API endpoints
3. Create permission management UI
4. Add role-based bot permissions

### Phase 4: Bot Library & Documentation
1. Create JavaScript bot client library
2. Write comprehensive documentation
3. Create example bots
4. Add bot developer portal

### Phase 5: Advanced Features
1. Bot analytics (message count, uptime)
2. Bot verification system
3. Bot marketplace/discovery
4. Webhook support

## Security Considerations

1. **Token Security:**
   - Never log bot tokens
   - Hash tokens before storing
   - Only show token once during creation
   - Implement token regeneration

2. **Rate Limiting:**
   - Limit bot API requests (e.g., 50/min)
   - Separate limits for bots vs users
   - Prevent bot spam

3. **Permission Checks:**
   - Always verify bot has required permissions
   - Check server membership before actions
   - Prevent privilege escalation

4. **Abuse Prevention:**
   - Monitor bot behavior
   - Automatic ban for malicious bots
   - Report system for bot abuse

## Bot API Endpoints Summary

```
POST   /api/bots                          Create bot
GET    /api/bots/:id                      Get bot info
POST   /api/bots/:id/regenerate           Regenerate token
DELETE /api/bots/:id                      Delete bot
GET    /api/bots/:id/servers               Get bot's servers

POST   /api/bots/:id/join/:serverId       Add bot to server
DELETE /api/bots/:id/leave/:serverId      Remove bot from server

GET    /api/bots/:id/permissions          Get bot permissions
PUT    /api/bots/:id/permissions          Update bot permissions
```

## Next Steps

To fully implement the bot system:

1. Create the bot routes file (`server/routes/bots.js`)
2. Implement bot authentication middleware
3. Set up bot WebSocket namespace
4. Create event emitter system
5. Build bot client library
6. Write documentation and examples

This architecture provides a solid foundation for a Discord-like bot system that users can code and customize!
