import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface StallDetailsProps {
    title: string
    subtitle: string
    items?: { name: string; price: number }[]
    onClose: () => void
    onApprove: () => void
    isApproved?: boolean
    onRevoke?: () => void
}

export function StallDetails({ title, subtitle, items = [], onClose, onApprove, isApproved, onRevoke }: StallDetailsProps) {
    return (
        <div className="relative flex flex-col w-full max-w-85 max-h-110 shadow-xl border-2 rounded-[30px] overflow-hidden bg-(--stall-details-bg) border-(--stall-details-border)">
            {/* Header Section - Fixed */}
            <div className="p-6 pb-4 border-b relative bg-(--stall-header-bg) border-(--stall-divider) shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 h-8 w-8 text-(--stall-close-icon)"
                    onClick={onClose}
                >
                    <X className="h-5 w-5" />
                </Button>
                <h2 className="text-[28px] leading-tight font-bold font-bricolage mb-2 pr-6 text-(--upcoming-primary-800)">
                    {title}
                </h2>
                <p className="text-sm font-poppins text-(--stall-subtitle-color)">{subtitle}</p>
            </div>

            {/* Scrollable Items Section */}
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="flex justify-between items-center border rounded-[15px] px-5 py-3 bg-background border-(--stall-item-border)"
                        >
                            <span className="font-medium font-poppins text-sm text-(--stall-item-text)">
                                {item.name}
                            </span>
                            <span className="font-semibold text-xl font-poppins text-(--stall-price-color)">
                                ₹{item.price}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 pt-0 shrink-0 bg-(--stall-details-bg)">
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (isApproved) {
                                onRevoke?.()
                            } else {
                                onRevoke?.()
                            }
                        }}
                        className="flex-1 font-bold rounded-[30px] py-6 font-poppins text-sm border-[1.5px] border-destructive shadow-none text-destructive bg-transparent"
                    >
                        Deny
                    </Button>
                    <Button
                        onClick={onApprove}
                        className="flex-1 font-bold rounded-[30px] py-6 font-poppins text-sm shadow-none text-background bg-foreground"
                    >
                        Accept
                    </Button>
                </div>
            </div>
        </div>
    )
}
