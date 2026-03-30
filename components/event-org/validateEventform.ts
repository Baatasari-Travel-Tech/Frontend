import { EventFormData } from "./data/create-event-data";

export type { EventFormData };

export function validateEventForm(formData: Partial<EventFormData>): Record<string, string> {
  const errors: Record<string, string> = {};

  // --- EventForm fields ---
  if (!formData.eventName || formData.eventName.trim() === "") errors.eventName = "Event Name is required";
  if (!formData.category || formData.category.trim() === "") errors.category = "Category is required";
  if (!formData.tagline || formData.tagline.trim() === "") errors.tagline = "Tagline is required";
  if (!formData.description || formData.description.trim() === "") errors.description = "Description is required";
  if (!formData.personnel || formData.personnel.trim() === "") errors.personnel = "Personnel is required";
  if (!formData.date) errors.date = "Date is required";
  if (!formData.time) errors.time = "Start time is required";
  if (!formData.endTime) errors.endTime = "End time is required";
  if (!formData.venue || formData.venue.trim() === "") errors.venue = "Venue is required";
  if (!formData.entrySide || formData.entrySide.trim() === "") errors.entrySide = "Entry Side is required";

  // --- TicketingForm fields ---
  if (!formData.ticketType || (formData.ticketType !== "paid" && formData.ticketType !== "free")) {
    errors.ticketType = "Ticket type is required";
  }
  if (formData.ticketType === "paid") {
    // Audience Category
    if (!Array.isArray(formData.audienceCategory) || formData.audienceCategory.length === 0) {
      errors["audienceCategory.0.category"] = "At least one audience category is required";
    } else {
      formData.audienceCategory.forEach((cat, idx) => {
        if (!cat.category || cat.category.trim() === "") errors[`audienceCategory.${idx}.category`] = "Category is required";
        if (!cat.price || cat.price === "") errors[`audienceCategory.${idx}.price`] = "Price is required";
        if (!cat.description || cat.description.trim() === "") errors[`audienceCategory.${idx}.description`] = "Description is required";
      });
    }
    if (!formData.refundPolicy || formData.refundPolicy.trim() === "") errors.refundPolicy = "Refund policy is required";
  }
  if (!formData.ticketName || formData.ticketName.trim() === "") errors.ticketName = "Ticket name is required";
  if (!formData.ticketQuantity || isNaN(Number(formData.ticketQuantity)) || Number(formData.ticketQuantity) < 1) errors.ticketQuantity = "Ticket quantity is required";
  if (formData.enableOffers) {
    if (!formData.discountType || (formData.discountType !== "flat" && formData.discountType !== "percentage")) errors.discountType = "Discount type is required";
    if (!formData.discountAmount || isNaN(Number(formData.discountAmount))) errors.discountAmount = "Discount amount is required";
    if (!formData.discountCode || formData.discountCode.trim() === "") errors.discountCode = "Discount code is required";
    if (formData.discountType === "percentage") {
      if (!formData.couponCode || formData.couponCode.trim() === "") errors.couponCode = "Coupon code is required";
      if (!formData.couponExpiry) {
        errors.couponExpiry = "Coupon expiry date is required";
      } else {
        const expiryDate = new Date(formData.couponExpiry);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(expiryDate.getTime())) {
          errors.couponExpiry = "Enter a valid date";
        } else if (expiryDate < today) {
          errors.couponExpiry = "Expiry date must be in the future";
        }
      }
      if (!formData.minOrderValue || isNaN(Number(formData.minOrderValue)) || Number(formData.minOrderValue) < 0) {
        errors.minOrderValue = "Enter a valid minimum order value";
      }
    }
  }
  if (!formData.guidelines || formData.guidelines.trim() === "") errors.guidelines = "Guidelines are required";
  // Add-Ons
  if (formData.addOns?.giftHampers && (!formData.addOns.giftHampersDescription || formData.addOns.giftHampersDescription.trim() === "")) {
    errors["addOns.giftHampersDescription"] = "Gift hampers description is required";
  }

  // --- SponsorshipForm fields ---
  if (!formData.contactInfo || !formData.contactInfo.mobile || formData.contactInfo.mobile.trim() === "") {
    errors["contactInfo.mobile"] = "Mobile number is required";
  }
  if (!formData.contactInfo || !formData.contactInfo.email || formData.contactInfo.email.trim() === "") {
    errors["contactInfo.email"] = "Email is required";
  }
  // Sponsors
  // Note: The original code handled both array and object structure. 
  // Based on EventPage.jsx, sponsors is an object with keys: titleSponsors, coPartners, mediaPartners.
  // Sponsors are optional now
  /*
  if (formData.sponsors && !Array.isArray(formData.sponsors)) {
      const sponsorsObj = formData.sponsors as { [key: string]: { name: string; website: string }[] };
      ["titleSponsors", "coPartners", "mediaPartners"].forEach(type => {
          const sponsorsOfType = sponsorsObj[type];
          if (Array.isArray(sponsorsOfType)) {
              sponsorsOfType.forEach((sponsor, idx) => {
                  if (!sponsor.name || sponsor.name.trim() === "") {
                      errors[`sponsors.${type}.${idx}.name`] = "Sponsor name is required";
                  }
              });
          }
      });
  } else if (Array.isArray(formData.sponsors)) {
      // Logic from original file if sponsors was array
      ["titleSponsors", "coPartners", "mediaPartners"].forEach(type => {
          // @ts-ignore
          const sponsorsOfType = formData.sponsors.filter(s => s.type === type);
          // @ts-ignore
          sponsorsOfType.forEach((sponsor, idx) => {
              if (!sponsor.name || sponsor.name.trim() === "") {
                  errors[`sponsors.${type}.${idx}.name`] = "Sponsor name is required";
              }
          });
      });
  }
  */

  // --- FinalForm fields ---
  if (!formData.requirements || !formData.requirements.artists || formData.requirements.artists.trim() === "") {
    errors["requirements.artists"] = "Artists/Singers field is required";
  }
  if (!formData.requirements || !formData.requirements.stallsAvailability || formData.requirements.stallsAvailability.trim() === "") {
    errors["requirements.stallsAvailability"] = "Stalls availability is required";
  }
  if (formData.requirements && Array.isArray(formData.requirements.stallsPrices)) {
    formData.requirements.stallsPrices.forEach((stall, idx) => {
      if (!stall.stallType || stall.stallType.trim() === "") {
        errors[`requirements.stallsPrices.${idx}.stallType`] = "Stall type is required";
      }
      if (!stall.stallPrice || isNaN(Number(stall.stallPrice))) {
        errors[`requirements.stallsPrices.${idx}.stallPrice`] = "Stall price is required";
      }
    });
  }
  if (!formData.postEventFollowUp || !formData.postEventFollowUp.thankYouNote || formData.postEventFollowUp.thankYouNote.trim() === "") {
    errors["postEventFollowUp.thankYouNote"] = "Thank you note is required";
  }

  return errors;
}
