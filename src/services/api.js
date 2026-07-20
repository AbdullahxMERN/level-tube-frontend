/**
 * Clean API Service Client for connecting the Next.js frontend to the Express backend.
 * Base URL: http://localhost:5001/api/v1
 *
 * Direct API connection without any mock databases or dummy fallbacks.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api/v1";
// Local storage keys
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "currentUser";

// Safe localStorage helpers
const getStoredToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
const setStoredToken = (token) =>
  typeof window !== "undefined" &&
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
const getStoredUser = () =>
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem(USER_KEY) || "null")
    : null;
const setStoredUser = (user) =>
  typeof window !== "undefined" &&
  localStorage.setItem(USER_KEY, JSON.stringify(user));
const clearStorage = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

async function request(endpoint, options = {}, isRetry = false) {
  const token = getStoredToken();
  const headers = { ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    if (options.body) options.body = JSON.stringify(options.body);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (
    response.status === 401 &&
    !isRetry &&
    endpoint !== "/user/refresh-token"
  ) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return request(endpoint, options, true);
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }
  return data;
}

async function tryRefreshToken() {
  try {
    const res = await fetch(`${API_BASE_URL}/user/refresh-token`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      setStoredToken(data.data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ==========================================
// CORE API CLIENT EXPORTS
// ==========================================
export const api = {
  // Auth & Profile
  auth: {
    login: (usernameOrEmail, password) =>
      request("/user/login", {
        method: "POST",
        body: { email: usernameOrEmail, userName: usernameOrEmail, password },
      }).then((res) => {
        if (res.success && res.data.accessToken) {
          setStoredToken(res.data.accessToken);
          setStoredUser(res.data.user);
        }
        return res;
      }),
    register: (formData) =>
      request("/user/register", { method: "POST", body: formData }).then(
        (res) => {
          if (res.success && res.data?.accessToken) {
            setStoredToken(res.data.accessToken);
            setStoredUser(res.data.user);
          }
          return res;
        },
      ),

    logout: () =>
      request("/user/logout", { method: "POST" }).then((res) => {
        clearStorage();
        return res;
      }),

    getCurrentUser: () => request("/user/current-user"),

    updateProfile: (fullName, email) =>
      request("/user/account-details", {
        method: "PATCH",
        body: { fullName, email },
      }),

    changePassword: (oldPassword, newPassword) =>
      request("/user/change-password", {
        method: "POST",
        body: { oldPassword, newPassword },
      }),

    changeAvatar: (file) => {
      const fd = new FormData();
      fd.append("avatar", file);
      return request("/user/avatar-change", { method: "PATCH", body: fd });
    },

    changeCoverImage: (file) => {
      const fd = new FormData();
      fd.append("coverImage", file);
      return request("/user/cover-image-change", { method: "PATCH", body: fd });
    },

    getChannelDetails: (username) => request(`/user/c/${username}`),

    getWatchHistory: () => request("/user/history"),
  },

  // Videos
  videos: {
    getAll: (params = {}) => {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.append("query", params.query);
      if (params.userId) queryParams.append("userId", params.userId);
      const queryString = queryParams.toString();
      return request(`/video/${queryString ? "?" + queryString : ""}`);
    },

    getById: (id) => request(`/video/${id}`),

    upload: (title, description, videoFile, thumbnailFile) => {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("video", videoFile);
      fd.append("thumbnail", thumbnailFile);
      return request("/video/upload", { method: "POST", body: fd });
    },

    update: (id, title, description, thumbnailFile) => {
      const fd = new FormData();
      if (title) fd.append("title", title);
      if (description) fd.append("description", description);
      if (thumbnailFile) fd.append("thumbnail", thumbnailFile);
      return request(`/video/${id}`, { method: "PATCH", body: fd });
    },

    delete: (id) => request(`/video/${id}`, { method: "DELETE" }),

    togglePublish: (id) =>
      request(`/video/toggle/publish/${id}`, { method: "PATCH" }),
  },

  // Comments
  comments: {
    getByVideo: (videoId) => request(`/comments/${videoId}`),

    add: (videoId, content) =>
      request(`/comments/${videoId}`, { method: "POST", body: { content } }),

    delete: (commentId) =>
      request(`/comments/${commentId}`, { method: "DELETE" }),
  },

  // Tweets
  tweets: {
    getAll: () => request("/tweets"),

    getUserTweets: (userId) => request(`/tweets/user/${userId}`),

    create: (content) =>
      request("/tweets", { method: "POST", body: { content } }),

    delete: (id) => request(`/tweets/${id}`, { method: "DELETE" }),
  },

  // Likes
  likes: {
    toggleVideo: (videoId) =>
      request(`/likes/toggle/v/${videoId}`, { method: "POST" }),

    toggleComment: (commentId) =>
      request(`/likes/toggle/c/${commentId}`, { method: "POST" }),

    toggleTweet: (tweetId) =>
      request(`/likes/toggle/t/${tweetId}`, { method: "POST" }),

    getLikedVideos: () => request("/likes/videos"),
  },

  // Subscriptions
  subscriptions: {
    toggle: (channelId) =>
      request(`/subscriptions/c/${channelId}`, { method: "POST" }),

    getSubscribers: (channelId) => request(`/subscriptions/u/${channelId}`),

    getSubscribedChannels: (subscriberId) =>
      request(`/subscriptions/subscribed/${subscriberId}`),
  },
  // Playlists
  playlists: {
    create: (name, description) =>
      request("/playlist", { method: "POST", body: { name, description } }),

    getById: (id) => request(`/playlist/${id}`),

    getUserPlaylists: (userId) => request(`/playlist/user/${userId}`),

    addVideo: (playlistId, videoId) =>
      request(`/playlist/add/${videoId}/${playlistId}`, { method: "PATCH" }),

    removeVideo: (playlistId, videoId) =>
      request(`/playlist/remove/${videoId}/${playlistId}`, { method: "PATCH" }),
  },

  // Dashboard
  dashboard: {
    getStats: () => request("/dashboard/stats"),

    getVideos: () => request("/dashboard/videos"),
  },

  // Authentication helpers
  getUser: getStoredUser,
  getToken: getStoredToken,
};
