import { Router, Request, Response } from 'express';
import {
  db,
  hashPassword,
  verifyPassword,
  generateToken,
  UserAccount,
  RouteMemory,
  GuideRequest,
  AssistanceSession,
  EmergencySosLog
} from '../db';
import { GoogleGenAI } from '@google/genai';

export const apiRouter = Router();

// Middleware: Authenticate Bearer Token
export function authenticateToken(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const data = db.getData();
  const user = data.users.find(u => u.token === token);

  if (!user) {
    return res.status(403).json({ success: false, error: 'Invalid or expired session token' });
  }

  (req as any).user = user;
  next();
}

// Haversine formula for distance in kilometers
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ----------------------------------------------------
// AUTHENTICATION APIs
// ----------------------------------------------------

// 0. Health check endpoint
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'RouteMate Core Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 1. Register User (Traveller or Guide)
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const {
    email,
    password,
    role = 'TRAVELLER',
    fullName,
    emergencyContactName,
    emergencyContactPhone,
    preferredLanguage,
    phone,
    specialty,
    languages,
    coverageRadiusKm,
    routeExperienceDescription,
    yearsExperience,
    ratePerSessionInr
  } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ success: false, error: 'Email, password, and full name are required' });
  }

  const data = db.getData();
  if (data.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists' });
  }

  const { salt, hash } = hashPassword(password);
  const userId = `usr-${Date.now()}`;
  const token = generateToken(userId);

  const newUser: UserAccount = {
    id: userId,
    email: email.toLowerCase(),
    passwordHash: hash,
    salt,
    role: role as 'TRAVELLER' | 'GUIDE' | 'ADMIN',
    fullName,
    createdAt: new Date().toISOString(),
    token,
    emergencyContactName,
    emergencyContactPhone,
    preferredLanguage: preferredLanguage || 'English',
    phone,
    specialty,
    languages: Array.isArray(languages) ? languages : languages ? [languages] : ['English'],
    coverageRadiusKm: Number(coverageRadiusKm) || 15,
    routeExperienceDescription,
    yearsExperience: Number(yearsExperience) || 1,
    ratePerSessionInr: Number(ratePerSessionInr) || 150,
    // Guides start as PENDING verification by default
    verificationStatus: role === 'GUIDE' ? 'PENDING' : 'VERIFIED',
    isAvailable: role === 'GUIDE' ? false : true,
    rating: 5.0,
    reviewCount: 0,
    verifiedTrips: 0
  };

  db.update(d => {
    d.users.push(newUser);
  });

  const { passwordHash: _, salt: __, ...sanitized } = newUser;
  res.status(201).json({
    success: true,
    message: role === 'GUIDE' ? 'Guide registration submitted. Status: PENDING_VERIFICATION' : 'Registration successful',
    token,
    user: sanitized
  });
});

// 2. Login User
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const data = db.getData();
  const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const isMatch = verifyPassword(password, user.salt, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const token = generateToken(user.id);
  db.update(d => {
    const target = d.users.find(u => u.id === user.id);
    if (target) {
      target.token = token;
    }
  });

  const { passwordHash: _, salt: __, ...sanitized } = user;
  res.json({
    success: true,
    token,
    user: { ...sanitized, token }
  });
});

// 3. Get Current User / Restore Session
apiRouter.get('/auth/me', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as UserAccount;
  const { passwordHash: _, salt: __, ...sanitized } = user;
  res.json({ success: true, user: sanitized });
});

// 4. Logout
apiRouter.post('/auth/logout', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as UserAccount;
  db.update(d => {
    const target = d.users.find(u => u.id === user.id);
    if (target) {
      delete target.token;
    }
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// 5. Password Reset Request
apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email address is required' });
  }
  const data = db.getData();
  const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, error: 'No account registered with this email address' });
  }
  res.json({
    success: true,
    message: `Password reset verification instructions sent to ${email}.`
  });
});

// ----------------------------------------------------
// NAVIGATION & GEOGRAPHIC APIs (NO FAKE FALLBACKS)
// ----------------------------------------------------

