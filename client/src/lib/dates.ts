// Timestamps from the API are ISO UTC; people read them in Philippine time.
const MANILA_DATE_TIME = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTimeManila(iso: string): string {
  return MANILA_DATE_TIME.format(new Date(iso));
}
