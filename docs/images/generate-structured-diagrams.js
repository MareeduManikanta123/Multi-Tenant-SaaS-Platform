const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Color palette
const colors = {
  primary: '#1e40af',      // Blue
  secondary: '#7c3aed',    // Purple
  success: '#059669',      // Green
  warning: '#d97706',      // Orange
  danger: '#dc2626',       // Red
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray600: '#4b5563',
  gray800: '#1f2937',
  white: '#ffffff',
};

// Helper function to draw rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Draw a box with text
function drawBox(ctx, x, y, width, height, text, bgColor, textColor = colors.white, fontSize = 14) {
  drawRoundedRect(ctx, x, y, width, height, 8);
  ctx.fillStyle = bgColor;
  ctx.fill();
  
  ctx.strokeStyle = colors.gray300;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Handle multi-line text
  const lines = text.split('\n');
  const lineHeight = fontSize + 4;
  const totalHeight = lines.length * lineHeight;
  let startY = y + height / 2 - totalHeight / 2;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, x + width / 2, startY + (index * lineHeight));
  });
}

// Draw arrow between boxes
function drawArrow(ctx, fromX, fromY, toX, toY, color = colors.gray600) {
  const headlen = 15;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX - Math.cos(angle) * 15, toY - Math.sin(angle) * 15);
  ctx.stroke();
  
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Create System Architecture Diagram
function createSystemArchitecture() {
  const canvas = createCanvas(1400, 900);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = colors.gray100;
  ctx.fillRect(0, 0, 1400, 900);
  
  // Title
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Multi-Tenant SaaS Platform - System Architecture', 700, 40);
  
  // Layer 1: Client Layer
  ctx.fillStyle = colors.gray600;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('CLIENT LAYER', 30, 90);
  
  drawBox(ctx, 30, 110, 140, 60, 'Web Browser\n(React)', colors.primary);
  drawBox(ctx, 190, 110, 140, 60, 'Admin Portal\n(React)', colors.primary);
  drawBox(ctx, 350, 110, 140, 60, 'Mobile App\n(Future)', colors.primary);
  
  // Arrow down
  drawArrow(ctx, 200, 170, 200, 240);
  
  // Layer 2: API Gateway
  ctx.fillStyle = colors.gray600;
  ctx.fillText('API GATEWAY & MIDDLEWARE', 30, 240);
  
  drawBox(ctx, 30, 260, 460, 50, 'JWT Auth | CORS | Error Handler | Validators', colors.secondary);
  
  // Arrow down
  drawArrow(ctx, 260, 310, 260, 380);
  
  // Layer 3: Application Layer
  ctx.fillStyle = colors.gray600;
  ctx.fillText('APPLICATION LAYER', 30, 380);
  
  drawBox(ctx, 30, 400, 100, 50, 'Auth\nRoutes', colors.success);
  drawBox(ctx, 150, 400, 100, 50, 'Tenants\nRoutes', colors.success);
  drawBox(ctx, 270, 400, 100, 50, 'Users\nRoutes', colors.success);
  drawBox(ctx, 390, 400, 100, 50, 'Projects\nRoutes', colors.success);
  
  // Layer 4: Business Logic
  ctx.fillStyle = colors.gray600;
  ctx.fillText('BUSINESS LOGIC LAYER', 30, 510);
  
  drawBox(ctx, 30, 530, 460, 40, 'Multi-Tenancy | RBAC | Validation | Security', colors.warning);
  
  // Arrow down
  drawArrow(ctx, 260, 570, 260, 620);
  
  // Layer 5: Data Layer
  ctx.fillStyle = colors.gray600;
  ctx.fillText('DATA LAYER', 30, 620);
  
  drawBox(ctx, 30, 640, 460, 50, 'PostgreSQL 15 Database (5 Tables)', colors.danger);
  
  // Right side - Details
  ctx.fillStyle = colors.gray600;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('ENDPOINTS: 19', 550, 90);
  ctx.fillText('• Auth: 4 routes', 550, 115);
  ctx.fillText('• Tenants: 4 routes', 550, 135);
  ctx.fillText('• Users: 3 routes', 550, 155);
  ctx.fillText('• Projects: 4 routes', 550, 175);
  ctx.fillText('• Tasks: 4 routes', 550, 195);
  
  ctx.fillText('DATABASES: 5 Tables', 550, 240);
  ctx.fillText('• TENANTS', 550, 265);
  ctx.fillText('• USERS', 550, 285);
  ctx.fillText('• PROJECTS', 550, 305);
  ctx.fillText('• TASKS', 550, 325);
  ctx.fillText('• AUDIT_LOGS', 550, 345);
  
  ctx.fillText('SECURITY', 550, 390);
  ctx.fillText('✓ Row-level isolation', 550, 415);
  ctx.fillText('✓ JWT (24-hour expiry)', 550, 435);
  ctx.fillText('✓ bcryptjs hashing', 550, 455);
  ctx.fillText('✓ RBAC (3 roles)', 550, 475);
  ctx.fillText('✓ Audit logging', 550, 495);
  
  // Tech Stack on right
  ctx.fillText('TECH STACK', 800, 90);
  
  // Backend box
  drawBox(ctx, 800, 110, 150, 120, 'BACKEND\nNode.js\nExpress.js\nPostgreSQL\nJWT\nbcryptjs', colors.primary, colors.white, 12);
  
  // Frontend box
  drawBox(ctx, 1000, 110, 150, 120, 'FRONTEND\nReact 18\nVite\nTailwindCSS\nAxios\nRouter', colors.secondary, colors.white, 12);
  
  // Infrastructure
  drawBox(ctx, 800, 280, 350, 80, 'Docker | Docker Compose | Nginx | PostgreSQL Container', colors.success, colors.white, 12);
  
  // Ports
  ctx.fillStyle = colors.gray600;
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Frontend: 3000', 800, 420);
  ctx.fillText('Backend: 5000', 800, 440);
  ctx.fillText('Database: 5433', 800, 460);
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('system-architecture.png', buffer);
  console.log('✓ Created system-architecture.png (1400x900)');
}

