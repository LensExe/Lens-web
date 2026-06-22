import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarCheck, Images, Search } from "lucide-react";
import { Button } from "@lens/ui";
import { useReveal } from "@lens/ui";

const steps = [
  {
    icon: Search,
    title: "Tìm kiếm & lọc",
    description:
      "Lọc theo phong cách, địa điểm, ngân sách và đánh giá để tìm người phù hợp nhất.",
  },
  {
    icon: Images,
    title: "Xem portfolio",
    description:
      "Khám phá bộ ảnh thực tế và đọc đánh giá từ khách hàng trước khi quyết định.",
  },
  {
    icon: CalendarCheck,
    title: "Đặt lịch & chụp",
    description:
      "Chọn ngày trống trên lịch, xác nhận và sẵn sàng cho buổi chụp của bạn.",
  },
];

export function HowItWorks() {
  const navigate = useNavigate();
  const scope = useRef<HTMLElement>(null);
  useReveal(scope);

  return (
    <section
      id="cach-hoat-dong"
      ref={scope}
      className="scroll-mt-20 bg-muted/30 px-5 py-20 lg:py-28"
    >
      <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.8fr_1fr] lg:gap-16">
        {/* Sticky heading */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Đặt lịch chụp trong ba bước
          </h2>
          <p className="mt-3 max-w-sm text-muted-foreground">
            Từ lúc tìm kiếm đến khi cầm máy, mọi thứ gọn gàng trên một nền tảng.
          </p>
          <Button
            className="mt-6 rounded-full px-6"
            onClick={() => navigate("/photographers")}
          >
            Bắt đầu ngay
            <ArrowRight className="size-4" />
          </Button>
        </div>

        {/* Stepped list with connector */}
        <ol className="relative">
          <span
            aria-hidden
            className="absolute left-6 top-3 bottom-3 w-px bg-border"
          />
          {steps.map((step, i) => (
            <li
              key={step.title}
              data-reveal
              className="relative flex gap-5 pb-10 last:pb-0"
            >
              <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
                <step.icon className="size-5" />
              </span>
              <div className="pt-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Bước {i + 1}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
