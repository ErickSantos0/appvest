import { isAIAvailable } from "./_shared.js";

export default function handler(_req, res) {
  res.status(200).json({ status: "ok", aiEnabled: isAIAvailable() });
}
