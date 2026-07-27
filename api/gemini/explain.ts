import { ApiRequest, VercelResponse, buildExplainFallback, generateText, getBody, isAIAvailable, methodNotAllowed } from "../_shared";

export default async function handler(req: ApiRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const { subject, concept, userMessage } = getBody(req);

  try {
    if (!isAIAvailable()) {
      return res.json({ text: buildExplainFallback(subject, concept, userMessage) });
    }

    const prompt = `Voce e o VestibularTutor, uma IA especialista em ENEM e vestibulares brasileiros.
Explique em portugues, com clareza e foco pratico:
Materia: ${subject || "Vestibular Geral"}
Topico: ${concept || "Duvida do aluno"}
Pergunta: ${userMessage || "Explique o conteudo"}

Formato:
1. Explicacao conceitual
2. Como cai no vestibular
3. Exemplo pratico resolvido
4. Macete de bolso
5. Recursos ou formas de estudar`;

    const text = await generateText(prompt, false, 0.7);
    return res.json({ text });
  } catch {
    return res.json({ text: buildExplainFallback(subject, concept, userMessage) });
  }
}
