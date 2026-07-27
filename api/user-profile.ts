import { ApiRequest, VercelResponse, getBody, methodNotAllowed, state, updateUser } from "./_shared";

export default function handler(req: ApiRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.json(state.user);
  }

  if (req.method === "POST") {
    return res.json(updateUser(getBody(req)));
  }

  return methodNotAllowed(res);
}
