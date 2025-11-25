import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// WhatsApp API configuration from environment variables
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_API_URL = 'https://crm.botpe.in/api/meta/v19.0/803226492883310/messages';
const WHATSAPP_AUTH_TOKEN = 'Bearer 9ysw2qSU233KtnSjpIQZIhlP8mofv5OCsorBrRRzREFTSATuvCBKFDHFB8K2Z0lBzMfWSgIwXBcRzKAkMOGYzx9vYyKaNxxZPmpVU5ERVJTQ09SRQF19I0zgTlslO77AuGneJcUVSwHJc';

// Log file path (using /tmp for Vercel compatibility)
const LOG_DIR = '/tmp';
const LOG_FILE = path.join(LOG_DIR, 'whatsapp-logs.json');

interface WhatsAppLog {
  id: string;
  timestamp: string;
  to: string;
  messageType: string;
  orderNumber?: string;
  request: Record<string, unknown>;
  response: Record<string, unknown> | null;
  httpStatus: number | null;
  success: boolean;
  error?: string;
}

async function getLogs(): Promise<WhatsAppLog[]> {
  try {
    if (existsSync(LOG_FILE)) {
      const data = await readFile(LOG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // File doesn't exist or is corrupted
  }
  return [];
}

async function saveLog(log: WhatsAppLog): Promise<void> {
  try {
    const logs = await getLogs();
    logs.unshift(log); // Add to beginning
    // Keep only last 100 logs
    const trimmedLogs = logs.slice(0, 100);
    await writeFile(LOG_FILE, JSON.stringify(trimmedLogs, null, 2));
  } catch (error) {
    console.error('Failed to save log:', error);
  }
}

export async function POST(request: NextRequest) {
  const logEntry: WhatsAppLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    to: '',
    messageType: '',
    request: {},
    response: null,
    httpStatus: null,
    success: false,
  };

  try {
    const body = await request.json();

    // Extract info for logging
    logEntry.to = body.to || 'unknown';
    logEntry.messageType = body.type || 'unknown';
    logEntry.orderNumber = body.interactive?.header?.text || body.location?.name || '';
    logEntry.request = body;

    console.log(`[WhatsApp] Sending ${logEntry.messageType} to ${logEntry.to}`);

    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': WHATSAPP_AUTH_TOKEN,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    logEntry.response = data;
    logEntry.httpStatus = response.status;
    logEntry.success = response.ok;

    console.log(`[WhatsApp] Response for ${logEntry.to}:`, JSON.stringify(data));

    // Save log
    await saveLog(logEntry);

    return NextResponse.json({
      success: response.ok,
      data,
      logId: logEntry.id,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WhatsApp] Error:', errorMessage);

    logEntry.error = errorMessage;
    logEntry.success = false;

    // Save error log
    await saveLog(logEntry);

    return NextResponse.json(
      { success: false, error: 'Failed to send WhatsApp message', logId: logEntry.id },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve logs
export async function GET() {
  try {
    const logs = await getLogs();
    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve logs' },
      { status: 500 }
    );
  }
}
