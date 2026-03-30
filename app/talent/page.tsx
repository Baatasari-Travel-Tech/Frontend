import { TalentInformationForm } from "@/components/talent/talent_form"
export default function TalentPage() {
  return (
    <main className="min-h-screen bg-(--talent-page-bg)">

      <div className="px-4 sm:px-6 pt-6">
        <div className="mx-auto max-w-440">
          <TalentInformationForm />
        </div>
      </div>
    </main>
  )
}