import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  content: string;
};

export const Tooltip = ({ content }: TooltipProps) => {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  };

  const show = () => {
    updatePosition();
    setVisible(true);
  };

  const hide = () => setVisible(false);

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible]);

  return (
    <>
      <span
        ref={wrapRef}
        className="tooltip-wrap"
        tabIndex={0}
        aria-label={content}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <span className="tooltip-icon" aria-hidden="true">?</span>
      </span>
      {visible &&
        createPortal(
          <span
            className="tooltip-bubble"
            role="tooltip"
            aria-hidden="true"
            style={{ top: coords.top, left: coords.left }}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
};
