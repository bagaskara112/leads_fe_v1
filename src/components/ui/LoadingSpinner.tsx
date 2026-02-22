interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

export default function LoadingSpinner({
  size = "md",
  fullPage = false,
}: LoadingSpinnerProps) {
  const spinner = <div className={`spinner spinner--${size}`} />;

  if (fullPage) {
    return <div className="loading-page">{spinner}</div>;
  }

  return spinner;
}
