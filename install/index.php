<?php
session_start();

// Check if already installed
if (file_exists(__DIR__ . '/.installed')) {
    header('Location: ../');
    exit;
}

$step = isset($_GET['step']) ? (int)$_GET['step'] : 1;
$error = '';
$success = '';

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    switch ($step) {
        case 1:
            // Database configuration
            $_SESSION['db_host'] = $_POST['db_host'] ?? '127.0.0.1';
            $_SESSION['db_port'] = $_POST['db_port'] ?? '3306';
            $_SESSION['db_name'] = $_POST['db_name'] ?? 'lndr';
            $_SESSION['db_user'] = $_POST['db_user'] ?? 'root';
            $_SESSION['db_pass'] = $_POST['db_pass'] ?? '';

            // Test connection
            try {
                $dsn = "mysql:host={$_SESSION['db_host']};port={$_SESSION['db_port']}";
                $pdo = new PDO($dsn, $_SESSION['db_user'], $_SESSION['db_pass']);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                header('Location: ?step=2');
                exit;
            } catch (PDOException $e) {
                $error = 'Database connection failed: ' . $e->getMessage();
            }
            break;

        case 2:
            // Create database and tables
            try {
                $dsn = "mysql:host={$_SESSION['db_host']};port={$_SESSION['db_port']}";
                $pdo = new PDO($dsn, $_SESSION['db_user'], $_SESSION['db_pass']);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

                // Create database
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$_SESSION['db_name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $pdo->exec("USE `{$_SESSION['db_name']}`");

                // Create tables
                $schema = file_get_contents(__DIR__ . '/schema.php');
                eval('?>' . $schema);

                foreach ($tables as $sql) {
                    $pdo->exec($sql);
                }

                header('Location: ?step=3');
                exit;
            } catch (PDOException $e) {
                $error = 'Database setup failed: ' . $e->getMessage();
            }
            break;

        case 3:
            // Admin setup
            $admin_user = $_POST['admin_user'] ?? '';
            $admin_pass = $_POST['admin_pass'] ?? '';
            $admin_pass_confirm = $_POST['admin_pass_confirm'] ?? '';

            if (empty($admin_user) || empty($admin_pass)) {
                $error = 'Username and password are required';
            } elseif ($admin_pass !== $admin_pass_confirm) {
                $error = 'Passwords do not match';
            } elseif (strlen($admin_pass) < 6) {
                $error = 'Password must be at least 6 characters';
            } else {
                try {
                    $dsn = "mysql:host={$_SESSION['db_host']};port={$_SESSION['db_port']};dbname={$_SESSION['db_name']}";
                    $pdo = new PDO($dsn, $_SESSION['db_user'], $_SESSION['db_pass']);
                    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

                    $hash = password_hash($admin_pass, PASSWORD_DEFAULT);
                    $stmt = $pdo->prepare("INSERT INTO admins (username, password) VALUES (?, ?)");
                    $stmt->execute([$admin_user, $hash]);

                    $_SESSION['admin_created'] = true;
                    header('Location: ?step=4');
                    exit;
                } catch (PDOException $e) {
                    $error = 'Admin creation failed: ' . $e->getMessage();
                }
            }
            break;

        case 4:
            // Seed data (optional)
            if (isset($_POST['seed_data'])) {
                try {
                    $dsn = "mysql:host={$_SESSION['db_host']};port={$_SESSION['db_port']};dbname={$_SESSION['db_name']}";
                    $pdo = new PDO($dsn, $_SESSION['db_user'], $_SESSION['db_pass']);
                    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

                    // Seed riders
                    $pdo->exec("INSERT INTO riders (name, mobile, status) VALUES
                        ('John Rider', '+97312345678', 'active'),
                        ('Ali Driver', '+97387654321', 'active')");

                    $success = 'Sample data seeded successfully!';
                } catch (PDOException $e) {
                    $error = 'Seeding failed: ' . $e->getMessage();
                }
            }

            if (isset($_POST['finish'])) {
                // Save config file
                $configContent = "<?php
class Database {
    private \$host = '{$_SESSION['db_host']}';
    private \$port = '{$_SESSION['db_port']}';
    private \$db_name = '{$_SESSION['db_name']}';
    private \$username = '{$_SESSION['db_user']}';
    private \$password = '{$_SESSION['db_pass']}';
    public \$conn;

    public function getConnection() {
        \$this->conn = null;
        try {
            \$this->conn = new PDO(
                'mysql:host=' . \$this->host . ';port=' . \$this->port . ';dbname=' . \$this->db_name,
                \$this->username,
                \$this->password
            );
            \$this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException \$e) {
            echo 'Connection Error: ' . \$e->getMessage();
        }
        return \$this->conn;
    }
}
";
                file_put_contents(__DIR__ . '/../api/config/database.php', $configContent);

                // Create installed marker
                file_put_contents(__DIR__ . '/.installed', date('Y-m-d H:i:s'));

                header('Location: ?step=5');
                exit;
            }
            break;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install - LNDR Admin Panel</title>
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
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(8, 94, 84, 0.15);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
        }
        .header {
            background: #085e54;
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .header p {
            opacity: 0.8;
            font-size: 14px;
        }
        .steps {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 24px;
        }
        .step-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: rgba(255,255,255,0.3);
            transition: all 0.3s;
        }
        .step-dot.active {
            background: #02c30a;
            transform: scale(1.2);
        }
        .step-dot.completed {
            background: #02c30a;
        }
        .content {
            padding: 40px;
        }
        .step-title {
            font-size: 24px;
            font-weight: 700;
            color: #085e54;
            margin-bottom: 8px;
        }
        .step-desc {
            color: #085e54;
            opacity: 0.6;
            margin-bottom: 32px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #085e54;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        input {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #ddf8c6;
            border-radius: 12px;
            font-size: 16px;
            font-family: inherit;
            transition: border-color 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #02c30a;
        }
        .row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .btn {
            display: inline-block;
            padding: 16px 32px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
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
            background: white;
            color: #085e54;
            border: 2px solid #085e54;
        }
        .btn-secondary:hover {
            background: #085e54;
            color: white;
        }
        .btn-block {
            width: 100%;
        }
        .btn-group {
            display: flex;
            gap: 12px;
            margin-top: 32px;
        }
        .btn-group .btn {
            flex: 1;
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
        .checklist {
            list-style: none;
            margin-bottom: 32px;
        }
        .checklist li {
            padding: 12px 0;
            border-bottom: 1px solid #ddf8c6;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .checklist li:last-child {
            border-bottom: none;
        }
        .check {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #02c30a;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
        .success-icon {
            width: 80px;
            height: 80px;
            background: #ddf8c6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            margin: 0 auto 24px;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: #ddf8c6;
            border-radius: 12px;
            margin-bottom: 16px;
            cursor: pointer;
        }
        .checkbox-group input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
        }
        .checkbox-group span {
            font-weight: 500;
            color: #085e54;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LNDR Admin Panel</h1>
            <p>Installation Wizard</p>
            <div class="steps">
                <?php for ($i = 1; $i <= 5; $i++): ?>
                    <div class="step-dot <?php echo $i < $step ? 'completed' : ($i === $step ? 'active' : ''); ?>"></div>
                <?php endfor; ?>
            </div>
        </div>

        <div class="content">
            <?php if ($error): ?>
                <div class="alert alert-error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="alert alert-success"><?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>

            <?php if ($step === 1): ?>
                <!-- Step 1: Database Configuration -->
                <h2 class="step-title">Database Configuration</h2>
                <p class="step-desc">Enter your MySQL database credentials</p>

                <form method="POST">
                    <div class="row">
                        <div class="form-group">
                            <label>Database Host</label>
                            <input type="text" name="db_host" value="<?php echo $_SESSION['db_host'] ?? '127.0.0.1'; ?>" required>
                        </div>
                        <div class="form-group">
                            <label>Port</label>
                            <input type="text" name="db_port" value="<?php echo $_SESSION['db_port'] ?? '3306'; ?>" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Database Name</label>
                        <input type="text" name="db_name" value="<?php echo $_SESSION['db_name'] ?? 'lndr'; ?>" required>
                    </div>
                    <div class="row">
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" name="db_user" value="<?php echo $_SESSION['db_user'] ?? 'root'; ?>" required>
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" name="db_pass" value="<?php echo $_SESSION['db_pass'] ?? ''; ?>">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Test Connection & Continue</button>
                </form>

            <?php elseif ($step === 2): ?>
                <!-- Step 2: Create Database -->
                <h2 class="step-title">Create Database</h2>
                <p class="step-desc">The following tables will be created</p>

                <ul class="checklist">
                    <li><span class="check">✓</span> admins - Admin users</li>
                    <li><span class="check">✓</span> riders - Delivery riders</li>
                    <li><span class="check">✓</span> customers - Customer information</li>
                    <li><span class="check">✓</span> addresses - Customer addresses</li>
                    <li><span class="check">✓</span> orders - Order records</li>
                    <li><span class="check">✓</span> services - Service catalog</li>
                </ul>

                <form method="POST">
                    <button type="submit" class="btn btn-primary btn-block">Create Database & Tables</button>
                </form>

            <?php elseif ($step === 3): ?>
                <!-- Step 3: Admin Setup -->
                <h2 class="step-title">Create Admin Account</h2>
                <p class="step-desc">Set up your administrator credentials</p>

                <form method="POST">
                    <div class="form-group">
                        <label>Admin Username</label>
                        <input type="text" name="admin_user" value="admin" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="admin_pass" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label>Confirm Password</label>
                        <input type="password" name="admin_pass_confirm" required minlength="6">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Create Admin Account</button>
                </form>

            <?php elseif ($step === 4): ?>
                <!-- Step 4: Seed Data -->
                <h2 class="step-title">Sample Data</h2>
                <p class="step-desc">Optionally seed sample data for testing</p>

                <form method="POST">
                    <label class="checkbox-group">
                        <input type="checkbox" name="seed_data" value="1">
                        <span>Add sample riders for testing</span>
                    </label>

                    <div class="btn-group">
                        <button type="submit" name="seed_data" value="1" class="btn btn-secondary">Seed Sample Data</button>
                        <button type="submit" name="finish" value="1" class="btn btn-primary">Finish Installation</button>
                    </div>
                </form>

            <?php elseif ($step === 5): ?>
                <!-- Step 5: Complete -->
                <div class="success-icon">✓</div>
                <h2 class="step-title" style="text-align: center;">Installation Complete!</h2>
                <p class="step-desc" style="text-align: center;">Your LNDR Admin Panel is ready to use</p>

                <ul class="checklist">
                    <li><span class="check">✓</span> Database created and configured</li>
                    <li><span class="check">✓</span> Tables created successfully</li>
                    <li><span class="check">✓</span> Admin account created</li>
                    <li><span class="check">✓</span> Configuration saved</li>
                </ul>

                <div class="alert alert-success">
                    <strong>Important:</strong> Delete the /install folder for security!
                </div>

                <a href="../" class="btn btn-primary btn-block" style="text-align: center;">Go to Admin Panel</a>

            <?php endif; ?>
        </div>
    </div>
</body>
</html>
