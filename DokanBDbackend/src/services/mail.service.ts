import nodemailer, { type Transporter } from "nodemailer";

import { env } from "../config/env.js";

interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface ActionEmailInput {
  to: string;
  recipientName: string;
  actionUrl: string;
}

interface OrderEmailInput {
  to: string;
  recipientName: string;
  orderNumber: string;
  orderStatus: string;
  grandTotal: string;
  currency: string;
  orderUrl: string;
}

let transporter: Transporter | null = null;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

function getTransporter() {
  if (!env.SMTP_HOST || !env.MAIL_FROM) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST and MAIL_FROM in the environment.",
    );
  }

  const hasUsername = Boolean(env.SMTP_USER);
  const hasPassword = Boolean(env.SMTP_PASSWORD);

  if (hasUsername !== hasPassword) {
    throw new Error(
      "SMTP_USER and SMTP_PASSWORD must either both be set or both be omitted.",
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      ...(env.SMTP_USER && env.SMTP_PASSWORD
        ? {
            auth: {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
            },
          }
        : {}),
    });
  }

  return transporter;
}

export async function sendMail(message: MailMessage) {
  if (!env.MAIL_FROM) {
    throw new Error("MAIL_FROM is not configured.");
  }

  return getTransporter().sendMail({
    from: env.MAIL_FROM,
    ...message,
  });
}

export function sendVerificationEmail({
  to,
  recipientName,
  actionUrl,
}: ActionEmailInput) {
  const safeName = escapeHtml(recipientName);
  const safeUrl = escapeHtml(actionUrl);

  return sendMail({
    to,
    subject: "Verify your DokanBD email",
    text: `Hello ${recipientName}, verify your email by opening this link: ${actionUrl}`,
    html: [
      `<p>Hello ${safeName},</p>`,
      "<p>Please verify your DokanBD email address.</p>",
      `<p><a href="${safeUrl}">Verify email</a></p>`,
      "<p>If you did not create this account, you can ignore this email.</p>",
    ].join(""),
  });
}

export function sendPasswordResetEmail({
  to,
  recipientName,
  actionUrl,
}: ActionEmailInput) {
  const safeName = escapeHtml(recipientName);
  const safeUrl = escapeHtml(actionUrl);

  return sendMail({
    to,
    subject: "Reset your DokanBD password",
    text: `Hello ${recipientName}, reset your password by opening this link: ${actionUrl}`,
    html: [
      `<p>Hello ${safeName},</p>`,
      "<p>We received a request to reset your DokanBD password.</p>",
      `<p><a href="${safeUrl}">Reset password</a></p>`,
      "<p>If you did not request this, you can ignore this email.</p>",
    ].join(""),
  });
}

export function sendOrderPlacedEmail({
  to,
  recipientName,
  orderNumber,
  grandTotal,
  currency,
  orderUrl,
}: OrderEmailInput) {
  const safeName = escapeHtml(recipientName);
  const safeOrderNumber = escapeHtml(orderNumber);
  const safeTotal = escapeHtml(`${currency} ${grandTotal}`);
  const safeUrl = escapeHtml(orderUrl);

  return sendMail({
    to,
    subject: `DokanBD order received: ${orderNumber}`,
    text: `Hello ${recipientName}, we received order ${orderNumber}. Cash on delivery total: ${currency} ${grandTotal}. Track it here: ${orderUrl}`,
    html: [
      `<p>Hello ${safeName},</p>`,
      `<p>We received your DokanBD order <strong>${safeOrderNumber}</strong>.</p>`,
      `<p>Cash on delivery total: <strong>${safeTotal}</strong></p>`,
      `<p><a href="${safeUrl}">View your order</a></p>`,
      "<p>We will email you again when the order status changes.</p>",
    ].join(""),
  });
}

export function sendOrderStatusEmail({
  to,
  recipientName,
  orderNumber,
  orderStatus,
  grandTotal,
  currency,
  orderUrl,
}: OrderEmailInput) {
  const safeName = escapeHtml(recipientName);
  const safeOrderNumber = escapeHtml(orderNumber);
  const safeStatus = escapeHtml(orderStatus);
  const safeTotal = escapeHtml(`${currency} ${grandTotal}`);
  const safeUrl = escapeHtml(orderUrl);

  return sendMail({
    to,
    subject: `DokanBD order ${orderNumber}: ${orderStatus}`,
    text: `Hello ${recipientName}, order ${orderNumber} is now ${orderStatus}. Total: ${currency} ${grandTotal}. View it here: ${orderUrl}`,
    html: [
      `<p>Hello ${safeName},</p>`,
      `<p>Your DokanBD order <strong>${safeOrderNumber}</strong> is now <strong>${safeStatus}</strong>.</p>`,
      `<p>Order total: <strong>${safeTotal}</strong></p>`,
      `<p><a href="${safeUrl}">View order details</a></p>`,
    ].join(""),
  });
}
