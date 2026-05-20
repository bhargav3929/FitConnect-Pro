"use client";

import { useEffect } from "react";
import { useClientAuthStore } from "@fitconnect/shared/stores/clientAuthStore";
import { FreeClassPopup } from "@/components/ui/FreeClassPopup";
import { HeroSection } from "@/components/home/HeroSection";
import { WhySolSection } from "@/components/home/WhySolSection";
import { ClassTypesSection } from "@/components/home/ClassTypesSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { TavaroSection } from "@/components/home/TavaroSection";
import { FoundingMembershipSection } from "@/components/home/FoundingMembershipSection";
import { InstagramSection } from "@/components/home/InstagramSection";

export default function Home() {
  const { isAuthenticated, initAuth } = useClientAuthStore();

  useEffect(() => {
    const unsub = initAuth();
    return unsub;
  }, [initAuth]);

  return (
    <main className="min-h-screen bg-peach-200 text-olive-400 font-sans overflow-x-hidden">
      <HeroSection />
      <WhySolSection />
      <ClassTypesSection />
      <TestimonialsSection />
      <TavaroSection />
      <FoundingMembershipSection />
      <InstagramSection id={"solpilatesstudio.in"}/>
      <FreeClassPopup isAuthenticated={isAuthenticated} />
    </main>
  );
}
