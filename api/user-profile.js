import { getBody, methodNotAllowed, state, updateUser } from "./_shared.js";

export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json(state.user);
  }

  if (req.method === "POST") {
    return res.status(200).json(updateUser(getBody(req)));
  }

  return methodNotAllowed(res);
}
