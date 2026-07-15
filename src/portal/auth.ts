import crypto from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";

export const PORTAL_COOKIE_NAME = "fta_portal";

type SessionPayload = {
    v: 1;
    slackUserId: string;
    name: string;
    email?: string;
    picture?: string;
    exp: number;
};

function mustEnv(name: string) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

function base64urlEncode(buf: Buffer) {
    return buf.toString("base64url");
}

function base64urlDecode(s: string) {
    return Buffer.from(s, "base64url");
}

function hmacSha256(data: string, secret: string) {
    return crypto
        .createHmac("sha256", secret)
        .update(data)
        .digest("base64url");
}

function safeEqual(a: string, b: string) {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);

    if (ab.length !== bb.length) {
        return false;
    }

    return crypto.timingSafeEqual(ab, bb);
}

export function parseCookies(
    header: string | undefined
): Record<string, string> {

    const out: Record<string, string> = {};

    if (!header) {
        return out;
    }

    const parts = header.split(";");

    for (const p of parts) {

        const idx = p.indexOf("=");

        if (idx === -1) {
            continue;
        }

        const key = p.slice(0, idx).trim();
        const value = p.slice(idx + 1).trim();

        if (!key) {
            continue;
        }

        out[key] = decodeURIComponent(value);

    }

    return out;

}

export function signPortalSession(args: {
    slackUserId: string;
    name: string;
    email?: string;
    picture?: string;
    ttlMinutes?: number;
}) {

    const secret = mustEnv("PORTAL_SESSION_SECRET");

    const ttl = Math.max(
        5,
        Math.min(args.ttlMinutes ?? 12 * 60, 7 * 24 * 60)
    );

    const payload: SessionPayload = {
        v: 1,
        slackUserId: args.slackUserId,
        name: args.name,
        email: args.email,
        picture: args.picture,
        exp: Math.floor(Date.now() / 1000) + ttl * 60,
    };

    const payloadB64 = base64urlEncode(
        Buffer.from(JSON.stringify(payload), "utf8")
    );

    const sig = hmacSha256(payloadB64, secret);

    return `${payloadB64}.${sig}`;

}

export function verifyPortalSession(
    token: string | undefined
): SessionPayload | null {

    if (!token) {
        return null;
    }

    const secret = process.env.PORTAL_SESSION_SECRET;

    if (!secret) {
        return null;
    }

    const [payloadB64, sig] = token.split(".");

    if (!payloadB64 || !sig) {
        return null;
    }

    const expectedSig = hmacSha256(payloadB64, secret);

    if (!safeEqual(sig, expectedSig)) {
        return null;
    }

    try {

        const raw = base64urlDecode(payloadB64).toString("utf8");

        const payload = JSON.parse(raw) as SessionPayload;

        if (!payload || payload.v !== 1) {
            return null;
        }

        if (typeof payload.slackUserId !== "string" || !payload.slackUserId) {
            return null;
        }

        if (typeof payload.name !== "string" || !payload.name) {
            return null;
        }

        if (typeof payload.email !== "string") {
            return null;
        }

        if (typeof payload.picture !== "string") {
            return null;
        }

        if (typeof payload.exp !== "number") {
            return null;
        }

        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;

    } catch {

        return null;

    }

}

export function setPortalCookie(
    reply: FastifyReply,
    token: string
) {

    const isProd =
        process.env.NODE_ENV === "production";

    const parts = [
        `${PORTAL_COOKIE_NAME}=${encodeURIComponent(token)}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        ...(isProd ? ["Secure"] : []),
    ];

    reply.header("Set-Cookie", parts.join("; "));

}

export function clearPortalCookie(
    reply: FastifyReply
) {

    const isProd =
        process.env.NODE_ENV === "production";

    const parts = [
        `${PORTAL_COOKIE_NAME}=`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=0",
        ...(isProd ? ["Secure"] : []),
    ];

    reply.header("Set-Cookie", parts.join("; "));

}

export function requirePortalUser(
    request: FastifyRequest,
    reply: FastifyReply,
    next: () => void
) {

    const cookies = parseCookies(
        request.headers.cookie
    );

    const token = cookies[PORTAL_COOKIE_NAME];

    const session = verifyPortalSession(token);

    if (!session) {
        reply.redirect("/portal/login");
        return;
    }

    (request as any).portalUser = {
        slackUserId: session.slackUserId,
        name: session.name,
        email: session.email,
        picture: session.picture,
    };

    next();

}

export function getPortalUser(
    request: FastifyRequest
) {

    return (
        (request as any).portalUser as
        | {
            slackUserId: string;
            name: string;
            email?: string;
            picture?: string;
        }
        | undefined
    ) ?? null;

}