import { PrismaClient, RequestPriority, RequestStatus, Role } from '@prisma/client';
const prisma = new PrismaClient();
const ago = (hours: number) => new Date(Date.now() - hours * 3600000);
async function main() {
  await prisma.maintenanceRequest.deleteMany();
  await prisma.user.deleteMany();
  const admin = await prisma.user.create({
    data: { name: 'Avery Admin', email: 'admin@example.com', role: Role.ADMIN },
  });
  void admin;
  const clients = await Promise.all(
    ['Cedar Foods', 'BlueWave Clinic', 'Nova Retail'].map((name) =>
      prisma.user.create({
        data: {
          name,
          email: `${name.split(' ')[0].toLowerCase()}@example.com`,
          role: Role.CLIENT,
        },
      }),
    ),
  );
  const rows = [
    [
      'Contact form submissions are not arriving',
      'Website leads from the contact page are not reaching the shared inbox.',
      RequestPriority.URGENT,
      RequestStatus.NEW,
      30,
    ],
    [
      'Homepage hero image needs replacing',
      'Client sent a new campaign banner by WhatsApp and wants it published.',
      RequestPriority.NORMAL,
      RequestStatus.NEW,
      28,
    ],
    [
      'Mobile app crashes on login',
      'Several users reported the Android app closes after entering credentials.',
      RequestPriority.URGENT,
      RequestStatus.NEW,
      6,
    ],
    [
      'Footer phone number is outdated',
      'The support phone number changed and should be updated site-wide.',
      RequestPriority.LOW,
      RequestStatus.NEW,
      2,
    ],
    [
      'Checkout payment error',
      'Customers can add items to cart but payment fails before confirmation.',
      RequestPriority.NORMAL,
      RequestStatus.IN_PROGRESS,
      48,
    ],
    [
      'Add careers page link',
      'The client asked to add the new careers page to the main navigation.',
      RequestPriority.LOW,
      RequestStatus.DONE,
      72,
    ],
    [
      'CMS editor cannot upload images',
      'The content team sees an upload error when replacing product photos.',
      RequestPriority.NORMAL,
      RequestStatus.IN_PROGRESS,
      18,
    ],
    [
      'SSL certificate warning',
      'Visitors briefly saw a browser security warning on the client portal.',
      RequestPriority.URGENT,
      RequestStatus.DONE,
      96,
    ],
    [
      'Booking calendar is not loading',
      'The appointment calendar stays blank on desktop and mobile browsers.',
      RequestPriority.URGENT,
      RequestStatus.NEW,
      26,
    ],
    [
      'Blog post formatting cleanup',
      'A newly published article has spacing issues and oversized headings.',
      RequestPriority.NORMAL,
      RequestStatus.NEW,
      12,
    ],
    [
      'Slow product listing page',
      'The shop category page takes too long to load during peak traffic.',
      RequestPriority.URGENT,
      RequestStatus.IN_PROGRESS,
      36,
    ],
    [
      'Email template logo update',
      'Transactional emails needed the refreshed brand logo and footer links.',
      RequestPriority.LOW,
      RequestStatus.DONE,
      120,
    ],
  ] as const;
  for (let i = 0; i < rows.length; i++) {
    const [title, description, priority, status, hours] = rows[i];
    const done = status === RequestStatus.DONE;
    await prisma.maintenanceRequest.create({
      data: {
        clientId: clients[i % clients.length].id,
        title,
        description,
        priority,
        status,
        statusChangedAt: ago(hours),
        createdAt: ago(hours),
        updatedAt: ago(Math.max(hours - 1, 0)),
        resolutionNote: done ? 'Update completed and confirmed with the client.' : null,
        resolvedAt: done ? ago(Math.max(hours - 2, 0)) : null,
      },
    });
  }
  console.info('Seeded admin, 3 clients, and 12 requests.');
}
main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
