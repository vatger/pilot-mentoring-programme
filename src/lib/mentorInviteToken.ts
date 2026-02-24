import { createHmac, timingSafeEqual } from "crypto";

interface InvitePayload {
  inviteId: string;
  exp: number;
}

const HEADER = { alg: "HS256", typ: "JWT" };

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSecret() {
  const secret = process.env.PMP_INVITE_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing PMP_INVITE_SECRET or NEXTAUTH_SECRET");
  }
  return secret;
}

function signUnsignedToken(unsignedToken: string) {
  const secret = getSecret();
  return createHmac("sha256", secret).update(unsignedToken).digest("base64url");
}

export function createMentorInviteToken(data: {
  inviteId: string;
  expiresInHours?: number;
}) {
  const expiresInHours = data.expiresInHours ?? 72;
  const payload: InvitePayload = {
    inviteId: data.inviteId,
    exp: Date.now() + expiresInHours * 60 * 60 * 1000,
  };

  const headerPart = toBase64Url(JSON.stringify(HEADER));
  const payloadPart = toBase64Url(JSON.stringify(payload));
  const unsignedToken = `${headerPart}.${payloadPart}`;
  const signature = signUnsignedToken(unsignedToken);

  return `${unsignedToken}.${signature}`;
}

export function verifyMentorInviteToken(token: string): InvitePayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  const unsignedToken = `${headerPart}.${payloadPart}`;
  const expectedSignature = signUnsignedToken(unsignedToken);

  const received = Buffer.from(signaturePart, "base64url");
  const expected = Buffer.from(expectedSignature, "base64url");

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(fromBase64Url(payloadPart)) as InvitePayload;

  if (!payload.inviteId) {
    throw new Error("Invalid token payload");
  }

  if (!payload.exp || Date.now() > payload.exp) {
    throw new Error("Token expired");
  }

  return payload;
}
