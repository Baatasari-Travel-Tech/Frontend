"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
} from "lucide-react";
import Image from "next/image";

import EventForm from "./EventForm";
import TicketingForm from "./TicketingForm";
import SponsorshipForm from "./SponsorshipForm";
import FinalForm from "./FinalForm";
import CoverImageCropper from "./CoverImageCropper";

import {
  INITIAL_EVENT_FORM_DATA,
  STEP_FIELDS,
  PROGRESS_STEPS,
  EventFormData,
} from "./data//create-event-data";

import { validateEventForm } from "./validateEventform";

const stepFields = STEP_FIELDS;

interface EventPageProps {
  isDashboardMode?: boolean;
  startDirectly?: boolean;
  action?: string | null;
  contactInfoPrefill?: Partial<EventFormData["contactInfo"]>;
  // Existing cover URL to show in the preview when editing an event.
  initialCoverPreview?: string | null;
  onSubmit?: (formData: EventFormData) => Promise<void>;
}

const SCROLL_OFFSET = 100;

function getScrollContainer(
  target: HTMLElement | null,
  mainContainerRef: React.RefObject<HTMLDivElement | null>,
  isDashboardMode: boolean
): HTMLElement | Window {
  if (isDashboardMode) {
    // In dashboard mode, scroll directly on window since the main element
    // doesn't have overflow: auto and isn't the actual scroll container
    return window;
  }

  if (mainContainerRef.current) return mainContainerRef.current;

  // Fallback to window
  return window;
}

// Calculate absolute scrollTop target in the container's coordinate system
function getTargetScrollTop(container: HTMLElement | Window, target: HTMLElement, offset = 0) {
  if (container === window) {
    const y = target.getBoundingClientRect().top + window.scrollY - offset;
    return Math.max(0, y);
  }

  const el = container as HTMLElement;

  // target position in viewport + current container scroll - container top in viewport
  const y =
    target.getBoundingClientRect().top -
    el.getBoundingClientRect().top +
    el.scrollTop -
    offset;

  return Math.max(0, y);
}