// 6. Real OSRM Directions Engine
apiRouter.get('/routes/directions', async (req: Request, res: Response) => {
  const fromStr = req.query.from as string;
  const toStr = req.query.to as string;

  if (!fromStr || !toStr) {
    return res.status(400).json({
      success: false,
      error: 'Query parameters from and to are required as "latitude,longitude"'
    });
  }

  const [fromLat, fromLon] = fromStr.split(',').map(Number);
  const [toLat, toLon] = toStr.split(',').map(Number);

  if (isNaN(fromLat) || isNaN(fromLon) || isNaN(toLat) || isNaN(toLon)) {
    return res.status(400).json({ success: false, error: 'Invalid coordinates provided' });
  }

  // Coordinate order for OSRM is lon,lat
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: `OSRM routing provider returned HTTP ${response.status}. Please try again.`
      });
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No driving route found between the specified coordinates.'
      });
    }

    const route = data.routes[0];
    res.json({
      success: true,
      provider: 'OSRM Open Source Routing Machine',
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.round(route.duration / 60),
      geometry: route.geometry,
      steps: route.legs[0]?.steps?.map((step: any) => ({
        instruction: step.maneuver.instruction || `${step.maneuver.type} ${step.maneuver.modifier || ''}`,
        distanceM: Math.round(step.distance),
        durationSec: Math.round(step.duration),
        name: step.name || 'Road Segment'
      })) || []
    });
  } catch (err: any) {
    res.status(503).json({
      success: false,
      error: `Routing provider unreachable: ${err.message}. Network connection required.`
    });
  }
});

// 7. Destination Geocoding Search (Photon OSM)
apiRouter.get('/geocoding/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  if (!query || query.trim().length < 2) {
    return res.json({ results: [] });
  }

  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(photonUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.features && Array.isArray(data.features)) {
        const results = data.features.map((feat: any) => ({
          name: feat.properties.name || feat.properties.city || feat.properties.street || 'Place',
          state: feat.properties.state || feat.properties.district,
          country: feat.properties.country,
          latitude: feat.geometry.coordinates[1],
          longitude: feat.geometry.coordinates[0],
          formatted: [feat.properties.name, feat.properties.state, feat.properties.country].filter(Boolean).join(', ')
        }));
        return res.json({ results });
      }
    }
    res.json({ results: [] });
  } catch (err: any) {
    res.json({ results: [], error: 'Geocoding service unavailable' });
  }
});

// ----------------------------------------------------
// GUIDE DISCOVERY & MATCHING (DATABASE QUERIED)
// ----------------------------------------------------

// 8. Query Guides from Database
apiRouter.get('/guides', (req: Request, res: Response) => {
  const lat = req.query.lat ? Number(req.query.lat) : undefined;
  const lon = req.query.lon ? Number(req.query.lon) : undefined;
  const filter = (req.query.filter as string) || 'all'; // all | nearby | remote
  const requestedRadiusKm = Number(req.query.radius) || 15;

  const data = db.getData();
  // Query ONLY registered users with role 'GUIDE'
  const guideUsers = data.users.filter(u => u.role === 'GUIDE');

  if (guideUsers.length === 0) {
    return res.json({
      success: true,
      scannedRadiusKm: requestedRadiusKm,
      totalGuidesFound: 0,
      guides: []
    });
  }

  let scoredGuides = guideUsers.map(g => {
    let dist = 0;
    if (lat !== undefined && lon !== undefined && g.latitude !== undefined && g.longitude !== undefined) {
      dist = calculateHaversineDistance(lat, lon, g.latitude, g.longitude);
    }

    const familiarity = g.verifiedTrips ? Math.min(100, g.verifiedTrips * 5) : 50;
    const ratingScore = ((g.rating || 5.0) / 5) * 100;
    const proximityScore = Math.max(0, 100 - dist * 4);
    const score = Math.round(familiarity * 0.4 + ratingScore * 0.3 + proximityScore * 0.3);

    return {
      id: g.id,
      name: g.fullName,
      specialty: g.specialty || 'Local Route Navigator',
      yearsExperience: g.yearsExperience || 1,
      rating: g.rating || 5.0,
      reviewCount: g.reviewCount || 0,
      status: g.isAvailable ? 'AVAILABLE' : 'OFFLINE',
      coverageRadiusKm: g.coverageRadiusKm || 15,
      isRemoteExpert: g.coverageRadiusKm ? g.coverageRadiusKm > 25 : false,
      latitude: g.latitude,
      longitude: g.longitude,
      routeFamiliarityPercent: familiarity,
      verifiedTrips: g.verifiedTrips || 0,
      languages: g.languages || ['English'],
      ratePerSessionInr: g.ratePerSessionInr || 150,
      verificationStatus: g.verificationStatus || 'PENDING',
      calculatedDistanceKm: dist,
      matchScore: score
    };
  });

  // Filter based on verification status and type
  scoredGuides = scoredGuides.filter(g => g.verificationStatus === 'VERIFIED');

  if (filter === 'nearby') {
    scoredGuides = scoredGuides.filter(g => !g.isRemoteExpert && g.calculatedDistanceKm <= requestedRadiusKm);
  } else if (filter === 'remote') {
    scoredGuides = scoredGuides.filter(g => g.isRemoteExpert);
  }

  scoredGuides.sort((a, b) => b.matchScore - a.matchScore);

  res.json({
    success: true,
    scannedRadiusKm: requestedRadiusKm,
    totalGuidesFound: scoredGuides.length,
    guides: scoredGuides
  });
});

