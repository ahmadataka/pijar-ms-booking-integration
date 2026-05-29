import { odooGet } from "./odooClient.js";

function normalizeContact(contact) {
  return {
    id: contact.id ?? null,
    name: contact.name ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    mobile: contact.mobile ?? null,
    roleId: contact.role_id ?? null,
    smartOfficeRole: contact.smart_office_role ?? null
  };
}

export async function fetchOdooContacts(params = {}) {
  const data = await odooGet("/api/v1/contacts", params);
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];

  return items.map(normalizeContact);
}
