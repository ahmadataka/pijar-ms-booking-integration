import { fetchOdooContacts } from "../odooContacts.js";

async function main() {
  const contacts = await fetchOdooContacts();
  console.log(
    JSON.stringify(
      {
        count: contacts.length,
        contacts
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[fetchOdooContacts] failed");
  console.error(error);
  process.exit(1);
});
