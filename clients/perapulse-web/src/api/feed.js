import { getJson, postJson, deleteJson } from "./http-client";

export const feedApi = {
  // Posts
  getPosts: (page = 0, size = 20) =>
    getJson(`/api/posts?page=${page}&size=${size}`),

  getPost: (postId) => getJson(`/api/posts/${postId}`),

  createPost: (data) => postJson("/api/posts", data),

  deletePost: (postId) => deleteJson(`/api/posts/${postId}`),

  // Comments
  getComments: (postId) => getJson(`/api/posts/${postId}/comments`),

  addComment: (postId, text) =>
    postJson(`/api/posts/${postId}/comments`, { text }),

  // Likes
  likePost: (postId) => postJson(`/api/posts/${postId}/likes`),

  unlikePost: (postId) => deleteJson(`/api/posts/${postId}/likes`),
};
