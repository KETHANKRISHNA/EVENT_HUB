"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { CircleUser } from "lucide-react";

export function UserMenu({
  user,
}: {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
  };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0 overflow-hidden">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-8 w-8 rounded-full object-cover border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <CircleUser className="h-6 w-6 text-muted-foreground" />
            )}
            <span className="sr-only">Toggle user menu</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">{user.name || "User"}</p>
              {user.email && (
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/profile" />} nativeButton={false}>
            Profile
          </DropdownMenuItem>
          {user.role === "ORGANIZER" && (
            <DropdownMenuItem render={<Link href="/organizer" />} nativeButton={false}>
              Dashboard
            </DropdownMenuItem>
          )}
          {user.role === "MANAGER" && (
            <DropdownMenuItem render={<Link href="/manager" />} nativeButton={false}>
              Manager Dashboard
            </DropdownMenuItem>
          )}

          {user.role === "ATTENDEE" && (
            <DropdownMenuItem render={<Link href="/my-bookings" />} nativeButton={false}>
              My Bookings
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logoutAction()}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
