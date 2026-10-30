import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type UserRole = 'TRAVELLER' | 'GUIDE' | 'ADMIN';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  fullName: string;
  createdAt: string;
  token?: string;
  // Traveller specific fields
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredLanguage?: string;
  // Guide specific fields
  phone?: string;
  specialty?: string;
  yearsExperience?: number;
  routeExperienceDescription?: string;
  languages?: string[];
  coverageRadiusKm?: number;
  ratePerSessionInr?: number;
  latitude?: number;
  longitude?: number;
  isAvailable?: boolean;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rating?: number;
  reviewCount?: number;
  verifiedTrips?: number;
  lastTraversedText?: string;
}

export interface RouteMemory {
  id: string;
  title: string;
  category: 'HAZARD' | 'DETOUR' | 'SUPPLIES' | 'MEDICAL' | 'LANDMARK';
  status: 'ACTIVE' | 'CLEARED' | 'PENDING_REVIEW';
  kilometerMarker?: number;
  routeCorridor: string;
  description: string;
  latitude: number;
  longitude: number;
  reportedBy: string;
  reportedByUserId: string;
  reportedAt: string;
  confirmations: number;
  confidencePercent: number;
  photoUrl?: string;
  requiresVehicleClearance?: string;
}

export interface AssistanceSession {
  id: string;
  travellerId: string;
  travellerName: string;
  guideId: string;
  guideName: string;
  routeCorridor: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  mode: 'VOICE' | 'CHAT' | 'REMOTE';
  startedAt: string;
  endedAt?: string;
  isMuted?: boolean;
  messages: {
    id: string;
    senderId: string;
    senderRole: 'TRAVELLER' | 'GUIDE' | 'SYSTEM';
    senderName: string;
    text: string;
    timestamp: string;
    coordinates?: [number, number];
  }[];
}

export interface GuideRequest {
  id: string;
  travellerId: string;
  travellerName: string;
  guideId: string;
  originName: string;
  destinationName: string;
  distanceKm: number;
  offeredPriceInr: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string; // Server-authoritative timestamp
}

export interface EmergencySosLog {
  id: string;
  userId: string;
  userName: string;
  latitude?: number;
  longitude?: number;
  elevationMsl?: number;
  activatedAt: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  emergencyContactsNotified: {
    name: string;
    phone: string;
  }[];
}

export interface DatabaseSchema {
  users: UserAccount[];
  routeMemories: RouteMemory[];
  sessions: AssistanceSession[];
  requests: GuideRequest[];
  sosLogs: EmergencySosLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'routemate.db.json');

// EMPTY production database baseline - ZERO fake users, guides, or memories!
const EMPTY_DATABASE: DatabaseSchema = {
  users: [],
  routeMemories: [],
  sessions: [],
  requests: [],
  sosLogs: []
};

// Password hashing utilities
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return checkHash === hash;
}

export function generateToken(userId: string): string {
  return crypto.randomBytes(32).toString('hex') + '-' + userId;
}

class DBManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all required collections exist
        return {
          users: parsed.users || [],
          routeMemories: parsed.routeMemories || [],
          sessions: parsed.sessions || [],
          requests: parsed.requests || [],
          sosLogs: parsed.sosLogs || []
        };
      }
    } catch (err) {
      console.error('[RouteMate DB] Error reading file, resetting to clean database:', err);
    }
    this.save(EMPTY_DATABASE);
    return EMPTY_DATABASE;
  }

  public save(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[RouteMate DB] Error writing database file:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public update(updater: (data: DatabaseSchema) => void): DatabaseSchema {
    updater(this.data);
    this.save(this.data);
    return this.data;
  }

  public clearAll(): void {
    this.data = {
      users: [],
      routeMemories: [],
      sessions: [],
      requests: [],
      sosLogs: []
    };
    this.save(this.data);
  }
}

export const db = new DBManager();