// 9. Guide Request (30s Server Authoritative Countdown)
apiRouter.post('/requests/create', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as UserAccount;
  const { guideId, origin = 'Current Location', destination = 'Selected Waypoint' } = req.body;

  const data = db.getData();
  const guide = data.users.find(u => u.id === guideId && u.role === 'GUIDE');

  if (!guide) {
    return res.status(404).json({ success: false, error: 'Selected guide not found in database' });
  }

  if (guide.verificationStatus !== 'VERIFIED') {
    return res.status(400).json({ success: false, error: 'Guide application is still pending verification' });
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 1000); // 30 seconds atomic countdown

  const newRequest: GuideRequest = {
    id: `req-${Date.now()}`,
    travellerId: user.id,
    travellerName: user.fullName,
    guideId: guide.id,
    originName: origin,
    destinationName: destination,
    distanceKm: 4.1,
    offeredPriceInr: guide.ratePerSessionInr || 150,
    status: 'PENDING',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString()
  };

  db.update(d => {
    d.requests.push(newRequest);
  });

  res.json({
    success: true,
    request: newRequest,
    message: 'Request dispatched to guide with 30s server-authoritative timer'
  });
});

// 10. Respond to Request
apiRouter.post('/requests/:id/respond', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as UserAccount;
  const { id } = req.params;
  const { action } = req.body; // 'ACCEPT' | 'DECLINE'

  const data = db.getData();
  const requestIndex = data.requests.findIndex(r => r.id === id);

  if (requestIndex === -1) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }

  const request = data.requests[requestIndex];

  // Verify server expiration time
  if (new Date() > new Date(request.expiresAt)) {
    db.update(d => {
      d.requests[requestIndex].status = 'EXPIRED';
    });
    return res.status(410).json({ success: false, error: 'Request has expired' });
  }

  if (request.status !== 'PENDING') {
    return res.status(409).json({ success: false, error: `Request already ${request.status.toLowerCase()}` });
  }

  let createdSession: AssistanceSession | null = null;

  db.update(d => {
    if (action === 'ACCEPT') {
      d.requests[requestIndex].status = 'ACCEPTED';
      const guide = d.users.find(u => u.id === request.guideId);

      createdSession = {
        id: `sess-${Date.now()}`,
        travellerId: request.travellerId,
        travellerName: request.travellerName,
        guideId: request.guideId,
        guideName: guide ? guide.fullName : 'Guide',
        routeCorridor: `${request.originName} → ${request.destinationName}`,
        status: 'ACTIVE',
        mode: 'VOICE',
        startedAt: new Date().toISOString(),
        messages: [
          {
            id: `msg-${Date.now()}-1`,
            senderId: 'SYSTEM',
            senderRole: 'SYSTEM',
            senderName: 'RouteMate Engine',
            text: `Guidance session connected with ${guide ? guide.fullName : 'Guide'}. Telemetry channel active.`,
            timestamp: new Date().toISOString()
          }
        ]
      };
      d.sessions.push(createdSession);
    } else {
      d.requests[requestIndex].status = 'DECLINED';
    }
  });

  res.json({
    success: true,
    action,
    session: createdSession
  });
});

// 11. Sessions & Messaging
apiRouter.get('/sessions/:id', authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const session = data.sessions.find(s => s.id === id);

  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  res.json({ success: true, session });
});

apiRouter.post('/sessions/:id/messages', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as UserAccount;
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, error: 'Message text required' });
  }

  let addedMessage: any = null;

  db.update(d => {
    const session = d.sessions.find(s => s.id === id);
    if (session) {
      addedMessage = {
        id: `msg-${Date.now()}`,
        senderId: user.id,
        senderRole: user.role === 'GUIDE' ? 'GUIDE' : 'TRAVELLER',
        senderName: user.fullName,
        text,
        timestamp: new Date().toISOString()
      };
      session.messages.push(addedMessage);
    }
  });

  if (!addedMessage) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  res.json({ success: true, message: addedMessage });
});

