#!/usr/bin/env node

/**
 * Password Setup Script
 *
 * This script helps you generate a secure bcrypt hash for your admin password.
 * Run this script to generate the ADMIN_PASSWORD_HASH environment variable.
 */

import bcrypt from 'bcrypt';
import { config } from 'dotenv';

// Load environment variables
config();

// Simplified PasswordManager class for setup script
class SetupPasswordManager {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      return isValid;
    } catch (error) {
      return false;
    }
  }

  static generateSecurePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }
}

async function setupPassword() {
  console.log('🔐 Custodial Command - Password Setup Utility');
  console.log('==========================================\n');

  // Check if password hash already exists
  if (process.env.ADMIN_PASSWORD_HASH) {
    console.log('⚠️  ADMIN_PASSWORD_HASH is already set in environment variables');
    console.log('   If you want to change the password, remove the existing hash first.\n');
  }

  // Get password from command line argument or prompt
  const passwordArg = process.argv[2];
  let password: string;

  if (passwordArg) {
    password = passwordArg;
    console.log(`📝 Using password from command line argument`);
  } else {
    console.log('💡 Please enter your admin password:');
    console.log('   Requirements: At least 8 characters, recommended to include letters, numbers, and symbols\n');

    // For production, you should use a more secure method to get the password
    // This is a simple implementation for demonstration
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    password = await new Promise<string>((resolve) => {
      rl.question('Enter password: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }
  }

  try {
    console.log('\n🔄 Generating secure password hash...');
    const hashedPassword = await SetupPasswordManager.hashPassword(password);

    console.log('✅ Password hash generated successfully!\n');
    console.log('📋 Environment Variable Setup:');
    console.log('================================');
    console.log('Add the following to your .env file or Railway environment variables:\n');
    console.log(`ADMIN_PASSWORD_HASH=${hashedPassword}\n`);

    console.log('🔒 Security Configuration:');
    console.log('=========================');
    console.log('• Password is hashed using bcrypt with 12 salt rounds');
    console.log('• Username is set via ADMIN_USERNAME environment variable');
    console.log('• Session tokens are cryptographically secure (32 bytes)');
    console.log('• Sessions expire after 24 hours');
    console.log('• Redis is used for secure session storage (fallback: memory with expiration)\n');

    console.log('🚀 Next Steps:');
    console.log('===============');
    console.log('1. Add the ADMIN_PASSWORD_HASH to your environment variables');
    console.log('2. Set ADMIN_USERNAME if you want a custom username (default: admin)');
    console.log('3. Optionally configure REDIS_URL for production-grade session storage');
    console.log('4. Restart your application\n');

    console.log('⚠️  Important Security Notes:');
    console.log('=============================');
    console.log('• Store the environment variables securely');
    console.log('• Never commit the hashed password to version control');
    console.log('• Use a strong, unique password');
    console.log('• Consider enabling two-factor authentication in the future\n');

    // Verify the hash works
    console.log('🧪 Verifying password hash...');
    const isValid = await SetupPasswordManager.verifyPassword(password, hashedPassword);

    if (isValid) {
      console.log('✅ Password verification successful - setup complete!');
    } else {
      console.error('❌ Password verification failed - something went wrong');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error generating password hash:', error);
    process.exit(1);
  }
}

// Generate a secure random password utility
async function generateSecurePassword() {
  console.log('🎲 Generating secure random password...');
  const password = SetupPasswordManager.generateSecurePassword(16);
  console.log(`\n🔐 Generated Password: ${password}\n`);
  console.log('💡 You can use this password with the setup script:');
  console.log(`   node server/setup-password.ts "${password}"\n`);
}

// Command line interface
const command = process.argv[2];

if (command === 'generate') {
  generateSecurePassword();
} else if (command === '--help' || command === '-h') {
  console.log('🔐 Custodial Command - Password Setup Utility');
  console.log('==========================================\n');
  console.log('Usage:');
  console.log('  node server/setup-password.ts [password]     Setup password hash');
  console.log('  node server/setup-password.ts generate      Generate secure password');
  console.log('  node server/setup-password.ts --help         Show this help\n');
  console.log('Examples:');
  console.log('  node server/setup-password.ts MySecurePassword123!');
  console.log('  node server/setup-password.ts generate\n');
} else {
  setupPassword().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}