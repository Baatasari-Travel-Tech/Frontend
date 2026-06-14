import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Baatasari's refund and cancellation policy for event tickets — all-sales-final with refunds processed when an event is cancelled.",
}

export default function RefundPolicy() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 text-gray-800">
      <h1 className="mb-2 text-3xl font-bold">Refund &amp; Cancellation Policy</h1>
      <p className="mb-8 text-sm text-gray-500">
        Please read this policy before booking. By completing a booking you agree to it.
      </p>

      {/* 1. All sales final */}
      <h2 className="mb-2 mt-6 text-xl font-semibold">1. Tickets are generally non-refundable</h2>
      <p className="mb-4">
        Event tickets purchased on Baatasari are <strong>non-refundable and
        non-exchangeable</strong> once the booking is confirmed. We do not provide
        refunds for change of mind, inability to attend, late arrival, no-show, or
        partial use of a multi-entry ticket, except as set out below.
      </p>

      {/* 2. Event cancelled */}
      <h2 className="mb-2 mt-6 text-xl font-semibold">2. If an event is cancelled</h2>
      <p className="mb-4">
        If an event is <strong>cancelled by the organizer or by Baatasari</strong>, you
        are entitled to a refund of the ticket amount. Refunds are processed{" "}
        <strong>manually</strong> to the original payment method, typically within{" "}
        <strong>5–7 working days</strong> of the cancellation being confirmed. The
        non-refundable payment-gateway charge levied by the payment provider may be
        retained, as it is a third-party cost incurred on the original transaction.
      </p>

      {/* 3. Postponed / rescheduled */}
      <h2 className="mb-2 mt-6 text-xl font-semibold">3. If an event is postponed or rescheduled</h2>
      <p className="mb-4">
        If an event is rescheduled, your ticket will normally remain valid for the new
        date. If you are unable to attend the new date, any refund is at the discretion
        of the organizer and subject to that event's specific terms.
      </p>

      {/* 4. Organizer-specific terms */}
      <h2 className="mb-2 mt-6 text-xl font-semibold">4. Organizer-specific terms</h2>
      <p className="mb-4">
        Individual events may carry their own additional terms set by the organizer. Where
        an organizer permits cancellation, any applicable platform/convenience fee and a
        cancellation charge may be retained. Such terms, where they exist, are shown on the
        event page or communicated by the organizer.
      </p>

      {/* 5. How to request */}
      <h2 className="mb-2 mt-6 text-xl font-semibold">5. How to request a refund</h2>
      <p className="mb-4">
        For any refund that falls within this policy, email our Grievance Officer at{" "}
        <a className="text-blue-600 hover:underline" href="mailto:grievance@baatasari.com">
          grievance@baatasari.com
        </a>{" "}
        with your <strong>order number</strong>, the event name, and the reason. We will
        acknowledge within 48 hours and process eligible refunds as described above. See our{" "}
        <a className="text-blue-600 hover:underline" href="/grievance">
          Grievance Redressal
        </a>{" "}
        page for full contact details.
      </p>

      <p className="mt-10 text-sm text-gray-500">Last updated: June 2026</p>
    </div>
  )
}
