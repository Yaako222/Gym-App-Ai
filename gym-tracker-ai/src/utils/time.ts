export const syncTimeWithInternet = async () => {
  try {
    const res = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=UTC');
    if (!res.ok) return;
    const data = await res.json();
    const internetTime = new Date(data.dateTime).getTime();
    const localTime = new Date().getTime();
    const offset = internetTime - localTime;
    localStorage.setItem('gym_time_offset', offset.toString());
  } catch (e) {
    // Silently fail and use local time if API is blocked or offline
  }
};

export const getCurrentDate = (): Date => {
  const offset = parseInt(localStorage.getItem('gym_time_offset') || '0', 10);
  return new Date(Date.now() + offset);
};

export const getCurrentISODate = (): string => {
  return getCurrentDate().toISOString();
};

export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const tz = localStorage.getItem('gym_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    return d.toLocaleDateString('de-DE', { timeZone: tz, ...options });
  } catch (e) {
    return d.toLocaleDateString('de-DE', options);
  }
};
