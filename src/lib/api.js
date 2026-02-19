const API_URL = import.meta.env.VITE_API_URL || 'https://i-like-being-social.onrender.com/api'

class API {
  constructor() {
    this.token = localStorage.getItem('token')
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  async register(username, password, email) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    })
    this.setToken(data.token)
    return data
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    this.setToken(data.token)
    return data
  }

  async getServers() {
    return this.request('/servers')
  }

  async createServer(name, isPublic) {
    return this.request('/servers', {
      method: 'POST',
      body: JSON.stringify({ name, isPublic }),
    })
  }

  async getPublicServers() {
    return this.request('/servers/public')
  }

  async joinServer(inviteCode) {
    return this.request(`/servers/join/${inviteCode}`, {
      method: 'POST',
    })
  }

  async getChannels(serverId) {
    return this.request(`/servers/${serverId}/channels`)
  }

  async createChannel(serverId, name, type) {
    return this.request(`/servers/${serverId}/channels`, {
      method: 'POST',
      body: JSON.stringify({ name, type }),
    })
  }

  async getServerMembers(serverId) {
    return this.request(`/servers/${serverId}/members`)
  }

  async getServerRoles(serverId) {
    return this.request(`/servers/${serverId}/roles`)
  }

  async createRole(serverId, name, color, permissions) {
    return this.request(`/servers/${serverId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ name, color, permissions }),
    })
  }

  async deleteServer(serverId) {
    return this.request(`/servers/${serverId}`, {
      method: 'DELETE',
    })
  }

  async regenerateInvite(serverId) {
    return this.request(`/servers/${serverId}/regenerate-invite`, {
      method: 'POST',
    })
  }

  async getChannelMessages(channelId, limit, before) {
    const params = new URLSearchParams({ limit: limit || 50 })
    if (before) params.append('before', before)
    return this.request(`/messages/channel/${channelId}?${params}`)
  }

  async getDMMessages(dmId, limit, before) {
    const params = new URLSearchParams({ limit: limit || 50 })
    if (before) params.append('before', before)
    return this.request(`/messages/dm/${dmId}?${params}`)
  }

  async deleteMessage(messageId) {
    return this.request(`/messages/${messageId}`, {
      method: 'DELETE',
    })
  }

  async editMessage(messageId, content) {
    return this.request(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    })
  }

  async getFriends() {
    return this.request('/friends')
  }

  async getPendingRequests() {
    return this.request('/friends/pending')
  }

  async sendFriendRequest(username) {
    return this.request('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
  }

  async acceptFriend(userId) {
    return this.request(`/friends/accept/${userId}`, {
      method: 'POST',
    })
  }

  async removeFriend(userId) {
    return this.request(`/friends/${userId}`, {
      method: 'DELETE',
    })
  }

  async getDMs() {
    return this.request('/friends/dms')
  }

  async getMe() {
    return this.request('/users/me')
  }

  async updateMe(data) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async searchUsers(query) {
    return this.request(`/users/search?q=${encodeURIComponent(query)}`)
  }

  async getFolders() {
    return this.request('/users/folders')
  }

  async createFolder(name, color) {
    return this.request('/users/folders', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    })
  }

  async addServerToFolder(folderId, serverId) {
    return this.request(`/users/folders/${folderId}/servers/${serverId}`, {
      method: 'POST',
    })
  }

  async deleteFolder(folderId) {
    return this.request(`/users/folders/${folderId}`, {
      method: 'DELETE',
    })
  }

  async kickMember(serverId, userId) {
    return this.request(`/moderation/servers/${serverId}/kick/${userId}`, {
      method: 'POST',
    })
  }

  async banMember(serverId, userId, reason) {
    return this.request(`/moderation/servers/${serverId}/ban/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async unbanMember(serverId, userId) {
    return this.request(`/moderation/servers/${serverId}/ban/${userId}`, {
      method: 'DELETE',
    })
  }

  async getBans(serverId) {
    return this.request(`/moderation/servers/${serverId}/bans`)
  }

  async assignRole(serverId, userId, roleId) {
    return this.request(`/moderation/servers/${serverId}/members/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ roleId }),
    })
  }
}

export default new API()
