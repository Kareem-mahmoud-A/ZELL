import React from "react";
import { Container } from "./layout-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <Container className="py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="flex flex-col gap-4">
          <span className="font-bold text-lg tracking-widest uppercase select-none">ZELL</span>
          <p className="text-sm text-muted-foreground">
            Experience premium, modern fashion curated for you. Elevate your style with ZELL.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">Shop</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                New Arrivals
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                Women
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                Men
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                Accessories
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                Sale
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">Customer Service</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact Us
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                Shipping & Returns
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                FAQs
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                Size Guide
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                Order Tracking
              </a>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider">Stay Connected</h4>
          <p className="text-sm text-muted-foreground">
            Subscribe to our newsletter for exclusive offers and updates.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Your email address"
              className="bg-background max-w-[200px]"
              aria-label="Email address for newsletter"
              required
            />
            <Button size="sm">Subscribe</Button>
          </div>
        </div>
      </Container>
      <div className="border-t border-border py-6">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} ZELL Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
            <a href="#" className="hover:underline">
              Sitemap
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}
