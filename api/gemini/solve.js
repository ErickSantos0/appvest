import { buildSolveFallback, generateText, getBody, isAIAvailable, methodNotAllowed } from "../_shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const { exerciseContext } = getBody(req);

  try {
    if (!isAIAvailable()) {
      return res.status(200).json({ text: buildSolveFallback(exerciseContext) });
    }

    const prompt = `Resolva a questao de vestibular abaixo em portugues, com Markdown.
Inclua: Analise inicial, Resolucao passo a passo, Gabarito e Dica do Tutor.

Questao:
${exerciseContext}`;

    const text = await generateText(prompt, false, 0.3);
    return res.status(200).json({ text });
  } catch {
    return res.status(200).json({ text: buildSolveFallback(exerciseContext) });
  }
}
