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

// Bootstrap default merchant "darlabhanumurthy@gmail.com"
const bootstrapMerchant = async () => {
  try {
    const merchantExists = await User.findOne({ email: 'darlabhanumurthy@gmail.com' });
    let merchantId;
    
    if (!merchantExists) {
      const hashedPassword = await hashPassword('Merchant@123!');
      const merchant = new User({
        email: 'darlabhanumurthy@gmail.com',
        hashed_password: hashedPassword,
        full_name: 'Darla Bhanu Murthy',
        role: 'merchant',
        account_number: 'RMMERCH0001',
        is_verified: true,
        is_first_login: false,
        is_active: true
      });
      await merchant.save();
      merchantId = merchant.id;
      console.log(`[Merchant Bootstrap] Created merchant user darlabhanumurthy@gmail.com (ID: ${merchantId})`);
    } else {
      merchantId = merchantExists.id;
      console.log(`[Merchant Bootstrap] Merchant user darlabhanumurthy@gmail.com already exists (ID: ${merchantId}).`);
    }
    
    const MerchantProfile = require('./models/MerchantProfile');
    const profileExists = await MerchantProfile.findOne({ user_id: merchantId });
    if (!profileExists) {
      const profile = new MerchantProfile({
        user_id: merchantId,
        business_name: 'Ratnamayuri Silks & Jewels',
        business_description: 'Premium heritage designer silks and fine jewellery',
        commission_rate: 10.0,
        is_approved: true
      });
      await profile.save();
      console.log('[Merchant Bootstrap] Created MerchantProfile successfully.');
    } else {
      console.log('[Merchant Bootstrap] MerchantProfile already exists.');
    }
  } catch (error) {
    console.error('Error bootstrapping Merchant:', error);
  }
};

// Helper function to run seed scripts as child processes
const runSeederScript = (scriptPath) => {
  const { fork } = require('child_process');
  return new Promise((resolve, reject) => {
    console.log(`[Seeder] Forking child process for ${scriptPath}...`);
    const child = fork(scriptPath);
    
    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`[Seeder] Script successfully completed.`);
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
};

// Seeding products and analytics/orders automatically if database is empty
const bootstrapDemoData = async () => {
  try {
    const Product = require('./models/Product');
    const productCount = await Product.countDocuments();
    if (productCount > 0) {
      console.log('[Demo Seeding] Products already exist in database. Skipping demo products and analytics seeding.');
      return;
    }
    
    console.log('[Demo Seeding] No products found in database. Starting automatic seeding of products and analytics...');
    const path = require('path');
    
    // 1. Seed products
    const seedProductsPath = path.join(__dirname, 'utils', 'seed_demo_products.js');
    await runSeederScript(seedProductsPath);
    
    // 2. Seed analytics (orders, customers, coupons)
    const seedAnalyticsPath = path.join(__dirname, 'utils', 'seed_analytics_data.js');
    await runSeederScript(seedAnalyticsPath);
    
    console.log('[Demo Seeding] Automatic seeding completed successfully!');
  } catch (err) {
    console.error('[Demo Seeding] Error during automatic seeding:', err);
  }
};

const startServer = async () => {
  // Hardlink powershell to Cwd to bypass runner path issues
  try {
    const fs = require('fs');
    const path = require('path');
    const targetPowerShell = path.join(__dirname, '../powershell.exe');
    if (!fs.existsSync(targetPowerShell)) {
      fs.linkSync('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', targetPowerShell);
      console.log('[System Workaround] Created powershell.exe hardlink successfully.');
    }
  } catch (err) {
    console.error('[System Workaround] Failed to create powershell hardlink:', err);
  }

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
  
  // Seed Merchant & Demo Products/Orders/Analytics (Disabled to maintain a completely fresh database)
  // await bootstrapMerchant();
  // await bootstrapDemoData();

  // Generate database status report
  try {
    require('./utils/status');
  } catch (statusErr) {
    console.error('Error running status check:', statusErr);
  }

  // Initialize Seller SLA Cron Scheduler
  try {
    const { initSLAScheduler } = require('./services/sla_scheduler');
    initSLAScheduler();
  } catch (slaErr) {
    console.error('Error starting SLA Scheduler:', slaErr);
  }

  // Start Listener
  app.listen(config.port, () => {
    console.log(`[${config.appName}] API server running on port ${config.port} in ${config.appEnv} mode`);
    
    // Start self-ping mechanism to bypass Render idle sleep limits in production
    try {
      keepServerAwake();
    } catch (err) {
      console.error('Failed to initialize keepServerAwake loop:', err);
    }
  });
};

// Self-pinging mechanism to keep Render awake in production
const keepServerAwake = () => {
  const https = require('https');
  const http = require('http');
  const backendUrl = config.backendUrl || 'https://ratnamayuri.onrender.com';

  // Only run this when APP_ENV is production and we have an external onrender domain
  if (config.appEnv !== 'production' && !backendUrl.includes('onrender.com')) {
    console.log('[Self-Ping] Skipping self-ping in non-production or local environment.');
    return;
  }

  const healthUrl = `${backendUrl.replace(/\/$/, '')}/api/health`;
  console.log(`[Self-Ping] Starting keep-awake loop. Will ping ${healthUrl} every 10 minutes.`);

  setInterval(() => {
    const client = healthUrl.startsWith('https') ? https : http;
    client.get(healthUrl, (res) => {
      console.log(`[Self-Ping] Awake-Ping sent to ${healthUrl}. Status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('[Self-Ping] Awake-Ping failed:', err.message);
    });
  }, 10 * 60 * 1000); // 10 minutes
};

startServer().catch(err => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});

// Force nodemon reload to apply category slug route fixes

