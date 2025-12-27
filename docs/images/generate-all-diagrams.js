const fs = require('fs');
const { createCanvas } = require('canvas');

const colors = {
  white: '#ffffff',
  darkBg: '#0f172a',
  lightBg: '#f8fafc',
  primary: '#0ea5e9',
  secondary: '#a855f7',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
};

// ============ SYSTEM ARCHITECTURE DIAGRAM ============
function createSystemArchitecture() {
  const canvas = createCanvas(1600, 950);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = colors.lightBg;
  ctx.fillRect(0, 0, 1600, 950);

  // Header
  ctx.fillStyle = colors.darkBg;
  ctx.fillRect(0, 0, 1600, 80);
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 45px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('System Architecture', 800, 55);

  // Layer 1: Presentation
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('🖥️  PRESENTATION LAYER', 50, 130);

  drawBox(ctx, 50, 160, 180, 70, 'Web Browser\n(React 18)', colors.primary, '#0284c7');
  drawBox(ctx, 280, 160, 180, 70, 'Admin Portal\n(React 18)', colors.primary, '#0284c7');
  drawBox(ctx, 510, 160, 180, 70, 'Mobile App\n(Future)', colors.primary, '#0284c7');

  // Arrow down
  drawArrow(ctx, 400, 230, 400, 290, '', colors.primary);

  // Layer 2: API Gateway
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 16px Arial';
  ctx.fillText('🔌 API GATEWAY & MIDDLEWARE', 50, 320);

  drawBox(ctx, 50, 350, 640, 70, 'CORS | JWT Auth | Error Handler | Validation | Request/Response Logging', colors.secondary, '#9333ea');

  // Arrow down
  drawArrow(ctx, 400, 420, 400, 480, '', colors.secondary);

  // Layer 3: Application
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 16px Arial';
  ctx.fillText('⚙️  APPLICATION LAYER', 50, 510);

  drawBox(ctx, 50, 540, 120, 80, 'Auth\nModule\n4 Routes', colors.success, '#059669');
  drawBox(ctx, 190, 540, 120, 80, 'Tenants\nModule\n4 Routes', colors.success, '#059669');
  drawBox(ctx, 330, 540, 120, 80, 'Users\nModule\n3 Routes', colors.success, '#059669');
  drawBox(ctx, 470, 540, 120, 80, 'Projects\nModule\n4 Routes', colors.success, '#059669');
  drawBox(ctx, 610, 540, 120, 80, 'Tasks\nModule\n4 Routes', colors.success, '#059669');

  // Right side details
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('KEY FEATURES:', 800, 130);

  ctx.font = '12px Arial';
  ctx.fillStyle = colors.gray700;
  const features = [
    '✅ 19 RESTful API Endpoints',
    '✅ Multi-tenant Architecture',
    '✅ Row-level Data Isolation',
    '✅ Role-Based Access Control',
    '✅ JWT Token Authentication',
    '✅ Complete Audit Trail',
    '✅ Error Handling & Logging',
    '✅ CORS Protection',
  ];
  features.forEach((f, i) => {
    ctx.fillText(f, 800, 160 + i * 28);
  });

  // Tech Stack
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 14px Arial';
  ctx.fillText('TECH STACK:', 800, 500);

  ctx.font = '12px Arial';
  ctx.fillStyle = colors.gray700;
  const techs = [
    '🖥️  Frontend: React 18 + Vite + TailwindCSS',
    '🔧 Backend: Node.js + Express.js',
    '💾 Database: PostgreSQL 15',
    '🔐 Security: JWT + bcryptjs',
    '📦 Containerization: Docker + Docker Compose',
    '🌐 Deployment: Kubernetes-ready',
  ];
  techs.forEach((t, i) => {
    ctx.fillText(t, 800, 530 + i * 28);
  });

  // Layer 4: Data
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('💾 DATA LAYER', 50, 700);

  drawBox(ctx, 50, 730, 680, 70, 'PostgreSQL 15 | 5 Tables | Parameterized Queries | ACID Compliance | Row-Level Security', colors.danger, '#991b1b');

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('system-architecture.png', buffer);
  console.log('✅ Updated system-architecture.png (1600x950)');
}

