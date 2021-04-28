import Post from "./Post";
import { createGraph } from "./graph";

async function createPost(post: Post) {
  const { dc, g } = createGraph();
  await g
    .addV("posts")
    .property("title", post.title)
    .property("content", post.content)
    .next();
  dc.close();
  return post;
}
export default createPost;
