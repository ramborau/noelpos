<?php
/**
 * Unzipper - Simple ZIP File Extractor
 * Upload and extract ZIP files directly on the server
 */

$currentDir = __DIR__;
$message = '';
$messageType = '';

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle file upload
    if (isset($_FILES['zipfile']) && $_FILES['zipfile']['error'] === UPLOAD_ERR_OK) {
        $uploadedFile = $_FILES['zipfile'];
        $fileName = basename($uploadedFile['name']);

        if (pathinfo($fileName, PATHINFO_EXTENSION) !== 'zip') {
            $message = 'Only ZIP files are allowed.';
            $messageType = 'error';
        } else {
            $destination = $currentDir . '/' . $fileName;
            if (move_uploaded_file($uploadedFile['tmp_name'], $destination)) {
                $message = "File '$fileName' uploaded successfully!";
                $messageType = 'success';
            } else {
                $message = 'Failed to upload file.';
                $messageType = 'error';
            }
        }
    }

    // Handle extraction
    if (isset($_POST['extract']) && isset($_POST['zipfile'])) {
        $zipFile = basename($_POST['zipfile']); // Sanitize
        $zipPath = $currentDir . '/' . $zipFile;
        $extractTo = isset($_POST['extract_to']) && !empty($_POST['extract_to'])
            ? $currentDir . '/' . basename($_POST['extract_to'])
            : $currentDir;

        if (!file_exists($zipPath)) {
            $message = "ZIP file not found: $zipFile";
            $messageType = 'error';
        } else {
            $zip = new ZipArchive();
            if ($zip->open($zipPath) === TRUE) {
                // Create extraction directory if specified and doesn't exist
                if ($extractTo !== $currentDir && !is_dir($extractTo)) {
                    mkdir($extractTo, 0755, true);
                }

                $zip->extractTo($extractTo);
                $numFiles = $zip->numFiles;
                $zip->close();

                $message = "Successfully extracted $numFiles files from '$zipFile'";
                $messageType = 'success';
            } else {
                $message = "Failed to open ZIP file: $zipFile";
                $messageType = 'error';
            }
        }
    }

    // Handle deletion
    if (isset($_POST['delete']) && isset($_POST['zipfile'])) {
        $zipFile = basename($_POST['zipfile']); // Sanitize
        $zipPath = $currentDir . '/' . $zipFile;

        if (file_exists($zipPath) && unlink($zipPath)) {
            $message = "Deleted: $zipFile";
            $messageType = 'success';
        } else {
            $message = "Failed to delete: $zipFile";
            $messageType = 'error';
        }
    }
}

// Get all ZIP files in current directory
$zipFiles = glob($currentDir . '/*.zip');
$zipFiles = array_map('basename', $zipFiles);

// Get ZIP file details
function getZipInfo($zipPath) {
    $info = [
        'size' => filesize($zipPath),
        'modified' => filemtime($zipPath),
        'files' => 0
    ];

    $zip = new ZipArchive();
    if ($zip->open($zipPath) === TRUE) {
        $info['files'] = $zip->numFiles;
        $zip->close();
    }

    return $info;
}

