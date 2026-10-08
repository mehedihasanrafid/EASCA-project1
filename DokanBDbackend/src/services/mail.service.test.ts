import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({ sendMail }),
  },
}));

vi.mock("../config/env.js", () => ({
  env: {
    SMTP_HOST: "smtp.example.test",
    SMTP_PORT: 587,
    SMTP_SECURE: false,
    SMTP_USER: "mailer",
    SMTP_PASSWORD: "secret",
    MAIL_FROM: "DokanBD <orders@example.test>",
  },
}));

import { sendOrderPlacedEmail, sendOrderStatusEmail } from "./mail.service.js";

describe("order emails", () => {
  beforeEach(() => sendMail.mockReset());

  it("sends an order-received email with escaped customer content", async () => {
    await sendOrderPlacedEmail({
      to: "customer@example.test",
      recipientName: "Customer <One>",
      orderNumber: "DBD-123",
      orderStatus: "PENDING",
      grandTotal: "2059.00",
      currency: "BDT",
      orderUrl: "https://shop.example.test/account/orders/1",
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "DokanBD <orders@example.test>",
        to: "customer@example.test",
        subject: "DokanBD order received: DBD-123",
        html: expect.stringContaining("Customer &lt;One&gt;"),
      }),
    );
  });

  it("sends the new order status and tracking link", async () => {
    await sendOrderStatusEmail({
      to: "customer@example.test",
      recipientName: "Customer",
      orderNumber: "DBD-123",
      orderStatus: "SHIPPED",
      grandTotal: "2059.00",
      currency: "BDT",
      orderUrl: "https://shop.example.test/account/orders/1",
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "DokanBD order DBD-123: SHIPPED",
        html: expect.stringContaining("SHIPPED"),
      }),
    );
  });
});
