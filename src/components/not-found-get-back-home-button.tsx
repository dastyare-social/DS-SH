"use client";

import { useRouter } from "next/navigation";
import { Button } from "./button";
import { useTranslations } from "next-intl";
import { useState } from "react";

/*
    —— used on global-not-found.tsx ——
*/
const NotFoundGetBackHomeButton = () => {
  const [is_clicked, set_is_clicked] = useState(false);

  const router = useRouter();

  const tNotFound = useTranslations("not_found");

  return (
    <Button
      disabled={is_clicked}
      className="text-sm md:text-sm mb-2"
      onClick={() => {
        set_is_clicked(true);
        router.push("/");
        router.refresh();
      }}
    >
      {tNotFound("back_to_home")}
    </Button>
  );
};

export default NotFoundGetBackHomeButton;
