"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { recordRedirect } from "@/lib/actions/links";

const COUNTDOWN = 3;

const Page = () => {
  const tGeneral = useTranslations("general");
  const tRedirect = useTranslations("redirect_page");
  const params = useParams();

  // r_path may be string or string[] depending on Next.js version — normalise it
  const r_path = Array.isArray(params?.r_path)
    ? params.r_path[0]
    : (params?.r_path as string | undefined);

  const pageRef = useRef<HTMLDivElement | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);

  // Start the counter immediately — it only navigates away once destination is also ready
  const [counter, setCounter] = useState<number>(COUNTDOWN);
  const [destination, setDestination] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "loading" | "active" | "inactive" | "not_found"
  >("loading");
  const resolved = useRef(false);

  // ── page height ───────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => setPageHeight(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── resolve destination (once) ────────────────────────────────────────────
  useEffect(() => {
    if (!r_path || resolved.current) return;
    resolved.current = true;

    recordRedirect(r_path)
      .then((result) => {
        if (result.success && result.r_to) {
          setDestination(result.r_to);
          setStatus("active");
        } else {
          // Check if error indicates inactive link vs not found
          if (
            result.error?.includes("inactive") ||
            result.error?.includes("is inactive")
          ) {
            setStatus("inactive");
          } else {
            setStatus("not_found");
          }
        }
      })
      .catch((error) => {
        console.error("Redirect error:", error);
        setStatus("not_found");
      });
  }, [r_path]);

  // ── countdown — only ticks for active links ───────────────────────────────
  useEffect(() => {
    if (status !== "active") return;

    const t = setInterval(() => {
      setCounter((c) => {
        const next = c - 1;
        if (next <= 0) {
          clearInterval(t);
        }
        return next > 0 ? next : 0;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [status]);

  // ── redirect when counter hits 0 AND destination is known ─────────────────
  useEffect(() => {
    if (counter <= 0 && destination) {
      window.location.href = destination;
    }
  }, [counter, destination]);

  return (
    <div
      ref={pageRef}
      style={{ height: pageHeight !== null ? `${pageHeight}px` : "100vh" }}
      className="flex items-center justify-center"
    >
      <div className="flex flex-col gap-y-6 px-6 sm:w-sm tracking-[-1.5px] text-center">
        {status === "not_found" ? (
          <div className="flex flex-col gap-y-2">
            <div className="text-[25px] leading-8 text-primary">
              Link not found
            </div>
            <div className="text-[20px] opacity-80">
              — {tGeneral("app_name")}
            </div>
          </div>
        ) : status === "inactive" ? (
          <div className="flex flex-col gap-y-2">
            <div className="text-[25px] leading-8 text-primary">
              This link is inactive
            </div>
            <div className="text-[20px] opacity-80">
              — {tGeneral("app_name")}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-y-2">
            <div className="flex justify-center items-center mb-5 w-full">
              <div className="flex justify-center items-center size-10 text-5xl rounded-full border-2 border-dashed border-primary/5 aspect-square bg-primary/3 p-8 text-primary">
                {status === "active" && counter > 0 ? counter : "—"}
              </div>
            </div>
            <div className="text-[25px] leading-8">
              {tRedirect("title_prefix")}
              <span className="text-primary"> {tRedirect("title_suffix")}</span>
            </div>
            <div className="text-[20px] opacity-80">
              — {tGeneral("app_name")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
