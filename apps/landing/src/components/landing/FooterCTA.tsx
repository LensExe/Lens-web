import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Camera } from "lucide-react";
import { Button } from "@lens/ui";
import { useReveal } from "@lens/ui";
import { portalBrowse } from "@/lib/links";

export function FooterCTA() {
  const navigate = useNavigate();
  const scope = useRef<HTMLElement>(null);
  useReveal(scope);

  return (
    <section ref={scope} className="px-5 py-20">
      <div
        data-reveal
        className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[40px] border border-white/10 bg-obsidian px-6 py-16 text-center text-snow md:py-20"
      >
        {/* Decorative washes (brand accents, used sparingly) */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--color-orchid-flash), transparent 65%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 size-72 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--color-ember), transparent 65%)",
          }}
        />

        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Sẵn sàng tạo nên những khoảnh khắc đáng nhớ?
          </h2>
          <p className="mt-4 text-base text-snow/70 md:text-lg">
            Tham gia Lens hôm nay, dù bạn cần một buổi chụp hay muốn phát triển sự
            nghiệp nhiếp ảnh.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="rounded-full bg-snow px-6 text-obsidian hover:bg-snow/90"
              onClick={() => {
                window.location.href = portalBrowse();
              }}
            >
              Tìm nhiếp ảnh gia
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/30 bg-transparent px-6 text-snow hover:bg-white/10 hover:text-snow"
              onClick={() => navigate("/signup")}
            >
              <Camera className="size-4" />
              Trở thành nhiếp ảnh gia
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