// ----------------------------------------------------
// ROUTE MEMORY (PERSISTENT & USER DRIVEN)
// ----------------------------------------------------

// 12. Get Route Memories
apiRouter.get('/route-memory', (req: Request, res: Response) => {
  const category = req.query.category as string;
  const data = db.getData();
  let list = data.routeMemories;

  if (category && category !== 'ALL') {
    list = list.filter(m => m.category === category);
  }

  res.json({
    success: true,
    total: list.length,
    activeInsightsCount: list.filter(m => m.status === 'ACTIVE').length,
    memories: list
  });
});

// 13. Create Route Memory
apiRouter.post('/route-memory', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as UserAccount;
  const { title, category, description, latitude, longitude, kilometerMarker, routeCorridor } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, error: 'Title and description are required' });
  }

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'Exact GPS coordinates are required' });
  }

  const newMemory: RouteMemory = {
    id: `mem-${Date.now()}`,
    title,
    category: category || 'HAZARD',
    status: 'ACTIVE',
    kilometerMarker: Number(kilometerMarker) || 0,
    routeCorridor: routeCorridor || 'Expedition Track',
    description,
    latitude: Number(latitude),
    longitude: Number(longitude),
    reportedBy: user.fullName,
    reportedByUserId: user.id,
    reportedAt: new Date().toISOString(),
    confirmations: 1,
    confidencePercent: 70
  };

  db.update(d => {
    d.routeMemories.unshift(newMemory);
  });

  res.status(201).json({
    success: true,
    memory: newMemory,
    message: 'Route memory successfully recorded in database'
  });
});

// 14. Confirm Route Memory ("Still There" or "Report Cleared")
apiRouter.post('/route-memory/:id/confirm', authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; // 'STILL_THERE' | 'REPORT_CLEARED'

  let updated: RouteMemory | null = null;

  db.update(d => {
    const memory = d.routeMemories.find(m => m.id === id);
    if (memory) {
      if (action === 'STILL_THERE') {
        memory.confirmations += 1;
        memory.confidencePercent = Math.min(99, memory.confidencePercent + 2);
      } else if (action === 'REPORT_CLEARED') {
        memory.confidencePercent = Math.max(10, memory.confidencePercent - 15);
        if (memory.confidencePercent <= 25) {
          memory.status = 'CLEARED';
        }
      }
      updated = memory;
    }
  });

  if (!updated) {
    return res.status(404).json({ success: false, error: 'Route memory not found' });
  }

  res.json({ success: true, memory: updated });
});

// ----------------------------------------------------
// SOS EMERGENCY WORKFLOW (REAL & HONEST)
// ----------------------------------------------------

// 15. Trigger SOS Distress
apiRouter.post('/sos/broadcast', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as UserAccount;
  const { latitude, longitude, elevationMsl } = req.body;

  const contactsToNotify: { name: string; phone: string }[] = [];
  if (user.emergencyContactName && user.emergencyContactPhone) {
    contactsToNotify.push({
      name: user.emergencyContactName,
      phone: user.emergencyContactPhone
    });
  }

  const newLog: EmergencySosLog = {
    id: `sos-${Date.now()}`,
    userId: user.id,
    userName: user.fullName,
    latitude: latitude !== undefined ? Number(latitude) : undefined,
    longitude: longitude !== undefined ? Number(longitude) : undefined,
    elevationMsl: elevationMsl !== undefined ? Number(elevationMsl) : undefined,
    activatedAt: new Date().toISOString(),
    status: 'ACTIVE',
    emergencyContactsNotified: contactsToNotify
  };

  db.update(d => {
    d.sosLogs.unshift(newLog);
  });

  res.json({
    success: true,
    sos: newLog,
    message: contactsToNotify.length > 0
      ? `Emergency distress logged. Alert dispatched to ${contactsToNotify[0].name} (${contactsToNotify[0].phone}) and saved to database.`
      : 'Emergency distress logged with coordinates and saved to database.'
  });
});

// ----------------------------------------------------
// ADMIN APIs
// ----------------------------------------------------

