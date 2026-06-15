import airports from '../../data/airports.json';

// In-memory cache map to prevent overloading external servers
const cache = new Map();
const CACHE_TTL = 60000; // Cache data for 60 seconds
const FETCH_TIMEOUT_MS = 5000; // Timeout external requests after 5 seconds

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Missing location slug parameter.' });
  }

  // Find the airport/lounge configuration for the given slug
  const airport = airports.find((a) => a.slug === slug);
  if (!airport) {
    return res.status(404).json({ error: 'Lounge configuration not found for the specified slug.' });
  }

  // Retrieve cached entry if valid
  const cachedEntry = cache.get(slug);
  const nowTime = Date.now();
  if (cachedEntry && nowTime - cachedEntry.timestamp < CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json({
      ...cachedEntry.data,
      isCached: true
    });
  }

  // Setup abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `https://waitwhile.com/locations/${slug}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch Waitwhile page: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract state properties using regex
    const isOpenMatch = html.match(/\\"isOpen\\"\s*:\s*(true|false)/);
    const isWaitlistOpenMatch = html.match(/\\"isWaitlistOpen\\"\s*:\s*(true|false)/);
    const isForceClosedMatch = html.match(/\\"isForceClosed\\"\s*:\s*(true|false)/);
    const numWaitingMatch = html.match(/\\"numWaiting\\"\s*:\s*(\d+)/);
    const waitMatch = html.match(/\\"wait\\"\s*:\s*(-?\d+)/);

    // Fallbacks
    const isOpen = isOpenMatch ? isOpenMatch[1] === 'true' : false;
    const isWaitlistOpen = isWaitlistOpenMatch ? isWaitlistOpenMatch[1] === 'true' : false;
    const isForceClosed = isForceClosedMatch ? isForceClosedMatch[1] === 'true' : false;
    const numWaiting = numWaitingMatch ? parseInt(numWaitingMatch[1], 10) : 0;
    const waitSeconds = waitMatch ? parseInt(waitMatch[1], 10) : -1;

    // Calculate current local time in the lounge's timezone
    const now = new Date();
    const localString = now.toLocaleString("en-US", { timeZone: airport.timezone });
    const localDate = new Date(localString);
    const currentHour = localDate.getHours();
    const currentMinute = localDate.getMinutes();
    const currentTimeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // Cross-reference operational hours
    const isInsideHours = currentTimeString >= airport.open_time && currentTimeString <= airport.close_time;

    let status = 'CLOSED';
    let estimatedWaitMinutes = 0;
    let partiesWaiting = 0;

    if (isWaitlistOpen && !isForceClosed) {
      status = 'YELLOW'; // Waitlist active (line is present)
      estimatedWaitMinutes = waitSeconds >= 0 ? Math.round(waitSeconds / 60) : -1;
      partiesWaiting = numWaiting;
    } else {
      // Waitlist closed or forced closed
      if (isInsideHours) {
        status = 'GREEN'; // Inside hours, no waitlist = Walk-in available, no line
      } else {
        status = 'CLOSED'; // Outside hours
      }
    }

    const responseData = {
      slug,
      name: airport.name,
      iata: airport.code,
      terminal: airport.terminal,
      open_time: airport.open_time,
      close_time: airport.close_time,
      timezone: airport.timezone,
      currentTime: currentTimeString,
      isInsideHours,
      isOpen,
      isWaitlistOpen,
      isForceClosed,
      status,
      estimatedWaitMinutes,
      partiesWaiting
    };

    // Update in-memory cache
    cache.set(slug, {
      timestamp: Date.now(),
      data: responseData
    });

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(responseData);

  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Error fetching/parsing waitlist status for slug ${slug}:`, error);

    // Stale-While-Revalidate Resilience: serve stale cache if fetch fails
    if (cachedEntry) {
      res.setHeader('X-Cache', 'STALE');
      return res.status(200).json({
        ...cachedEntry.data,
        isStale: true,
        isOfflineFallback: true,
        staleReason: error.name === 'AbortError' ? 'Fetch request timed out' : error.message
      });
    }

    // Determine timezone-based operational hours status when no cache is available
    const now = new Date();
    let isInsideHours = false;
    let currentTimeString = 'N/A';
    try {
      const localString = now.toLocaleString("en-US", { timeZone: airport.timezone });
      const localDate = new Date(localString);
      const currentHour = localDate.getHours();
      const currentMinute = localDate.getMinutes();
      currentTimeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      isInsideHours = currentTimeString >= airport.open_time && currentTimeString <= airport.close_time;
    } catch (tzErr) {
      console.error('Timezone parsing error in fallback:', tzErr);
    }

    const fallbackStatus = isInsideHours ? 'GREEN' : 'CLOSED';

    const fallbackData = {
      slug,
      name: airport.name,
      iata: airport.code,
      terminal: airport.terminal,
      open_time: airport.open_time,
      close_time: airport.close_time,
      timezone: airport.timezone,
      currentTime: currentTimeString,
      isInsideHours,
      isOpen: isInsideHours,
      isWaitlistOpen: false,
      isForceClosed: false,
      status: fallbackStatus,
      estimatedWaitMinutes: 0,
      partiesWaiting: 0,
      isOfflineFallback: true,
      offlineReason: error.name === 'AbortError' ? 'Fetch request timed out' : error.message
    };

    return res.status(200).json(fallbackData);
  }
}
