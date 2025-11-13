const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@makutaplace.com' },
    update: {},
    create: {
      email: 'superadmin@makutaplace.com',
      phone: '+243810000001',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
      province: 'Kinshasa',
      city: 'Kinshasa'
    },
  });

  // Create main categories
  const categories = [
    {
      name: 'Real Estate',
      nameFr: 'Immobilier',
      nameSw: 'Mali isiyo onekana',
      slug: 'real-estate',
      icon: '🏠',
      children: [
        { name: 'Houses for Rent', nameFr: 'Maisons à Louer', nameSw: 'Nyumba za Kukodisha', slug: 'houses-rent' },
        { name: 'Houses for Sale', nameFr: 'Maisons à Vendre', nameSw: 'Nyumba za Kuuza', slug: 'houses-sale' },
        { name: 'Apartments for Rent', nameFr: 'Appartements à Louer', nameSw: 'Maatu ya Kukodisha', slug: 'apartments-rent' },
        { name: 'Apartments for Sale', nameFr: 'Appartements à Vendre', nameSw: 'Maatu ya Kuuza', slug: 'apartments-sale' },
        { name: 'Offices', nameFr: 'Bureaux', nameSw: 'Mafundi', slug: 'offices' },
      ]
    },
    {
      name: 'Vehicles',
      nameFr: 'Véhicules',
      nameSw: 'Magari',
      slug: 'vehicles',
      icon: '🚗',
      children: [
        { name: 'Cars for Sale', nameFr: 'Voitures à Vendre', nameSw: 'Magari ya Kuuza', slug: 'cars-sale' },
        { name: 'Cars for Rent', nameFr: 'Voitures à Louer', nameSw: 'Magari ya Kukodisha', slug: 'cars-rent' },
        { name: 'Motorcycles', nameFr: 'Motos', nameSw: 'Pikipiki', slug: 'motorcycles' },
        { name: 'Trucks & Vans', nameFr: 'Camions et Fourgonnettes', nameSw: 'Malori na Mabenki', slug: 'trucks-vans' },
      ]
    },
    {
      name: 'Domestic Services',
      nameFr: 'Services Domestiques',
      nameSw: 'Huduma za Nyumbani',
      slug: 'domestic-services',
      icon: '👨‍👩‍👧‍👦',
      children: [
        { name: 'Nannies', nameFr: 'Nounous', nameSw: 'Yaya', slug: 'nannies' },
        { name: 'Cleaners', nameFr: 'Nettoyeurs', nameSw: 'Wasafishaji', slug: 'cleaners' },
        { name: 'Gardeners', nameFr: 'Jardiniers', nameSw: 'Walimu wa Bustani', slug: 'gardeners' },
        { name: 'Drivers', nameFr: 'Chauffeurs', nameSw: 'Madereva', slug: 'drivers' },
      ]
    },
    {
      name: 'Skilled Services',
      nameFr: 'Services Qualifiés',
      nameSw: 'Huduma za Ufundi',
      slug: 'skilled-services',
      icon: '🔧',
      children: [
        { name: 'Electricians', nameFr: 'Électriciens', nameSw: 'Waelektroniki', slug: 'electricians' },
        { name: 'Plumbers', nameFr: 'Plombiers', nameSw: 'Wafundi wa Bomba', slug: 'plumbers' },
        { name: 'Painters', nameFr: 'Peintres', nameSw: 'Wachoraji', slug: 'painters' },
        { name: 'IT Technicians', nameFr: 'Techniciens IT', nameSw: 'Wataalamu wa IT', slug: 'it-technicians' },
      ]
    }
  ];

  for (const categoryData of categories) {
    const parentCategory = await prisma.category.create({
      data: {
        name: categoryData.name,
        nameFr: categoryData.nameFr,
        nameSw: categoryData.nameSw,
        slug: categoryData.slug,
        icon: categoryData.icon,
      }
    });

    for (const childData of categoryData.children) {
      await prisma.category.create({
        data: {
          ...childData,
          parentId: parentCategory.id
        }
      });
    }
  }

  // Create sample vendors and listings
  const vendorPassword = await bcrypt.hash('vendor123', 12);
  
  const vendor1 = await prisma.user.create({
    data: {
      email: 'realestate@example.com',
      phone: '+243810000002',
      password: vendorPassword,
      firstName: 'Jean',
      lastName: 'Mutombo',
      role: 'VENDOR',
      isVerified: true,
      province: 'Kinshasa',
      city: 'Gombe',
      idNumber: 'ID123456',
      idType: 'PASSPORT'
    }
  });

  const realEstateCategory = await prisma.category.findFirst({
    where: { slug: 'apartments-rent' }
  });

  // Create sample listings
  await prisma.listing.create({
    data: {
      title: 'Beautiful 3 Bedroom Apartment in Gombe',
      description: 'Spacious 3 bedroom apartment with modern amenities, located in the heart of Gombe. Perfect for professionals and families.',
      price: 1500,
      currency: 'USD',
      type: 'RENT',
      province: 'Kinshasa',
      city: 'Gombe',
      commune: 'Gombe',
      contactPhone: '+243810000002',
      contactEmail: 'realestate@example.com',
      categoryId: realEstateCategory.id,
      userId: vendor1.id,
      images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500'],
      status: 'APPROVED'
    }
  });

  console.log('Database seeded successfully!');
  console.log('Super Admin credentials:');
  console.log('Email: superadmin@makutaplace.com');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });