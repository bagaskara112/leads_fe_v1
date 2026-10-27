export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const endpoint = req.query?.endpoint;
  if (!endpoint) {
    return res.status(400).json({ message: 'Missing endpoint parameter' });
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `https://pemetaan-be-backup.vercel.app/api/v1${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
  };
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method || 'PATCH',
      headers,
      body: req.body ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : undefined,
    });

    const data = await upstreamRes.json().catch(() => null);
    return res.status(upstreamRes.status).json(data);
  } catch (error) {
    return res.status(500).json({ message: error?.message || 'Bridge request failed' });
  }
}