// Create Database ERD Diagram
function createDatabaseERD() {
  const canvas = createCanvas(1400, 900);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = colors.gray100;
  ctx.fillRect(0, 0, 1400, 900);
  
  // Title
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Database Schema - Entity Relationship Diagram', 700, 40);
  
  // Table 1: TENANTS
  const tenantX = 50;
  const tenantY = 100;
  
  ctx.fillStyle = colors.primary;
  ctx.fillRect(tenantX, tenantY, 200, 180);
  
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TENANTS', tenantX + 100, tenantY + 25);
  
  ctx.fillStyle = colors.gray800;
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  const tenantFields = [
    'id (PK)',
    'name',
    'email',
    'subscription_plan',
    'max_users',
    'max_projects',
    'created_at',
    'updated_at'
  ];
  tenantFields.forEach((field, i) => {
    ctx.fillText(field, tenantX + 10, tenantY + 50 + (i * 16));
  });
  
  // Table 2: USERS
  const userX = 350;
  const userY = 100;
  
  ctx.fillStyle = colors.secondary;
  ctx.fillRect(userX, userY, 200, 200);
  
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('USERS', userX + 100, userY + 25);
  
  ctx.fillStyle = colors.gray800;
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  const userFields = [
    'id (PK)',
    'tenant_id (FK)',
    'name',
    'email',
    'password_hash',
    'role',
    'is_active',
    'created_at',
    'updated_at'
  ];
  userFields.forEach((field, i) => {
    ctx.fillText(field, userX + 10, userY + 50 + (i * 16));
  });
  
  // Table 3: PROJECTS
  const projectX = 650;
  const projectY = 100;
  
  ctx.fillStyle = colors.success;
  ctx.fillRect(projectX, projectY, 200, 200);
  
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PROJECTS', projectX + 100, projectY + 25);
  
  ctx.fillStyle = colors.gray800;
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  const projectFields = [
    'id (PK)',
    'tenant_id (FK)',
    'name',
    'description',
    'status',
    'owner_id (FK)',
    'created_at',
    'updated_at'
  ];
  projectFields.forEach((field, i) => {
    ctx.fillText(field, projectX + 10, projectY + 50 + (i * 16));
  });
  
  // Table 4: TASKS
  const taskX = 950;
  const taskY = 100;
  
  ctx.fillStyle = colors.warning;
  ctx.fillRect(taskX, taskY, 200, 220);
  
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TASKS', taskX + 100, taskY + 25);
  
  ctx.fillStyle = colors.gray800;
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  const taskFields = [
    'id (PK)',
    'tenant_id (FK)',
    'project_id (FK)',
    'title',
    'description',
    'status',
    'priority',
    'assigned_to (FK)',
    'due_date',
    'created_at'
  ];
  taskFields.forEach((field, i) => {
    ctx.fillText(field, taskX + 10, taskY + 50 + (i * 16));
  });
  
  // Table 5: AUDIT_LOGS
  const auditX = 1250;
  const auditY = 100;
  
  ctx.fillStyle = colors.danger;
  ctx.fillRect(auditX, auditY, 130, 180);
  
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('AUDIT_LOGS', auditX + 65, auditY + 25);
  
  ctx.fillStyle = colors.gray800;
  ctx.font = '11px Arial';
  ctx.textAlign = 'left';
  const auditFields = [
    'id (PK)',
    'user_id (FK)',
    'action',
    'changes',
    'ip_address',
    'created_at'
  ];
  auditFields.forEach((field, i) => {
    ctx.fillText(field, auditX + 8, auditY + 50 + (i * 18));
  });
  
  // Relationships
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  
  // TENANTS -> USERS
  ctx.beginPath();
  ctx.moveTo(250, 180);
  ctx.lineTo(350, 180);
  ctx.stroke();
  ctx.fillStyle = colors.primary;
  ctx.font = '11px Arial';
  ctx.fillText('1-to-Many', 280, 170);
  
  // TENANTS -> PROJECTS
  ctx.beginPath();
  ctx.moveTo(250, 160);
  ctx.lineTo(650, 160);
  ctx.stroke();
  ctx.fillStyle = colors.primary;
  ctx.fillText('1-to-Many', 420, 150);
  
  // TENANTS -> TASKS
  ctx.beginPath();
  ctx.moveTo(250, 200);
  ctx.lineTo(950, 200);
  ctx.stroke();
  
  // USERS -> PROJECTS (owner)
  ctx.beginPath();
  ctx.moveTo(550, 250);
  ctx.lineTo(700, 290);
  ctx.stroke();
  ctx.fillStyle = colors.secondary;
  ctx.font = '10px Arial';
  ctx.fillText('owner', 600, 265);
  
  // PROJECTS -> TASKS
  ctx.beginPath();
  ctx.moveTo(850, 180);
  ctx.lineTo(950, 180);
  ctx.stroke();
  ctx.fillStyle = colors.success;
  ctx.font = '11px Arial';
  ctx.fillText('1-to-Many', 880, 170);
  
  // USERS -> TASKS (assigned_to)
  ctx.beginPath();
  ctx.moveTo(550, 280);
  ctx.lineTo(950, 280);
  ctx.stroke();
  ctx.fillStyle = colors.secondary;
  ctx.font = '10px Arial';
  ctx.fillText('assigned_to', 720, 270);
  
  // USERS -> AUDIT_LOGS
  ctx.beginPath();
  ctx.moveTo(550, 200);
  ctx.lineTo(1250, 180);
  ctx.stroke();
  
  ctx.setLineDash([]);
  
  // Legend at bottom
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('RELATIONSHIPS:', 50, 380);
  
  ctx.font = '12px Arial';
  ctx.fillText('• Tenants have multiple Users, Projects, and Tasks', 50, 410);
  ctx.fillText('• Projects belong to one Tenant and have multiple Tasks', 50, 435);
  ctx.fillText('• Tasks have assigned users and belong to Projects', 50, 460);
  ctx.fillText('• Audit logs track all user actions across the system', 50, 485);
  ctx.fillText('• Row-level isolation: All queries filtered by tenant_id', 50, 510);
  
  // Multi-tenancy note
  ctx.fillStyle = colors.primary;
  ctx.fillRect(50, 550, 1330, 70);
  
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 14px Arial';
  ctx.fillText('MULTI-TENANCY ISOLATION', 60, 575);
  
  ctx.font = '12px Arial';
  ctx.fillText('Every table includes tenant_id to ensure complete data isolation. Users can only see/access data from their own tenant.', 60, 600);
  ctx.fillText('All queries automatically filtered by tenant_id in middleware. Database enforces row-level security through application logic.', 60, 625);
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('database-erd.png', buffer);
  console.log('✓ Created database-erd.png (1400x900)');
}

// Generate both diagrams
createSystemArchitecture();
createDatabaseERD();
console.log('\n✅ All structured diagrams generated successfully!');
