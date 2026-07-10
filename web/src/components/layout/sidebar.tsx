"use client";

import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ShoppingBag, Heart, User, Settings, HelpCircle } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent side="left" className="w-[300px]">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="text-xl font-bold">ZELL Menu</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-6 py-6">
          <nav className="flex flex-col gap-2">
            {[
              { label: "New Arrivals", href: "#" },
              { label: "Women", href: "#" },
              { label: "Men", href: "#" },
              { label: "Accessories", href: "#" },
              { label: "Sale", href: "#" },
            ].map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-base font-medium px-4 py-2 hover:bg-secondary rounded-md transition-colors"
                onClick={onClose}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <hr className="border-border" />
          <nav className="flex flex-col gap-2">
            {[
              { label: "Shopping Bag", icon: ShoppingBag, href: "#" },
              { label: "Wishlist", icon: Heart, href: "#" },
              { label: "My Account", icon: User, href: "#" },
              { label: "Settings", icon: Settings, href: "#" },
              { label: "Help & Support", icon: HelpCircle, href: "#" },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <a
                  key={index}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                  onClick={onClose}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
