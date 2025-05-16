const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const password = 'MyyP@s5wordIsP@s5w0rd';
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            email: 'NelsonBighetti@standford.edu',
            password: hashedPassword,
        },
    });

    console.log('Seeded user with email: user@example.com');
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });