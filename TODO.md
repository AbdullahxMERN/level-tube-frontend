# TODO Checklist: Connecting Next.js Frontend to Express Backend

Follow this step-by-step checklist to wire up the frontend routes, components, and controllers with your Express API backend.

---

## 🛠️ Step 1: Environment & CORS Configuration
Before initiating any requests, verify that the backend allows connection requests from the frontend client.

- [ ] **Configure Backend CORS**:
  Open `backend/src/app.js` and verify the `cors()` middleware allows requests from the Next.js origin (`http://localhost:3000`).
  ```javascript
  app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
  }));
  ```
- [ ] **Verify Port**:
  Verify the backend `.env` file lists `PORT=5001`. If it's running on a different port, update the `API_BASE_URL` at the top of `frontend/src/services/api.js`.
- [ ] **Database Connection**:
  Ensure your MongoDB database is running, and spin up the Express server:
  ```bash
  # Inside backend/
  npm run dev
  ```

---

## 🔐 Step 2: Authentication Flows
Verify that local session keys match the backend JSON Web Token (JWT) return structures.

- [ ] **Login Integration**:
  *   **File**: `frontend/src/context/AuthContext.jsx` -> `login()`
  *   **Verify**: Ensure the backend `/api/v1/user/login` endpoint returns a response that matches the client destructuring:
      ```javascript
      // Expected Response Payload:
      // { success: true, data: { token: "...", user: { _id, userName, fullName, avatar } } }
      ```
- [ ] **Register Integration (Multipart/Form-Data)**:
  *   **File**: `frontend/src/app/(auth)/register/page.jsx` -> `handleSubmit()`
  *   **Verify**: The register forms send a `FormData` block. Verify that the backend Multer file configuration in `backend/src/routes/user.route.js` matches the field keys:
      *   `avatar` (required profile image file)
      *   `coverImage` (optional banner image file)
      *   `fullName`, `userName`, `email`, `password` (text parameters)
- [ ] **Auto-Login Check**:
  *   **File**: `frontend/src/context/AuthContext.jsx` -> `refreshUser()`
  *   **Verify**: Ensure the backend `/api/v1/user/current-user` GET route returns the user object from the database using the token sent in the headers.

---

## 🏠 Step 3: Home Feed & Chip Filter
- [ ] **Videos List Integration**:
  *   **File**: `frontend/src/app/(main)/page.jsx`
  *   **Verify**: Ensure the backend `/api/v1/video` route is a GET that returns an array of video items:
      ```javascript
      // Each video item should match this schema:
      // { _id, title, description, thumbnail, durtion, views, createdAt, owner: { _id, userName, fullName, avatar } }
      ```
      *(Note: Check if your backend model uses the spelling `durtion` or `duration` and match it accordingly).*

---

## 🎬 Step 4: Video Details & Interactivity
- [ ] **Video Watch Page**:
  *   **File**: `frontend/src/app/(main)/watch/[videoId]/page.jsx`
  *   **Verify**: GET `/api/v1/video/:videoId` returns the matching video object.
- [ ] **Like / Dislike Toggle**:
  *   **File**: `watch/[videoId]/page.jsx` -> `handleLikeToggle()`
  *   **Verify**: POST `/api/v1/likes/toggle/v/:videoId` toggles likes correctly.
- [ ] **Subscribers Toggle**:
  *   **File**: `watch/[videoId]/page.jsx` -> `handleSubscribeToggle()`
  *   **Verify**: POST `/api/v1/subscriptions/c/:channelId` registers a subscriber relation.
- [ ] **Comments Fetch & Post**:
  *   **File**: `watch/[videoId]/page.jsx` -> `handleCommentSubmit()` & `handleCommentDelete()`
  *   **Verify**:
      *   GET `/api/v1/comments/:videoId` (Lists all comments).
      *   POST `/api/v1/comments/:videoId` (Creates new comment with `{ content }` payload).
      *   DELETE `/api/v1/comments/:commentId` (Removes the matching comment).

---

## 📊 Step 5: Studio Dashboard & File Uploads
- [ ] **Dashboard Stats Integration**:
  *   **File**: `frontend/src/app/(main)/dashboard/page.jsx`
  *   **Verify**: GET `/api/v1/dashboard/stats` returns the analytics cards data:
      ```javascript
      // Expected payload:
      // { success: true, data: { totalVideos, totalViews, totalSubscribers, totalLikes } }
      ```
- [ ] **Video Upload Integration (Multer fields)**:
  *   **File**: `dashboard/page.jsx` -> `handleUploadSubmit()`
  *   **Verify**: The upload form uses `FormData` containing the keys:
      *   `video` (The video file)
      *   `thumbnail` (The thumbnail image file)
      *   `title`, `description` (text strings)
      Confirm the Multer route parser in `backend/src/routes/video.route.js` matches these.
- [ ] **Toggle Publish Status**:
  *   **File**: `dashboard/page.jsx` -> `handleTogglePublish()`
  *   **Verify**: PATCH `/api/v1/video/toggle/publish/:videoId` changes status.
- [ ] **Delete Video**:
  *   **File**: `dashboard/page.jsx` -> `handleDeleteVideo()`
  *   **Verify**: DELETE `/api/v1/video/:videoId` cleans the video from the DB and Cloudinary.

---

## 👤 Step 6: User Profiles & Channels
- [ ] **Channel Profiling Details**:
  *   **File**: `frontend/src/app/(main)/channel/[username]/page.jsx`
  *   **Verify**: GET `/api/v1/user/c/:username` yields profile header counters (`subscribersCount`, `channelsSubscribedToCount`, `isSubscribed` flag).
- [ ] **Banner / Avatar Changes**:
  *   **File**: `channel/[username]/page.jsx` -> `handleAvatarChange()` & `handleCoverChange()`
  *   **Verify**:
      *   PATCH `/api/v1/user/avatar-change` parses field key `avatar` via Multer.
      *   PATCH `/api/v1/user/cover-image-change` parses field key `coverImage` via Multer.

---

## 📝 Step 7: Tweets timeline
- [ ] **Tweets Integration**:
  *   **File**: `frontend/src/app/(main)/tweets/page.jsx`
  *   **Verify**:
      *   GET `/api/v1/tweets/user/:userId` (Lists user's tweets) or GET `/api/v1/tweets` (Global timeline).
      *   POST `/api/v1/tweets` (Creates new tweet with `{ content }` payload).
      *   DELETE `/api/v1/tweets/:tweetId` (Removes tweet).
