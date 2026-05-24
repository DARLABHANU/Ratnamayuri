const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config');
const User = require('./models/User');
const { hashPassword } = require('./middleware/auth');

// Bootstrap default admin if not exists
const bootstrapAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Super Admin already exists.');
      return;
    }

    const hashedPassword = await hashPassword(config.adminPassword);
    const admin = new User({
      email: config.adminEmail,
      hashed_password: hashedPassword,
      full_name: 'Super Admin',
      role: 'admin',
      account_number: 'RMADMIN0001',
      is_verified: true,
      is_first_login: false,
      is_active: true
    });

    await admin.save();
    console.log(`Super Admin bootstrapped successfully: ${config.adminEmail}`);
  } catch (error) {
    console.error('Error bootstrapping Super Admin:', error);
  }
};

// Bootstrap default categories if not exists
const bootstrapCategories = async () => {
  try {
    const Category = require('./models/Category');
    const count = await Category.countDocuments();
    if (count > 0) {
      console.log('Categories already exist in database.');
      return;
    }

    const defaultCategories = [
      { name: 'Luxury Jewellery', slug: 'jewellery', sort_order: 1 },
      { name: 'Silk Sarees', slug: 'sarees', sort_order: 2 },
      { name: 'Bridal', slug: 'bridal', sort_order: 3 }
    ];

    for (const cat of defaultCategories) {
      const newCat = new Category(cat);
      await newCat.save();
    }
    console.log('Default categories bootstrapped successfully.');
  } catch (error) {
    console.error('Error bootstrapping categories:', error);
  }
};

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Normalize any legacy blank SKUs in existing database entries to prevent index blocks
  try {
    const Product = require('./models/Product');
    const result = await Product.updateMany({ sku: "" }, { $set: { sku: null } });
    if (result.modifiedCount > 0) {
      console.log(`[Self-Healing] Normalized ${result.modifiedCount} legacy blank SKU values in the database to null.`);
    }
  } catch (err) {
    console.error('Error during self-healing SKU normalization:', err);
  }

  // Seed default Admin & Categories
  await bootstrapAdmin();
  await bootstrapCategories();

  // Start Listener
  app.listen(config.port, () => {
    console.log(`[${config.appName}] API server running on port ${config.port} in ${config.appEnv} mode`);
  });
};

startServer().catch(err => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});

// Force nodemon reload to apply category slug route fixes

