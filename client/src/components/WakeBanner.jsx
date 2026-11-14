import { useEffect, useState } from 'react';
import { setWakingHandler } from '@/api/axios';

/**
 * WakeBanner: Placed ABOVE the app shell so it pushes content down instead of floating over buttons.
 */
export function WakeBanner() {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    setWakingHandler(setWaking);
  }, []);

  if (!waking) return null;

  return (
    <div role="status" className="wake">
      Waking up the server. The first load can take about a minute.
    </div>
  );
}

export default WakeBanner;
