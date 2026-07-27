import { ApiRequest, VercelResponse, methodNotAllowed, state } from "../../_shared";

export default function handler(req: ApiRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  const post = state.feed.find(item => item.id === id);

  if (!post) {
    return res.status(404).json({ error: "Post nao encontrado" });
  }

  post.hasLiked = !post.hasLiked;
  post.likes += post.hasLiked ? 1 : -1;
  return res.json(post);
}
