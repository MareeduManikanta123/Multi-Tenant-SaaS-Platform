const fs = require('fs');
const { createCanvas } = require('canvas');

// Professional color palette
const colors = {
  bg: '#ffffff',
  darkBg: '#0f172a',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
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

function createProDatabaseERD() {
  const canvas = createCanvas(1400, 950);
  const ctx = canvas.getContext('2d');

  // Background gradient effect
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, 1400, 950);

  // Header with background
  ctx.fillStyle = colors.darkBg;
  ctx.fillRect(0, 0, 1400, 90);

  ctx.fillStyle = colors.white;
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Database Schema', 700, 50);

  ctx.fillStyle = colors.gray300;
  ctx.font = '14px Arial';
  ctx.fillText('Multi-Tenant SaaS Platform ERD', 700, 75);

  // Main content area
  const startY = 120;

  // Define tables with specific positioning
  const tables = [
    {
      id: 'tenants',
      x: 50,
      y: startY,
      name: 'TENANTS',
      icon: '🏢',
      color: colors.primary,
      borderColor: '#1e40af',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK' },
        { name: 'name', type: 'VARCHAR(255)', key: null },
        { name: 'email', type: 'VARCHAR(255)', key: null },
        { name: 'subscription_plan', type: 'VARCHAR(50)', key: null },
        { name: 'max_users', type: 'INTEGER', key: null },
        { name: 'max_projects', type: 'INTEGER', key: null },
        { name: 'is_active', type: 'BOOLEAN', key: null },
        { name: 'created_at', type: 'TIMESTAMP', key: null },
      ]
    },
    {
      id: 'users',
      x: 320,
      y: startY,
      name: 'USERS',
      icon: '👤',
      color: colors.secondary,
      borderColor: '#6d28d9',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK' },
        { name: 'tenant_id', type: 'UUID', key: 'FK' },
        { name: 'name', type: 'VARCHAR(255)', key: null },
        { name: 'email', type: 'VARCHAR(255)', key: null },
        { name: 'password_hash', type: 'TEXT', key: null },
        { name: 'role', type: 'ENUM', key: null },
        { name: 'is_active', type: 'BOOLEAN', key: null },
        { name: 'created_at', type: 'TIMESTAMP', key: null },
      ]
    },
    {
      id: 'projects',
      x: 590,
      y: startY,
      name: 'PROJECTS',
      icon: '📁',
      color: colors.success,
      borderColor: '#047857',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK' },
        { name: 'tenant_id', type: 'UUID', key: 'FK' },
        { name: 'owner_id', type: 'UUID', key: 'FK' },
        { name: 'name', type: 'VARCHAR(255)', key: null },
        { name: 'description', type: 'TEXT', key: null },
        { name: 'status', type: 'VARCHAR(50)', key: null },
        { name: 'created_at', type: 'TIMESTAMP', key: null },
      ]
    },
    {
      id: 'tasks',
      x: 860,
      y: startY,
      name: 'TASKS',
      icon: '✓',
      color: colors.warning,
      borderColor: '#b45309',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK' },
        { name: 'tenant_id', type: 'UUID', key: 'FK' },
        { name: 'project_id', type: 'UUID', key: 'FK' },
        { name: 'assigned_to', type: 'UUID', key: 'FK' },
        { name: 'title', type: 'VARCHAR(255)', key: null },
        { name: 'description', type: 'TEXT', key: null },
        { name: 'status', type: 'VARCHAR(50)', key: null },
        { name: 'priority', type: 'VARCHAR(20)', key: null },
        { name: 'due_date', type: 'DATE', key: null },
      ]
    },
    {
      id: 'audit_logs',
      x: 1130,
      y: startY,
      name: 'AUDIT_LOGS',
      icon: '📋',
      color: colors.danger,
      borderColor: '#991b1b',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK' },
        { name: 'tenant_id', type: 'UUID', key: 'FK' },
        { name: 'user_id', type: 'UUID', key: 'FK' },
        { name: 'action', type: 'VARCHAR(50)', key: null },
        { name: 'changes', type: 'JSONB', key: null },
        { name: 'ip_address', type: 'VARCHAR(45)', key: null },
        { name: 'created_at', type: 'TIMESTAMP', key: null },
      ]
    }
  ];

  // Draw tables
  tables.forEach(table => {
    drawModernTable(ctx, table);
  });

  // Draw relationships
  drawRelationships(ctx);

  // Footer with legend
  ctx.fillStyle = colors.gray100;
  ctx.fillRect(0, 650, 1400, 300);

  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Legend & Information', 50, 685);

  // Legend items
  const legendY = 710;
  const columnWidth = 330;

  // Column 1: Key Types
  ctx.fillStyle = colors.gray700;
  ctx.font = 'bold 13px Arial';
  ctx.fillText('Key Types', 50, legendY);

  ctx.font = '11px Arial';
  ctx.fillStyle = colors.gray600;
  const keyTypes = [
    '▪ PK = Primary Key (Unique identifier)',
    '▪ FK = Foreign Key (Relationship)',
    '▪ Each table auto-generates UUID primary keys',
  ];
  keyTypes.forEach((item, i) => {
    ctx.fillText(item, 50, legendY + 25 + i * 22);
  });

  // Column 2: Multi-Tenancy
  ctx.fillStyle = colors.gray700;
  ctx.font = 'bold 13px Arial';
  ctx.fillText('Multi-Tenancy', 50 + columnWidth, legendY);

  ctx.font = '11px Arial';
  ctx.fillStyle = colors.gray600;
  const tenancy = [
    '▪ Every table has tenant_id foreign key',
    '▪ Complete row-level data isolation',
    '▪ All queries filtered by tenant_id',
  ];
  tenancy.forEach((item, i) => {
    ctx.fillText(item, 50 + columnWidth, legendY + 25 + i * 22);
  });

  // Column 3: Relationships
  ctx.fillStyle = colors.gray700;
  ctx.font = 'bold 13px Arial';
  ctx.fillText('Key Relationships', 50 + columnWidth * 2, legendY);

  ctx.font = '11px Arial';
  ctx.fillStyle = colors.gray600;
  const relationships = [
    '▪ Tenants → Users, Projects, Tasks (1:N)',
    '▪ Users → Projects (owner), Tasks (assigned)',
    '▪ Projects → Tasks (1:N)',
  ];
  relationships.forEach((item, i) => {
    ctx.fillText(item, 50 + columnWidth * 2, legendY + 25 + i * 22);
  });

  // Bottom stats
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(50, 820, 1300, 100);

  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2;
  ctx.strokeRect(50, 820, 1300, 100);

  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Database Structure Summary', 65, 850);

  ctx.font = '12px Arial';
  ctx.fillStyle = colors.gray700;

  const stats = [
    '📊 Tables: 5  |  🔑 Primary Keys: 5  |  🔗 Foreign Keys: 8  |  📝 Total Fields: 52+',
    '🔐 Security: Row-level isolation via tenant_id  |  📈 Scalable: Built for multi-tenant growth',
    '📋 Audit Trail: JSONB change tracking  |  ⚡ Performance: Indexed foreign keys & tenants'
  ];

  stats.forEach((stat, i) => {
    ctx.fillText(stat, 65, 875 + i * 22);
  });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('database-erd.png', buffer);
  console.log('✓ Created professional database-erd.png');
}

