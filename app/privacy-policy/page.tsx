export default function PrivacyPolicy() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        Baatasari Platform respects your privacy and is committed to protecting
        your personal data.
      </p>

      {/* 1. Information We Collect */}
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Personal details (Name, Email, Phone)</li>
        <li>Profile and preference data</li>
        <li>Payment and transaction details</li>
        <li>Organizer verification data (PAN, Bank details)</li>
      </ul>

      {/* 2. How We Use Data */}
      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Data</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>To provide and improve services</li>
        <li>To process payments and registrations</li>
        <li>To verify organizers</li>
        <li>To personalize user experience</li>
      </ul>

      {/* 3. Data Sharing */}
      <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Sharing</h2>
      <p className="mb-4">
        We do not sell your data. Information may be shared with:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Event organizers (for registrations)</li>
        <li>Payment gateways</li>
        <li>Legal authorities if required</li>
      </ul>

      {/* 4. Data Security */}
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Security</h2>
      <p className="mb-4">
        We implement industry-standard security measures to protect your data.
      </p>

      {/* 5. Cookies */}
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Cookies</h2>
      <p className="mb-4">
        We use cookies to enhance user experience and track platform usage.
      </p>

      {/* 6. User Rights */}
      <h2 className="text-xl font-semibold mt-6 mb-2">6. User Rights</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Access your data</li>
        <li>Request correction or deletion</li>
        <li>Opt-out of communications</li>
      </ul>

      {/* 7. Organizer Data Handling */}
      <h2 className="text-xl font-semibold mt-6 mb-2">7. Organizer Data Handling</h2>
      <p className="mb-4">
        Organizer financial and identity data are used strictly for verification
        and payout processing and are handled securely.
      </p>

      {/* 8. Changes */}
      <h2 className="text-xl font-semibold mt-6 mb-2">8. Changes to Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy periodically.
      </p>

      <p className="text-sm text-gray-500 mt-10">
        Last Updated: March 2026
      </p>
    </div>
  );
}