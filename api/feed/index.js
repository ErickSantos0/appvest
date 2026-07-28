import { getBody, methodNotAllowed, state } from "../_shared.js";

export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json(state.feed);
  }

  if (req.method === "POST") {
    const body = getBody(req);
    const newPost = {
      id: `feed_${Date.now()}`,
      user: {
        username: `${state.user.name.toLowerCase().replace(/\s/g, "")}_studa`,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        badge: state.user.target
      },
      timeAgo: "Agora mesmo",
      content: body.content,
      category: body.category || "Geral",
      likes: 0,
      hasLiked: false,
      comments: []
    };

    if (body.hasExerciseBox && body.optA && body.optB) {
      newPost.isExercise = true;
      newPost.exerciseData = {
        subject: body.category || "Matematica",
        equation: body.content,
        options: [body.optA, body.optB, body.optC, body.optD, body.optE].filter(Boolean),
        correctAnswer: body.correctOption || "A"
      };
    }

    state.feed.unshift(newPost);
    return res.status(200).json(state.feed);
  }

  return methodNotAllowed(res);
}