function drawModernTable(ctx, table) {
  const width = 250;
  const rowHeight = 24;
  const headerHeight = 45;
  const height = headerHeight + (table.fields.length * rowHeight) + 10;

  // Shadow effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(table.x + 2, table.y + 2, width, height);

  // Main box background
  ctx.fillStyle = colors.white;
  ctx.fillRect(table.x, table.y, width, height);

  // Border
  ctx.strokeStyle = table.borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(table.x, table.y, width, height);

  // Header
  ctx.fillStyle = table.color;
  ctx.fillRect(table.x, table.y, width, headerHeight);

  // Icon and table name
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(table.icon + ' ' + table.name, table.x + 10, table.y + 32);

  // Separator line
  ctx.strokeStyle = table.borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(table.x, table.y + headerHeight);
  ctx.lineTo(table.x + width, table.y + headerHeight);
  ctx.stroke();

  // Fields
  table.fields.forEach((field, i) => {
    const fieldY = table.y + headerHeight + (i * rowHeight) + 18;

    // Alternate row colors
    if (i % 2 === 0) {
      ctx.fillStyle = colors.gray50;
      ctx.fillRect(table.x, table.y + headerHeight + (i * rowHeight), width, rowHeight);
    }

    // Field name (bold if key)
    ctx.fillStyle = colors.gray900;
    ctx.font = field.key ? 'bold 11px Courier New' : '11px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(field.name, table.x + 8, fieldY);

    // Key indicator (right side)
    if (field.key) {
      ctx.fillStyle = field.key === 'PK' ? '#fbbf24' : '#60a5fa';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(field.key, table.x + width - 8, fieldY);
    }

    // Type (lighter)
    ctx.fillStyle = colors.gray500;
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(field.type, table.x + 8, fieldY + 12);
  });
}

function drawRelationships(ctx) {
  const relationships = [
    { from: { id: 'tenants', x: 300, y: 250 }, to: { id: 'users', x: 320, y: 250 }, label: '1:N' },
    { from: { id: 'tenants', x: 300, y: 280 }, to: { id: 'projects', x: 590, y: 280 }, label: '1:N' },
    { from: { id: 'tenants', x: 300, y: 310 }, to: { id: 'tasks', x: 860, y: 310 }, label: '1:N' },
    { from: { id: 'users', x: 460, y: 340 }, to: { id: 'projects', x: 650, y: 190 }, label: 'owns' },
    { from: { id: 'users', x: 480, y: 360 }, to: { id: 'tasks', x: 920, y: 200 }, label: 'assigned' },
    { from: { id: 'projects', x: 840, y: 280 }, to: { id: 'tasks', x: 860, y: 280 }, label: '1:N' },
  ];

  relationships.forEach(rel => {
    // Draw line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(rel.from.x, rel.from.y);
    
    const midX = (rel.from.x + rel.to.x) / 2;
    const midY = (rel.from.y + rel.to.y) / 2;
    
    ctx.quadraticCurveTo(midX, midY - 30, rel.to.x, rel.to.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label background
    ctx.fillStyle = colors.white;
    ctx.fillRect(midX - 20, midY - 45, 40, 16);
    
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(midX - 20, midY - 45, 40, 16);

    // Label text
    ctx.fillStyle = colors.gray600;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(rel.label, midX, midY - 33);
  });
}

createProDatabaseERD();
console.log('\n✅ Professional database ERD created!');
