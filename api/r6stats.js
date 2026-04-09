module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { username, type } = req.query;

  // Separate endpoint: fetch operator icon list once (no username needed)
  if (type === "operators") {
    const API_KEY = process.env.TRN_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: "API key not configured" });
    try {
      const r = await fetch("https://api.r6data.eu/api/operators", {
        headers: { "api-key": API_KEY, "Accept": "application/json" }
      });
      const data = await r.json();
      res.setHeader("Cache-Control", "s-maxage=86400"); // cache 24h
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (!username) return res.status(400).json({ error: "Missing username" });

  const API_KEY = process.env.TRN_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "API key not configured" });

  const headers = { "api-key": API_KEY, "Accept": "application/json" };
  const base = "https://api.r6data.eu/api/stats";
  const u = encodeURIComponent(username);

  const seasonalUrl   = `${base}?type=seasonalStats&nameOnPlatform=${u}&platformType=psn&platform_families=console`;
  const statsUrl      = `${base}?type=stats&nameOnPlatform=${u}&platformType=psn&platform_families=console`;
  const accountUrl    = `${base}?type=accountInfo&nameOnPlatform=${u}&platformType=psn`;
  const operatorUrl   = `${base}?type=operatorStats&nameOnPlatform=${u}&platformType=psn&modes=ranked`;

  try {
    const [sRes, stRes, aRes, opRes] = await Promise.all([
      fetch(seasonalUrl,  { headers }),
      fetch(statsUrl,     { headers }),
      fetch(accountUrl,   { headers }),
      fetch(operatorUrl,  { headers }),
    ]);

    const [seasonal, stats, account, operators] = await Promise.all([
      sRes.json(), stRes.json(), aRes.json(), opRes.json(),
    ]);

    res.setHeader("Cache-Control", "s-maxage=120");
    return res.status(200).json({ seasonal, stats, account, operators });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
