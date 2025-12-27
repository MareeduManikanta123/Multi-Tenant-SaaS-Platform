const fs = require('fs');
const { createCanvas } = require('canvas');

const colors = {
  white: '#ffffff',
  darkBg: '#0f172a',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
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

function drawRoundRect(ctx, x, y, width, height, radius) {
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

function drawBox(ctx, x, y, width, height, text, color, borderColor, textColor = colors.white) {
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(x + 2, y + 2, width, height);

  // Box
  ctx.fillStyle = color;
  drawRoundRect(ctx, x, y, width, height, 8);
  ctx.fill();

  // Border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Text
  ctx.fillStyle = textColor;
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const lines = text.split('\n');
  const lineHeight = 18;
  const totalHeight = lines.length * lineHeight;
  const startY = y + height / 2 - totalHeight / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, x + width / 2, startY + i * lineHeight);
  });
}

function drawArrow(ctx, x1, y1, x2, y2, label = '', color = colors.gray600) {
  // Line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Arrow head
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headlen = 12;
  
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  // Label
  if (label) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    ctx.fillStyle = colors.white;
    ctx.fillRect(midX - 30, midY - 12, 60, 24);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(midX - 30, midY - 12, 60, 24);
    
    ctx.fillStyle = color;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, midX, midY);
  }
}

