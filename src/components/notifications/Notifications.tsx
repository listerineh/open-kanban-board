'use client';

import { Bell, CircleDot } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/use-notifications';
import { ScrollArea } from '../ui/scroll-area';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

export function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading, handleInvitationAction } = useNotifications();
  const router = useRouter();

  const handleNotificationClick = (notificationId: string, link: string) => {
    markAsRead(notificationId);
    if (link && link !== '#') {
      router.push(link);
    }
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
              <Button variant="link" size="sm" className="h-auto p-0" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-auto max-h-[calc(5*4.5rem)] overflow-y-auto">
          {loading ? (
            <div className="p-2 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer flex flex-col items-start gap-3 whitespace-normal data-[disabled]:cursor-default"
                onSelect={(e) => {
                  e.preventDefault();
                  if (!notification.actions) {
                    handleNotificationClick(notification.id, notification.link);
                  }
                }}
              >
                <div className="flex items-start gap-3 w-full">
                  {!notification.read && <CircleDot className="h-2 w-2 mt-2 text-primary flex-shrink-0" />}
                  <div className={notification.read ? 'pl-5' : ''}>
                    <p className="text-sm leading-snug" dangerouslySetInnerHTML={{ __html: notification.text }}></p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {notification.actions && (
                  <div className="flex items-center gap-2 w-full justify-end pl-5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleInvitationAction(
                          'decline',
                          notification.actions!.decline.projectId,
                          notification.actions!.decline.invitationId,
                          notification.id,
                        )
                      }
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleInvitationAction(
                          'accept',
                          notification.actions!.accept.projectId,
                          notification.actions!.accept.invitationId,
                          notification.id,
                        )
                      }
                    >
                      Accept
                    </Button>
                  </div>
                )}
              </DropdownMenuItem>
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