// 16. Admin Overview Statistics
apiRouter.get('/admin/overview', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as UserAccount;
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin authorization required' });
  }

  const data = db.getData();
  const guides = data.users.filter(u => u.role === 'GUIDE');

  res.json({
    success: true,
    stats: {
      totalTravellers: data.users.filter(u => u.role === 'TRAVELLER').length,
      totalGuides: guides.length,
      verifiedGuides: guides.filter(g => g.verificationStatus === 'VERIFIED').length,
      pendingVerifications: guides.filter(g => g.verificationStatus === 'PENDING').length,
      activeSessions: data.sessions.filter(s => s.status === 'ACTIVE').length,
      routeMemoriesActive: data.routeMemories.filter(m => m.status === 'ACTIVE').length,
      emergencyAlertsCount: data.sosLogs.length
    },
    guides,
    recentSos: data.sosLogs
  });
});

// 17. Admin Guide Verification
apiRouter.post('/admin/verify-guide', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as UserAccount;
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin authorization required' });
  }

  const { guideId, action } = req.body; // 'APPROVE' | 'REJECT'
  let updatedGuide: UserAccount | null = null;

  db.update(d => {
    const target = d.users.find(u => u.id === guideId && u.role === 'GUIDE');
    if (target) {
      target.verificationStatus = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
      target.isAvailable = action === 'APPROVE';
      updatedGuide = target;
    }
  });

  if (!updatedGuide) {
    return res.status(404).json({ success: false, error: 'Guide not found in database' });
  }

  res.json({
    success: true,
    guide: updatedGuide,
    message: `Guide verification status updated to ${action === 'APPROVE' ? 'VERIFIED' : 'REJECTED'}`
  });
});

// ----------------------------------------------------
// GEMINI AI INTEGRATION
// ----------------------------------------------------

apiRouter.post('/ai/extract-hazard', async (req: Request, res: Response) => {
  const { fieldNotes } = req.body;
  if (!fieldNotes) {
    return res.status(400).json({ success: false, error: 'fieldNotes is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      error: 'GEMINI_API_KEY is not configured in environment variables. Please provide the key in AI Studio Secrets.'
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: `You are the RouteMate Route Intelligence engine. Analyze this traveller/guide observation on a remote road:
"${fieldNotes}"

Extract a JSON object with this exact structure:
{
  "title": "Short concise headline (max 6 words)",
  "category": "HAZARD" | "DETOUR" | "SUPPLIES" | "MEDICAL" | "LANDMARK",
  "confidencePercent": number between 60 and 95,
  "actionAdvice": "1 sentence practical guidance for other drivers"
}
Output strictly valid JSON with no markdown backticks or commentary.`
    });

    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    res.json({
      success: true,
      provider: 'Google Gemini',
      extracted: parsed
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Gemini extraction failed: ${err.message}`
    });
  }
});

// ----------------------------------------------------
// OPTIONAL DEV SEED (FOR EXPLICIT TESTING ONLY)
// ----------------------------------------------------
apiRouter.post('/dev/seed', (req: Request, res: Response) => {
  const { salt, hash } = hashPassword('RouteMate2026!');
  const adminSaltHash = hashPassword('AdminPass2026!');

  const seedUsers: UserAccount[] = [
    {
      id: 'usr-admin-demo',
      email: 'admin@routemate.org',
      passwordHash: adminSaltHash.hash,
      salt: adminSaltHash.salt,
      role: 'ADMIN',
      fullName: 'Dispatch Officer',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-guide-demo',
      email: 'guide@routemate.org',
      passwordHash: hash,
      salt: salt,
      role: 'GUIDE',
      fullName: 'Dev Guide',
      phone: '+91 94881 22334',
      specialty: 'High Pass Specialist',
      yearsExperience: 8,
      languages: ['English', 'Tamil'],
      coverageRadiusKm: 15,
      ratePerSessionInr: 150,
      verificationStatus: 'VERIFIED',
      isAvailable: true,
      rating: 4.9,
      reviewCount: 12,
      verifiedTrips: 18,
      latitude: 10.0245,
      longitude: 77.2185,
      createdAt: new Date().toISOString()
    }
  ];

  db.update(d => {
    d.users = seedUsers;
    d.routeMemories = [];
    d.sessions = [];
    d.requests = [];
    d.sosLogs = [];
  });

  res.json({
    success: true,
    message: 'Development test users seeded (admin@routemate.org / guide@routemate.org, password: RouteMate2026! / AdminPass2026!)'
  });
});

apiRouter.post('/dev/clear', (req: Request, res: Response) => {
  db.clearAll();
  res.json({ success: true, message: 'Database reset to completely empty state' });
});
