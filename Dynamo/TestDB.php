<?php
require_once 'dynamodb-config.php';

$db = new DynamoDBWebsite();

// Log the current visitor
$db->logVisitor(
    $_SERVER['REMOTE_ADDR'],
    $_SERVER['HTTP_USER_AGENT'],
    $_SERVER['REQUEST_URI']
);

// Get recent visitors
$visitors = $db->getRecentVisitors(10);
$visitorCount = $db->getVisitorCount();
?>
<!DOCTYPE html>
<html>
<head>
    <title>DynamoDB Website</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background:  #f5f5f5; }
        .container { background: white; padding:  30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color:  #333; }
        table { width: 100%; border-collapse:  collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom:  1px solid #ddd; }
        th { background-color: #ff9900; color: white; }
        .info { background:  #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-box { background: #e3f2fd; padding: 20px; border-radius: 5px; text-align: center; }
        .stat-number { font-size:  2em; font-weight: bold; color: #1976d2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>DynamoDB Powered Website</h1>
        
        <div class="info">
            <strong>Infrastructure: </strong> DynamoDB (Serverless NoSQL) | Auto Scaling | TTL Enabled | Encrypted
        </div>
        
        <div class="stats">
            <div class="stat-box">
                <div class="stat-number"><?php echo $visitorCount; ?></div>
                <div>Total Visitors</div>
            </div>
        </div>
        
        <h2>Recent Visitors</h2>
        <table>
            <tr>
                <th>Visitor ID</th>
                <th>IP Address</th>
                <th>Page</th>
                <th>Visit Time</th>
            </tr>
            <?php foreach ($visitors as $visitor): ?>
            <tr>
                <td><?php echo htmlspecialchars(substr($visitor['visitorId'], 0, 12)); ?>...</td>
                <td><?php echo htmlspecialchars($visitor['ipAddress']); ?></td>
                <td><?php echo htmlspecialchars($visitor['pageVisited']); ?></td>
                <td><?php echo date('Y-m-d H:i:s', $visitor['visitTimestamp']); ?></td>
            </tr>
            <?php endforeach; ?>
        </table>
    </div>
</body>
</html>