// Global variables to store the processed data
const CONFIG = {
    printDelayMs: 100 // Delay in milliseconds before printing to ensure DOM updates
};

let scannedQRs = [];
let notScannedQRs = [];
let originalHeaders = [];
const displayHeaders = ['Dhalao Name', 'qrcodeid', 'Ward', 'Zone', 'Zonal Name', 'Location', 'Scanned Status'];

const zonalData = {
    "Aniket Wards": [
        "09-Gandhi Nagar",
        "34-Radhaniwas",
        "50-Patharpura",
        "51-Gaushala Nagar",
        "62-Mathura Darwaza",
        "66-Keshighat",
        "70-Biharipur"
    ],
    "Abhinav Wards": [
        "08-Atas",
        "13-Sunrakh",
        "21-Chaitanya Bihar",
        "25-Chharaura",
        "67-Kemar Van",
        "69-Ratan Chhatri"
    ],
    "Bharat Wards": [
        "01-Birjapur",
        "03-Girdharpur",
        "11-Tarsi",
        "15-Maholi First",
        "16-Bakalpur",
        "20-Krishna Nagar First",
        "30-Krishna Nagar Second",
        "31-Navneet Nagar",
        "33-Palikhera",
        "37-Baldevpuri",
        "44-Radhika Bihar",
        "47-Dwarkapuri",
        "48-Satoha Asangpur",
        "54-Pratap Nagar",
        "59-Maholi Second",
        "68-Shanti Nagar"
    ],
    "Nishant Wards": [
        "06-Aduki",
        "10-Aurangabad First",
        "23-Aheer Pada",
        "27-Baad",
        "28-Aurangabad Second",
        "29-Koyla Alipur",
        "32-Ranchibagar",
        "38-Civil lines",
        "41-Dhaulipiau",
        "57-Balajipuram",
        "63-Maliyaan Sadar",
        "52-Chandrapuri"
    ],
    "Rahul Wards": [
        "02-Ambedkar Nagar",
        "04-Ishapur Yamunapar",
        "05-Bharatpur Gate",
        "07-Lohvan",
        "14-Lakshmi Nagar Yamunapar",
        "18-General ganj",
        "19-Ramnagar Yamunapar",
        "26-Naya Nagla",
        "35-Bankhandi",
        "49-Daimpiriyal Nagar",
        "53-Krishna puri",
        "61-Chaubia para",
        "64-Ghati Bahalray",
        "65-Holi Gali"
    ],
    "Ranveer Wards": [
        "12-Radhe Shyam Colony",
        "17-Bairaagpura",
        "22-Badhri Nagar",
        "24-Sarai Azamabad",
        "36-Jaisingh Pura",
        "39-Mahavidhya Colony",
        "40-Rajkumar",
        "42-Manoharpur",
        "43-Ganeshra",
        "45-Birla Mandir",
        "46-Radha Nagar",
        "55-Govind Nagar",
        "56-Mandi Randas",
        "58-Gau Ghat",
        "60-Jagannath Puri"
    ]
};

function getZonalName(ward) {
    for (const zonalName in zonalData) {
        if (zonalData[zonalName].includes(ward)) {
            return zonalName;
        }
    }
    return 'N/A'; // Or handle cases where ward is not found
}

// Function to parse CSV content
function parseCSV(content, fileName) {
    const rows = content.split('\n');
    originalHeaders = rows[0].split(',').map(header => header.trim());
    const qrCodeIdIndex = originalHeaders.findIndex(header => header.trim().toLowerCase().replace(/\s+/g, '') === 'qrcodeid');

    console.log(`Parsing headers for ${fileName}:`, originalHeaders);
    if (qrCodeIdIndex === -1) {
        throw new Error(`CSV file '${fileName}' must contain a "qrcodeid" column (case-insensitive and whitespace-agnostic).`);
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
                displayRow[header] = rowData[header] || '';
            });
            displayRow['Zonal Name'] = getZonalName(rowData['Ward']);

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
        populateZonalDropdown();
        document.getElementById('zonalReportSection').classList.remove('d-none');

    } catch (error) {
        showError(error.message);
    }
}

// Function to populate the zonal dropdown
function populateZonalDropdown() {
    const zonalSelect = document.getElementById('zonalNameSelect');
    zonalSelect.innerHTML = '<option value="">All Zones</option>'; // Reset options
    const zones = Object.keys(zonalData);
    zones.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        zonalSelect.appendChild(option);
    });
}

