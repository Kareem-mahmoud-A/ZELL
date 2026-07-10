"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/layout/navbar";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Container, Section } from "@/components/layout/layout-primitives";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, role, logout } = useAuth();

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <Section className="py-20 text-center">
          <Container className="max-w-2xl flex flex-col gap-6 items-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Elevate Your Style with ZELL
            </h1>
            <p className="text-lg text-muted-foreground">
              Experience premium, modern fashion curated for you. Discover collections that redefine
              elegance.
            </p>
            {user ? (
              <div className="flex flex-col gap-4 items-center bg-card p-6 rounded-lg border border-border shadow-sm w-full max-w-sm mt-6">
                <span className="text-sm font-semibold text-foreground">
                  Logged in as: <span className="text-primary">{user.email}</span>
                </span>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">
                  Role: {role}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                  className="w-full mt-2"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex gap-4 mt-6">
                <a href="/login">
                  <Button variant="default">Sign In</Button>
                </a>
                <a href="/register">
                  <Button variant="outline">Create Account</Button>
                </a>
              </div>
            )}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
