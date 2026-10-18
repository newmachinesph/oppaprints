"use client";

import { usePathname } from "next/navigation";

// Floating chat button → opens the Oppa Prints Facebook/Messenger chat.
// Uses m.me (direct chat) with the page as the destination.
const CHAT_URL = "https://m.me/oppaprints";

export default function MessengerButton() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <a
      href={CHAT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on Facebook Messenger"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center bg-[#1A1A1A] text-[#E3A907] shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]"
    >
      <svg viewBox="0 0 36 36" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M18 2C9.2 2 2.5 8.5 2.5 17c0 4.5 1.9 8.3 4.9 11 .3.2.4.5.4.9l.1 2.7c0 .8.9 1.4 1.7 1l3-1.3c.3-.1.6-.2.9-.1 1.4.4 2.9.6 4.4.6 8.8 0 15.5-6.5 15.5-15S26.8 2 18 2z" />
        <path
          d="M8.7 21.6l4.6-7.3c.7-1.1 2.2-1.4 3.3-.6l3.6 2.7c.3.2.8.2 1.1 0l4.9-3.7c.7-.5 1.5.3 1.1 1l-4.6 7.3c-.7 1.1-2.2 1.4-3.3.6l-3.6-2.7c-.3-.2-.8-.2-1.1 0l-4.9 3.7c-.7.5-1.5-.3-1.1-1z"
          fill="#1A1A1A"
        />
      </svg>
    </a>
  );
}
