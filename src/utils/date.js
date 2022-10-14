export function create_date_formatter(locale, options = {}) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "numeric",
    hourCycle: "h24",
    minute: "numeric",
    ...options,
  });
}

export function create_relative_formatter(locale) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "short" });
  const dtf = create_date_formatter(locale, { month: "numeric" });
  return function format_relative(date, date2) {
    const diff = Math.abs(new Date(date).valueOf() - new Date(date2).valueOf());
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return rtf.format(-seconds, "second");
    if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), "minute");
    if (seconds < 86400) return rtf.format(-Math.floor(seconds / 60 / 60), "hour");
    if (seconds < 1296000) return rtf.format(-Math.floor(seconds / 86400), "day"); // show until 15 days (1_296_000)
    return dtf.format(new Date(date));
  };
}