function createSystemFlowchart() {
  const canvas = createCanvas(1600, 1100);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = colors.gray100;
  ctx.fillRect(0, 0, 1600, 1100);

  // Header
  ctx.fillStyle = colors.darkBg;
  ctx.fillRect(0, 0, 1600, 80);

  ctx.fillStyle = colors.white;
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('System Data Flow Diagram', 800, 50);

  // Define sections
  const y1 = 120;
  const y2 = 300;
  const y3 = 480;
  const y4 = 660;

  // ============ SECTION 1: USER ENTRY ============
  ctx.fillStyle = colors.gray700;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('1. User Entry Point', 50, y1 - 20);

  drawBox(ctx, 150, y1, 140, 60, 'User Access\nBrowser', colors.primary, '#1e40af');
  drawArrow(ctx, 290, y1 + 30, 380, y1 + 30, '', colors.primary);

  drawBox(ctx, 380, y1, 140, 60, 'Frontend\nApplication\n(React + Vite)', colors.primary, '#1e40af');
  drawArrow(ctx, 520, y1 + 30, 610, y1 + 30, '', colors.primary);

  // ============ SECTION 2: AUTHENTICATION ============
  ctx.fillStyle = colors.gray700;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('2. Authentication Flow', 50, y2 - 20);

  drawBox(ctx, 150, y2, 140, 60, 'Login/Register\nForm', colors.secondary, '#6d28d9');
  drawArrow(ctx, 290, y2 + 30, 380, y2 + 30, 'Credentials', colors.secondary);

  drawBox(ctx, 380, y2, 140, 60, 'Express.js\nAuth Routes', colors.secondary, '#6d28d9');
  drawArrow(ctx, 520, y2 + 30, 610, y2 + 30, 'Validate', colors.secondary);

  drawBox(ctx, 610, y2, 140, 60, 'PostgreSQL\nCheck User', colors.secondary, '#6d28d9');
  drawArrow(ctx, 750, y2 + 30, 840, y2 + 30, 'Success', colors.success);

  drawBox(ctx, 840, y2, 140, 60, 'Generate\nJWT Token\n(24hr)', colors.success, '#047857');

  // Return token
  drawArrow(ctx, 980, y2 + 30, 1100, y2 + 30, '', colors.success);
  drawBox(ctx, 1100, y2, 140, 60, 'Store Token\nLocalStorage', colors.success, '#047857');

  // ============ SECTION 3: AUTHORIZED REQUEST ============
  ctx.fillStyle = colors.gray700;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('3. Authorized Data Request', 50, y3 - 20);

  drawBox(ctx, 150, y3, 140, 60, 'User Action\n(View Projects)', colors.warning, '#b45309');
  drawArrow(ctx, 290, y3 + 30, 380, y3 + 30, 'API Call', colors.warning);

  drawBox(ctx, 380, y3, 140, 60, 'Attach JWT\nToken Header', colors.warning, '#b45309');
  drawArrow(ctx, 520, y3 + 30, 610, y3 + 30, 'Request', colors.warning);

  drawBox(ctx, 610, y3, 140, 60, 'Validate JWT\nMiddleware', colors.warning, '#b45309');
  drawArrow(ctx, 750, y3 + 30, 840, y3 + 30, 'Valid', colors.success);

  // ============ SECTION 4: DATA PROCESSING ============
  ctx.fillStyle = colors.gray700;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('4. Data Processing & Response', 50, y4 - 20);

  drawBox(ctx, 150, y4, 140, 60, 'RBAC Check\nauthorize()', colors.danger, '#991b1b');
  drawArrow(ctx, 290, y4 + 30, 380, y4 + 30, 'Permitted', colors.danger);

  drawBox(ctx, 380, y4, 140, 60, 'Query Database\nFiltered by\ntenant_id', colors.danger, '#991b1b');
  drawArrow(ctx, 520, y4 + 30, 610, y4 + 30, 'Results', colors.danger);

  drawBox(ctx, 610, y4, 140, 60, 'Format JSON\nResponse', colors.danger, '#991b1b');
  drawArrow(ctx, 750, y4 + 30, 840, y4 + 30, 'Send', colors.success);

  drawBox(ctx, 840, y4, 140, 60, 'Receive &\nRender UI\n(React)', colors.success, '#047857');

  // ============ RIGHT SIDE: MULTI-TENANCY ============
  const rightX = 1300;
  
  ctx.fillStyle = colors.gray700;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Multi-Tenancy Security', rightX - 250, y1 - 20);

  // Tenant isolation box
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.fillRect(rightX - 240, y1, 220, 300);
  
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2;
  ctx.strokeRect(rightX - 240, y1, 220, 300);

  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Tenant A', rightX - 230, y1 + 25);
  
  ctx.font = '11px Arial';
  ctx.fillStyle = colors.gray600;
  const tenantA = [
    '✓ User: alice@a.com',
    '✓ Role: admin',
    '✓ Access: Own data only',
    '✓ Projects: 2',
    '✓ Tasks: 15'
  ];
  tenantA.forEach((item, i) => {
    ctx.fillText(item, rightX - 230, y1 + 50 + i * 22);
  });

  // Barrier
  ctx.strokeStyle = colors.danger;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(rightX - 240, y1 + 155);
  ctx.lineTo(rightX - 20, y1 + 155);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Tenant B', rightX - 230, y1 + 185);
  
  ctx.font = '11px Arial';
  ctx.fillStyle = colors.gray600;
  const tenantB = [
    '✓ User: bob@b.com',
    '✓ Role: user',
    '✓ Access: Own data only',
    '✓ Projects: 1',
    '✓ Tasks: 8'
  ];
  tenantB.forEach((item, i) => {
    ctx.fillText(item, rightX - 230, y1 + 210 + i * 22);
  });

  // Database architecture
  ctx.fillStyle = colors.gray700;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Database Structure', rightX - 250, y3 - 20);

  ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
  ctx.fillRect(rightX - 240, y3, 220, 200);
  
  ctx.strokeStyle = colors.success;
  ctx.lineWidth = 2;
  ctx.strokeRect(rightX - 240, y3, 220, 200);

  ctx.fillStyle = colors.gray800;
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'left';

  const tables = [
    '📊 TENANTS',
    '👥 USERS',
    '📁 PROJECTS',
    '✓ TASKS',
    '📋 AUDIT_LOGS'
  ];

  tables.forEach((table, i) => {
    ctx.fillText(table, rightX - 230, y3 + 30 + i * 30);
    
    ctx.font = '9px Arial';
    ctx.fillStyle = colors.gray500;
    ctx.fillText('tenant_id isolation', rightX - 210, y3 + 45 + i * 30);
    ctx.fillStyle = colors.gray800;
    ctx.font = 'bold 11px Arial';
  });

  // Bottom stats
  ctx.fillStyle = colors.darkBg;
  ctx.fillRect(0, 1030, 1600, 70);

  ctx.fillStyle = colors.white;
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('🔐 Security Layers: JWT Auth → RBAC Check → Tenant Isolation → Row-Level Filtering', 50, 1060);
  ctx.fillText('⚡ Performance: Indexed queries | 🛡️ Audit Trail: All actions logged | 📈 Scalability: Multi-tenant ready', 50, 1085);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('system-flow.png', buffer);
  console.log('✓ Created system-flow.png');
}

createSystemFlowchart();
console.log('\n✅ System flowchart created successfully!');
