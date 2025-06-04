// Global variables to store the processed data
let scannedQRs = [];
    let notScannedQRs = [];
    let originalHeaders = [];
    const displayHeaders = ['Dhalao Name', 'qrcodeid', 'Ward', 'Zone', 'Location', 'Type', 'Scanned Status'];

// Function to parse CSV content
function parseCSV(content, fileName) {
    const rows = content.split('\n');
    originalHeaders = rows[0].split(',').map(header => header.trim());
    const qrCodeIdIndex = originalHeaders.findIndex(header => header.trim().toLowerCase() === 'qrcodeid');

    console.log(`Parsing headers for ${fileName}:`, originalHeaders);
    if (qrCodeIdIndex === -1) {
        throw new Error(`CSV file '${fileName}' must contain a "Qrcodeid" column`);
    }

    return rows.slice(1)
        .filter(row => row.trim())
        .map(row => {
            const values = row.split(',');
            const rowData = {};
            originalHeaders.forEach((header, index) => {
                rowData[header] = values[index] ? values[index].trim() : '';
            });
            return {
                id: rowData[originalHeaders[qrCodeIdIndex]].trim(),
                data: rowData
            };
        })
        .filter(item => item.id); // Remove empty IDs
}

// Function to read file content
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// Function to compare files and generate report
async function compareFiles() {
    // Reset previous results
    scannedQRs = [];
    notScannedQRs = [];
    
    // Get file inputs
    const totalQrFile = document.getElementById('totalQrFile').files[0];
    const scannedQrFile = document.getElementById('scannedQrFile').files[0];
    
    // Hide previous error messages
    const errorAlert = document.getElementById('errorAlert');
    errorAlert.classList.add('d-none');

    // Validate file selection
    if (!totalQrFile || !scannedQrFile) {
        showError('Please select both CSV files');
        return;
    }

    try {
        // Read and parse both files
        const totalQrContent = await readFile(totalQrFile);
        const scannedQrContent = await readFile(scannedQrFile);

            const totalQrIds = parseCSV(totalQrContent, totalQrFile.name);
        const scannedQrIds = parseCSV(scannedQrContent, scannedQrFile.name);

        // Compare QR codes
        const scannedMap = new Map(scannedQrIds.map(item => [item.id, item.data]));
        
        totalQrIds.forEach(item => {
            const rowData = item.data;
            const displayRow = {};
            displayHeaders.slice(0, -1).forEach(header => {
                if (header === 'Type') {
                    displayRow[header] = rowData['Type'] || ''; // Assuming 'Type' column exists in CSV
                } else {
                    displayRow[header] = rowData[header] || '';
                }
            });

            if (scannedMap.has(item.id)) {
                displayRow['Scanned Status'] = 'Scanned';
                scannedQRs.push(displayRow);
            } else {
                displayRow['Scanned Status'] = 'Not Scanned';
                notScannedQRs.push(displayRow);
            }
        });

        // Update UI
        updateTables();
        updateSummary();

    } catch (error) {
        showError(error.message);
    }
}

// Function to update tables with results
function updateTables() {
    // Update table headers
    const headerRow = `<th>S.No.</th>` + displayHeaders.map(header => `<th>${header}</th>`).join('');
    document.querySelectorAll('table thead tr').forEach(row => {
        row.innerHTML = headerRow;
    });

    // Update Scanned QRs table
    const scannedTable = document.getElementById('scannedTable').getElementsByTagName('tbody')[0];
    scannedTable.innerHTML = scannedQRs.map((data, index) => {
        const rowClass = data['Scanned Status'] === 'Scanned' ? 'table-success' : '';
        return `<tr class="${rowClass}"><td>${index + 1}</td>${displayHeaders.map(header => `<td>${data[header]}</td>`).join('')}</tr>`;
    }).join('');

    // Update Not-Scanned QRs table
    const notScannedTable = document.getElementById('notScannedTable').getElementsByTagName('tbody')[0];
    notScannedTable.innerHTML = notScannedQRs.map((data, index) => {
        const rowClass = data['Scanned Status'] === 'Not Scanned' ? 'table-danger' : '';
        return `<tr class="${rowClass}"><td>${index + 1}</td>${displayHeaders.map(header => `<td>${data[header]}</td>`).join('')}</tr>`;
    }).join('');
}

// Function to update summary section
function updateSummary() {
    const summarySection = document.getElementById('summarySection');
    summarySection.classList.remove('d-none');

    document.getElementById('totalCount').textContent = scannedQRs.length + notScannedQRs.length;
    document.getElementById('scannedCount').textContent = scannedQRs.length;
    document.getElementById('notScannedCount').textContent = notScannedQRs.length;
}

// Function to show error message
function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    errorAlert.textContent = message;
    errorAlert.classList.remove('d-none');
}

// Function to download CSV
function downloadCSV(type) {
    const data = type === 'scanned' ? scannedQRs : notScannedQRs;
    const filename = `${type}_qr_codes.csv`;
    
    // Create CSV content
    const csvContent = displayHeaders.join(',') + '\n' +
        data.map(row => displayHeaders.map(header => row[header]).join(',')).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to print table
function printTable(tableId, title) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table with ID ${tableId} not found.`);
        return;
    }

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>' + title + '</title>');
    printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
    printWindow.document.write('th { background-color: #f2f2f2; }');
    printWindow.document.write('td:first-child, th:first-child { width: 50px; }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div style="text-align: center; margin-bottom: 20px;"><img src="SAFAIMITRA.png" alt="SafaiMitra Logo" style="height: 80px;"></div>');
    printWindow.document.write('<h1 style="text-align: center;">' + title + '</h1>');
    const today = new Date();
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString(undefined, dateOptions);
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const formattedTime = today.toLocaleTimeString(undefined, timeOptions);
    printWindow.document.write('<p style="text-align: center; font-style: italic;">Report Date: ' + formattedDate + ' ' + formattedTime + '</p>');

    // Add summary cards to print view
    const totalCount = document.getElementById('totalCount').innerText;
    const scannedCount = document.getElementById('scannedCount').innerText;
    const notScannedCount = document.getElementById('notScannedCount').innerText;

    printWindow.document.write(`
        <div style="display: flex; justify-content: center; margin-bottom: 20px;">
            <div style="flex: 1; text-align: center; margin: 0 10px; padding: 15px; border-radius: 10px; background: linear-gradient(45deg, #007bff, #0056b3); color: white; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                <h5>Total QR Codes</h5>
                <p style="font-size: 2.5rem; margin: 0;">${totalCount}</p>
            </div>
            <div style="flex: 1; text-align: center; margin: 0 10px; padding: 15px; border-radius: 10px; background: linear-gradient(45deg, #28a745, #1e7e34); color: white; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                <h5>Scanned</h5>
                <p style="font-size: 2.5rem; margin: 0;">${scannedCount}</p>
            </div>
            <div style="flex: 1; text-align: center; margin: 0 10px; padding: 15px; border-radius: 10px; background: linear-gradient(45deg, #dc3545, #b02a37); color: white; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                <h5>Not Scanned</h5>
                <p style="font-size: 2.5rem; margin: 0;">${notScannedCount}</p>
            </div>
        </div>
    `);

    printWindow.document.write(table.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}