// Function to generate zonal report
function generateZonalReport() {
    const selectedZone = document.getElementById('zonalNameSelect').value;
    const zonalTableBody = document.querySelector('#zonalTable tbody');
    zonalTableBody.innerHTML = ''; // Clear previous results

    let filteredQRs = [];
    if (selectedZone === '') {
        // If 'All Zones' is selected, combine all QRs and add 'Scanned Status'
        filteredQRs = [...scannedQRs, ...notScannedQRs].map(qr => ({
            ...qr,
            'Scanned Status': qr['Scanned Status']
        }));
    } else {
        // Filter by selected zone and add 'Scanned Status'
        filteredQRs = [...scannedQRs, ...notScannedQRs].filter(qr => qr['Zonal Name'] === selectedZone).map(qr => ({
            ...qr,
            'Scanned Status': qr['Scanned Status']
        }));
    }

    filteredQRs.forEach((qr, index) => {
        const row = zonalTableBody.insertRow();
        row.insertCell().textContent = index + 1;
        displayHeaders.forEach(header => {
            if (header === 'Scanned Status') {
                const cell = row.insertCell();
                cell.textContent = qr[header];
                if (qr[header] === 'Scanned') {
                    cell.classList.add('table-success');
                } else {
                    cell.classList.add('table-danger');
                }
            } else if (header === 'qrcodeid' || header === 'Zonal Name' || header === 'Ward') {
                row.insertCell().textContent = qr[header] || '';
            } else {
                // For other headers not explicitly handled, insert empty cell or specific data if available
                row.insertCell().textContent = qr[header] || '';
            }
        });
    });

    // Update zonal summary counts
    const zonalScannedCount = filteredQRs.filter(qr => qr['Scanned Status'] === 'Scanned').length;
    const zonalNotScannedCount = filteredQRs.filter(qr => qr['Scanned Status'] === 'Not Scanned').length;
    const zonalTotalCount = filteredQRs.length;

    document.getElementById('zonalTotalCount').textContent = zonalTotalCount;
    document.getElementById('zonalScannedCount').textContent = zonalScannedCount;
    document.getElementById('zonalNotScannedCount').textContent = zonalNotScannedCount;

    // Show the zonal report section and summary if they were hidden
    document.getElementById('zonalReportSection').classList.remove('d-none');
    // document.getElementById('zonalSummarySection').classList.remove('d-none'); // Cards are not needed in zonal report
}

// Function to update tables with results

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

// Function to download table as CSV
function downloadCSV(type) {
    let data = [];
    let filename = '';
    let headers = [];

    if (type === 'scanned') {
        data = scannedQRs;
        filename = 'scanned_qr_codes.csv';
        headers = displayHeaders;
    } else if (type === 'notScanned') {
        data = notScannedQRs;
        filename = 'not_scanned_qr_codes.csv';
        headers = displayHeaders;
    } else if (type === 'zonal') {
        const selectedZone = document.getElementById('zonalNameSelect').value;
        if (selectedZone === '') {
            data = [...scannedQRs, ...notScannedQRs];
        } else {
            data = [...scannedQRs, ...notScannedQRs].filter(qr => qr['Zonal Name'] === selectedZone);
        }
        filename = `zonal_qr_codes_${selectedZone || 'all_zones'}.csv`;
        headers = ['qrcodeid', 'Zonal Name', 'Ward', 'Scanned Status']; // Specific headers for zonal report
    }

    if (data.length === 0) {
        alert(`No ${type} QR codes to download.`);
        return;
    }

    let csvContent = headers.join(',') + '\n';
    data.forEach(row => {
        csvContent += headers.map(header => `"${row[header] || ''}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
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
    printWindow.document.write('<link rel="stylesheet" href="style.css">');
    printWindow.document.write('<link rel="stylesheet" href="print.css" media="print">');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div style="text-align: center; margin-bottom: 20px;"><img src="SAFAIMITRA.png" alt="SafaiMitra Logo" style="height: 80px;"></div>');
    printWindow.document.write('<h1 style="text-align: center;">' + title + '</h1>');
    const today = new Date();
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString(undefined, dateOptions);
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const formattedTime = today.toLocaleTimeString(undefined, timeOptions);
    printWindow.document.write('<p style="text-align: center; font-style: italic;">Report Date: ' + formattedDate + ' ' + formattedTime + '</p>');

    if (tableId === 'scannedTable' || tableId === 'notScannedTable') {
        let totalCount, scannedCount, notScannedCount;

        totalCount = document.getElementById('totalCount').innerText;
        scannedCount = document.getElementById('scannedCount').innerText;
        notScannedCount = document.getElementById('notScannedCount').innerText;

        printWindow.document.write(`
            <div class="row text-center mb-4">
                <div class="col-md-4 mb-3">
                    <div class="card text-white bg-primary mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Total QR Codes</h5>
                            <p class="card-text fs-1">${totalCount}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card text-white bg-success mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Scanned</h5>
                            <p class="card-text fs-1">${scannedCount}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card text-white bg-danger mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Not Scanned</h5>
                            <p class="card-text fs-1">${notScannedCount}</p>
                        </div>
                    </div>
                </div>
            </div>
        `);
    } else if (tableId === 'zonalTable') {
        // Do not include summary cards for zonal report
    }

    printWindow.document.write(table.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, CONFIG.printDelayMs);
    printWindow.close();
}

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