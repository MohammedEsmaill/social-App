# 🌐 Social App API (Express.js + MongoDB)

A RESTful API for a basic social media platform built with **Express.js**, **MongoDB**, and **JWT** authentication.  
Supports user accounts, following/unfollowing, creating posts, liking/unliking, and comments.

---

## 🌍 Live API

🟢 API is deployed on Vercel:  
👉 [https://social-app-eta-black.vercel.app](https://social-app-eta-black.vercel.app)

You can access it directly or test it using tools like Postman.

---

## 📮 API Documentation

📘 Full Postman Docs:  
👉 [https://documenter.getpostman.com/view/37641417/2sAYQfEUsG](https://documenter.getpostman.com/view/37641417/2sAYQfEUsG)

---

## 🧰 Tech Stack

- ⚙️ **Express.js** – Node.js web framework
- 🍃 **MongoDB + Mongoose** – Database
- 🔐 **JWT** – Authentication
- 🧪 **Postman** – API testing
- 📁 **Multer / Cloudinary** – for image upload (Optional)

---

## 📦 Features

- 📝 **User Authentication** (Register/Login)
- 👤 **Profile Update** and Info Retrieval
- ➕ **Create Post**
- ❤️ **Like / Unlike Post**
- 💬 **Add / Delete Comment**
- 🔁 **Follow / Unfollow Users**
- 🔐 Protected Routes using JWT
- 📄 Clean RESTful structure

---

## 🔗 Sample Endpoints

```http
POST   /api/v1/auth/register       # Create new account
POST   /api/v1/auth/login          # Login and get token

GET    /api/v1/users/profile/:id   # Get user profile
PUT    /api/v1/users/profile       # Update profile
PUT    /api/v1/users/follow/:id    # Follow another user
PUT    /api/v1/users/unfollow/:id  # Unfollow user

POST   /api/v1/posts               # Create post
GET    /api/v1/posts               # Get all posts
POST   /api/v1/posts/like/:id      # Like a post
POST   /api/v1/posts/unlike/:id    # Unlike a post
POST   /api/v1/posts/comment/:id   # Comment on post
DELETE /api/v1/posts/comment/:id   # Delete comment
