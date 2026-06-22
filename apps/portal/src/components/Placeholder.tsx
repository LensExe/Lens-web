import { Construction } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description?: string;
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-20 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
        <Construction className="size-7" />
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        {description ?? "Trang này đang được xây dựng và sẽ sớm ra mắt."}
      </p>
    </div>
  );
}
