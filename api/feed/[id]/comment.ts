import { ApiRequest, VercelResponse, getBody, methodNotAllowed, state } from "../../_shared";

export default function handler(req: ApiRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  const body = getBody(req);
  const post = state.feed.find(item => item.id === id);

  if (!post || !body.text) {
    return res.status(404).json({ error: "Post ou conteudo nao encontrado" });
  }

  post.comments.push({
    id: `comment_${Date.now()}`,
    user: `${state.user.name.toLowerCase().replace(/\s/g, "")}.foco`,
    text: body.text
  });

  return res.json(post);
}
