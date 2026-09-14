import bcrypt from 'bcryptjs';
import { PrismaClient, RequestStatus, Role } from '@prisma/client';
const prisma = new PrismaClient();
const ago = (hours: number) => new Date(Date.now() - hours * 3600000);
async function main() {
  const hash = await bcrypt.hash('Password123!', 12);
  await prisma.maintenanceRequest.deleteMany();
  await prisma.user.deleteMany();
  const admin = await prisma.user.create({
    data: { name: 'Avery Admin', email: 'admin@example.com', passwordHash: hash, role: Role.ADMIN },
  });
  void admin;
  const clients = await Promise.all(
    ['Alice Client', 'Bob Client', 'Carla Client'].map((name, i) =>
      prisma.user.create({
        data: {
          name,
          email: `${name.split(' ')[0].toLowerCase()}@example.com`,
          passwordHash: hash,
          role: Role.CLIENT,
        },
      }),
    ),
  );
  const rows = [
    ['Leaking kitchen faucet', 'The kitchen faucet drips continuously.', RequestStatus.NEW, 30],
    ['Broken hallway light', 'The hallway fixture will not switch on.', RequestStatus.NEW, 28],
    ['No hot water', 'Hot water is unavailable in the unit.', RequestStatus.NEW, 6],
    ['Window latch repair', 'Bedroom window latch is loose.', RequestStatus.NEW, 2],
    ['HVAC inspection', 'Air conditioner makes a rattling noise.', RequestStatus.IN_PROGRESS, 48],
    ['Garage door remote', 'Remote no longer opens the garage.', RequestStatus.DONE, 72],
    ['Bathroom fan noise', 'Fan produces a loud grinding sound.', RequestStatus.IN_PROGRESS, 18],
    ['Outlet replacement', 'Living room outlet is intermittently powered.', RequestStatus.DONE, 96],
    ['Fence panel repair', 'Rear fence panel is leaning.', RequestStatus.NEW, 26],
    ['Smoke detector battery', 'Detector chirps after battery replacement.', RequestStatus.NEW, 12],
    ['Dishwasher drainage', 'Dishwasher leaves standing water.', RequestStatus.IN_PROGRESS, 36],
    ['Door weather strip', 'Front door lets in a noticeable draft.', RequestStatus.DONE, 120],
  ] as const;
  for (let i = 0; i < rows.length; i++) {
    const [title, description, status, hours] = rows[i];
    const done = status === RequestStatus.DONE;
    await prisma.maintenanceRequest.create({
      data: {
        clientId: clients[i % clients.length].id,
        title,
        description,
        status,
        createdAt: ago(hours),
        updatedAt: ago(Math.max(hours - 1, 0)),
        resolutionNote: done
          ? 'Maintenance completed and the resident confirmed the repair.'
          : null,
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
