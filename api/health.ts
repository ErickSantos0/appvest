import { ApiRequest, VercelResponse, isAIAvailable } from "./_shared";

export default function handler(_req: ApiRequest, res: VercelResponse) {
  res.json({ status: "ok", aiEnabled: isAIAvailable() });
}
