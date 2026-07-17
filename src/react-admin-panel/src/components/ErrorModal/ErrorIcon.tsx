

export const ErrorIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="46"
    height="46"
    viewBox="0 0 46 46"
    fill="none"
    {...props}
  >
    <rect width="46" height="46" rx="23" fill="#E53935" />

    <path
      d="M15 15 L31 31 M31 15 L15 31"
      stroke="white"
      stroke-width="4"
      stroke-linecap="round"
    />
  </svg>
);
