const express = require("express");
const postsRouter = express.Router();

const { requireUser } = require("./utils");

const {
  createPost,
  getAllPosts,
  updatePost,
  getPostById,
  deletePost,
} = require("../db");

postsRouter.get("/", async (req, res, next) => {
  try {
    const allPosts = await getAllPosts();

    const posts = allPosts.filter((post) => {
      // the post is active, doesn't matter who it belongs to
      if (post.active) {
        return true;
      }

      // the post is not active, but it belogs to the current user
      if (req.user && post.author.id === req.user.id) {
        return true;
      }

      // none of the above are true
      return false;
    });

    res.send({
      posts,
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// Did this.
postsRouter.get("/:postid", async (req, res, next) => {
  try {
    const postId = req.params.postid;
    const post = await getPostById(postId);

    if (!post.active) {
      console.log("test1");
      throw new error("test");
    } else if (req.user && post.author.id !== req.user.id) {
      console.log("test2wwww");
      throw new Error("test");
    }

    res.send(post);
  } catch (error) {
    next(error);
  }
});

postsRouter.post("/", requireUser, async (req, res, next) => {
  const { title, content = "", tags } = req.body;

  const postData = {};

  try {
    postData.authorId = req.user.id;
    postData.title = title;
    postData.content = content;
    postData.tags = tags;

    const post = await createPost(postData);

    if (post) {
      res.send(post);
    } else {
      next({
        name: "PostCreationError",
        message: "There was an error creating your post. Please try again.",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.patch("/:postId", requireUser, async (req, res, next) => {
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  const updateFields = {};

  if (tags && tags.length > 0) {
    updateFields.tags = tags.trim().split(/\s+/);
  }

  if (title) {
    updateFields.title = title;
  }

  if (content) {
    updateFields.content = content;
  }

  try {
    const originalPost = await getPostById(postId);

    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updateFields);
      res.send({ post: updatedPost });
    } else {
      next({
        name: "UnauthorizedUserError",
        message: "You cannot update a post that is not yours",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.delete("/:postId", requireUser, async (req, res, next) => {
  const postId = req.params.postId;

  const post = await getPostById(postId);

  //I tried using this piece of code inside the getPostById funtion but it was causing the server to crash to i moved it here.
  if (!post) {
    next({
      name: "PostNotFoundError",
      message: "Post does not exist.",
    });
  }

  try {
    if (post.author.id === req.user.id) {
      await deletePost(postId);

      res.send({ status: "Success", message: "Post was deleted successfully" });
    } else {
      next({
        name: "UnauthorizedUserError",
        message: "You cannot delete a post that is not yours",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = postsRouter;
