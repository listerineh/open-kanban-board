'use client';

import { useLiveCursors } from '@/hooks/use-live-cursors';
import { OtherUserCursor } from './OtherUserCursor';

export function LiveCursors({ projectId }: { projectId: string }) {
  const otherUsers = useLiveCursors(projectId);

  return (
    <>
      {otherUsers.map(({ uid, cursor, displayName, theme }) => {
        if (!cursor) return null;

        return <OtherUserCursor key={uid} x={cursor.x} y={cursor.y} displayName={displayName} theme={theme} />;
      })}
    </>
  );
}
