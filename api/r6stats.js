module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Missing username" });

  const API_KEY = process.env.TRN_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "API key not configured" });

  const headers = { "api-key": API_KEY, "Accept": "application/json" };
  const base = "https://api.r6data.eu/api/stats";
  const u = encodeURIComponent(username);

  const seasonalUrl = `${base}?type=seasonalStats&nameOnPlatform=${u}&platformType=psn&platform_families=console`;
  const statsUrl    = `${base}?type=stats&nameOnPlatform=${u}&platformType=psn&platform_families=console`;
  const accountUrl  = `${base}?type=accountInfo&nameOnPlatform=${u}&platformType=psn`;

  try {
    const [sRes, stRes, aRes] = await Promise.all([
      fetch(seasonalUrl, { headers }),
      fetch(statsUrl,    { headers }),
      fetch(accountUrl,  { headers }),
    ]);

    const [seasonal, stats, account] = await Promise.all([
      sRes.json(), stRes.json(), aRes.json(),
    ]);

    res.setHeader("Cache-Control", "s-maxage=120");
    return res.status(200).json({ seasonal, stats, account });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
