"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    // TODO: Replace with your form backend (Formspree, EmailJS, or a Next.js API route).
    // For now, simulates a successful submission.
    await new Promise((r) => setTimeout(r, 900));
    setStatus("sent");
  };

  const input =
    "w-full bg-[#111] border border-neutral-800 text-neutral-100 font-mono text-sm px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block font-mono text-[11px] text-neutral-600 tracking-widest mb-2">
          NAME
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={input}
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] text-neutral-600 tracking-widest mb-2">
          EMAIL
        </label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={input}
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] text-neutral-600 tracking-widest mb-2">
          MESSAGE
        </label>
        <textarea
          required
          rows={6}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`${input} resize-none`}
          placeholder="What's on your mind?"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending" || status === "sent"}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-neutral-950 font-mono text-sm font-bold tracking-widest py-3 transition-colors"
      >
        {status === "idle" && "SEND MESSAGE"}
        {status === "sending" && "SENDING..."}
        {status === "sent" && "MESSAGE SENT ✓"}
        {status === "error" && "ERROR — TRY AGAIN"}
      </button>

      {status === "sent" && (
        <p className="font-mono text-xs text-amber-400/70 text-center tracking-wider">
          Thanks — I&apos;ll get back to you soon.
        </p>
      )}
    </form>
  );
}
