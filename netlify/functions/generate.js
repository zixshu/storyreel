// netlify/functions/generate.js
// Uses Pollinations.ai free text API to generate full creative story scripts and image prompts

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) {}
  const prompt = (body.prompt || "a magical adventure").slice(0, 300);

  const gradients = ["#e6dcfb,#cdb8f7", "#d9e5fd,#b8cffa", "#ece4fb,#d4c4f5", "#dcebfd,#c3d9fa"];
  const defaultEmojis = ["🐉", "🚀", "🌙", "🧭"];
  const durations = ["1:30", "1:15", "1:45", "1:20"];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are an award-winning children's story animator and scriptwriter. You must always return pure JSON without markdown backticks or commentary."
          },
          {
            role: "user",
            content: `Write 4 distinct, engaging story videos based on: "${prompt}".

Return strictly this JSON:
{
  "videos": [
    {
      "title": "Short exciting title",
      "emoji": "emoji",
      "scenes": [
        {
          "narration": "First scene narration sentence. Clear, dramatic and friendly.",
          "imagePrompt": "Detailed visual description for digital concept art, storybook style, 4k, vibrant"
        },
        {
          "narration": "Second scene narration sentence advancing the adventure.",
          "imagePrompt": "Detailed visual description of action or discovery, storybook style, 4k"
        },
        {
          "narration": "Third scene conclusion sentence with a satisfying ending.",
          "imagePrompt": "Detailed visual description of the joyful celebration or peaceful resolution, storybook style"
        }
      ]
    }
  ]
}`
          }
        ],
        model: "openai",
        jsonMode: true,
        seed: Math.floor(Math.random() * 99999)
      })
    });

    clearTimeout(timeout);
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) data = JSON.parse(match[0]);
      else throw new Error("Could not parse JSON: " + text.slice(0, 100));
    }

    if (!data || !Array.isArray(data.videos) || data.videos.length === 0) {
      throw new Error("Invalid videos array");
    }

    const videos = data.videos.slice(0, 4).map((v, i) => ({
      title: v.title || `Adventure ${i + 1}`,
      emoji: v.emoji || defaultEmojis[i % defaultEmojis.length],
      gradient: gradients[i % gradients.length],
      duration: durations[i % durations.length],
      scenes: (v.scenes && v.scenes.length >= 2 ? v.scenes.slice(0, 3) : [
        { narration: `Once upon a time, an incredible tale began around ${prompt}.`, imagePrompt: `${prompt}, colorful digital concept art, storybook, cinematic lighting` },
        { narration: `Through brave challenges and magic, great surprises unfolded across the journey.`, imagePrompt: `magical scene of discovery for ${prompt}, luminous colors, fairytale art` },
        { narration: `In the end, peace and wonder returned, leaving a legend never forgotten.`, imagePrompt: `peaceful celebration, beautiful landscape, storybook art` }
      ])
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ok: true, videos })
    };

  } catch (err) {
    console.error("AI Generation error:", err.message);

    // Prompt-aware fallback
    const p = prompt.slice(0, 40);
    const fallbackVideos = [
      {
        title: `${p}: The Journey Begins`,
        emoji: "🐉", gradient: gradients[0], duration: durations[0],
        scenes: [
          { narration: `Deep in an enchanted kingdom, a wondrous adventure began with ${prompt}.`, imagePrompt: `${prompt}, magical fairytale landscape, vibrant children book illustration, glowing lights, 4k` },
          { narration: `With courage in heart and friends by their side, they ventured into the uncharted lands of mystery.`, imagePrompt: `brave explorer venturing into mystical glowing forest, fantasy art, cinematic lighting` },
          { narration: `A great secret was revealed, bringing magic and joy to everyone across the land.`, imagePrompt: `radiant magical celebration, golden light, joyful fantasy world, children book art` }
        ]
      },
      {
        title: `${p}: Secrets of the Stars`,
        emoji: "🚀", gradient: gradients[1], duration: durations[1],
        scenes: [
          { narration: `High above the clouds, starlight whispered a legend inspired by ${prompt}.`, imagePrompt: `cosmic fantasy sky, glowing stars, dreamy storybook style, vibrant purple and blue` },
          { narration: `Together they navigated through starry constellations and sparkling cosmic wonders.`, imagePrompt: `traveling through magical space nebulas, glowing ships, fantasy digital art` },
          { narration: `They returned with celestial stardust that illuminated their home forever.`, imagePrompt: `peaceful planet with warm glowing lanterns and starry sky, storybook art` }
        ]
      },
      {
        title: `${p}: The Hidden Treasure`,
        emoji: "🧭", gradient: gradients[2], duration: durations[2],
        scenes: [
          { narration: `An ancient map pointed straight toward the legendary mystery of ${prompt}.`, imagePrompt: `ancient treasure map on wooden table with magical compass, warm golden lighting` },
          { narration: `Through crystal caves and hidden waterfalls, each clue unlocked another door.`, imagePrompt: `magnificent crystal cave with glowing turquoise water, fantasy adventure illustration` },
          { narration: `The greatest treasure discovered was not gold, but the bond of true friendship.`, imagePrompt: `friends celebrating with glowing magical artifact, happy, warm colors, storybook art` }
        ]
      },
      {
        title: `${p}: The Midnight Dream`,
        emoji: "🌙", gradient: gradients[3], duration: durations[3],
        scenes: [
          { narration: `When the silver moon rose into the velvet sky, the magic of ${prompt} awakened.`, imagePrompt: `peaceful night landscape, giant glowing moon, fairy lights, fantasy children illustration` },
          { narration: `Dreamy clouds guided the sleepy travellers through soft rivers of gentle starlight.`, imagePrompt: `floating boat on starlight river through clouds, ethereal, calming fantasy art` },
          { narration: `And as the morning dawn peeked over the hills, all was warm, peaceful and bright.`, imagePrompt: `sunrise over beautiful fantasy meadows, warm pastel colors, peaceful, fairytale ending` }
        ]
      }
    ];

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ok: true, videos: fallbackVideos, fallback: true })
    };
  }
};
