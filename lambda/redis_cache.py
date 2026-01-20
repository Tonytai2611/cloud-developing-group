"""
Redis Cache Utility for DynamoDB Integration
Provides caching layer to reduce DynamoDB read operations and improve performance
"""

import json
import os
from decimal import Decimal
from typing import Any, Optional, Union
import redis

# Environment variables for ElastiCache configuration
REDIS_HOST = os.environ.get('REDIS_ENDPOINT', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', '6379'))
CACHE_TTL = int(os.environ.get('CACHE_TTL', '300'))  # Default 5 minutes

# Initialize Redis client (reuse connection across Lambda invocations)
redis_client = None

def get_redis_client():
    """Get or create Redis client connection"""
    global redis_client
    if redis_client is None:
        try:
            redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
                retry_on_timeout=True,
                health_check_interval=30
            )
            # Test connection
            redis_client.ping()
            print(f"Redis connected to {REDIS_HOST}:{REDIS_PORT}")
        except Exception as e:
            print(f"Redis connection failed: {e}")
            redis_client = None
    return redis_client

def decimal_to_native(obj):
    """Convert Decimal to native Python types for JSON serialization"""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    elif isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    return obj

def get_cached(key: str) -> Optional[Any]:
    """
    Get value from cache
    
    Args:
        key: Cache key
        
    Returns:
        Cached value or None if not found or Redis unavailable
    """
    client = get_redis_client()
    if client is None:
        return None
    
    try:
        cached = client.get(key)
        if cached:
            print(f"Cache HIT: {key}")
            return json.loads(cached)
        print(f"Cache MISS: {key}")
        return None
    except Exception as e:
        print(f"Cache get error: {e}")
        return None

def set_cached(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """
    Set value in cache
    
    Args:
        key: Cache key
        value: Value to cache (will be JSON serialized)
        ttl: Time to live in seconds (defaults to CACHE_TTL)
        
    Returns:
        True if successful, False otherwise
    """
    client = get_redis_client()
    if client is None:
        return False
    
    try:
        # Convert Decimal types before serialization
        serializable_value = decimal_to_native(value)
        ttl_seconds = ttl or CACHE_TTL
        client.setex(key, ttl_seconds, json.dumps(serializable_value))
        print(f"Cache SET: {key} (TTL: {ttl_seconds}s)")
        return True
    except Exception as e:
        print(f"Cache set error: {e}")
        return False

def delete_cached(key: str) -> bool:
    """
    Delete value from cache
    
    Args:
        key: Cache key
        
    Returns:
        True if successful, False otherwise
    """
    client = get_redis_client()
    if client is None:
        return False
    
    try:
        client.delete(key)
        print(f"Cache DELETE: {key}")
        return True
    except Exception as e:
        print(f"Cache delete error: {e}")
        return False

def invalidate_pattern(pattern: str) -> int:
    """
    Delete all keys matching a pattern
    
    Args:
        pattern: Redis key pattern (e.g., "menu:*")
        
    Returns:
        Number of keys deleted
    """
    client = get_redis_client()
    if client is None:
        return 0
    
    try:
        keys = client.keys(pattern)
        if keys:
            deleted = client.delete(*keys)
            print(f"Cache INVALIDATE: {pattern} ({deleted} keys)")
            return deleted
        return 0
    except Exception as e:
        print(f"Cache invalidate error: {e}")
        return 0

def cache_aside(cache_key: str, fetch_function, ttl: Optional[int] = None) -> Any:
    """
    Cache-aside pattern: Try cache first, fetch from DynamoDB on miss
    
    Args:
        cache_key: Key to use for caching
        fetch_function: Function to call if cache miss (should return data)
        ttl: Time to live in seconds
        
    Returns:
        Data from cache or fetch_function
    """
    # Try to get from cache
    cached_data = get_cached(cache_key)
    if cached_data is not None:
        return cached_data
    
    # Cache miss - fetch from DynamoDB
    data = fetch_function()
    
    # Store in cache for next time
    if data is not None:
        set_cached(cache_key, data, ttl)
    
    return data

def write_through(cache_key: str, data: Any, write_function, ttl: Optional[int] = None) -> Any:
    """
    Write-through pattern: Write to both cache and DynamoDB
    
    Args:
        cache_key: Key to use for caching
        data: Data to write
        write_function: Function to write to DynamoDB
        ttl: Time to live in seconds
        
    Returns:
        Result from write_function
    """
    # Write to DynamoDB first
    result = write_function(data)
    
    # Update cache
    set_cached(cache_key, data, ttl)
    
    return result

def get_cache_stats() -> dict:
    """
    Get Redis cache statistics
    
    Returns:
        Dictionary with cache stats
    """
    client = get_redis_client()
    if client is None:
        return {"status": "unavailable"}
    
    try:
        info = client.info()
        return {
            "status": "connected",
            "used_memory": info.get("used_memory_human"),
            "connected_clients": info.get("connected_clients"),
            "total_commands": info.get("total_commands_processed"),
            "keyspace_hits": info.get("keyspace_hits", 0),
            "keyspace_misses": info.get("keyspace_misses", 0),
            "hit_rate": calculate_hit_rate(
                info.get("keyspace_hits", 0),
                info.get("keyspace_misses", 0)
            )
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def calculate_hit_rate(hits: int, misses: int) -> float:
    """Calculate cache hit rate percentage"""
    total = hits + misses
    if total == 0:
        return 0.0
    return round((hits / total) * 100, 2)

# Example usage patterns:
"""
# 1. Cache-aside (lazy loading)
menu_items = cache_aside(
    "menu:all",
    lambda: table.scan().get('Items', []),
    ttl=600
)

# 2. Write-through
new_item = write_through(
    f"menu:{item_id}",
    item_data,
    lambda data: table.put_item(Item=data)
)

# 3. Manual cache management
# Get from cache
items = get_cached("menu:all")

# Set in cache
set_cached("menu:all", items, ttl=300)

# Delete from cache
delete_cached("menu:123")

# Invalidate pattern
invalidate_pattern("menu:*")
"""
