function normalizePerson(person) {
  return {
    name: person?.name || null,
    address: person?.address || null
  };
}

function extractAccessPrincipals(attendees, roomEmail) {
  const roomEmailLower = (roomEmail || "").toLowerCase();

  return attendees
    .filter((attendee) => {
      const email = (attendee.address || "").toLowerCase();
      return attendee.type !== "resource" && email && email !== roomEmailLower;
    })
    .map((attendee) => ({
      ...normalizePerson(attendee),
      type: attendee.type || null,
      status: attendee.status || null
    }));
}

export function buildOdooHandoffPreview({ room, mapping, bookings }) {
  return {
    microsoftRoom: {
      id: room.id,
      displayName: room.displayName,
      emailAddress: room.emailAddress,
      building: room.building,
      floor: room.floor,
      floorLabel: room.floorLabel,
      capacity: room.capacity
    },
    odooMapping: mapping || null,
    bookingCount: bookings.length,
    bookings: bookings.map((booking) => ({
      microsoftEventId: booking.id,
      iCalUId: booking.iCalUId,
      subject: booking.subject,
      organizer: normalizePerson(booking.organizer),
      roomEmail: booking.roomEmail,
      start: booking.start,
      startTimeZone: booking.startTimeZone,
      end: booking.end,
      endTimeZone: booking.endTimeZone,
      isCancelled: booking.isCancelled,
      lastModifiedDateTime: booking.lastModifiedDateTime,
      accessPrincipals: extractAccessPrincipals(booking.attendees || [], booking.roomEmail)
    }))
  };
}
