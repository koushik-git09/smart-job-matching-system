import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import Chatbot from "@/app/components/Chatbot";

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Best-effort focus for accessibility without modifying Chatbot.
    const id = window.setTimeout(() => {
      const el = containerRef.current?.querySelector?.("input");
      if (el && typeof el.focus === "function") el.focus();
    }, 0);

    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-[9999]"
      style={{ bottom: 20, right: 20 }}
      aria-live="polite"
    >
      {/* Chat window stays mounted to preserve session state */}
      <div
        className={
          "transition-all duration-200 ease-out origin-bottom-right " +
          (open
            ? "opacity-100 translate-y-0 scale-100"
            : "pointer-events-none opacity-0 translate-y-2 scale-95")
        }
      >
        <div className="relative w-[360px] max-w-[90vw]">
          <div className="absolute right-2 top-2 z-10">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Chatbot />
        </div>
      </div>

      {/* Floating toggle button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full h-12 w-12 p-0"
          aria-label={open ? "Close chatbot" : "Open chatbot"}
          aria-expanded={open}
        >
          {open ? (
            <X className="w-5 h-5" />
          ) : (
            <MessageCircle className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