// ============ DATABASE ERD DIAGRAM ============
function createDatabaseERD() {
  const canvas = createCanvas(1600, 1000);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = colors.lightBg;
  ctx.fillRect(0, 0, 1600, 1000);

  // Header
  ctx.fillStyle = colors.darkBg;
  ctx.fillRect(0, 0, 1600, 80);
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 45px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Database Schema - ERD', 800, 55);

  // Tables
  const tableConfigs = [
    { x: 50, y: 120, name: 'TENANTS', color: colors.primary, fields: ['id (PK)', 'name', 'email', 'subscription_plan', 'max_users', 'max_projects', 'is_active', 'created_at'] },
    { x: 350, y: 120, name: 'USERS', color: colors.secondary, fields: ['id (PK)', 'tenant_id (FK)', 'name', 'email', 'password_hash', 'role', 'is_active', 'created_at'] },
    { x: 650, y: 120, name: 'PROJECTS', color: colors.success, fields: ['id (PK)', 'tenant_id (FK)', 'owner_id (FK)', 'name', 'description', 'status', 'created_at'] },
    { x: 950, y: 120, name: 'TASKS', color: colors.warning, fields: ['id (PK)', 'tenant_id (FK)', 'project_id (FK)', 'assigned_to (FK)', 'title', 'status', 'priority', 'due_date'] },
    { x: 1250, y: 120, name: 'AUDIT_LOGS', color: colors.danger, fields: ['id (PK)', 'tenant_id (FK)', 'user_id (FK)', 'action', 'changes', 'ip_address', 'created_at'] }
  ];

  tableConfigs.forEach(config => {
    drawERDTable(ctx, config.x, config.y, 280, config.name, config.color, config.fields);
  });

  // Relationships
  drawRelationshipLine(ctx, 330, 180, 350, 180, '1:N', colors.primary);
  drawRelationshipLine(ctx, 330, 220, 650, 220, '1:N', colors.primary);
  drawRelationshipLine(ctx, 330, 260, 950, 260, '1:N', colors.primary);
  drawRelationshipLine(ctx, 500, 400, 750, 120, 'owns', colors.secondary);
  drawRelationshipLine(ctx, 520, 400, 1050, 120, 'assigned', colors.secondary);
  drawRelationshipLine(ctx, 930, 180, 950, 180, '1:N', colors.success);

  // Legend & Info
  ctx.fillStyle = colors.gray100;
  ctx.fillRect(0, 580, 1600, 420);

  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('LEGEND & KEY INFORMATION', 50, 620);

  ctx.font = '13px Arial';
  ctx.fillStyle = colors.gray700;
  const info = [
    '🔑 PK = Primary Key (Unique Identifier)  |  FK = Foreign Key (Table Reference)',
    '🏢 Multi-Tenancy: Every table has tenant_id for complete data isolation',
    '📊 5 Tables | 50+ Fields | 8 Foreign Keys | Complete ACID compliance',
    '🔒 Row-Level Security: All queries automatically filtered by tenant_id',
    '📋 Audit Trail: JSONB change tracking for compliance & debugging'
  ];
  info.forEach((item, i) => {
    ctx.fillText(item, 50, 660 + i * 35);
  });

  // Statistics
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(50, 820, 1500, 140);
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2;
  ctx.strokeRect(50, 820, 1500, 140);

  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 14px Arial';
  ctx.fillText('DATABASE STRUCTURE SUMMARY', 70, 855);

  ctx.font = '12px Arial';
  ctx.fillStyle = colors.gray700;
  ctx.fillText('📊 Total Tables: 5  |  🔑 Primary Keys: 5  |  🔗 Foreign Keys: 8  |  📝 Total Fields: 52+', 70, 890);
  ctx.fillText('🔐 Isolation: Row-level via tenant_id  |  ⚡ Performance: Indexed queries  |  📈 Scalability: Multi-tenant ready', 70, 920);
  ctx.fillText('✅ Type Safety: UUID primary keys  |  🛡️ Data Integrity: Referential constraints  |  📋 Compliance: Audit logging', 70, 950);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('database-erd.png', buffer);
  console.log('✅ Updated database-erd.png (1600x1000)');
}

