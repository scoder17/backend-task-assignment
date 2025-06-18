import { PrismaClient, Contact } from '../generated/prisma';

const prisma = new PrismaClient();

interface IdentifyInput {
  email?: string | null;
  phoneNumber?: string | null;
}

interface IdentifyResponse {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export const handleIdentify = async ({
  email,
  phoneNumber,
}: IdentifyInput): Promise<IdentifyResponse> => {
  if (!email && !phoneNumber) {
    throw new Error('At least one of email or phoneNumber must be provided.');
  }

  // Step 1: Fetch all relevant contacts
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email || undefined },
        { phoneNumber: phoneNumber || undefined },
      ],
    },
    orderBy: { createdAt: 'asc' }, // oldest first
  });

  // Step 2: Handle new user (no existing contact)
  if (contacts.length === 0) {
    const newPrimary = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: 'primary',
      },
    });

    return {
      contact: {
        primaryContatctId: newPrimary.id,
        emails: [newPrimary.email!],
        phoneNumbers: [newPrimary.phoneNumber!],
        secondaryContactIds: [],
      },
    };
  }

  // Step 3: Reconciliation logic
  // Collect all related contacts recursively
  const allRelatedContacts: Contact[] = [];
  const visited = new Set<number>();
  const toVisit = [...contacts];

  while (toVisit.length) {
    const current = toVisit.pop();
    if (!current || visited.has(current.id)) continue;
    visited.add(current.id);
    allRelatedContacts.push(current);

    if (current.linkedId) {
      const parent = await prisma.contact.findUnique({
        where: { id: current.linkedId },
      });
      if (parent) toVisit.push(parent);
    } else {
      const children = await prisma.contact.findMany({
        where: { linkedId: current.id },
      });
      toVisit.push(...children);
    }
  }

  // Step 4: Determine primary contact (oldest)
  const primaryContact = allRelatedContacts.reduce((oldest, contact) =>
    contact.createdAt < oldest.createdAt ? contact : oldest
  );

  // Step 5: Check if we need to create a new secondary contact
  const infoAlreadyExists = allRelatedContacts.some(
    (c) =>
      (c.email === email && email) ||
      (c.phoneNumber === phoneNumber && phoneNumber)
  );

  if (!infoAlreadyExists && (email || phoneNumber)) {
    await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkedId: primaryContact.id,
        linkPrecedence: 'secondary',
      },
    });
  }

  // Step 6: Re-fetch updated list
  const finalContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryContact.id },
        { linkedId: primaryContact.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  const emails = [
    ...new Set(finalContacts.map((c) => c.email).filter(Boolean)),
  ] as string[];

  const phoneNumbers = [
    ...new Set(finalContacts.map((c) => c.phoneNumber).filter(Boolean)),
  ] as string[];

  const secondaryContactIds = finalContacts
    .filter((c) => c.id !== primaryContact.id)
    .map((c) => c.id);

  return {
    contact: {
      primaryContatctId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  };
};