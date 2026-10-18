import { STORE_NAME } from "@/lib/config";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-display text-4xl sm:text-5xl">Contact us</h1>
      <p className="mt-4 text-black/70 dark:text-white/70">
        The fastest way to reach {STORE_NAME} is on Facebook Messenger — tap the chat button
        in the corner or use the link below. We reply to order questions, custom requests, and
        bulk quotes.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a
          href="https://www.facebook.com/oppaprints"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-black/10 p-5 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
        >
          <p className="font-medium">Facebook</p>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">facebook.com/oppaprints</p>
        </a>
        <a
          href="https://m.me/oppaprints"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-black/10 p-5 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
        >
          <p className="font-medium">Messenger</p>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">Chat with us directly</p>
        </a>
      </div>

      <div className="mt-8 rounded-2xl bg-stone-50 p-5 text-sm text-black/70 dark:bg-white/5 dark:text-white/70">
        <p className="font-medium text-black dark:text-white">How ordering works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Pick your product, color, size, and text, then add to cart.</li>
          <li>Check out with your name, number, and delivery address — no account needed.</li>
          <li>Pay via GCash or BPI and upload your receipt on the order page.</li>
          <li>We confirm your payment and prepare your order.</li>
        </ol>
      </div>
    </div>
  );
}
