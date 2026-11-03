
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        backend: "My AI Studio"
      });
    }

    if (url.pathname === "/api/generate-image") {
      if (request.method !== "POST") {
        return Response.json(
          { error: "POST so'rovi kerak" },
          { status: 405 }
        );
      }

      if (!env.FAL_KEY) {
        return Response.json(
          { error: "FAL_KEY sozlanmagan" },
          { status: 500 }
        );
      }

      try {
        const body = await request.json();
        const prompt = body.prompt;

        if (typeof prompt !== "string" ||
            !prompt.trim() ||
            prompt.length > 1500) {
          return Response.json(
            { error: "Prompt noto'g'ri" },
            { status: 400 }
          );
        }

        const sizes = {
          "1:1": "square",
          "16:9": "landscape_16_9",
          "9:16": "portrait_16_9"
        };

        const response = await fetch(
          "https://fal.run/fal-ai/flux/schnell",
          {
            method: "POST",
            headers: {
              "Authorization": `Key ${env.FAL_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              prompt: prompt.trim(),
              image_size: sizes[body.ratio] || "square",
              num_images: 1,
              enable_safety_checker: true
            })
          }
        );

        if (!response.ok) {
          return Response.json(
            { error: "AI xizmatida xatolik", status: response.status },
            { status: 502 }
          );
        }

        const data = await response.json();
        const imageUrl = data.images?.[0]?.url;

        if (!imageUrl) {
          return Response.json(
            { error: "Rasm natijasi topilmadi" },
            { status: 502 }
          );
        }

        return Response.json({
          success: true,
          image: imageUrl
        });

      } catch (error) {
        return Response.json(
          { error: "Rasm yaratishda xatolik yuz berdi" },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
