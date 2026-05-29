function mapPrincipalToOdoo(principal, userMappingsByEmail) {
  const mapping = userMappingsByEmail.get((principal.address || "").toLowerCase()) || null;

  return {
    microsoftEmail: principal.address || null,
    displayName: principal.name || null,
    accessRole: principal.type || null,
    responseStatus: principal.status || null,
    odooUserId: mapping?.odooUserId || null,
    odooPartnerId: mapping?.odooPartnerId || null,
    employeeId: mapping?.employeeId || null
  };
}

export function buildOdooAccessPayloadPreview(handoffRoom, userMappingsByEmail) {
  const roomMapping = handoffRoom.odooMapping || {};

  return {
    microsoftRoomEmail: handoffRoom.microsoftRoom.emailAddress,
    odooRoomId: roomMapping.odooRoomId,
    odooRoomName: roomMapping.odooRoomName,
    controllerId: roomMapping.controllerId,
    site: roomMapping.site || handoffRoom.microsoftRoom.building || null,
    floor: roomMapping.floor || handoffRoom.microsoftRoom.floorLabel || null,
    bookings: handoffRoom.bookings.map((booking) => ({
      microsoftEventId: booking.microsoftEventId,
      iCalUId: booking.iCalUId,
      subject: booking.subject,
      organizer: mapPrincipalToOdoo(booking.organizer, userMappingsByEmail),
      start: booking.start,
      startTimeZone: booking.startTimeZone,
      end: booking.end,
      endTimeZone: booking.endTimeZone,
      isCancelled: booking.isCancelled,
      accessUsers: booking.accessPrincipals.map((principal) =>
        mapPrincipalToOdoo(principal, userMappingsByEmail)
      )
    }))
  };
}
