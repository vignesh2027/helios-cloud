use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

use crate::models::ScanResult;

#[derive(Debug, Clone)]
struct CacheEntry<T> {
    value: T,
    inserted_at: Instant,
    ttl: Duration,
}

impl<T> CacheEntry<T> {
    fn new(value: T, ttl: Duration) -> Self {
        Self {
            value,
            inserted_at: Instant::now(),
            ttl,
        }
    }

    fn is_expired(&self) -> bool {
        self.inserted_at.elapsed() > self.ttl
    }
}

/// Thread-safe in-memory TTL cache for scan results.
///
/// Prevents hammering cloud APIs on every request by caching results
/// for a configurable duration. The default TTL is 5 minutes, matching
/// the HELIOS scan interval default.
#[derive(Debug, Clone)]
pub struct ScanCache {
    inner: Arc<RwLock<HashMap<String, CacheEntry<ScanResult>>>>,
    default_ttl: Duration,
}

impl ScanCache {
    pub fn new(default_ttl_secs: u64) -> Self {
        Self {
            inner: Arc::new(RwLock::new(HashMap::new())),
            default_ttl: Duration::from_secs(default_ttl_secs),
        }
    }

    pub fn get(&self, key: &str) -> Option<ScanResult> {
        let map = self.inner.read().unwrap();
        map.get(key).and_then(|entry| {
            if entry.is_expired() {
                None
            } else {
                Some(entry.value.clone())
            }
        })
    }

    pub fn set(&self, key: impl Into<String>, value: ScanResult) {
        let mut map = self.inner.write().unwrap();
        map.insert(key.into(), CacheEntry::new(value, self.default_ttl));
    }

    pub fn set_with_ttl(&self, key: impl Into<String>, value: ScanResult, ttl: Duration) {
        let mut map = self.inner.write().unwrap();
        map.insert(key.into(), CacheEntry::new(value, ttl));
    }

    pub fn invalidate(&self, key: &str) {
        self.inner.write().unwrap().remove(key);
    }

    pub fn invalidate_all(&self) {
        self.inner.write().unwrap().clear();
    }

    pub fn evict_expired(&self) -> usize {
        let mut map = self.inner.write().unwrap();
        let before = map.len();
        map.retain(|_, v| !v.is_expired());
        before - map.len()
    }

    pub fn len(&self) -> usize {
        self.inner.read().unwrap().len()
    }

    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    pub fn cache_key(provider: &str, region: &str, account_id: &str) -> String {
        format!("{provider}/{region}/{account_id}")
    }
}

impl Default for ScanCache {
    fn default() -> Self {
        Self::new(300) // 5 minutes
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::ScanResult;

    fn make_scan_result(region: &str) -> ScanResult {
        ScanResult::new("aws", region, "123456789012")
    }

    #[test]
    fn cache_hit_and_miss() {
        let cache = ScanCache::new(60);
        assert!(cache.get("key-1").is_none());

        cache.set("key-1", make_scan_result("us-east-1"));
        assert!(cache.get("key-1").is_some());
        assert_eq!(cache.get("key-1").unwrap().region, "us-east-1");
    }

    #[test]
    fn cache_ttl_expiry() {
        let cache = ScanCache::new(0); // 0-second TTL — expires immediately
        cache.set("key-1", make_scan_result("us-east-1"));
        // After 0-second TTL, any elapsed time should trigger expiry
        std::thread::sleep(Duration::from_millis(10));
        assert!(cache.get("key-1").is_none());
    }

    #[test]
    fn cache_invalidate() {
        let cache = ScanCache::new(300);
        cache.set("k1", make_scan_result("us-east-1"));
        cache.set("k2", make_scan_result("eu-west-1"));
        assert_eq!(cache.len(), 2);

        cache.invalidate("k1");
        assert!(cache.get("k1").is_none());
        assert!(cache.get("k2").is_some());
    }

    #[test]
    fn cache_invalidate_all() {
        let cache = ScanCache::new(300);
        cache.set("k1", make_scan_result("us-east-1"));
        cache.set("k2", make_scan_result("eu-west-1"));
        cache.invalidate_all();
        assert!(cache.is_empty());
    }

    #[test]
    fn cache_key_format() {
        let key = ScanCache::cache_key("aws", "us-east-1", "123456789012");
        assert_eq!(key, "aws/us-east-1/123456789012");
    }

    #[test]
    fn cache_evict_expired() {
        let cache = ScanCache::new(300);
        cache.set("live", make_scan_result("us-east-1"));
        // Manually insert with 0-TTL using set_with_ttl
        cache.set_with_ttl(
            "dead",
            make_scan_result("eu-west-1"),
            Duration::from_millis(0),
        );
        std::thread::sleep(Duration::from_millis(10));

        let evicted = cache.evict_expired();
        assert_eq!(evicted, 1);
        assert_eq!(cache.len(), 1);
        assert!(cache.get("live").is_some());
    }

    #[test]
    fn cache_clone_shares_state() {
        let cache1 = ScanCache::new(300);
        let cache2 = cache1.clone();

        cache1.set("shared", make_scan_result("us-east-1"));
        assert!(cache2.get("shared").is_some()); // Clones share Arc
    }
}
