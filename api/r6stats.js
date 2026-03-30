module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { username } = req.query;

  if (!username) return res.status(400).json({ error: "Missing username" });

  const API_KEY = process.env.TRN_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "API key not configured" });

  // Fetch both profile/seasonal stats and match history in parallel
  const headers = { "api-key": API_KEY, "Accept": "application/json" };

  const statsUrl    = `https://api.r6data.eu/api/stats?type=seasonalStats&nameOnPlatform=${encodeURIComponent(username)}&platformType=psn&platform_families=console`;
  const accountUrl  = `https://api.r6data.eu/api/stats?type=accountInfo&nameOnPlatform=${encodeURIComponent(username)}&platformType=psn`;
  const historyUrl  = `https://api.r6data.eu/api/stats?type=matchHistory&nameOnPlatform=${encodeURIComponent(username)}&platformType=psn&platform_families=console`;

  try {
    const [statsRes, accountRes, historyRes] = await Promise.all([
      fetch(statsUrl,   { headers }),
      fetch(accountUrl, { headers }),
      fetch(historyUrl, { headers }),
    ]);

    const [stats, account, history] = await Promise.all([
      statsRes.json(),
      accountRes.json(),
      historyRes.json(),
    ]);

    res.setHeader("Cache-Control", "s-maxage=120");
    return res.status(200).json({ stats, account, history });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
