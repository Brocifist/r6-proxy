module.exports = async function handler(req, res) {
  // Handle CORS preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { platform, username } = req.query;

  if (!platform || !username) {
    return res.status(400).json({ error: "Missing platform or username" });
  }

  const API_KEY = process.env.TRN_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  const url = `https://public-api.tracker.gg/v2/r6siege/standard/profile/${platform}/${encodeURIComponent(username)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "TRN-Api-Key": API_KEY,
        "Accept": "application/json",
      },
    });

    const data = await response.json();
    res.setHeader("Cache-Control", "s-maxage=120");
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
