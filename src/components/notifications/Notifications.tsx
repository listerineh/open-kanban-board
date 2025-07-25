"use client";

import { Bell, CircleDot } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/use-notifications";
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "../ui/skeleton";

export function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } =
    useNotifications();

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium leading-none">Notifications</p>
            {unreadCount > 0 && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-[22rem]">
          {loading ? (
            <div className="p-2 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <Link href={notification.link} passHref key={notification.id}>
                <DropdownMenuItem
                  className="cursor-pointer flex items-start gap-3 whitespace-normal"
                  onSelect={() => handleNotificationClick(notification.id)}
                >
                  {!notification.read && (
                    <CircleDot className="h-2 w-2 mt-2 text-primary flex-shrink-0" />
                  )}
                  <div className={notification.read ? "pl-5" : ""}>
                    <p
                      className="text-sm leading-snug"
                      dangerouslySetInnerHTML={{ __html: notification.text }}
                    ></p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </DropdownMenuItem>
              </Link>
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground py-16">
              <p>You have no notifications.</p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
