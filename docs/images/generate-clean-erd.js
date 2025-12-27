const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Color palette
const colors = {
  primary: '#0066cc',      // Blue
  secondary: '#6600cc',    // Purple
  success: '#00b366',      // Green
  warning: '#ff9900',      // Orange
  danger: '#cc0000',       // Red
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray600: '#4b5563',
  gray800: '#1f2937',
  white: '#ffffff',
};

// Helper function to draw table box
function drawTableBox(ctx, x, y, width, height, tableName, fields, bgColor) {
  // Main box
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, width, height);
  
  // Border
  ctx.strokeStyle = colors.gray300;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  
  // Header
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, width, 35);
  
  // Header border
  ctx.strokeStyle = colors.gray400;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 35);
  ctx.lineTo(x + width, y + 35);
  ctx.stroke();
  
  // Table name
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(tableName, x + width / 2, y + 23);
  
  // Fields
  ctx.fillStyle = colors.gray800;
  ctx.font = '11px Courier New';
  ctx.textAlign = 'left';
  
  fields.forEach((field, i) => {
    const fieldY = y + 45 + (i * 16);
    
    // Highlight key fields
    if (field.includes('(PK)')) {
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(x + 2, fieldY - 10, width - 4, 13);
      ctx.fillStyle = colors.gray800;
      ctx.font = 'bold 11px Courier New';
    } else if (field.includes('(FK)')) {
      ctx.fillStyle = '#e3f2fd';
      ctx.fillRect(x + 2, fieldY - 10, width - 4, 13);
      ctx.fillStyle = colors.gray800;
      ctx.font = '11px Courier New';
    } else {
      ctx.fillStyle = colors.gray800;
      ctx.font = '11px Courier New';
    }
    
    ctx.fillText(field, x + 8, fieldY);
  });
}

// Draw relationship line with label
function drawRelationship(ctx, fromX, fromY, toX, toY, label, color = colors.gray400) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  
  // Draw line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  
  // Curved connection
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  
  ctx.quadraticCurveTo(midX, midY, toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Label background
  const labelWidth = label.length * 5 + 8;
  const labelX = midX - labelWidth / 2;
  const labelY = midY - 12;
  
  ctx.fillStyle = colors.white;
  ctx.fillRect(labelX - 2, labelY - 8, labelWidth + 4, 14);
  
  ctx.fillStyle = color;
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, midX, labelY + 2);
}

