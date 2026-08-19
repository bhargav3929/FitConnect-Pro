/**
 * Thin client for the Expo Push Service.
 *
 * Expo brokers APNs and FCM on our behalf, so the credentials live in the EAS
 * project rather than in this codebase. Node 20 ships global fetch, so no
 * HTTP dependency is needed.
 */

const EXPO_SEND_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPT_URL = 'https://exp.host/--/api/v2/push/getReceipts';

/** Expo caps a single request at 100 messages and 1000 receipt IDs. */
export const EXPO_SEND_CHUNK = 100;
export const EXPO_RECEIPT_CHUNK = 1000;

export interface ExpoPushMessage {
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound?: 'default' | null;
    channelId?: string;
    badge?: number;
}

export interface ExpoPushTicket {
    status: 'ok' | 'error';
    id?: string;
    message?: string;
    details?: { error?: string };
}

export interface ExpoPushReceipt {
    status: 'ok' | 'error';
    message?: string;
    details?: { error?: string };
}

/**
 * Errors that mean the token will never deliver again. Anything else (rate
 * limits, transient Expo faults) is left alone so the token survives.
 */
export function isUnrecoverable(error: string | undefined): boolean {
    return error === 'DeviceNotRegistered' || error === 'InvalidCredentials';
}

function chunk<T>(items: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
}

/**
 * Sends messages and returns one ticket per message, positionally aligned with
 * the input. A failed chunk yields synthetic error tickets rather than
 * throwing, so one bad batch cannot stop the rest of the fan-out.
 */
export async function sendExpoPushes(
    messages: ExpoPushMessage[],
): Promise<ExpoPushTicket[]> {
    const tickets: ExpoPushTicket[] = [];

    for (const batch of chunk(messages, EXPO_SEND_CHUNK)) {
        try {
            const response = await fetch(EXPO_SEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                },
                body: JSON.stringify(batch),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`[expo] send failed ${response.status}: ${text.slice(0, 500)}`);
                tickets.push(...batch.map((): ExpoPushTicket => ({
                    status: 'error',
                    message: `HTTP ${response.status}`,
                })));
                continue;
            }

            const payload = await response.json() as { data?: ExpoPushTicket[] };
            const batchTickets = payload.data ?? [];
            // Guard against a short response so ticket/message alignment holds.
            for (let i = 0; i < batch.length; i += 1) {
                tickets.push(batchTickets[i] ?? { status: 'error', message: 'Missing ticket' });
            }
        } catch (error) {
            console.error('[expo] send threw', error);
            tickets.push(...batch.map((): ExpoPushTicket => ({
                status: 'error',
                message: (error as Error).message,
            })));
        }
    }

    return tickets;
}

/** Fetches delivery receipts for previously issued ticket IDs. */
export async function getExpoPushReceipts(
    ticketIds: string[],
): Promise<Record<string, ExpoPushReceipt>> {
    const receipts: Record<string, ExpoPushReceipt> = {};

    for (const batch of chunk(ticketIds, EXPO_RECEIPT_CHUNK)) {
        try {
            const response = await fetch(EXPO_RECEIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ ids: batch }),
            });

            if (!response.ok) {
                console.error(`[expo] receipts failed ${response.status}`);
                continue;
            }

            const payload = await response.json() as { data?: Record<string, ExpoPushReceipt> };
            Object.assign(receipts, payload.data ?? {});
        } catch (error) {
            console.error('[expo] receipts threw', error);
        }
    }

    return receipts;
}
