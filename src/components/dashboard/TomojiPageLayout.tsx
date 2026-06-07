import type { ReactNode } from "react";

interface TomojiPageLayoutProps {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** skip max-width wrapper — useful for wide assignment grids */
  wide?: boolean;
}

// one scroll container for all tomoji sub-pages — avoids nested scrollbars
export function TomojiPageLayout({
  header,
  children,
  footer,
  wide = false,
}: TomojiPageLayoutProps) {
  return (
    <section className="relative flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-neutral-800/80 px-8 py-5">
        {header}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-8 py-8">
        {wide ? (
          children
        ) : (
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        )}
      </div>

      {footer ? (
        <div className="shrink-0 border-t border-neutral-800/80 px-8 py-4">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
