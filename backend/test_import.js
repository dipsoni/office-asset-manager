const fs = require('fs');
const http = require('http');
const path = require('path');

const filePath = path.join(__dirname, '..', 'custom_format_test.xlsx');
const fileBuffer = fs.readFileSync(filePath);
const boundary = '----WebKitFormBoundary' + Math.random().toString(16);

const mapping = {
  name: 'Equipment Description',
  assigned_to: 'User Name',
  serial_number: 'Machine S/N',
  purchase_price: 'Total Bill Amount',
  location: 'Sitting Place',
  purchase_date: 'Purchased DT',
  warranty_end_date: 'Warranty Valid Till',
  notes: 'Hardware Remarks'
};

const headerPart = Buffer.from(
  '--' + boundary + '\r\n' +
  'Content-Disposition: form-data; name="column_mapping"\r\n\r\n' +
  JSON.stringify(mapping) + '\r\n' +
  '--' + boundary + '\r\n' +
  'Content-Disposition: form-data; name="default_category"\r\n\r\n' +
  'Laptop\r\n' +
  '--' + boundary + '\r\n' +
  'Content-Disposition: form-data; name="import_file"; filename="custom_format_test.xlsx"\r\n' +
  'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n'
);

const footerPart = Buffer.from('\r\n--' + boundary + '--\r\n');
const payload = Buffer.concat([headerPart, fileBuffer, footerPart]);

const req = http.request({
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/backup/import',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': payload.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Import API Result:', data));
});

req.on('error', err => console.error('Req error:', err));
req.write(payload);
req.end();
