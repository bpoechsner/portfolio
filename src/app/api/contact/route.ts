import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email, message } = (await req.json()) as {
    name?: string;
    email?: string;
    message?: string;
  };

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_TO_EMAIL) {
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  try {
    await resend.emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: process.env.CONTACT_TO_EMAIL,
      replyTo: email,
      subject: `Portfolio message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <div style="font-family:monospace;background:#0a0a0a;color:#f0f0f0;padding:32px;max-width:600px">
          <div style="color:#f59e0b;font-size:11px;letter-spacing:0.3em;margin-bottom:24px">PORTFOLIO CONTACT FORM</div>
          <p style="margin:0 0 8px"><span style="color:#737373">From:</span> ${name}</p>
          <p style="margin:0 0 24px"><span style="color:#737373">Reply-to:</span> ${email}</p>
          <div style="border-left:2px solid #f59e0b;padding-left:16px;color:#d4d4d4">${message.replace(/\n/g, "<br>")}</div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Resend error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
