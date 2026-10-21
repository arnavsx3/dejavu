/** Decorative objects, drawn locally rather than downloaded as remote assets. */
export function ShelfIllustration() {
  return (
    <div
      className="flex h-[145px] items-end justify-center gap-[23px] sm:h-40 sm:gap-14 sm:px-6"
      aria-hidden="true"
    >
      <svg
        className="h-[110px] w-[76px] shrink-0 -translate-y-0.5 rotate-[-9deg] drop-shadow-sm sm:h-[133px] sm:w-[104px]"
        viewBox="0 0 104 133"
        focusable="false"
      >
        <path d="M.5.5h103v132H.5z" fill="#eee3cc" stroke="#e0d1b5" />
        <circle cx="27" cy="30" r="10" fill="none" stroke="#b69861" />
        <path d="M16 70h72M16 79h72M16 88h47" stroke="#c4b48f" />
      </svg>
      <svg
        className="h-[137px] w-[106px] shrink-0 -translate-y-1 rotate-[5deg] drop-shadow-sm sm:h-[168px] sm:w-[146px]"
        viewBox="0 0 146 168"
        focusable="false"
      >
        <rect width="146" height="168" rx="2" fill="#89745c" />
        <path d="M8 8h130v152H8z" fill="#e8e0ce" />
        <svg x="17" y="17" width="112" height="134" viewBox="0 0 112 134" overflow="hidden">
          <path d="M0 0h112v134H0z" fill="#c7cec1" />
          <circle cx="86" cy="29" r="12" fill="#efdfba" />
          <ellipse cx="29" cy="122" rx="80" ry="55" fill="#83937b" transform="rotate(-20 29 122)" />
          <ellipse cx="93" cy="147" rx="80" ry="55" fill="#62745e" transform="rotate(-20 93 147)" />
        </svg>
      </svg>
      <svg
        className="h-[60px] w-[87px] shrink-0 -translate-y-0.5 rotate-[-4deg] sm:h-20 sm:w-[126px]"
        viewBox="0 0 126 80"
        focusable="false"
      >
        <rect x=".5" y=".5" width="125" height="79" rx="7" fill="#bd8066" stroke="#aa7059" />
        <rect x="12" y="13" width="102" height="32" rx="2" fill="#e4d8bc" />
        <g fill="none" stroke="#806e58" strokeWidth="4">
          <circle cx="38" cy="29" r="6.5" />
          <circle cx="88" cy="29" r="6.5" />
        </g>
        <path
          d="M35.5 66V59Q35.5 54 40.5 54H85.5Q90.5 54 90.5 59V66Z"
          fill="none"
          stroke="#945e48"
        />
      </svg>
    </div>
  );
}
