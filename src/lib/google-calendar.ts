import { google, calendar_v3 } from 'googleapis';
import { db } from './db';
import { AppError } from './errors';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'https://nailagenda.vercel.app'}/api/integrations/google/callback`;

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AppError('Google Calendar no configurado — faltan credenciales OAuth', 500);
  }

  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
}

// ---------------------------------------------------------------------------
// Auth URL
// ---------------------------------------------------------------------------

export function getAuthURL(userId: string): string {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: userId,
  });
}

// ---------------------------------------------------------------------------
// Handle OAuth Callback
// ---------------------------------------------------------------------------

export async function handleCallback(code: string, userId: string) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new AppError('Google no devolvió tokens completos', 502);
  }

  // Get the email of the connected Google account
  oauth2.setCredentials(tokens);
  const people = google.oauth2({ version: 'v2', auth: oauth2 });
  const { data: tokenInfo } = await people.tokeninfo({ access_token: tokens.access_token });

  const googleEmail = tokenInfo.email || 'unknown@google.com';

  // Upsert token — encrypt sensitive fields
  await db.googleCalendarToken.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      email: googleEmail,
      expiresAt: new Date(tokens.expiry_date),
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      email: googleEmail,
      expiresAt: new Date(tokens.expiry_date),
    },
  });
}

// ---------------------------------------------------------------------------
// Get Authenticated Calendar Client
// ---------------------------------------------------------------------------

async function getCalendarClient(userId: string): Promise<calendar_v3.Calendar> {
  const oauth2 = getOAuth2Client();
  const token = await db.googleCalendarToken.findUnique({ where: { userId } });

  if (!token) {
    throw new AppError('Google Calendar no conectado — vincula tu cuenta primero', 400);
  }

  // Check if token is expired and refresh if needed
  if (token.expiresAt <= new Date()) {
    oauth2.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
    });

    const { credentials } = await oauth2.refreshAccessToken();

    if (!credentials.access_token || !credentials.expiry_date) {
      throw new AppError('Error al refrescar token de Google', 502);
    }

    await db.googleCalendarToken.update({
      where: { userId },
      data: {
        accessToken: credentials.access_token,
        expiresAt: new Date(credentials.expiry_date),
        ...(credentials.refresh_token ? { refreshToken: credentials.refresh_token } : {}),
      },
    });

    oauth2.setCredentials(credentials);
  } else {
    oauth2.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
    });
  }

  return google.calendar({ version: 'v3', auth: oauth2 });
}

// ---------------------------------------------------------------------------
// CRUD Events
// ---------------------------------------------------------------------------

export interface CalendarEventInput {
  summary: string;
  description?: string;
  startDateTime: string;  // ISO 8601
  endDateTime: string;    // ISO 8601
}

export async function createEvent(userId: string, input: CalendarEventInput) {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startDateTime, timeZone: 'America/Mexico_City' },
      end: { dateTime: input.endDateTime, timeZone: 'America/Mexico_City' },
    },
  });

  return response.data;
}

export async function updateEvent(userId: string, eventId: string, input: CalendarEventInput) {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.events.update({
    calendarId: 'primary',
    eventId,
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startDateTime, timeZone: 'America/Mexico_City' },
      end: { dateTime: input.endDateTime, timeZone: 'America/Mexico_City' },
    },
  });

  return response.data;
}

export async function deleteEvent(userId: string, eventId: string) {
  const calendar = await getCalendarClient(userId);

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
}

// ---------------------------------------------------------------------------
// Connection Status
// ---------------------------------------------------------------------------

export async function getConnectionStatus(userId: string) {
  const token = await db.googleCalendarToken.findUnique({ where: { userId } });

  if (!token) {
    return { connected: false, email: null };
  }

  return {
    connected: true,
    email: token.email,
    expiresAt: token.expiresAt.toISOString(),
  };
}

export async function disconnect(userId: string) {
  await db.googleCalendarToken.delete({ where: { userId } });
}

// ---------------------------------------------------------------------------
// Revoke (optional — full OAuth disconnect)
// ---------------------------------------------------------------------------

export async function revokeAndDisconnect(userId: string) {
  const token = await db.googleCalendarToken.findUnique({ where: { userId } });

  if (token) {
    try {
      const oauth2 = getOAuth2Client();
      oauth2.setCredentials({ refresh_token: token.refreshToken });
      await oauth2.revokeCredentials();
    } catch {
      // Revocation failure is non-fatal — delete local token anyway
    }
  }

  await db.googleCalendarToken.delete({ where: { userId } });
}
