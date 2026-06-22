import { ScrollReveal } from "@lens/ui";

// Word-by-word reveal statement (React Bits ScrollReveal). Distinct layout
// family: a single centered editorial line, lots of breathing room.
export function Statement() {
  return (
    <section className="px-5 py-24 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <ScrollReveal
          baseOpacity={0.12}
          enableBlur
          blurStrength={5}
          baseRotation={2}
          containerClassName="!my-0"
          textClassName="text-2xl font-semibold leading-snug tracking-tight md:text-4xl"
        >
          Mỗi bức ảnh là một câu chuyện. Lens giúp bạn tìm đúng người kể câu
          chuyện đó, theo cách của riêng bạn.
        </ScrollReveal>
      </div>
    </section>
  );
}
