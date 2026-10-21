import { ShelfIllustration } from "./ShelfIllustration";

export function ShelfScene() {
  return (
    <section className="mx-auto mt-10 max-w-[740px] sm:mt-[50px]" aria-labelledby="shelf-title">
      <ShelfIllustration />
      <div
        className="relative h-3 rounded-[2px] bg-[#b59e7b] shadow-[0_10px_16px_#5d4b2a14] after:absolute after:inset-x-[8%] after:top-3 after:h-5 after:bg-linear-to-b after:from-[#b7a38216] after:to-transparent"
        aria-hidden="true"
      />
      <div className="px-4 pt-[34px] pb-[42px] text-center">
        <span className="eyebrow text-[9px] tracking-[1.6px]">THE BEGINNING OF SOMETHING</span>
        <h2 id="shelf-title" className="my-3 font-serif text-[30px] font-normal tracking-[-0.6px]">
          Your shelf is waiting.
        </h2>
        <p className="text-[13px] leading-[1.7] text-muted">
          Soon, a place for your photographs, words, and familiar voices.
        </p>
      </div>
    </section>
  );
}
