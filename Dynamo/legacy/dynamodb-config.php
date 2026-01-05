<?php
require 'vendor/autoload.php';

use Aws\DynamoDb\DynamoDbClient;
use Aws\DynamoDb\Marshaler;

class DynamoDBWebsite {
	//to-be-changed
	//sample
    private $client;
    private $marshaler;
    private $visitorsTable;
    private $contentTable;
    private $sessionsTable;
    ////////////////////////
    public function __construct() {
        // Get table names from SSM Parameter Store or environment variables
        $this->visitorsTable = getenv('VISITORS_TABLE') ?: 'WebsiteData-Visitors-dev';
        $this->contentTable = getenv('CONTENT_TABLE') ?: 'WebsiteData-Content-dev';
        $this->sessionsTable = getenv('SESSIONS_TABLE') ?: 'WebsiteData-Sessions-dev';
        
        // Initialize DynamoDB client (uses IAM role when on EC2)
        $this->client = new DynamoDbClient([
            'region' => getenv('AWS_REGION') ?: 'us-east-1',
            'version' => 'latest'
        ]);
        
        $this->marshaler = new Marshaler();
    }
    
    // ==================== VISITOR TRACKING ====================
    
    public function logVisitor($ipAddress, $userAgent, $pageVisited) {
        $visitorId = $this->generateVisitorId($ipAddress, $userAgent);
        $timestamp = time();
        
        $item = [
            'visitorId' => $visitorId,
            'visitTimestamp' => $timestamp,
            'ipAddress' => $ipAddress,
            'userAgent' => $userAgent,
            'pageVisited' => $pageVisited,
            'ttl' => $timestamp + (30 * 24 * 60 * 60) // Expire after 30 days
        ];
        
        try {
            $this->client->putItem([
                'TableName' => $this->visitorsTable,
                'Item' => $this->marshaler->marshalItem($item)
            ]);
            return true;
        } catch (Exception $e) {
            error_log("DynamoDB Error: " . $e->getMessage());
            return false;
        }
    }
    
    public function getRecentVisitors($limit = 10) {
        try {
            $result = $this->client->scan([
                'TableName' => $this->visitorsTable,
                'Limit' => $limit
            ]);
            
            $visitors = [];
            foreach ($result['Items'] as $item) {
                $visitors[] = $this->marshaler->unmarshalItem($item);
            }
            
            // Sort by timestamp descending
            usort($visitors, function($a, $b) {
                return $b['visitTimestamp'] - $a['visitTimestamp'];
            });
            
            return $visitors;
        } catch (Exception $e) {
            error_log("DynamoDB Error: " . $e->getMessage());
            return [];
        }
    }
    
    public function getVisitorCount() {
        try {
            $result = $this->client->scan([
                'TableName' => $this->visitorsTable,
                'Select' => 'COUNT'
            ]);
            return $result['Count'];
        } catch (Exception $e) {
            return 0;
        }
    }
    
    // ==================== SESSION MANAGEMENT ====================
    
    public function createSession($userId, $data = []) {
        $sessionId = bin2hex(random_bytes(32));
        $timestamp = time();
        
        $item = [
            'sessionId' => $sessionId,
            'userId' => $userId,
            'data' => json_encode($data),
            'createdAt' => $timestamp,
            'expiresAt' => $timestamp + (24 * 60 * 60) // 24 hour expiry
        ];
        
        try {
            $this->client->putItem([
                'TableName' => $this->sessionsTable,
                'Item' => $this->marshaler->marshalItem($item)
            ]);
            return $sessionId;
        } catch (Exception $e) {
            error_log("DynamoDB Error:  " . $e->getMessage());
            return null;
        }
    }
    
    public function getSession($sessionId) {
        try {
            $result = $this->client->getItem([
                'TableName' => $this->sessionsTable,
                'Key' => $this->marshaler->marshalItem([
                    'sessionId' => $sessionId
                ])
            ]);
            
            if (isset($result['Item'])) {
                return $this->marshaler->unmarshalItem($result['Item']);
            }
            return null;
        } catch (Exception $e) {
            return null;
        }
    }
    
    // ==================== CONTENT MANAGEMENT ====================
    
    public function saveContent($pageId, $category, $title, $content) {
        $item = [
            'pageId' => $pageId,
            'category' => $category,
            'title' => $title,
            'content' => $content,
            'createdAt' => time(),
            'updatedAt' => time()
        ];
        
        try {
            $this->client->putItem([
                'TableName' => $this->contentTable,
                'Item' => $this->marshaler->marshalItem($item)
            ]);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
    
    public function getContent($pageId) {
        try {
            $result = $this->client->getItem([
                'TableName' => $this->contentTable,
                'Key' => $this->marshaler->marshalItem([
                    'pageId' => $pageId
                ])
            ]);
            
            if (isset($result['Item'])) {
                return $this->marshaler->unmarshalItem($result['Item']);
            }
            return null;
        } catch (Exception $e) {
            return null;
        }
    }
    
    public function getContentByCategory($category) {
        try {
            $result = $this->client->query([
                'TableName' => $this->contentTable,
                'IndexName' => 'CategoryIndex',
                'KeyConditionExpression' => 'category = :cat',
                'ExpressionAttributeValues' => $this->marshaler->marshalItem([
                    ':cat' => $category
                ])
            ]);
            
            $content = [];
            foreach ($result['Items'] as $item) {
                $content[] = $this->marshaler->unmarshalItem($item);
            }
            return $content;
        } catch (Exception $e) {
            return [];
        }
    }
    
    // ==================== HELPER FUNCTIONS ====================
    
    private function generateVisitorId($ip, $userAgent) {
        return hash('sha256', $ip .  $userAgent .  date('Y-m-d'));
    }
}
?>