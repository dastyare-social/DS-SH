import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";

const Loader = ({ className }: { className?: string }) => {
  return (
    <Loader2Icon
      className={cn(
        "size-8 text-secondary/10 stroke-1 animate-spin",
        className
      )}
    />
  );
};

export default Loader;
