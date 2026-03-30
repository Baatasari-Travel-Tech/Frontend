export default function TermsAndConditions() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>

      <p className="mb-4">
        Welcome to <strong>Baatasari Platform</strong>. By accessing or using our platform,
        you agree to comply with and be bound by the following terms.
      </p>

      {/* 1. Eligibility */}
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Eligibility</h2>
      <p className="mb-4">
        You must be at least 18 years old to use this platform. By registering,
        you confirm that the information provided is accurate and complete.
      </p>

      {/* 2. User Accounts */}
      <h2 className="text-xl font-semibold mt-6 mb-2">2. User Accounts</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>You are responsible for maintaining account confidentiality.</li>
        <li>You agree not to share login credentials.</li>
        <li>You are responsible for all activities under your account.</li>
      </ul>

      {/* 3. General User Responsibilities */}
      <h2 className="text-xl font-semibold mt-6 mb-2">3. General User Responsibilities</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Browse and register for events responsibly.</li>
        <li>Provide accurate profile and preference information.</li>
        <li>Do not misuse platform features or submit harmful content.</li>
      </ul>

      {/* 4. Artist Role */}
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Artist Role</h2>
      <p className="mb-4">
        Users may upgrade to Artist by submitting talent details and completing payment.
        The platform is not responsible for guaranteeing opportunities or bookings.
      </p>

      {/* 5. Event Organizer Role */}
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Event Organizer Role</h2>
      <p className="mb-2">
        Event Organizers must provide valid personal, financial, and legal details.
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>All submitted documents must be authentic.</li>
        <li>Organizers are responsible for event accuracy and execution.</li>
        <li>Any fraudulent activity may result in account suspension.</li>
      </ul>

      {/* 6. Event Creation & Management */}
      <h2 className="text-xl font-semibold mt-6 mb-2">6. Event Creation & Management</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Organizers must provide accurate event details.</li>
        <li>Past events cannot be modified.</li>
        <li>Platform is not liable for event cancellations or changes.</li>
      </ul>

      {/* 7. Payments & Refunds */}
      <h2 className="text-xl font-semibold mt-6 mb-2">7. Payments & Refunds</h2>
      <p className="mb-4">
        All payments made on the platform are subject to the organizer’s refund policy.
        Baatasari acts only as a facilitator and is not responsible for disputes.
      </p>

      {/* 8. Prohibited Activities */}
      <h2 className="text-xl font-semibold mt-6 mb-2">8. Prohibited Activities</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Fraudulent registrations or payments</li>
        <li>Uploading misleading or illegal content</li>
        <li>Violating applicable laws</li>
      </ul>

      {/* 9. Platform Rights */}
      <h2 className="text-xl font-semibold mt-6 mb-2">9. Platform Rights</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>We may suspend or terminate accounts.</li>
        <li>We may modify features without prior notice.</li>
      </ul>

      {/* 10. Limitation of Liability */}
      <h2 className="text-xl font-semibold mt-6 mb-2">10. Limitation of Liability</h2>
      <p className="mb-4">
        Baatasari is not liable for any direct or indirect damages arising from
        platform usage, event participation, or organizer actions.
      </p>

      {/* 11. Changes to Terms */}
      <h2 className="text-xl font-semibold mt-6 mb-2">11. Changes to Terms</h2>
      <p className="mb-4">
        We reserve the right to update these terms at any time.
      </p>

      <p className="text-sm text-gray-500 mt-10">
        Last Updated: March 2026
      </p>
    </div>
  );
}