// Custom smooth scroll using RAF for consistent animation
function smoothScrollTo(container: HTMLElement | Window, top: number, duration = 600) {
  const start = container === window ? window.scrollY : (container as HTMLElement).scrollTop;
  const distance = top - start;
  if (Math.abs(distance) < 2) return;

  let startTime: number | null = null;

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const step = (time: number) => {
    if (startTime === null) startTime = time;
    const progress = Math.min(1, (time - startTime) / duration);
    const y = start + distance * easeInOutCubic(progress);

    if (container === window) {
      window.scrollTo(0, y);
    } else {
      (container as HTMLElement).scrollTop = y;
    }

    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

const EventPage: React.FC<EventPageProps> = ({
  isDashboardMode = false,
  startDirectly = false,
  action = null,
  contactInfoPrefill,
  initialCoverPreview = null,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const savedStep = localStorage.getItem("eventFormCurrentStep");
      if (savedStep) {
        const parsed = parseInt(savedStep, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 4) return parsed;
      }
    }
    return 1;
  });
  const [showCreateEvent, setShowCreateEvent] = useState(startDirectly);

  useEffect(() => {
    if (startDirectly) setShowCreateEvent(true);
  }, [startDirectly]);

  const [formData, setFormData] = useState<EventFormData>(INITIAL_EVENT_FORM_DATA);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialCoverPreview);
  const [photoError, setPhotoError] = useState("");
  const [coverCropSource, setCoverCropSource] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({
    "event-info": true,
    "date-time": true,
    "event-highlights": true,
    ticketing: true,
    sponsorship: true,
    audience: true,
    guidelines: true,
    addOns: true,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof openSections],
    }));
  };

  const progressSteps = PROGRESS_STEPS.map((step, index) => ({
    ...step,
    active: currentStep >= index + 1,
  }));

  const formRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Load saved state
  useEffect(() => {
    const savedData = localStorage.getItem("eventFormData");
    const savedSections = localStorage.getItem("eventFormOpenSections");

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (action === "reschedule" || action === "repeat") {
          parsedData.date = "";
          parsedData.endDate = "";
          parsedData.time = "";
          parsedData.endTime = "";
        }
        setFormData((prev) => ({ ...prev, ...parsedData }));

        // Auto-resume: if we have draft data, skip the "Get Started" screen
        if (!startDirectly) {
          setShowCreateEvent(true);
        }
      } catch { }
    }

    if (savedSections) {
      try {
        setOpenSections(JSON.parse(savedSections));
      } catch { }
    }
  }, [action, startDirectly]);

  useEffect(() => {
    if (!contactInfoPrefill) return;

    setFormData((prev) => {
      const current = prev.contactInfo ?? {
        mobile: "",
        email: "",
        website: "",
        additionalLinks: "",
      };

      const next = {
        mobile: current.mobile?.trim() ? current.mobile : (contactInfoPrefill.mobile?.trim() ?? current.mobile),
        email: current.email?.trim() ? current.email : (contactInfoPrefill.email?.trim() ?? current.email),
        website: current.website?.trim() ? current.website : (contactInfoPrefill.website?.trim() ?? current.website),
        additionalLinks: current.additionalLinks?.trim()
          ? current.additionalLinks
          : (contactInfoPrefill.additionalLinks?.trim() ?? current.additionalLinks),
      };

      if (
        next.mobile === current.mobile &&
        next.email === current.email &&
        next.website === current.website &&
        next.additionalLinks === current.additionalLinks
      ) {
        return prev;
      }

      return {
        ...prev,
        contactInfo: next,
      };
    });
  }, [contactInfoPrefill]);

  // Persist form data (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem("eventFormData", JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(t);
  }, [formData]);

  useEffect(() => {
    localStorage.setItem("eventFormCurrentStep", currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem("eventFormOpenSections", JSON.stringify(openSections));
  }, [openSections]);

  // When the form becomes visible, scroll to it once (reliable)
  useLayoutEffect(() => {
    if (!showCreateEvent) return;
    if (!formRef.current) return;

    const container = getScrollContainer(formRef.current, mainContainerRef, isDashboardMode);
    const top = getTargetScrollTop(container, formRef.current, SCROLL_OFFSET);

    // Slight delay helps when CSS/layout transitions exist
    requestAnimationFrame(() => {
      smoothScrollTo(container, top, 450);
    });
  }, [showCreateEvent, isDashboardMode]);

  const handleGetStarted = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowCreateEvent(true);
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep <= currentStep) {
      setCurrentStep(targetStep);
      setFormErrors({});
      setTimeout(scrollToFormTop, 0);
      return;
    }
    const errors = validateEventForm(formData);
    const currentStepKeys = stepFields[currentStep - 1] ?? [];
    const hasCurrentErrors = Object.keys(errors).some((field) =>
      currentStepKeys.some((key) => field === key || field.startsWith(`${key}.`))
    );
    if (hasCurrentErrors) {
      setFormErrors(errors);
      scrollToFirstError(errors);
      return;
    }
    setFormErrors({});
    setCurrentStep(targetStep);
    setTimeout(scrollToFormTop, 0);
  };

  const scrollToFirstError = (errors: Record<string, string>) => {
    if (Object.keys(errors).length === 0) return;

    // Expand every collapsible section so a collapsed one can't hide the field.
    setOpenSections((prev) => ({
      ...prev,
      "event-info": true,
      "date-time": true,
      "event-highlights": true,
      ticketing: true,
      sponsorship: true,
      audience: true,
      guidelines: true,
      addOns: true,
    }));

    const focusFirstError = () => {
      // Error messages all render with `.text-danger-red` directly beside their
      // field, in DOM order — so the first one is the first invalid field.
      const msg = document.querySelector<HTMLElement>(".text-danger-red");
      if (!msg) return;

      const field = msg.closest<HTMLElement>(".relative") ?? msg.parentElement ?? msg;
      field.scrollIntoView({ behavior: "smooth", block: "center" });

      const control = field.querySelector<HTMLElement>(
        "input:not([type='file']):not([type='hidden']), select, textarea"
      );
      if (control) {
        try { control.focus({ preventScroll: true }); } catch {}
      }
    };

    // Wait for any step switch / section expansion to render before measuring.
    requestAnimationFrame(() => setTimeout(focusFirstError, 120));
  };

  const scrollToFormTop = () => {
    if (!formRef.current) return;
    const container = getScrollContainer(formRef.current, mainContainerRef, isDashboardMode);
    const top = getTargetScrollTop(container, formRef.current, SCROLL_OFFSET);
    smoothScrollTo(container, top, 350);
  };

  const handleNext = async () => {
    if (isSubmitting) return;

    const errors = validateEventForm(formData);

    if (currentStep < 4) {
      const currentStepKeys = stepFields[currentStep - 1] ?? [];
      const currentStepHasErrors = Object.keys(errors).some((field) =>
        currentStepKeys.some((key) => field === key || field.startsWith(`${key}.`))
      );

      if (currentStepHasErrors) {
        setFormErrors(errors);
        setSubmitError(null);
        setSubmitSuccess(null);
        scrollToFirstError(errors);
        return;
      }
    }

    if (currentStep === 4) {
      setFormErrors(errors);
      setSubmitError(null);
      setSubmitSuccess(null);

      if (Object.keys(errors).length > 0) {
        const errorFields = Object.keys(errors);
        let jumpStep = 1;
        for (let i = 0; i < stepFields.length; i++) {
          if (errorFields.some((field) => stepFields[i].some((key) => field === key || field.startsWith(`${key}.`)))) {
            jumpStep = i + 1;
            break;
          }
        }
        const count = Object.keys(errors).length;
        setSubmitError(`${count} required field${count > 1 ? "s are" : " is"} incomplete. Please fix the highlighted fields before submitting.`);
        setCurrentStep(jumpStep);
        scrollToFirstError(errors);
        return;
      }

      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(formData);
          localStorage.removeItem("eventFormData");
          localStorage.removeItem("eventFormCurrentStep");
          localStorage.removeItem("eventFormOpenSections");
          setSubmitSuccess("Event submitted successfully.");
        } catch (submitErr) {
          setSubmitError(submitErr instanceof Error ? submitErr.message : "Event submission failed.");
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      localStorage.removeItem("eventFormData");
      localStorage.removeItem("eventFormCurrentStep");
      localStorage.removeItem("eventFormOpenSections");
      setSubmitSuccess("Form submitted.");
      return;
    }

    setCurrentStep((s) => s + 1);
    setFormErrors({});
    setSubmitError(null);
    setTimeout(scrollToFormTop, 0);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      setTimeout(scrollToFormTop, 0);
    }
  };

  const updateNestedState = <T extends object,>(
    prevState: T,
    path: string[],
    value: unknown
  ): T => {
    const [head, ...tail] = path;
    const obj = prevState as Record<string, unknown>;
    if (tail.length === 0) return { ...obj, [head]: value } as unknown as T;

    return {
      ...obj,
      [head]: updateNestedState((obj[head] as object) || {}, tail, value),
    } as unknown as T;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = target.checked;
    const files = target.files;

    if (name === "eventPhoto") {
      const file = files?.[0];
      if (file) {
        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!validTypes.includes(file.type)) {
          setPhotoError("Please upload a JPG, PNG, GIF, or WEBP file.");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setPhotoError("File size must be less than 5MB.");
          return;
        }
        setPhotoError("");
        // Open the cropper so the organizer frames the cover to the exact ratio
        // that's stored and shown everywhere, instead of a blind center-crop.
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") setCoverCropSource(reader.result);
        };
        reader.readAsDataURL(file);
      }
      // Reset the input so re-selecting the same file re-opens the cropper.
      target.value = "";
      return;
    }

    if (name.startsWith("transport.") || name.startsWith("addOns.")) {
      const path = name.split(".");
      setFormData((prev) => updateNestedState(prev, path, checked));
      return;
    }

    const path = name.split(".");
    setFormData((prev) =>
      updateNestedState(prev, path, type === "checkbox" ? checked : value)
    );
  };

  const addArrayItem = (arrayName: string) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: [
        ...(prev[arrayName as keyof EventFormData] as Record<string, unknown>[]),
        arrayName === "artists"
          ? { name: "", genre: "" }
          : arrayName === "chefGuests"
            ? { name: "", specialty: "" }
            : arrayName === "attractions"
              ? { name: "", description: "" }
              : arrayName === "audienceCategory"
                ? { category: "", numberOfTickets: "", isLimited: true, isFree: false, price: "", description: "" }
                : arrayName === "timeSlots"
                  ? { name: "", startTime: "", endTime: "" }
                  : { name: "", logo: null, details: "" },
      ],
    }));
  };

  const updateArrayField = (arrayName: string, index: number, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: (prev[arrayName as keyof EventFormData] as Record<string, unknown>[]).map(
        (item, i) => (i === index ? { ...item, [field]: value } : item)
      ),
    }));
  };

  const removeArrayItem = (arrayName: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: (
        (prev[arrayName as keyof EventFormData] as Record<string, unknown>[]) || []
      ).filter((_, i) => i !== index),
    }));
  };

  return (
    <div
      ref={mainContainerRef}
      className={`flex flex-col w-full bg-background ${isDashboardMode
          ? "h-auto overflow-y-visible bg-transparent!"
          : "h-screen overflow-y-auto"
        }`}
    >
      <div className="grow">
        <section
          className={`flex flex-col items-center gap-13 w-full bg-background min-h-screen ${isDashboardMode ? "bg-transparent! min-h-0!" : ""
            }`}
        >
          <div className="flex flex-col items-start gap-13 w-full">
            {!startDirectly && (
              <section className="flex flex-col items-start justify-center gap-6 py-15 px-25 w-full bg-background max-xl:py-10 max-xl:px-[4vw] max-[700px]:py-6 max-[700px]:px-[2vw] max-[700px]:min-h-0 max-[480px]:py-4 max-[480px]:px-2">
                <h1 className="font-semibold text-upcoming-primary-700 text-[52px] leading-[62.4px] m-0 font-[Poppins,Helvetica,sans-serif] max-[900px]:text-[32px] max-[900px]:leading-10 max-[700px]:text-[22px] max-[700px]:leading-7 max-[480px]:text-[32px] max-[480px]:leading-[1.2]">
                  Promote Your Event with Baatasari
                </h1>

                <div className="flex items-center gap-6 w-full max-xl:flex-col max-xl:gap-8 max-[900px]:flex-col max-[900px]:gap-6">
                  <div className="flex flex-col items-start gap-10 flex-1 min-w-70 max-xl:w-full max-xl:max-w-[100vw]">
                    <p className="w-full max-w-152 font-medium text-gray-600 text-lg leading-normal m-0 font-[Poppins,Helvetica,sans-serif] max-[480px]:text-[15px] max-[480px]:leading-normal max-[480px]:max-w-full">
                      Are you an event planner eager to highlight amazing talent? Look no further than
                      Baatasari — the perfect blend of creativity and opportunity!
                      <br />
                      In just 5 minutes, you can complete our form, making sure every detail is tailored
                      to your needs. Let us assist you in connecting with the ideal performers and
                      audiences.
                    </p>

                    <p className="font-medium text-foreground text-base leading-6 m-0 font-[Outfit,Helvetica,sans-serif] max-[480px]:text-[15px] max-[480px]:leading-normal">
                      Become part of our dynamic community and let your event shine at thrilling
                      gatherings, live shows, and tailored showcases.
                      <br />
                      Ready to elevate your event? Just take 5 minutes to complete the form below — our
                      team will reach out to ensure you&apos;re fully prepared. Your event deserves the
                      spotlight. Let&apos;s create something extraordinary!
                    </p>

                    <a href="#create" onClick={handleGetStarted} className="inline-flex items-center justify-center gap-4 py-3 px-8 bg-upcoming-primary-900 rounded-[30px] text-white cursor-pointer border-none no-underline">
                      <span className="font-medium text-base leading-normal font-[Poppins,Helvetica,sans-serif]">Get Started</span>
                      <ChevronDownIcon className="w-6 h-6" />
                    </a>
                  </div>

                  <div className="flex items-start justify-center px-8 pb-12.5 flex-1 min-w-70 max-xl:w-full max-xl:max-w-[100vw] max-[480px]:hidden">
                    <div className="w-full max-w-99.75 h-100 rounded-4xl flex items-center justify-center flex-col" style={{ position: "relative", background: "transparent", padding: 0 }}>
                      <Image
                        src="/event_hero_landing.png"
                        alt="Event celebration with crowd and stage"
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        style={{ objectFit: "cover", borderRadius: "20px" }}
                        priority
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {showCreateEvent && (
            <div
              id="create"
              ref={formRef}
              className="flex flex-col w-full max-w-310 items-center gap-18 p-[30px_16px] rounded-4xl bg-card min-h-200 scroll-mt-25 max-[900px]:p-[16px_4vw] max-[900px]:rounded-xl max-[900px]:gap-8 max-[768px]:pt-6 max-[700px]:p-[8px_2vw] max-[700px]:rounded-lg max-[700px]:gap-4.5 max-[480px]:p-[16px_12px] max-[480px]:gap-6 max-[480px]:rounded-lg max-[480px]:min-h-0"
              aria-hidden={!showCreateEvent}
            >
              <div className="flex flex-col items-center gap-8 w-full">
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-[28px] font-bold text-foreground m-0">Create Event</h2>
                </div>

                <div className="hidden max-[768px]:flex max-[768px]:flex-col max-[768px]:items-center text-center mb-6 w-full">
                  <h3 className="text-xl font-bold text-(--upcoming-primary-900) m-0">{progressSteps[currentStep - 1]?.label}</h3>
                  <div className="text-xs text-gray-500 mt-1">
                    Step {currentStep} of {progressSteps.length}
                  </div>
                </div>

                <div
                  className="relative w-full max-w-250 h-17.5 flex items-start justify-between max-[900px]:max-w-[98vw] max-[900px]:h-14 max-[768px]:hidden"
                  role="progressbar"
                  aria-label={`Event creation progress, step ${currentStep} of 4`}
                >
                  {progressSteps.map((step, index) => {
                    const done = index + 1 < currentStep;
                    const active = step.active;

                    return (
                      <React.Fragment key={step.number}>
                        <div
                          className="flex flex-col items-center min-w-20 z-2 cursor-pointer"
                          onClick={() => handleStepClick(Number(step.number))}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") handleStepClick(Number(step.number));
                          }}
                        >
                          <div
                            className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border-2 border-(--upcoming-primary-800) bg-gray-100 text-(--upcoming-primary-800) transition-all duration-200 ${active
                                ? "border-(--upcoming-primary-900) bg-card text-(--upcoming-primary-900)"
                                : ""
                              } ${done
                                ? "border-green-600 bg-green-50 text-green-700"
                                : ""
                              }`}
                          >
                            {done ? (
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <path
                                  d="M6 10.5L9 13.5L14 8.5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : (
                              <span style={{ fontSize: 14, fontWeight: 500 }}>{step.number}</span>
                            )}
                          </div>

                          <span
                            className={`mt-3 text-center text-base text-(--upcoming-primary-800) max-w-25 wrap-break-word ${active ? "text-(--upcoming-primary-900)" : ""
                              }`}
                          >
                            {step.label}
                          </span>
                        </div>

                        {index < progressSteps.length - 1 && (
                          <div
                            className={`flex-1 h-1 bg-(--upcoming-gray-200) min-w-6 max-w-full z-1 mt-3.75 ${done ? "bg-green-600" : ""
                              }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="w-full">
                {currentStep === 1 && (
                  <EventForm
                    formData={formData}
                    setFormData={setFormData}
                    handleInputChange={handleInputChange}
                    photoPreview={photoPreview}
                    setPhotoPreview={setPhotoPreview}
                    photoError={photoError}
                    setPhotoError={setPhotoError}
                    addArrayItem={addArrayItem}
                    updateArrayField={updateArrayField}
                    removeArrayItem={removeArrayItem}
                    openSections={openSections}
                    toggleSection={toggleSection}
                    formErrors={formErrors}
                  />
                )}

                {currentStep === 2 && (
                  <TicketingForm
                    formData={formData}
                    setFormData={setFormData}
                    handleInputChange={handleInputChange}
                    addArrayItem={addArrayItem}
                    updateArrayField={updateArrayField}
                    removeArrayItem={removeArrayItem}
                    openSections={openSections}
                    toggleSection={toggleSection}
                    formErrors={formErrors}
                  />
                )}

                {currentStep === 3 && (
                  <SponsorshipForm
                    formData={formData}
                    setFormData={setFormData}
                    handleInputChange={handleInputChange}
                    openSections={openSections}
                    toggleSection={toggleSection}
                    formErrors={formErrors}
                  />
                )}

                {currentStep === 4 && (
                  <FinalForm
                    formData={formData}
                    setFormData={setFormData}
                    handleInputChange={handleInputChange}
                    formErrors={formErrors}
                  />
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {showCreateEvent && (
        <div className="flex justify-center py-2 px-[7%] bg-background">
          <div className="w-full max-w-200 mt-8 pb-25 max-[480px]:pb-20">
            {submitError ? (
              <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p>
            ) : null}
            {submitSuccess ? (
              <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{submitSuccess}</p>
            ) : null}
            <div className="flex justify-between w-full">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1 || isSubmitting}
              className={`flex items-center gap-2 py-3 px-6 rounded-full border border-border bg-background text-gray-700 cursor-pointer text-base font-medium ${currentStep === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed invisible"
                  : ""
                }`}
            >
              <ArrowLeftIcon size={20} />
              Previous
            </button>

            <button
              onClick={() => void handleNext()}
              disabled={isSubmitting}
              className="flex items-center gap-2 py-3 px-8 rounded-full bg-(--upcoming-primary-900) text-white border-none cursor-pointer text-base font-medium shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1),0_2px_4px_-1px_rgb(0_0_0/0.06)] hover:bg-(--upcoming-primary-800) disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : currentStep === 4 ? "Submit" : "Proceed"}
              {currentStep !== 4 && <ArrowRightIcon size={20} />}
            </button>
            </div>
          </div>
        </div>
      )}

      {coverCropSource ? (
        <CoverImageCropper
          source={coverCropSource}
          onCancel={() => setCoverCropSource(null)}
          onApply={(file, previewUrl) => {
            setFormData((prev) => ({ ...prev, eventPhoto: file, hasStoredCover: true }));
            setPhotoPreview(previewUrl);
            setPhotoError("");
            setCoverCropSource(null);
          }}
        />
      ) : null}
    </div>
  );
};

export default EventPage;
