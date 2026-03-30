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
  const platform = "psn";
  const family = "console";
  const u = encodeURIComponent(username);

  const urls = {
    seasonal:  `${base}?type=seasonalStats&nameOnPlatform=${u}&platformType=${platform}&platform_families=${family}`,
    stats:     `${base}?type=stats&nameOnPlatform=${u}&platformType=${platform}&platform_families=${family}`,
    account:   `${base}?type=accountInfo&nameOnPlatform=${u}&platformType=${platform}`,
    rankHistory: `${base}?type=seasonalStats&nameOnPlatform=${u}&platformType=${platform}&platform_families=${family}`,
  };

  try {
    const [seasonalRes, statsRes, accountRes] = await Promise.all([
      fetch(urls.seasonal, { headers }),
      fetch(urls.stats,    { headers }),
      fetch(urls.account,  { headers }),
    ]);

    const [seasonal, stats, account] = await Promise.all([
      seasonalRes.json(),
      statsRes.json(),
      accountRes.json(),
    ]);

    res.setHeader("Cache-Control", "s-maxage=120");
    return res.status(200).json({ seasonal, stats, account });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
