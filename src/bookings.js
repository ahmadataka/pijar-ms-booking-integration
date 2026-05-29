import { graphGet } from "./graphClient.js";

function normalizeAttendee(attendee) {
  return {
    name: attendee?.emailAddress?.name || null,
    address: attendee?.emailAddress?.address || null,
    type: attendee?.type || null,
    status: attendee?.status?.response || null
  };
}

function normalizeBooking(event, roomEmail) {
  return {
    id: event.id || null,
    iCalUId: event.iCalUId || null,
    subject: event.subject || null,
    organizer: {
      name: event?.organizer?.emailAddress?.name || null,
      address: event?.organizer?.emailAddress?.address || null
    },
    roomEmail,
    start: event?.start?.dateTime || null,
    startTimeZone: event?.start?.timeZone || null,
    end: event?.end?.dateTime || null,
    endTimeZone: event?.end?.timeZone || null,
    isCancelled: Boolean(event.isCancelled),
    showAs: event.showAs || null,
    type: event.type || null,
    attendees: Array.isArray(event.attendees)
      ? event.attendees.map(normalizeAttendee)
      : [],
    webLink: event.webLink || null,
    lastModifiedDateTime: event.lastModifiedDateTime || null
  };
}

function buildCalendarViewPath(roomEmail, startIso, endIso) {
  const params = new URLSearchParams({
    startDateTime: startIso,
    endDateTime: endIso
  });

  return `/users/${encodeURIComponent(roomEmail)}/calendar/calendarView?${params.toString()}`;
}

export async function fetchRoomBookings(roomEmail, startIso, endIso) {
  const path = buildCalendarViewPath(roomEmail, startIso, endIso);
  const result = await graphGet(path);
  const items = Array.isArray(result.value) ? result.value : [];

  return items.map((event) => normalizeBooking(event, roomEmail));
}