// ============ SYSTEM FLOW DIAGRAM ============
function createSystemFlow() {
  const canvas = createCanvas(1600, 1100);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = colors.lightBg;
  ctx.fillRect(0, 0, 1600, 1100);

  // Header
  ctx.fillStyle = colors.darkBg;
  ctx.fillRect(0, 0, 1600, 80);
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 45px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('System Data Flow Diagram', 800, 55);

  const y1 = 120, y2 = 300, y3 = 480, y4 = 660;

  // Section 1
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('1️⃣  USER ENTRY & FRONTEND', 50, y1 - 10);

  drawBox(ctx, 50, y1, 150, 70, 'Browser\nAccess', colors.primary, '#0284c7');
  drawArrow(ctx, 200, y1 + 35, 260, y1 + 35, '', colors.primary);
  drawBox(ctx, 260, y1, 150, 70, 'React\nApplication', colors.primary, '#0284c7');
  drawArrow(ctx, 410, y1 + 35, 470, y1 + 35, '', colors.primary);
  drawBox(ctx, 470, y1, 150, 70, 'Request\nAPI', colors.primary, '#0284c7');

  // Section 2
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 15px Arial';
  ctx.fillText('2️⃣  AUTHENTICATION FLOW', 50, y2 - 10);

  drawBox(ctx, 50, y2, 130, 70, 'Login\nCredentials', colors.secondary, '#9333ea');
  drawArrow(ctx, 180, y2 + 35, 230, y2 + 35, '', colors.secondary);
  drawBox(ctx, 230, y2, 130, 70, 'Validate\nin Backend', colors.secondary, '#9333ea');
  drawArrow(ctx, 360, y2 + 35, 410, y2 + 35, '', colors.secondary);
  drawBox(ctx, 410, y2, 130, 70, 'Query\nDatabase', colors.secondary, '#9333ea');
  drawArrow(ctx, 540, y2 + 35, 590, y2 + 35, 'Valid', colors.success);
  drawBox(ctx, 590, y2, 130, 70, 'Generate\nJWT Token', colors.success, '#059669');
  drawArrow(ctx, 720, y2 + 35, 770, y2 + 35, '', colors.success);
  drawBox(ctx, 770, y2, 130, 70, 'Send\nToken', colors.success, '#059669');

  // Section 3
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 15px Arial';
  ctx.fillText('3️⃣  AUTHORIZED REQUEST', 50, y3 - 10);

  drawBox(ctx, 50, y3, 130, 70, 'User\nAction', colors.warning, '#b45309');
  drawArrow(ctx, 180, y3 + 35, 230, y3 + 35, 'With JWT', colors.warning);
  drawBox(ctx, 230, y3, 130, 70, 'Middleware\nValidate', colors.warning, '#b45309');
  drawArrow(ctx, 360, y3 + 35, 410, y3 + 35, 'Check Role', colors.warning);
  drawBox(ctx, 410, y3, 130, 70, 'RBAC\nAuthorize', colors.warning, '#b45309');
  drawArrow(ctx, 540, y3 + 35, 590, y3 + 35, 'Permitted', colors.success);
  drawBox(ctx, 590, y3, 130, 70, 'Filter by\ntenant_id', colors.success, '#059669');

  // Section 4
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 15px Arial';
  ctx.fillText('4️⃣  DATA RESPONSE', 50, y4 - 10);

  drawBox(ctx, 50, y4, 130, 70, 'Query\nDatabase', colors.danger, '#991b1b');
  drawArrow(ctx, 180, y4 + 35, 230, y4 + 35, '', colors.danger);
  drawBox(ctx, 230, y4, 130, 70, 'Format\nJSON', colors.danger, '#991b1b');
  drawArrow(ctx, 360, y4 + 35, 410, y4 + 35, 'Response', colors.danger);
  drawBox(ctx, 410, y4, 130, 70, 'Render\nUI', colors.success, '#059669');

  // Right side: Multi-tenancy
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('🔐 MULTI-TENANCY SECURITY', 800, 120);

  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.fillRect(800, 160, 750, 520);
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2;
  ctx.strokeRect(800, 160, 750, 520);

  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 13px Arial';
  ctx.fillText('Tenant A (Company X)', 820, 190);
  
  ctx.font = '11px Arial';
  ctx.fillStyle = colors.gray700;
  const tenantA = ['👤 alice@company-x.com', '⚙️ Role: Admin', '📁 Projects: 5', '✓ Tasks: 24', '🔒 Isolated Data Only'];
  tenantA.forEach((item, i) => {
    ctx.fillText(item, 820, 220 + i * 25);
  });

  // Barrier
  ctx.strokeStyle = colors.danger;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(800, 350);
  ctx.lineTo(1550, 350);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 13px Arial';
  ctx.fillText('Tenant B (Company Y)', 820, 380);
  
  ctx.font = '11px Arial';
  ctx.fillStyle = colors.gray700;
  const tenantB = ['👤 bob@company-y.com', '⚙️ Role: User', '📁 Projects: 2', '✓ Tasks: 8', '🔒 Isolated Data Only'];
  tenantB.forEach((item, i) => {
    ctx.fillText(item, 820, 410 + i * 25);
  });

  // Security summary
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(800, 650, 750, 130);
  ctx.strokeStyle = colors.success;
  ctx.lineWidth = 2;
  ctx.strokeRect(800, 650, 750, 130);

  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 13px Arial';
  ctx.fillText('🛡️ SECURITY LAYERS', 820, 680);

  ctx.font = '11px Arial';
  ctx.fillStyle = colors.gray700;
  const security = [
    '1️⃣ JWT Token Validation',
    '2️⃣ Role-Based Access Control (RBAC)',
    '3️⃣ Tenant Isolation (tenant_id filtering)',
    '4️⃣ Row-Level Security',
    '5️⃣ Audit Logging (all actions tracked)'
  ];
  security.forEach((item, i) => {
    ctx.fillText(item, 820, 710 + i * 25);
  });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('system-flow.png', buffer);
  console.log('✅ Updated system-flow.png (1600x1100)');
}

// Helper functions
function drawBox(ctx, x, y, w, h, text, color, border) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x, y, w, h);
  
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = text.split('\n');
  const lineHeight = 16;
  const startY = y + h / 2 - (lines.length - 1) * lineHeight / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, x + w / 2, startY + i * lineHeight);
  });
}

function drawArrow(ctx, x1, y1, x2, y2, label, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(angle - Math.PI / 6), y2 - 10 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 10 * Math.cos(angle + Math.PI / 6), y2 - 10 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawERDTable(ctx, x, y, w, name, color, fields) {
  const h = 40 + fields.length * 24;
  
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, 40);
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(name, x + w / 2, y + 23);
  
  ctx.fillStyle = colors.white;
  ctx.fillRect(x, y + 40, w, h - 40);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  
  ctx.fillStyle = colors.gray800;
  ctx.font = '11px Arial';
  ctx.textAlign = 'left';
  fields.forEach((field, i) => {
    ctx.fillText(field, x + 10, y + 65 + i * 24);
  });
}

function drawRelationshipLine(ctx, x1, y1, x2, y2, label, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Generate all diagrams
createSystemArchitecture();
createDatabaseERD();
createSystemFlow();
console.log('\n✅ All diagrams regenerated successfully!');
