function toOdooDatetime(dateTime, timeZone) {
  if (!dateTime) return null;
  const source = timeZone && timeZone !== "UTC" ? `${dateTime} ${timeZone}` : `${dateTime}Z`;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) {
    return dateTime.replace("T", " ").slice(0, 19);
  }

  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function dedupePartnerIds(values) {
  return [...new Set(values.filter((x) => Number.isInteger(x) && x > 0))];
}

export function buildOdooBookingPayload(payloadRoom) {
  return {
    microsoftRoomEmail: payloadRoom.microsoftRoomEmail,
    odooRoomId: payloadRoom.odooRoomId,
    bookings: payloadRoom.bookings.map((booking) => {
      const guestContactIds = dedupePartnerIds(
        booking.accessUsers.map((user) => user.odooPartnerId)
      );

      return {
        source: {
          microsoftEventId: booking.microsoftEventId,
          iCalUId: booking.iCalUId
        },
        ready: Boolean(payloadRoom.odooRoomId && booking.organizer.odooPartnerId),
        missing: {
          room: !payloadRoom.odooRoomId,
          organizerPartner: !booking.organizer.odooPartnerId,
          guestContacts: booking.accessUsers
            .filter((user) => !user.odooPartnerId)
            .map((user) => user.microsoftEmail)
        },
        request: {
          name: booking.subject || "Microsoft Synced Booking",
          room_id: payloadRoom.odooRoomId,
          organizer_id: booking.organizer.odooPartnerId,
          start_datetime: toOdooDatetime(booking.start, booking.startTimeZone),
          end_datetime: toOdooDatetime(booking.end, booking.endTimeZone),
          description: `Synced from Microsoft booking ${booking.microsoftEventId}`,
          guest_contact_ids: guestContactIds
        }
      };
    })
  };
}
