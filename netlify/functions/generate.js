// netlify/functions/generate.js
// Uses Pollinations.ai (free, no API key) to generate real AI stories

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) {}
  const prompt = (body.prompt || "magical adventure").slice(0, 300);

  const gradients = ["#e6dcfb,#cdb8f7", "#d9e5fd,#b8cffa", "#ece4fb,#d4c4f5", "#dcebfd,#c3d9fa"];
  const emojis = ["🐉", "🚀", "🌙", "🧭"];
  const durations = ["11:20", "10:45", "12:02", "10:58"];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a creative children's story writer producing content for animated YouTube videos. Always respond with valid JSON only, no markdown code blocks."
          },
          {
            role: "user",
            content: `Create 4 animated story video concepts based on this idea: "${prompt}".

Return exactly this JSON structure:
{
  "videos": [
    {
      "title": "Catchy story title (max 7 words)",
      "scenes": [
        {
          "narration": "Engaging narration for this scene, 2-3 sentences, suitable for children aged 5-12.",
          "imagePrompt": "Vivid image description for AI art generation: style, colors, characters, setting, mood. Include 'children book illustration style, vibrant colors, fantasy art'."
        }
      ]
    }
  ]
}

Rules:
- 4 videos total, each with exactly 3 scenes
- Narration should flow naturally when read aloud
- Image prompts should be detailed and visual
- Titles should be exciting and unique`
          }
        ],
        model: "openai",
        jsonMode: true,
        seed: Math.floor(Math.random() * 9999)
      })
    });

    clearTimeout(timeout);
    const text = await res.text();

    let data;
    try { data = JSON.parse(text); } catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) data = JSON.parse(match[0]);
      else throw new Error("No valid JSON in response");
    }

    if (!data || !Array.isArray(data.videos)) throw new Error("Invalid structure");

    const videos = data.videos.slice(0, 4).map((v, i) => ({
      title: v.title || `Story ${i + 1}`,
      emoji: emojis[i],
      gradient: gradients[i],
      duration: durations[i],
      scenes: (v.scenes || []).slice(0, 3)
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ok: true, videos })
    };

  } catch (err) {
    console.error("Pollinations error:", err.message);

    // Intelligent fallback using the user's prompt
    const p = prompt.length > 30 ? prompt.slice(0, 30) + "…" : prompt;
    const fallback = [
      {
        title: `${p} – A Magical Beginning`,
        emoji: "🐉", gradient: gradients[0], duration: durations[0],
        scenes: [
          { narration: `Once upon a time, in a world filled with wonder and magic, a brave young hero set off on an incredible journey inspired by ${prompt}. The land was alive with colors and sounds beyond imagination.`, imagePrompt: `magical fantasy landscape inspired by ${prompt}, golden sunlight, lush forests, children book illustration style, vibrant colors, fantasy art, 4k` },
          { narration: "Along the way, they discovered hidden powers they never knew they had. With every challenge, they grew stronger and wiser.", imagePrompt: `young hero discovering magical powers, glowing hands, colorful fantasy world, children book illustration style, vibrant colors, wonder and excitement` },
          { narration: "And so the adventure truly began, with endless possibilities stretching out before them like a road to the stars.", imagePrompt: `hero standing at crossroads, magical paths, starry sky, fantasy landscape, children book illustration style, inspiring, vibrant colors` }
        ]
      },
      {
        title: `${p} – The Great Challenge`,
        emoji: "🚀", gradient: gradients[1], duration: durations[1],
        scenes: [
          { narration: "A tremendous challenge stood before our hero, greater than anything they had ever faced before. But fear was not an option.", imagePrompt: `epic challenge scene, brave young hero facing obstacle, dramatic lighting, children book illustration style, vibrant fantasy art` },
          { narration: "With the help of loyal friends and a heart full of courage, they tackled the challenge head on.", imagePrompt: `friends working together, teamwork, colorful fantasy world, children book illustration style, warm colors, friendship` },
          { narration: "Victory was sweet, and the whole land celebrated the triumph of bravery and friendship over all odds.", imagePrompt: `victory celebration, magical fireworks, happy characters, fantasy world, children book illustration style, colorful, joyful` }
        ]
      },
      {
        title: `${p} – The Hidden Secret`,
        emoji: "🌙", gradient: gradients[2], duration: durations[2],
        scenes: [
          { narration: "Hidden deep within an ancient forest was a secret that had been kept for a thousand years, waiting for just the right hero.", imagePrompt: `mysterious ancient forest, glowing secrets, ancient ruins, children book illustration style, magical, moody, vibrant fantasy art` },
          { narration: "When the hero uncovered the secret, the entire world transformed in the most beautiful and unexpected way.", imagePrompt: `magical transformation, world changing, glowing light, wonder, children book illustration style, vibrant colors, fantasy art` },
          { narration: "The secret gift was shared with everyone, bringing joy, peace, and endless magic to the land forever.", imagePrompt: `magical gift being shared, happy community, glowing magic, children book illustration style, warm colors, wholesome` }
        ]
      },
      {
        title: `${p} – The Happy Ending`,
        emoji: "🧭", gradient: gradients[3], duration: durations[3],
        scenes: [
          { narration: "As the journey neared its end, every memory, every struggle, and every laugh came together like the pages of a perfect story.", imagePrompt: `journey's end, beautiful sunset, hero looking back at memories, children book illustration style, warm golden tones, fantasy art` },
          { narration: "Friends held hands and hearts, knowing that whatever came next, they would face it together and always find a way.", imagePrompt: `friends together, holding hands, beautiful landscape, children book illustration style, warm colors, heartwarming` },
          { narration: "And they all lived happily ever after, in a world where kindness is magic, and every story is worth telling.", imagePrompt: `happily ever after, magical world, colorful celebration, children book illustration style, vibrant colors, joyful, fantasy` }
        ]
      }
    ];

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ok: true, videos: fallback, fallback: true })
    };
  }
};