// Create clean Database ERD Diagram
function createCleanDatabaseERD() {
  const canvas = createCanvas(1600, 1000);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = colors.gray50;
  ctx.fillRect(0, 0, 1600, 1000);
  
  // Title
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Database Schema - Entity Relationship Diagram', 800, 45);
  
  ctx.fillStyle = colors.gray600;
  ctx.font = '13px Arial';
  ctx.fillText('Multi-Tenant SaaS Platform', 800, 65);
  
  // Define table structures with better field names
  const tables = {
    tenants: {
      x: 100,
      y: 120,
      name: 'TENANTS',
      color: colors.primary,
      fields: [
        'id (PK)',
        'name',
        'email',
        'subscription_plan',
        'max_users',
        'max_projects',
        'is_active',
        'created_at',
        'updated_at'
      ]
    },
    users: {
      x: 450,
      y: 120,
      name: 'USERS',
      color: colors.secondary,
      fields: [
        'id (PK)',
        'tenant_id (FK)',
        'name',
        'email',
        'password_hash',
        'role',
        'is_active',
        'created_at',
        'updated_at'
      ]
    },
    projects: {
      x: 800,
      y: 120,
      name: 'PROJECTS',
      color: colors.success,
      fields: [
        'id (PK)',
        'tenant_id (FK)',
        'owner_id (FK)',
        'name',
        'description',
        'status',
        'created_at',
        'updated_at'
      ]
    },
    tasks: {
      x: 1150,
      y: 120,
      name: 'TASKS',
      color: colors.warning,
      fields: [
        'id (PK)',
        'tenant_id (FK)',
        'project_id (FK)',
        'assigned_to (FK)',
        'title',
        'description',
        'status',
        'priority',
        'due_date',
        'created_at'
      ]
    },
    auditLogs: {
      x: 575,
      y: 580,
      name: 'AUDIT_LOGS',
      color: colors.danger,
      fields: [
        'id (PK)',
        'tenant_id (FK)',
        'user_id (FK)',
        'entity_type',
        'action',
        'changes (JSON)',
        'ip_address',
        'created_at'
      ]
    }
  };
  
  // Draw all tables
  const width = 280;
  const height = 310;
  
  Object.values(tables).forEach(table => {
    drawTableBox(ctx, table.x, table.y, width, height, table.name, table.fields, table.color);
  });
  
  // Draw relationships with curves
  const relationshipColor = '#6366f1';
  
  // TENANTS -> USERS
  drawRelationship(ctx, 380, 180, 450, 180, '1:N', relationshipColor);
  
  // TENANTS -> PROJECTS
  drawRelationship(ctx, 380, 220, 800, 220, '1:N', relationshipColor);
  
  // TENANTS -> TASKS
  drawRelationship(ctx, 380, 260, 1150, 270, '1:N', relationshipColor);
  
  // USERS -> PROJECTS (owner_id)
  drawRelationship(ctx, 500, 430, 850, 120, 'owns', '#ff6b6b');
  
  // USERS -> TASKS (assigned_to)
  drawRelationship(ctx, 570, 430, 1200, 120, 'assigned', '#ff6b6b');
  
  // PROJECTS -> TASKS (project_id)
  drawRelationship(ctx, 1080, 180, 1150, 180, '1:N', relationshipColor);
  
  // TENANTS -> AUDIT_LOGS
  drawRelationship(ctx, 240, 430, 650, 580, '1:N', relationshipColor);
  
  // USERS -> AUDIT_LOGS
  drawRelationship(ctx, 540, 430, 620, 580, '1:N', relationshipColor);
  
  // Legend
  const legendY = 780;
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('LEGEND', 100, legendY);
  
  // Legend items
  ctx.font = '12px Arial';
  ctx.fillStyle = colors.gray600;
  
  // PK indicator
  ctx.fillStyle = '#ffeb3b';
  ctx.fillRect(100, legendY + 20, 15, 13);
  ctx.fillStyle = colors.gray600;
  ctx.fillText('Primary Key', 125, legendY + 28);
  
  // FK indicator
  ctx.fillStyle = '#e3f2fd';
  ctx.fillRect(100, legendY + 45, 15, 13);
  ctx.fillStyle = colors.gray600;
  ctx.fillText('Foreign Key', 125, legendY + 53);
  
  // Relationship indicator
  ctx.strokeStyle = relationshipColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(100, legendY + 70);
  ctx.lineTo(115, legendY + 70);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = colors.gray600;
  ctx.fillText('1:N Relationship', 125, legendY + 73);
  
  // Key information
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 14px Arial';
  ctx.fillText('KEY INFORMATION', 450, legendY);
  
  ctx.font = '12px Arial';
  ctx.fillStyle = colors.gray600;
  ctx.textAlign = 'left';
  
  const keyInfo = [
    '• All tables include tenant_id for complete multi-tenant isolation',
    '• Primary Keys (PK) uniquely identify each record',
    '• Foreign Keys (FK) maintain referential integrity',
    '• Row-level security enforced through tenant_id filtering',
    '• Audit logs track all user actions and data changes',
    '• Relationships use 1:N (one-to-many) cardinality'
  ];
  
  keyInfo.forEach((info, i) => {
    ctx.fillText(info, 450, legendY + 25 + (i * 22));
  });
  
  // Statistics box
  ctx.fillStyle = '#f0f4ff';
  ctx.fillRect(1100, legendY - 10, 450, 160);
  
  ctx.strokeStyle = relationshipColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(1100, legendY - 10, 450, 160);
  
  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('DATABASE STATISTICS', 1120, legendY + 15);
  
  ctx.font = '11px Arial';
  ctx.fillStyle = colors.gray600;
  
  const stats = [
    '✓ Total Tables: 5',
    '✓ Total Fields: 52+',
    '✓ Primary Keys: 5',
    '✓ Foreign Keys: 8',
    '✓ Relationships: 8',
    '✓ Isolation Level: Row-level (tenant_id)',
    '✓ Audit Trail: Complete JSON change tracking',
    '✓ Data Integrity: Referential & Row constraints'
  ];
  
  stats.forEach((stat, i) => {
    ctx.fillText(stat, 1120, legendY + 35 + (i * 15));
  });
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('database-erd.png', buffer);
  console.log('✓ Created clean database-erd.png (1600x1000)');
}

createCleanDatabaseERD();
console.log('\n✅ Clean database ERD generated successfully!');
