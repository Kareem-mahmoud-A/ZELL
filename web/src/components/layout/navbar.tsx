"use client";

import React, { useState, useEffect } from "react";
import { Menu, Heart, User, Sun, Moon } from "lucide-react";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Container } from "./layout-primitives";
import { SearchBar } from "./search-bar";
import { Sidebar } from "./sidebar";

import Link from "next/link";
import { MiniCart } from "@/components/cart/mini-cart";

export function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/" className="flex items-center gap-2 select-none">
              <span className="font-sans font-bold text-xl tracking-widest uppercase">ZELL</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            {[
              { label: "Products", href: "/products" },
              { label: "New Arrivals", href: "/products?sort=newest" },
              { label: "Featured", href: "/products?featured=true" },
            ].map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex flex-1 justify-center max-w-md">
            <SearchBar />
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle dark mode">
              {mounted && theme === "dark" ? (
                <Sun className="h-5 w-5 transition-transform" />
              ) : (
                <Moon className="h-5 w-5 transition-transform" />
              )}
            </Button>
            <Link href="/wishlist">
              <Button variant="ghost" size="icon" aria-label="Favorites" className="cursor-pointer">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
            <MiniCart />
            <Link href="/profile">
              <Button
                variant="ghost"
                size="icon"
                aria-label="User Account"
                className="cursor-pointer"
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </Container>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}
