import { PrismaClient, Role, DiscountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('Seeding database...');

  const adminPassword = await hashPassword('admin123');
  const userPassword = await hashPassword('user123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@shopmyuniform.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@shopmyuniform.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@shopmyuniform.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'user@shopmyuniform.com',
      password: userPassword,
      role: Role.USER,
    },
  });

  console.log(`Created users: ${admin.email}, ${user.email}`);

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'mens-clothing' },
      update: {},
      create: {
        name: "Men's Clothing",
        slug: 'mens-clothing',
        description: 'Stylish clothing for men',
        image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&h=400&fit=crop',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'womens-clothing' },
      update: {},
      create: {
        name: "Women's Clothing",
        slug: 'womens-clothing',
        description: 'Trendy clothing for women',
        image: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&h=400&fit=crop',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'footwear' },
      update: {},
      create: {
        name: 'Footwear',
        slug: 'footwear',
        description: 'Comfortable and stylish footwear',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'accessories' },
      update: {},
      create: {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Complete your look with accessories',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sportswear' },
      update: {},
      create: {
        name: 'Sportswear',
        slug: 'sportswear',
        description: 'Performance wear for active lifestyles',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
      },
    }),
  ]);

  console.log(`Created ${categories.length} categories`);

  const mensId = categories[0].id;
  const womensId = categories[1].id;
  const footwearId = categories[2].id;
  const accessoriesId = categories[3].id;
  const sportswearId = categories[4].id;

  const products = [
    // Men's Clothing
    { name: 'Classic Oxford Shirt', slug: 'classic-oxford-shirt', description: 'A timeless oxford shirt crafted from premium cotton. Perfect for both casual and formal occasions.', price: 89.99, stockQuantity: 50, categoryId: mensId, sizes: ['S', 'M', 'L', 'XL'], colors: ['White', 'Blue', 'Pink'], images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=750&fit=crop'] },
    { name: 'Slim Fit Chinos', slug: 'slim-fit-chinos', description: 'Modern slim fit chinos with a comfortable stretch fabric. A wardrobe essential.', price: 69.99, stockQuantity: 75, categoryId: mensId, sizes: ['S', 'M', 'L', 'XL'], colors: ['Khaki', 'Navy', 'Black'], images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=750&fit=crop'] },
    { name: 'Denim Jacket', slug: 'denim-jacket', description: 'Classic denim jacket with a vintage wash. Made from durable selvedge denim.', price: 129.99, stockQuantity: 30, categoryId: mensId, sizes: ['M', 'L', 'XL'], colors: ['Blue', 'Black'], images: ['https://images.unsplash.com/photo-1551537482-f20782d7d666?w=600&h=750&fit=crop'] },
    { name: 'Polo T-Shirt', slug: 'polo-t-shirt', description: 'Premium cotton polo shirt. Breathable and comfortable for everyday wear.', price: 49.99, stockQuantity: 100, categoryId: mensId, sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['White', 'Navy', 'Red', 'Green'], images: ['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&h=750&fit=crop'] },
    { name: 'Linen Summer Shirt', slug: 'linen-summer-shirt', description: 'Lightweight linen shirt perfect for summer. Relaxed fit with a camp collar.', price: 79.99, stockQuantity: 40, categoryId: mensId, sizes: ['S', 'M', 'L', 'XL'], colors: ['Beige', 'Sky Blue', 'White'], images: ['https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=600&h=750&fit=crop'] },
    { name: 'Pleated Trousers', slug: 'pleated-trousers', description: 'High-waisted pleated trousers with a tapered leg. Italian-inspired design.', price: 99.99, stockQuantity: 35, categoryId: mensId, sizes: ['S', 'M', 'L', 'XL'], colors: ['Grey', 'Navy', 'Black'], images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=750&fit=crop'] },

    // Women's Clothing
    { name: 'Floral Summer Dress', slug: 'floral-summer-dress', description: 'Beautiful floral print dress with a flowing silhouette. Perfect for summer days.', price: 119.99, stockQuantity: 45, categoryId: womensId, sizes: ['XS', 'S', 'M', 'L'], colors: ['Floral Blue', 'Floral Pink'], images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=750&fit=crop'] },
    { name: 'High-Waist Mom Jeans', slug: 'high-waist-mom-jeans', description: 'Relaxed fit mom jeans with a high waist. Vintage-inspired with modern comfort.', price: 89.99, stockQuantity: 60, categoryId: womensId, sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['Light Blue', 'Dark Blue', 'Black'], images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop'] },
    { name: 'Silk Blouse', slug: 'silk-blouse', description: 'Elegant silk blouse with a relaxed fit. Perfect for office or evening wear.', price: 149.99, stockQuantity: 25, categoryId: womensId, sizes: ['XS', 'S', 'M', 'L'], colors: ['Ivory', 'Black', 'Burgundy'], images: ['https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&h=750&fit=crop'] },
    { name: 'Knit Cardigan', slug: 'knit-cardigan', description: 'Cozy knit cardigan made from soft merino wool. Oversized fit for layering.', price: 109.99, stockQuantity: 35, categoryId: womensId, sizes: ['S', 'M', 'L'], colors: ['Cream', 'Camel', 'Grey'], images: ['https://images.unsplash.com/photo-1434389677669-e08b4cda3a54?w=600&h=750&fit=crop'] },
    { name: 'Wrap Midi Skirt', slug: 'wrap-midi-skirt', description: 'Flattering wrap midi skirt with an adjustable tie waist. Versatile for any occasion.', price: 79.99, stockQuantity: 40, categoryId: womensId, sizes: ['XS', 'S', 'M', 'L'], colors: ['Black', 'Navy', 'Rust'], images: ['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=750&fit=crop'] },
    { name: 'Tailored Blazer', slug: 'tailored-blazer', description: 'Structured tailored blazer with a modern cut. Single-button closure.', price: 159.99, stockQuantity: 20, categoryId: womensId, sizes: ['XS', 'S', 'M', 'L'], colors: ['Black', 'Grey', 'Navy'], images: ['https://images.unsplash.com/photo-1539109136881-3db057153cc3?w=600&h=750&fit=crop'] },

    // Footwear
    { name: 'Leather Sneakers', slug: 'leather-sneakers', description: 'Premium leather sneakers with a minimalist design. Cushioned insole for all-day comfort.', price: 139.99, stockQuantity: 60, categoryId: footwearId, sizes: ['7', '8', '9', '10', '11'], colors: ['White', 'Black'], images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=750&fit=crop'] },
    { name: 'Canvas Low Tops', slug: 'canvas-low-tops', description: 'Classic canvas sneakers. Lightweight and versatile for everyday wear.', price: 59.99, stockQuantity: 80, categoryId: footwearId, sizes: ['7', '8', '9', '10', '11'], colors: ['White', 'Navy', 'Red'], images: ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&h=750&fit=crop'] },
    { name: 'Suede Chelsea Boots', slug: 'suede-chelsea-boots', description: 'Elegant suede Chelsea boots with elastic side panels. Goodyear welted sole.', price: 179.99, stockQuantity: 25, categoryId: footwearId, sizes: ['8', '9', '10', '11'], colors: ['Tan', 'Brown', 'Black'], images: ['https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&h=750&fit=crop'] },
    { name: 'Running Trainers', slug: 'running-trainers', description: 'Lightweight running shoes with responsive cushioning. Breathable mesh upper.', price: 119.99, stockQuantity: 50, categoryId: footwearId, sizes: ['7', '8', '9', '10', '11'], colors: ['Black', 'White', 'Blue'], images: ['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=750&fit=crop'] },
    { name: 'Leather Loafers', slug: 'leather-loafers', description: 'Handcrafted leather loafers with a penny keeper detail. Classic preppy style.', price: 159.99, stockQuantity: 30, categoryId: footwearId, sizes: ['8', '9', '10', '11'], colors: ['Brown', 'Black', 'Burgundy'], images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&h=750&fit=crop'] },

    // Accessories
    { name: 'Leather Belt', slug: 'leather-belt', description: 'Genuine leather belt with a brushed silver buckle. Width: 3.5cm.', price: 49.99, stockQuantity: 100, categoryId: accessoriesId, sizes: ['S', 'M', 'L', 'XL'], colors: ['Brown', 'Black'], images: ['https://images.unsplash.com/photo-1624222247344-550fbf026c89?w=600&h=750&fit=crop'] },
    { name: 'Aviator Sunglasses', slug: 'aviator-sunglasses', description: 'Classic aviator sunglasses with UV400 protection. Gold metal frame.', price: 79.99, stockQuantity: 60, categoryId: accessoriesId, sizes: ['One Size'], colors: ['Gold/Green', 'Silver/Blue'], images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=750&fit=crop'] },
    { name: 'Woven Scarf', slug: 'woven-scarf', description: 'Lightweight woven scarf in a herringbone pattern. 100% wool.', price: 39.99, stockQuantity: 70, categoryId: accessoriesId, sizes: ['One Size'], colors: ['Grey', 'Navy', 'Camel'], images: ['https://images.unsplash.com/photo-1601924994988-5ed19233d2a7?w=600&h=750&fit=crop'] },
    { name: 'Canvas Backpack', slug: 'canvas-backpack', description: 'Durable canvas backpack with leather trim. Multiple compartments for organization.', price: 89.99, stockQuantity: 40, categoryId: accessoriesId, sizes: ['One Size'], colors: ['Khaki', 'Navy', 'Black'], images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=750&fit=crop'] },

    // Sportswear
    { name: 'Running Shorts', slug: 'running-shorts', description: 'Lightweight running shorts with built-in brief. Moisture-wicking fabric.', price: 44.99, stockQuantity: 80, categoryId: sportswearId, sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Navy', 'Grey'], images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=750&fit=crop'] },
    { name: 'Yoga Leggings', slug: 'yoga-leggings', description: 'High-waisted yoga leggings with 4-way stretch. Squat-proof and opaque.', price: 69.99, stockQuantity: 70, categoryId: sportswearId, sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['Black', 'Navy', 'Burgundy'], images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&h=750&fit=crop'] },
    { name: 'Performance Tank Top', slug: 'performance-tank-top', description: 'Sleeveless performance tank with breathable mesh panels. Quick-dry technology.', price: 34.99, stockQuantity: 90, categoryId: sportswearId, sizes: ['S', 'M', 'L', 'XL'], colors: ['White', 'Black', 'Grey'], images: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=750&fit=crop'] },
    { name: 'Training Hoodie', slug: 'training-hoodie', description: 'Zip-up training hoodie with kangaroo pocket. Fleece-lined for warmth.', price: 79.99, stockQuantity: 45, categoryId: sportswearId, sizes: ['S', 'M', 'L', 'XL'], colors: ['Grey', 'Navy', 'Black'], images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=750&fit=crop'] },
    { name: 'Track Pants', slug: 'track-pants', description: 'Classic track pants with side stripe detail. Elastic waist with drawstring.', price: 59.99, stockQuantity: 55, categoryId: sportswearId, sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Navy', 'Grey'], images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=750&fit=crop'] },
  ];

  for (const product of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          ...product,
          isActive: true,
        },
      });
    }
  }

  console.log(`Created ${products.length} products`);

  console.log('Seeding coupons...');
  const coupons = [
    {
      code: 'SAVE10',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10.00,
      minOrderValue: 0.00,
      expiryDate: new Date('2027-12-31T23:59:59Z'),
      usageLimit: 100,
      isActive: true,
    },
    {
      code: 'WELCOME100',
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 100.00,
      minOrderValue: 500.00,
      expiryDate: new Date('2027-12-31T23:59:59Z'),
      usageLimit: 200,
      isActive: true,
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon,
    });
  }

  console.log('Seeding reviews...');
  const createdProducts = await prisma.product.findMany({ take: 5 });
  const demoUser = await prisma.user.findUnique({
    where: { email: 'user@shopmyuniform.com' },
  });

  if (demoUser && createdProducts.length > 0) {
    const reviewsData = [
      { rating: 5, comment: 'Excellent quality and perfect fit! Highly recommend.' },
      { rating: 4, comment: 'Very comfortable material, color is exactly as shown.' },
      { rating: 5, comment: 'Absolutely love it! Great value for money.' },
      { rating: 4, comment: 'Good quality fabric. Fits well, but shipping took a day longer.' },
      { rating: 5, comment: 'Super soft and stylish. Will definitely buy again!' },
    ];

    for (let i = 0; i < createdProducts.length; i++) {
      const product = createdProducts[i];
      const review = reviewsData[i];

      await prisma.review.upsert({
        where: {
          userId_productId: {
            userId: demoUser.id,
            productId: product.id,
          },
        },
        update: {},
        create: {
          rating: review.rating,
          comment: review.comment,
          userId: demoUser.id,
          productId: product.id,
        },
      });
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
