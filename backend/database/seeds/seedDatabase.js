const pool = require('../../src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('Seeding database...');

    // Check if already seeded
    const superAdminCheck = await client.query(
      "SELECT COUNT(*) FROM users WHERE role = 'super_admin'"
    );
    
    if (superAdminCheck.rows[0].count > 0) {
      console.log('⚠ Database already seeded, skipping...');
      return;
    }

    // Create super admin user
    const superAdminPassword = await bcrypt.hash('Admin@123', 10);
    const superAdminId = uuidv4();
    
    await client.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [superAdminId, null, 'superadmin@system.com', superAdminPassword, 'Super Admin', 'super_admin', true]
    );
    console.log('✓ Created super admin user');

    // Create demo tenant
    const demoTenantId = uuidv4();
    await client.query(
      `INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [demoTenantId, 'Demo Company', 'demo', 'active', 'pro', 25, 15]
    );
    console.log('✓ Created demo tenant');

    // Create tenant admin
    const adminPassword = await bcrypt.hash('Demo@123', 10);
    const adminId = uuidv4();
    
    await client.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, demoTenantId, 'admin@demo.com', adminPassword, 'Demo Admin', 'tenant_admin', true]
    );
    console.log('✓ Created demo tenant admin');

    // Create regular users
    const userPassword = await bcrypt.hash('User@123', 10);
    const user1Id = uuidv4();
    const user2Id = uuidv4();
    
    await client.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7), ($8, $9, $10, $11, $12, $13, $14)`,
      [
        user1Id, demoTenantId, 'user1@demo.com', userPassword, 'User One', 'user', true,
        user2Id, demoTenantId, 'user2@demo.com', userPassword, 'User Two', 'user', true,
      ]
    );
    console.log('✓ Created demo users');

    // Create sample projects
    const project1Id = uuidv4();
    const project2Id = uuidv4();
    
    await client.query(
      `INSERT INTO projects (id, tenant_id, name, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)`,
      [
        project1Id, demoTenantId, 'Project Alpha', 'First demo project', 'active', adminId,
        project2Id, demoTenantId, 'Project Beta', 'Second demo project', 'active', adminId,
      ]
    );
    console.log('✓ Created demo projects');

    // Create sample tasks
    const task1Id = uuidv4();
    const task2Id = uuidv4();
    const task3Id = uuidv4();
    const task4Id = uuidv4();
    const task5Id = uuidv4();
    
    await client.query(
      `INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
       VALUES 
       ($1, $2, $3, $4, $5, $6, $7, $8, $9),
       ($10, $11, $12, $13, $14, $15, $16, $17, $18),
       ($19, $20, $21, $22, $23, $24, $25, $26, $27),
       ($28, $29, $30, $31, $32, $33, $34, $35, $36),
       ($37, $38, $39, $40, $41, $42, $43, $44, $45)`,
      [
        // Project Alpha tasks
        task1Id, project1Id, demoTenantId, 'Task 1: Design', 'Create mockups', 'todo', 'high', user1Id, '2024-12-31',
        task2Id, project1Id, demoTenantId, 'Task 2: Frontend', 'Implement UI', 'in_progress', 'high', user2Id, '2025-01-15',
        task3Id, project1Id, demoTenantId, 'Task 3: Testing', 'QA testing', 'todo', 'medium', null, '2025-01-20',
        // Project Beta tasks
        task4Id, project2Id, demoTenantId, 'Task 4: Backend', 'API development', 'in_progress', 'high', user1Id, '2025-01-10',
        task5Id, project2Id, demoTenantId, 'Task 5: Documentation', 'Write docs', 'completed', 'low', user2Id, '2024-12-25',
      ]
    );
    console.log('✓ Created demo tasks');

    await client.query('COMMIT');
    console.log('Database seeding completed successfully');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding error:', error);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { seedDatabase };