function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    return round($bytes / pow(1024, $pow), $precision) . ' ' . $units[$pow];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unzipper - ZIP File Extractor</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #ddf8c6 0%, #fff 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 36px;
            font-weight: 700;
            color: #085e54;
            margin-bottom: 8px;
        }
        .header p {
            color: #085e54;
            opacity: 0.7;
        }
        .card {
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(8, 94, 84, 0.1);
            padding: 32px;
            margin-bottom: 24px;
        }
        .card-title {
            font-size: 20px;
            font-weight: 700;
            color: #085e54;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .card-title span {
            font-size: 24px;
        }
        .alert {
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            font-weight: 500;
        }
        .alert-error {
            background: #fee;
            color: #c00;
            border: 1px solid #fcc;
        }
        .alert-success {
            background: #ddf8c6;
            color: #085e54;
            border: 1px solid #02c30a;
        }
        .upload-zone {
            border: 3px dashed #ddf8c6;
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            transition: all 0.3s;
            cursor: pointer;
        }
        .upload-zone:hover {
            border-color: #02c30a;
            background: #ddf8c6;
        }
        .upload-zone.dragover {
            border-color: #02c30a;
            background: #ddf8c6;
        }
        .upload-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        .upload-text {
            color: #085e54;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .upload-hint {
            color: #085e54;
            opacity: 0.6;
            font-size: 14px;
        }
        .file-input {
            display: none;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 24px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
        }
        .btn-primary {
            background: #02c30a;
            color: white;
        }
        .btn-primary:hover {
            background: #029a08;
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #085e54;
            color: white;
        }
        .btn-secondary:hover {
            background: #064a43;
        }
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        .btn-danger:hover {
            background: #c82333;
        }
        .btn-sm {
            padding: 8px 16px;
            font-size: 13px;
        }
        .zip-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .zip-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
            border: 2px solid transparent;
            transition: all 0.3s;
        }
        .zip-item:hover {
            border-color: #02c30a;
            background: white;
        }
        .zip-info {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .zip-icon {
            width: 48px;
            height: 48px;
            background: #ddf8c6;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .zip-details h3 {
            font-size: 16px;
            font-weight: 600;
            color: #085e54;
            margin-bottom: 4px;
        }
        .zip-meta {
            display: flex;
            gap: 16px;
            font-size: 13px;
            color: #085e54;
            opacity: 0.7;
        }
        .zip-actions {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .extract-options {
            display: none;
            margin-top: 12px;
            padding: 16px;
            background: #ddf8c6;
            border-radius: 10px;
        }
        .extract-options.show {
            display: block;
        }
        .extract-options label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #085e54;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .extract-options input {
            width: 100%;
            padding: 10px 14px;
            border: 2px solid #085e54;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            margin-bottom: 12px;
        }
        .extract-options input:focus {
            outline: none;
            border-color: #02c30a;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #085e54;
        }
        .empty-state .icon {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.5;
        }
        .empty-state h3 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .empty-state p {
            opacity: 0.6;
        }
        .current-path {
            background: #085e54;
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 13px;
            margin-bottom: 20px;
            overflow-x: auto;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 13px;
            margin-top: 24px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Unzipper</h1>
            <p>Upload and extract ZIP files on the server</p>
        </div>

        <?php if ($message): ?>
            <div class="alert alert-<?php echo $messageType; ?>"><?php echo htmlspecialchars($message); ?></div>
        <?php endif; ?>

        <!-- Upload Section -->
        <div class="card">
            <h2 class="card-title"><span>📤</span> Upload ZIP File</h2>

            <div class="current-path">
                <strong>Current Directory:</strong> <?php echo htmlspecialchars($currentDir); ?>
            </div>

            <form method="POST" enctype="multipart/form-data" id="uploadForm">
                <div class="upload-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
                    <div class="upload-icon">📦</div>
                    <div class="upload-text">Drop ZIP file here or click to browse</div>
                    <div class="upload-hint">Maximum file size depends on server configuration</div>
                </div>
                <input type="file" name="zipfile" id="fileInput" class="file-input" accept=".zip">
            </form>
        </div>

        <!-- ZIP Files List -->
        <div class="card">
            <h2 class="card-title"><span>📁</span> ZIP Files (<?php echo count($zipFiles); ?>)</h2>

            <?php if (empty($zipFiles)): ?>
                <div class="empty-state">
                    <div class="icon">📭</div>
                    <h3>No ZIP files found</h3>
                    <p>Upload a ZIP file to get started</p>
                </div>
            <?php else: ?>
                <div class="zip-list">
                    <?php foreach ($zipFiles as $index => $zipFile): ?>
                        <?php $info = getZipInfo($currentDir . '/' . $zipFile); ?>
                        <div class="zip-item">
                            <div class="zip-info">
                                <div class="zip-icon">🗜️</div>
                                <div class="zip-details">
                                    <h3><?php echo htmlspecialchars($zipFile); ?></h3>
                                    <div class="zip-meta">
                                        <span><?php echo formatBytes($info['size']); ?></span>
                                        <span><?php echo $info['files']; ?> files</span>
                                        <span><?php echo date('M d, Y H:i', $info['modified']); ?></span>
                                    </div>
                                </div>
                            </div>
                            <div class="zip-actions">
                                <button type="button" class="btn btn-primary btn-sm" onclick="toggleExtract(<?php echo $index; ?>)">
                                    Extract
                                </button>
                                <form method="POST" style="display: inline;" onsubmit="return confirm('Delete this file?');">
                                    <input type="hidden" name="zipfile" value="<?php echo htmlspecialchars($zipFile); ?>">
                                    <button type="submit" name="delete" value="1" class="btn btn-danger btn-sm">Delete</button>
                                </form>
                            </div>
                        </div>
                        <div class="extract-options" id="extract-<?php echo $index; ?>">
                            <form method="POST">
                                <input type="hidden" name="zipfile" value="<?php echo htmlspecialchars($zipFile); ?>">
                                <label>Extract to folder (leave empty for current directory)</label>
                                <input type="text" name="extract_to" placeholder="folder-name">
                                <button type="submit" name="extract" value="1" class="btn btn-secondary">
                                    Extract Now
                                </button>
                            </form>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <div class="warning">
                <strong>⚠️ Security Warning:</strong> Delete this file (unzipper.php) after use to prevent unauthorized access to your server.
            </div>
        </div>
    </div>

    <script>
        // File input change handler
        document.getElementById('fileInput').addEventListener('change', function() {
            if (this.files.length > 0) {
                document.getElementById('uploadForm').submit();
            }
        });

        // Drag and drop handlers
        const dropZone = document.getElementById('dropZone');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const files = dt.files;

            if (files.length > 0 && files[0].name.endsWith('.zip')) {
                document.getElementById('fileInput').files = files;
                document.getElementById('uploadForm').submit();
            } else {
                alert('Please drop a ZIP file.');
            }
        });

        // Toggle extract options
        function toggleExtract(index) {
            const el = document.getElementById('extract-' + index);
            el.classList.toggle('show');
        }
    </script>
</body>
</html>
