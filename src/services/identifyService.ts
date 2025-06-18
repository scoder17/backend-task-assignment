// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export async function identifyContact(email?: string, phoneNumber?: string) {
//   const contacts = await prisma.contact.findMany({
//     where: {
//       OR: [
//         { email: email || undefined },
//         { phoneNumber: phoneNumber || undefined }
//       ]
//     }
//   });

//   // If no contacts exist — create new primary
//   if (contacts.length === 0) {
//     const newContact = await prisma.contact.create({
//       data: {
//         email,
//         phoneNumber,
//         linkPrecedence: 'primary'
//       }
//     });
//     return {
//       primaryContatctId: newContact.id,
//       emails: [newContact.email].filter(Boolean),
//       phoneNumbers: [newContact.phoneNumber].filter(Boolean),
//       secondaryContactIds: []
//     };
//   }

//   // Consolidate all linked contacts
//   const contactIds = new Set<number>();
//   contacts.forEach(c => contactIds.add(c.id));
//   contacts.forEach(c => c.linkedId && contactIds.add(c.linkedId));

//   const allLinkedContacts = await prisma.contact.findMany({
//     where: {
//       OR: [
//         { id: { in: Array.from(contactIds) } },
//         { linkedId: { in: Array.from(contactIds) } }
//       ]
//     }
//   });

//   // Identify oldest primary
//   const primary = allLinkedContacts
//     .filter(c => c.linkPrecedence === 'primary')
//     .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

//   // Create new secondary if necessary
//   const existing = allLinkedContacts.find(
//     c => c.email === email && c.phoneNumber === phoneNumber
//   );
//   if (!existing) {
//     await prisma.contact.create({
//       data: {
//         email,
//         phoneNumber,
//         linkPrecedence: 'secondary',
//         linkedId: primary.id
//       }
//     });
//   }

//   const finalContacts = await prisma.contact.findMany({
//     where: {
//       OR: [
//         { id: primary.id },
//         { linkedId: primary.id }
//       ]
//     }
//   });

//   const emails = [...new Set(finalContacts.map(c => c.email).filter(Boolean))];
//   const phones = [...new Set(finalContacts.map(c => c.phoneNumber).filter(Boolean))];
//   const secondaryIds = finalContacts
//     .filter(c => c.linkPrecedence === 'secondary')
//     .map(c => c.id);

//   return {
//     primaryContatctId: primary.id,
//     emails,
//     phoneNumbers: phones,
//     secondaryContactIds: secondaryIds
//   };
// }

import { PrismaClient } from '../generated/prisma'
const prisma = new PrismaClient();

interface IdentifyRequest {
  email?: string;
  phoneNumber?: string;
}

export const handleIdentify = async (input: IdentifyRequest) => {
  const { email, phoneNumber } = input;

  // Step 1: Find all related contacts
  const allContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email || undefined },
        { phoneNumber: phoneNumber || undefined },
      ],
      deletedAt: null,
    },
  });

  if (allContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "primary",
      },
    });

    return {
      primaryContatctId: newContact.id,
      emails: [newContact.email!],
      phoneNumbers: [newContact.phoneNumber!],
      secondaryContactIds: [],
    };
  }

  // You will now need to:
  // 1. Find the true primary contact
  // 2. If email or phoneNumber is new, create a secondary
  // 3. Merge if multiple primaries
  // 4. Return all related contacts

  // [We’ll implement this full logic next if you want]

  return {}; // Placeholder
};
