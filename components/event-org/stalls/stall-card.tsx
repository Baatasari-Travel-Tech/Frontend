import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface StallCardProps {
  title: string;
  category: string;
  image: string;
  isApproved?: boolean;
  onViewMore?: () => void;
  onApprove?: () => void;
}

export function StallCard({
  title,
  category,
  image,
  onViewMore,
  onApprove,
}: StallCardProps) {
  return (
    <Card className="h-full rounded-xl overflow-hidden shadow-sm border bg-(--stall-card-bg) border-(--stall-card-border) flex flex-col cursor-pointer" onClick={onViewMore}>
      <div className="relative aspect-3/4 w-full">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 240px, (min-width: 640px) 45vw, 90vw"
        />
      </div>

      <CardContent className="p-3 flex-1">
        <h3 className="font-medium leading-tight font-albert text-(--upcoming-primary-800)">
          {title}
        </h3>
        <p className="text-sm font-poppins text-(--stall-category-color)">
          {category}
        </p>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <Button
          variant="outline"
          className="w-full rounded-[25px] py-5 font-poppins text-xs font-medium border-transparent bg-foreground text-background"
          onClick={(e) => {
            e.stopPropagation();
            onApprove?.();
          }}
        >
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
}
