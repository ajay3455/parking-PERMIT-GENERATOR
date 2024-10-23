// Generate Parking Pass
document.getElementById('passForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const securityCardName = document.getElementById('securityCardName').value;
    const licensePlate = document.getElementById('licensePlate').value;
    const visitorName = document.getElementById('visitorName').value;
    const vehicleModel = document.getElementById('vehicleModel').value;
    const duration = parseInt(document.getElementById('duration').value);

    const expiryDate = new Date(Date.now() + duration * 60000); // duration in minutes

    const passData = {
        securityCardName,
        licensePlate,
        visitorName,
        vehicleModel,
        expiryDate: expiryDate.toISOString()
    };

    // Generate QR code data
    const qrData = JSON.stringify(passData);

    // Display the pass
    document.getElementById('expiryDateTime').textContent = expiryDate.toLocaleString();
    document.getElementById('vehicleNumber').textContent = licensePlate;
    document.getElementById('displaySecurityCardName').textContent = securityCardName;
    document.getElementById('displayVisitorName').textContent = visitorName;
    document.getElementById('displayVehicleModel').textContent = vehicleModel;

    // Generate QR code
    const qrCodeDiv = document.getElementById('qrcode');
    qrCodeDiv.innerHTML = '';
    new QRCode(qrCodeDiv, {
        text: qrData,
        width: 180,
        height: 180
    });

    document.getElementById('passOutput').style.display = 'block';
    // Scroll to the pass output
    document.getElementById('passOutput').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('printButton').addEventListener('click', function() {
    window.print();
});

// Verification code
document.getElementById('scanButton').addEventListener('click', function() {
    // Implement QR code scanning via camera
    const video = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    const canvas = canvasElement.getContext('2d');
    const verificationResult = document.getElementById('verificationResult');

    verificationResult.innerHTML = '';

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function(stream) {
        video.srcObject = stream;
        video.setAttribute('playsinline', true); // required to tell iOS safari we don't want fullscreen
        video.style.display = 'block';
        video.play();
        requestAnimationFrame(tick);
    });

    function tick() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvasElement.hidden = false;
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                // QR code detected
                video.srcObject.getTracks().forEach(track => track.stop());
                video.style.display = 'none';
                processQRCode(code.data);
                return;
            }
        }
        requestAnimationFrame(tick);
    }
});

document.getElementById('uploadInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    const img = new Image();
    img.onload = function() {
        const canvasElement = document.getElementById('canvas');
        const canvas = canvasElement.getContext('2d');
        canvasElement.width = img.width;
        canvasElement.height = img.height;
        canvas.drawImage(img, 0, 0, img.width, img.height);
        const imageData = canvas.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
            processQRCode(code.data);
        } else {
            document.getElementById('verificationResult').innerHTML = '<div class="alert alert-danger">No QR code found.</div>';
        }
    };
    img.src = URL.createObjectURL(file);
});

function processQRCode(data) {
    try {
        const passData = JSON.parse(data);
        const expiryDate = new Date(passData.expiryDate);
        const now = new Date();
        let status = '';

        if (now > expiryDate) {
            status = '<div class="alert alert-danger">Status: Expired</div>';
        } else {
            status = '<div class="alert alert-success">Status: Valid</div>';
        }

        const resultHTML = `
            <h4>Pass Details:</h4>
            <p><strong>Security Card Name:</strong> ${passData.securityCardName}</p>
            <p><strong>Visitor's Name:</strong> ${passData.visitorName}</p>
            <p><strong>Vehicle Model:</strong> ${passData.vehicleModel}</p>
            <p><strong>License Plate:</strong> ${passData.licensePlate}</p>
            <p><strong>Expiry Date:</strong> ${expiryDate.toLocaleString()}</p>
            ${status}
        `;

        document.getElementById('verificationResult').innerHTML = resultHTML;
    } catch (e) {
        document.getElementById('verificationResult').innerHTML = '<div class="alert alert-danger">Invalid QR code data.</div>';
    }
}
