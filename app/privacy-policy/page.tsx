import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Baatasari collects, uses, shares, and protects your personal data, and how to exercise your rights under the DPDP Act, 2023.",
}

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 text-gray-800">
      <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>

      <p className="mb-4">
        Baatasari (operated by Simha Karthik Reddy, trading as BAATASARI) respects your
        privacy and is committed to protecting your personal data and handling it in line
        with the Digital Personal Data Protection Act, 2023.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">1. Information We Collect</h2>
      <ul className="mb-4 list-disc pl-6">
        <li>Personal details (name, email, phone)</li>
        <li>Profile, location and preference data</li>
        <li>Payment and transaction details (processed by our payment gateway)</li>
        <li>Organizer verification data (PAN, GSTIN, bank details)</li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold">2. How We Use Data</h2>
      <ul className="mb-4 list-disc pl-6">
        <li>To provide and improve the service, process bookings and payments</li>
        <li>To verify organizers and process settlements</li>
        <li>To personalise your experience and send transactional updates</li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold">3. Data Sharing</h2>
      <p className="mb-2">We do not sell your data. Information may be shared with:</p>
      <ul className="mb-4 list-disc pl-6">
        <li>
          <strong>Event organizers</strong> — your booking details (name, contact) are
          shared with the organizer of an event you book, solely so they can fulfil and
          manage that event. Organizers are required to use this data only for that purpose.
        </li>
        <li>Payment gateways, to process payments and refunds</li>
        <li>Legal or regulatory authorities where required by law</li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold">4. Consent</h2>
      <p className="mb-4">
        We collect and process your personal data based on the consent you give when you
        sign up and when you book. You may withdraw consent at any time by deleting your
        account (see Section 6). Withdrawing consent does not affect processing already
        carried out, or data we must retain for legal/tax purposes.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">5. Children</h2>
      <p className="mb-4">
        The platform is intended for users aged <strong>18 and above</strong>. We do not
        knowingly collect data from minors. You confirm you are 18 or older when you create
        an account.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">6. Your Rights &amp; How to Exercise Them</h2>
      <ul className="mb-4 list-disc pl-6">
        <li>
          <strong>Access / correct your data:</strong> edit your details any time under{" "}
          <a className="text-blue-600 hover:underline" href="/profile">Profile</a>.
        </li>
        <li>
          <strong>Delete your account &amp; data:</strong> go to{" "}
          <span className="font-medium">Profile → Security → Delete account</span>. Your
          account is removed after a short grace window; records we are legally required to
          keep (e.g. tax invoices) are retained and anonymised where possible.
        </li>
        <li>
          <strong>Guests (booked without an account):</strong> email our Grievance Officer
          at{" "}
          <a className="text-blue-600 hover:underline" href="mailto:grievance@baatasari.com">
            grievance@baatasari.com
          </a>{" "}
          to request access or erasure of your data.
        </li>
        <li>
          <strong>Grievances / data requests:</strong> contact our Grievance Officer (see{" "}
          <a className="text-blue-600 hover:underline" href="/grievance">Grievance Redressal</a>
          ). We respond within the timelines required by law.
        </li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold">7. Data Security &amp; Retention</h2>
      <p className="mb-4">
        We apply reasonable security safeguards to protect your data. We retain personal
        data only as long as needed for the purposes above or as required by law (financial
        records are retained for the statutory period).
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">8. Cookies</h2>
      <p className="mb-4">We use cookies to keep you signed in and to understand platform usage.</p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">9. Changes</h2>
      <p className="mb-4">We may update this policy from time to time; the date below reflects the latest version.</p>

      <p className="mt-10 text-sm text-gray-500">Last updated: June 2026</p>
    </div>
  )
}
