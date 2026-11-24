// netlify/functions/generate.js
// Mock video generation endpoint – returns sample videos after a short delay.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) {}

  const prompt = body.prompt || "untitled story";

  // Simulated AI-generated video list
  const videos = [
    {
      emoji: "🐉",
      gradient: "#e6dcfb,#cdb8f7",
      title: `${prompt.length > 30 ? prompt.slice(0, 30) + "…" : prompt} – Part 1`,
      duration: "11:20",
      resolution: "1080p",
    },
    {
      emoji: "🚀",
      gradient: "#d9e5fd,#b8cffa",
      title: "Mia and the Moon Rocket",
      duration: "10:45",
      resolution: "1080p",
    },
    {
      emoji: "🌙",
      gradient: "#ece4fb,#d4c4f5",
      title: "The Sleepy Star Lullaby",
      duration: "12:02",
      resolution: "1080p",
    },
    {
      emoji: "🧭",
      gradient: "#dcebfd,#c3d9fa",
      title: "Island of the Lost Compass",
      duration: "10:58",
      resolution: "1080p",
    },
  ];

  // Simulate processing time (Netlify Functions don't allow real sleep,
  // so the front-end handles the progress-bar animation independently)
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ ok: true, videos }),
  };
};
